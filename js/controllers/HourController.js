app.factory('quote', ['$http', function($http) {
	var url = "http://query.yahooapis.com/v1/public/yql";
	var symbol = "tsla";
	var qstring = "select * from yahoo.finance.quotes where symbol in ('" + symbol + "')";

	return $http.get(url + '?q=' + qstring + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env") 
		.success(function(data) {
			return data;
		}) 
		.error(function(err) {
			return err;
		});
}]);



app.controller('MainController', ['$scope', '$http', 'quote', function($scope, $http, quote) {

// --------------------------------------     IO     -------------------------------------------- //

	/* Required Format: 2014-03-08T00:00:00
	 * Server Format:   1970-01-01T20:00:00.000Z
	 * This function prepares the data by:
	 *	trimming last 5 characters from data ('.000Z')
	 *	putting data in the proper Date format (rather than string)
	 */
	$scope.loadHours = function() {
		$http.get("php/getdata.php")
		.success(function (data) {
			//console.log($scope.hours);
			for (var i = data.length - 1; i >= 0; i--) {
				data[i].win.slice(0,-5);
				data[i].win = new Date(data[i].win);
				data[i].lout.slice(0,-5);
				data[i].lout = new Date(data[i].lout);
				data[i].lin.slice(0,-5);
				data[i].lin = new Date(data[i].lin);
				data[i].wout.slice(0,-5);
				data[i].wout = new Date(data[i].wout);
				//console.log(data[i]);
			};
			$scope.hours = data;
			//console.log($scope.hours);
		}).error(function () {
			alert("An unexpected error ocurred!");
		});
	};
	$scope.loadHours();



	//This function saves the hours to a text document on the server
	$scope.httpPost = function() {
		//console.log("prepost");
		$http.post('php/setdata.php', JSON.stringify($scope.hours))
		.error(function(status){console.log(status)});
		//console.log("postpost");
		alert("Hours Saved");
	};

// ---------------------------------     Prep Data     ------------------------------------------ //

	//This function resets the data then saves the cleared data to the server
	$scope.clearHours = function() {
		//reset all of the values
		var clear = new Date("1970-01-01T08:00:00");
		for (var i = $scope.hours.length - 1; i >= 0; i--) {
			$scope.hours[i].wout = clear;
			$scope.hours[i].win = clear;
			$scope.hours[i].lin = clear;
			$scope.hours[i].lout = clear;
		}
		//post to the server
		$http.post('php/setdata.php', JSON.stringify($scope.hours))
		.error(function(status){console.log(status)});
		alert("Hours Cleared and Saved");
	};

// --------------------------------     Calculations     ---------------------------------------- //

	// set the default payrate
	$scope.payrate = 28;
	//Global variables manipulated in the calculate function, used in view
	$scope.overtime = 0;
	$scope.regular = 0;
	$scope.pay = {
		gross: 0,
		paycheck: 0,
		tax: 0
	}

	/*This function calculates:
	 *    the total hours worked and stores it in a global variable
	 *    overtime based on CA State Law and returns that value
	 *    grosspay based on payrate
	 *    aproximate tax for CA employee in lower brackets
	 */
	$scope.calculate = function() {

		var temp = 0;
		var days = 0;
		var workdays = 0;
		var total = 0;

		$scope.overtime = 0;
		$scope.regular = 0;

		for (var i = 0; i < $scope.hours.length; i++) {
			temp = ($scope.hours[i].wout - $scope.hours[i].win) - ($scope.hours[i].lin - $scope.hours[i].lout);
			// compensate for minutes      (/ 60)
			// compensate for seconds 	   (/ 60)
			// compensate for milliseconds (/ 1,000)
			// total                       (/ 3,600,000)
			temp = temp / 3600000;

			//calculate total
			total += temp;

			/* overtime logic:
			 * 	If you worked 7 days in a week, the 7th day is overtime
			 *	If you worked anything over 8 hours on the 7th day it is double time
			 */
			days += 1;

			if (temp > 0) {
				workdays += 1;
			} else {
				continue;
			}

			if (days == 7) {
				if (workdays == 7) {
					workdays = 0;
					if (temp > 8) {
						$scope.overtime += (temp - 8) * (4/3);
						$scope.overtime += 8;
					} else {
						$scope.overtime += temp;
					}
				}
				workdays = 0;
				days = 0;
				continue;
			}

			/* overtime logic:
			 *	If you worked more than 8 hours in a day it is overtime
			 *	If you worked more than 12 hours in a day it is double time
			 *	All else is regular time
			 */
			if (temp <= 8 && temp != 0) {
				$scope.regular += temp;
			} else if (temp > 8 && temp <= 12) {
				$scope.overtime += (temp - 8);
				$scope.regular += 8;
			} else if (temp > 12) {
				$scope.overtime += 4;
				$scope.overtime += (temp - 12) * (4/3);
				$scope.regular += 8;
			}
		}

		// overtime should be 1.5x pay, so I added overtime x 0.5
		$scope.pay.gross = ( (total * 1) + ($scope.overtime * 0.5) ) * $scope.payrate;
		//I put 4% towards my 401k as is the default for Tesla
		//as calculated online, paycheck is ~78% - 4% (401k) of gross pay
		//total ~74% of paycheck
		$scope.pay.paycheck = $scope.pay.gross * 0.74;
		$scope.pay.tax = $scope.pay.gross * 0.26;

		return total;
	};

// ------------------------------------     Date     ---------------------------------------------- //

	// get today's date
	$scope.date = new Date();
	//console.log($scope.date);

// ---------------------------------     Stock Quote     ------------------------------------------ //

	// prepare data object for tesla stock quote
	$scope.tsla = {
		total: 0,
		change: 0,
		color: {"color":"green"}
	}

	// get data from web for tesla stock quote
	quote.success(function(data) {
		//console.log(data);
		$scope.tsla.total = data.query.results.quote.LastTradePriceOnly;
		$scope.tsla.change = data.query.results.quote.Change;
		if ($scope.tsla.change >= 0) {
				$scope.tsla.color = {"color":"green"};
			} else {
				$scope.tsla.color = {"color":"red"};
			};
			//console.log($scope.tsla);
	});



}]);