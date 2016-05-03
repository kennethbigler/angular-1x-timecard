/*global hourApp, $ */
hourApp.controller('HourController', ['$scope', 'HourService', '$location', '$interval', '$timeout', function ($scope, $HS, $location, $interval, $timeout) {
    "use strict";
    // get today's date
	$scope.date = new Date();
	
	// set model to variables usable by the view
	$scope.hours = $HS.hours();
	$scope.payrate = $HS.payrate();
	$scope.k401 = $HS.k401();
    $scope.tsla = $HS.getQ();
    $scope.confirmSave = false;
    
    // saving hours functions
    $scope.clearLunch = function () {
		$HS.clearLunch($scope.hours);
        $scope.calculate();
	};
	$scope.clearHours = function () {
		$HS.clearHours();
	};
	$scope.saveHours = function () {
        $HS.saveHours($scope.payrate, $scope.k401, $scope.hours);
        $scope.confirmSave = true;
        $timeout(function () {
            $scope.confirmSave = true;
        }, 2000);
	};
    
    // dynamically update data
    $scope.calculate = function () {
		$scope.pay = $HS.calculate($scope.hours, $scope.k401, $scope.payrate);
	};
    $scope.calculate();
    
    // set the active tab
    $scope.getClass = function (path) {
        if ($location.path() === path) {
            return 'active';
        } else { return ''; }
    };
    
    // close navigation
    $scope.closeNav = function () { $("#navbar").collapse('hide'); };
    
	// save data to local storage every 60 seconds
	$interval(function () {
		$scope.$apply(function () {
			$scope.saveHours();
            $scope.tsla = $HS.getQ();
            console.log("i");
		});
	}, 60000);
}]);