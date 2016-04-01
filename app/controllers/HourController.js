/*jslint continue:true */
/*global app, console */
// ----------------------------------     Controller    ---------------------------------------- //
app.controller('HourController', ["$scope", "HourService", function ($scope, $HS) {
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
	$scope.clearHours = function () {
		$HS.clearHours();
	};
	$scope.saveHours = function () {
        $HS.saveHours($scope.payrate, $scope.k401, $scope.hours);
	};
    
// ---------------------------------     Auto Update Quote    ----------------------------------- //
	// save data to local storage every 60 seconds
	setInterval(function () {
		$scope.$apply(function () {
			$scope.saveHours();
            $scope.tsla = $HS.getQ();
		});
	}, 60000);
    
// --------------------------------     Calculations     ---------------------------------------- //
	// Global variables manipulated in the calculate function, used in view
	$scope.pay = {
		overtime:	0,
		regular:	0,
		taxh:		0,
		gross:		0,
		paycheck:	0,
		tax:		0,
		k401:		0
	};

	/* This function calculates:
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
			if (temp <= 8 && temp > 0) {
				$scope.pay.regular += temp;
			} else if (temp > 8 && temp <= 12) {
				$scope.pay.regular += 8;
                $scope.pay.overtime += (temp - 8);
			} else if (temp > 12) {
				$scope.pay.regular += 8;
                $scope.pay.overtime += 4;
				$scope.pay.overtime += (temp - 12) * (4 / 3);
			}
		}
		// overtime should be 1.5x pay, so I added overtime x 0.5
		$scope.pay.gross = (total + ($scope.pay.overtime * 0.5)) * $scope.payrate;
		//as calculated online, paycheck is ~78% of gross pay
		$scope.pay.k401 = $scope.pay.gross * ($scope.k401 / 100);
        $scope.pay.paycheck = ($scope.pay.gross - $scope.pay.k401) * 0.78;
		$scope.pay.tax = ($scope.pay.gross - $scope.pay.k401) * 0.22;
		
		//hours worked for the government
		$scope.pay.taxh = $scope.pay.tax / $scope.payrate;
		return total;
	};
}]);