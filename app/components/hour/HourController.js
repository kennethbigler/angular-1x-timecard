/*global hourApp, $ */
// ----------------------------------     Controller    ---------------------------------------- //
hourApp.controller('HourController', ["$scope", "HourService", "$location", function ($scope, $HS, $location) {
    "use strict";
// ---------------------------------     IO Functions    --------------------------------------- //
    // get today's date
	$scope.date = new Date();
	
	// set model to variables usable by the view
	$scope.hours = $HS.hours();
	$scope.payrate = $HS.payrate();
	$scope.k401 = $HS.k401();
    $scope.tsla = $HS.getQ();
    // set remove and update functions
    $scope.clearLunch = function () {
		$HS.clearLunch($scope.hours);
        $scope.calculate();
	};
	$scope.clearHours = function () {
		$HS.clearHours();
	};
	$scope.saveHours = function () {
        $HS.saveHours($scope.payrate, $scope.k401, $scope.hours);
	};
    $scope.calculate = function () {
		$scope.pay = $HS.calculate($scope.hours, $scope.k401, $scope.payrate);
	};
    $scope.calculate();
    
    // set a tab as the active tab
    $scope.getClass = function (path) {
        if ($location.path() === path) {
            return 'active';
        } else { return ''; }
    };
    
    // close the navigation
    $scope.closeNav = function () { $("#navbar").collapse('hide'); };
    
// ---------------------------------     Auto Update Quote    ----------------------------------- //
	// save data to local storage every 60 seconds
	setInterval(function () {
		$scope.$apply(function () {
			$scope.saveHours();
            $scope.tsla = $HS.getQ();
		});
	}, 60000);
}]);