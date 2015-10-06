//HourController.js
/*jslint continue:true*/
/*global app, console*/
// ----------------------------------     Controller    ---------------------------------------- //
// old functions require '$http' to be passed in as well, replaced by '$localstorage'
app.controller('MainController', function ($scope, $localstorage, quote) {
    "use strict";
// --------------------------------------     IO    -------------------------------------------- //
	var memory = $localstorage.getObject('memory'),
        hours = $localstorage.getObject('hours'),
        i = 0;

	// check if the cookie exists
	if (Object.keys(hours).length !== 0) {
		/* Required Format: 2014-03-08T00:00:00
		 * Server Format:   1970-01-01T20:00:00.000Z
		 * This function prepares the data by:
		 *  - trimming last 5 characters from data ('.000Z')
		 *  - putting data in the proper Date format (rather than string)
		 */
		for (i = hours.length - 1; i >= 0; i -= 1) {
            if (hours[i].win !== null) {
                hours[i].win.slice(0, -5);
                hours[i].win = new Date(hours[i].win);
            }
            if (hours[i].lout !== null) {
                hours[i].lout.slice(0, -5);
                hours[i].lout = new Date(hours[i].lout);
            }
            if (hours[i].lin !== null) {
                hours[i].lin.slice(0, -5);
                hours[i].lin = new Date(hours[i].lin);
            }
            if (hours[i].wout !== null) {
                hours[i].wout.slice(0, -5);
                hours[i].wout = new Date(hours[i].wout);
            }
		}
		//console.log(hours);
	} else {
		// if there was no hours data fill with default values
		hours = window.hours;
        //console.log(hours);
	}
	if (Object.keys(memory).length === 0) {
        memory.payrate = 10;
        memory.k401 = 4;
    }

	// set model to variables usable by the view
	$scope.hours = hours;
	$scope.payrate = memory.payrate;
	$scope.k401 = memory.k401;
// ---------------------------------     IO Functions    --------------------------------------- //
	$scope.clearHours = function () {
		$localstorage.remove('hours');
		window.location.reload();
	};
	$scope.saveHours = function () {
        memory.payrate = $scope.payrate;
        memory.k401 = $scope.k401;
		$localstorage.putObject('memory', memory);
        $localstorage.putObject('hours', $scope.hours);
		console.log("hours saved");
	};
// --------------------------------     Calculations     ---------------------------------------- //
	//Global variables manipulated in the calculate function, used in view
	$scope.pay = {
		overtime:	0,
		regular:	0,
		taxh:		0,
		gross:		0,
		paycheck:	0,
		tax:		0,
		k401:		0
	};

	/*This function calculates:
	 *    the total hours worked and stores it in a global variable
	 *    overtime based on CA State Law and returns that value
	 *    grosspay based on payrate
	 *    aproximate tax for CA employee in lower brackets
	 */
	$scope.calculate = function () {

		var temp	 = 0,
            days	 = 0,
            workdays = 0,
            total	 = 0,
            i        = 0;
		$scope.pay.overtime	= 0;
		$scope.pay.regular	= 0;

		for (i = 0; i < $scope.hours.length; i += 1) {
			temp = ($scope.hours[i].wout - $scope.hours[i].win) - ($scope.hours[i].lin - $scope.hours[i].lout);
			// compensate for minutes        (/ 60)
			// compensate for seconds        (/ 60)
			// compensate for milliseconds   (/ 1,000)
			// total                         (/ 3,600,000)
			temp = temp / 3600000;
			//calculate total
			total += temp;
			/* overtime logic:
			 *  If you worked 7 days in a week, the 7th day is overtime
			 *  If you worked anything over 8 hours on the 7th day it is double time
			 */
			days += 1;
			if (temp > 0) {
				workdays += 1;
			} else { continue; }
			if (days === 7) {
				if (workdays === 7) {
					workdays = 0;
					if (temp > 8) {
						$scope.pay.overtime += (temp - 8) * (4 / 3);
						$scope.pay.overtime += 8;
					} else {
						$scope.pay.overtime += temp;
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
			if (temp <= 8 && temp !== 0) {
				$scope.pay.regular += temp;
			} else if (temp > 8 && temp <= 12) {
				$scope.pay.overtime += (temp - 8);
				$scope.pay.regular += 8;
			} else if (temp > 12) {
				$scope.pay.overtime += 4;
				$scope.pay.overtime += (temp - 12) * (4 / 3);
				$scope.pay.regular += 8;
			}
		}
		// overtime should be 1.5x pay, so I added overtime x 0.5
		$scope.pay.gross = (total + ($scope.pay.overtime * 0.5)) * $scope.payrate;
		//I put 4% towards my 401k as is the default for Tesla
		//as calculated online, paycheck is ~78% - 4% (401k) of gross pay
		//total ~74% of paycheck
		$scope.pay.paycheck = $scope.pay.gross * 0.74;
		$scope.pay.tax = $scope.pay.gross * 0.22;
		$scope.pay.k401 = $scope.pay.gross * ($scope.k401 / 100);
		//hours worked for the government
		$scope.pay.taxh = $scope.pay.tax / $scope.payrate;
		return total;
	};
// ------------------------------------     Date     ---------------------------------------------- //
	// get today's date
	$scope.date = new Date();
// ---------------------------------     Stock Quote     ------------------------------------------ //
	// get data from web for tesla stock quote
	$scope.tsla = quote.getQ('tsla');
// --------------------------------     Auto Score and Saving    --------------------------------- //
	// save data to cookies every 60 seconds
	setInterval(function () {
		$scope.$apply(function () {
			$scope.saveHours();
            $scope.tsla = quote.getQ('tsla');
		});
	}, 60000);

// ---------------------------------     End Controller    ---------------------------------------- //
});
// --------------------------------     IO to a txt file    -------------------------------------- //
/*$scope.loadHours = function () {
    $http.get("php/getdata.php")
        .success(function (data) {
            var i = 0;
            //console.log($scope.hours);
            for (i = data.length - 1; i >= 0; i -= 1) {
                data[i].win.slice(0, -5);
                data[i].win  = new Date(data[i].win);
                data[i].lout.slice(0, -5);
                data[i].lout = new Date(data[i].lout);
                data[i].lin.slice(0, -5);
                data[i].lin  = new Date(data[i].lin);
                data[i].wout.slice(0, -5);
                data[i].wout = new Date(data[i].wout);
                //console.log(data[i]);
            }
            $scope.hours = data;
            //console.log($scope.hours);
        }).error(function () {
            alert("An unexpected error ocurred!");
        });
};
//This function saves the hours to a text document on the server
$scope.httpPost = function () {
    //console.log("prepost");
    $http.post('php/setdata.php', JSON.stringify($scope.hours))
        .error(function (status) { console.log(status); });
    //console.log("postpost");
    alert("Hours Saved");
};
//This function resets the data then saves the cleared data to the server
$scope.clearHours = function () {
    //reset all of the values
    var clear = new Date("1970-01-01T08:00:00"),
        i = 0;
    for (i = $scope.hours.length - 1; i >= 0; i -= 1) {
        $scope.hours[i].wout = clear;
        $scope.hours[i].win  = clear;
        $scope.hours[i].lin  = clear;
        $scope.hours[i].lout = clear;
    }
    //post to the server
    $http.post('php/setdata.php', JSON.stringify($scope.hours))
        .error(function (status) { console.log(status); });
    alert("Hours Cleared and Saved");
};*/