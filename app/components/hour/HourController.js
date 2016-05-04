/*global hourApp, console, confirm, $ */
hourApp.controller('HourController', ['$scope', 'HourService', '$location', '$interval', '$timeout', function ($scope, $HS, $location, $interval, $timeout) {
    "use strict";
    // set up new variables
	$scope.date = new Date();
	$scope.confirmSave = false;
	// set model to variables usable by the view
	$scope.hours = $HS.hours();
	$scope.payrate = $HS.payrate();
	$scope.k401 = $HS.k401();
    $scope.tsla = $HS.getQ();
    
    // saving hours functions
    $scope.clearLunch = function () {
		if (confirm('Are you sure you want to clear all the lunches?')) {
            $HS.clearLunch($scope.hours);
            $scope.calculate();
        }
	};
	$scope.clearHours = function () {
        if (confirm('Are claer all the hours?')) {
		  $HS.clearHours();
        }
	};
	$scope.saveHours = function () {
        $HS.saveHours($scope.payrate, $scope.k401, $scope.hours);
        $scope.confirmSave = true;
        console.log($scope.confirmSave);
        $timeout(function () { $scope.confirmSave = false; }, 2000);
	};
    
    // dynamically update data
    $scope.calculate = function () {
		$scope.pay = $HS.calculate($scope.hours, $scope.k401, $scope.payrate);
	};
    $scope.calculate();
    
	// save data to local storage every 60 seconds
	var myInterval = $interval(function () {
        $scope.saveHours();
        $scope.tsla = $HS.getQ();
	}, 60000);
    // stop intervals after scope is destroyed
    $scope.$on(
        "$destroy",
        function (event) {
            $interval.cancel(myInterval);
        }
    );
    
    // moved to a home controller later
    // set the active tab
    $scope.getClass = function (path) {
        if ($location.path() === path) {
            return 'active';
        } else { return ''; }
    };
    
    // close navigation
    $scope.closeNav = function () { $("#navbar").collapse('hide'); };
}]);