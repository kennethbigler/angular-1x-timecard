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
	$scope.tsla = {
		total: 0,
		change: 0,
		color: {"color":"green"}
	}
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

	$scope.payrate = 28;
	$scope.date = new Date();
	//console.log($scope.date);

	$scope.loadHours = function() {
		$http.get("php/getdata.php")
		.success(function (data) {
			//console.log($scope.hours);
			$scope.hours = data;
			//console.log($scope.hours);
		}).error(function () {
			alert("An unexpected error ocurred!");
		});
	};
	$scope.loadHours();

	$scope.httpPost = function() {
		//console.log("prepost");
		$http.post('php/setdata.php', JSON.stringify($scope.hours))
		.error(function(status){console.log(status)});
		//console.log("postpost");
		alert("Hours Saved");
	};

	$scope.total = function() {
		var total = 0;
		for (var i = 0; i < 14; i ++) {
			total += ($scope.hours[i].wout - $scope.hours[i].win) - ($scope.hours[i].lin - $scope.hours[i].lout);
		}
		return total;
	};

	$scope.overtime = function() {
		var overtime = 0;
		var temp = 0;
		var days = 0;
		var workdays = 0;
		for (var i = 0; i < 14; i ++) {
			temp = ($scope.hours[i].wout - $scope.hours[i].win) - ($scope.hours[i].lin - $scope.hours[i].lout);
			days = days + 1;
			if (temp > 0) {
				workdays += 1;
			}
			if (workdays > 5) {
				overtime += temp;
			}
			if (temp > 8) {
				overtime += (temp - 8);
			}
			if (days == 7) {
				workdays = 0;
			}
		}
		return overtime;
	};

	$scope.payment = function() {
		//total returns (regular + overtime)
		//overtime returns (overtime) but since it is double counted
		// Overtime should be 1.5x pay, so I added Overtime x 0.5
		return (($scope.total() * 1) + ($scope.overtime() * 0.5)) * $scope.payrate;
	}
}]);