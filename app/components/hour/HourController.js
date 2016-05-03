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
    $scope.confirmSave = true;
    
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
        var timer = $timeout(function () { $scope.confirmSave = false; }, 10000);
        console.log("saved");
        
        // Let's bind to the resolve/reject handlers of
        // the timer promise so that we can make sure our
        // cancel approach is actually working.
        timer.then(
            function () {
                console.log("Timer resolved! ", Date.now());
            },
            function () {
                console.log("Timer rejected! ", Date.now());
            }
        );
        // When the DOM element is removed from the page,
        // AngularJS will trigger the $destroy event on
        // the scope. This gives us a chance to cancel any
        // pending timer that we may have.
        
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
	var myInterval = $interval(function () {
        $scope.saveHours();
        $scope.tsla = $HS.getQ();
	}, 60000);
    
    $scope.$on(
        "$destroy",
        function (event) {
            $timeout.cancel(myInterval);
        }
    );
}]);