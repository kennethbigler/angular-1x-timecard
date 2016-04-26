/*jslint continue:true */
/*global console, hourApp */

// ----------------------------------     Service    ---------------------------------------- //
// old functions require '$http' to be passed in as well, replaced by '$localstorage'
hourApp.factory('HourService', ["$localstorage", "$quote", function ($storage, $quote) {
    "use strict";
    var factory = {};

    // get data from web for tesla stock quote
	factory.getQ = function () {
        return $quote.getQ('tsla');
    };
    
    factory.hours = function () {
        var hours = $storage.getObject('hours'),
            i = 0;
        // check if the local data exists
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
        return hours;
    };
    
    factory.payrate = function () {
        var p = $storage.getObject('payrate');
        //console.log(p);
        if (isNaN(p)) {
            return 10;
        }
        return p;
    };
    
    factory.k401 = function () {
        var k = $storage.getObject('k401');
        if (isNaN(k)) {
            return 4;
        }
        return k;
    };
    
    factory.clearLunch = function (hours) {
		var i = 0;
        for (i = 0; i < hours.length; i += 1) {
            hours[i].lout = window.hours[i].lout;
            hours[i].lin = window.hours[i].lin;
        }
        $storage.putObject('hours', hours);
		//window.location.reload();
	};
    
    factory.clearHours = function () {
		$storage.remove('hours');
        $storage.remove('payrate');
        $storage.remove('k401');
		window.location.reload();
	};
    
	factory.saveHours = function (p, k, h) {
		$storage.put('payrate', p);
        $storage.put('k401', k);
        $storage.putObject('hours', h);
		//console.log("hours saved");
	};
    
// --------------------------------     Calculations     ---------------------------------------- //
	

	/* This function calculates:
	 *    the total hours worked and stores it in a global variable
	 *    overtime based on CA State Law and returns that value
	 *    grosspay based on payrate
	 *    aproximate tax for CA employee in lower brackets
	 */
	factory.calculate = function (hours, k401, payrate) {
        var
            pay = {
                regular:	0,
                overtime:	0,
                double:     0,
                gross:		0,
                paycheck:	0,
                tax:		0,
                k401:		0,
                mealp:      0
            },
		    timeEntry = 0,
            days = 0,
            workDays = 0,
            weekHours = 0,
            block1 = 0,
            block2 = 0,
            i = 0,
            temp = 0;

		for (i = 0; i < hours.length; i += 1) {
            block1 = hours[i].lout - hours[i].win;
            block2 = hours[i].wout - hours[i].lin;
			// compensate for minutes        (/ 60)
			// compensate for seconds        (/ 60)
			// compensate for milliseconds   (/ 1,000)
			// total                         (/ 3,600,000)
            block1 /= 3600000;
            block2 /= 3600000;
            timeEntry = block1 + block2;
			// add to days and calculate work week hours
            days += 1;
			if (timeEntry > 0) {
				workDays += 1;
                weekHours += timeEntry;
			} else { continue; }
            // check for meal premiums (working 5+ hours with no lunch break in a 6+ hour work day)
            if (block1 >= 5 && timeEntry >= 6) {
                pay.mealp += 1;
            }
            if (block2 >= 5 && timeEntry >= 6) {
                pay.mealp += 1;
            }
            /* overtime logic:
			 *  If you worked 7 days in a week, the 7th day is overtime
			 *  If you worked anything over 8 hours on the 7th day it is double time
			 */
			if (days === 7) {
				if (workDays === 7) {
					if (timeEntry > 8) {
						pay.double += timeEntry - 8;
						pay.overtime += 8;
					} else {
						pay.overtime += timeEntry;
					}
				}
                if (weekHours > 40) {
                    temp = weekHours - 40;
                    pay.overtime += temp;
                }
				workDays = 0;
                weekHours = 0;
				days = 0;
				continue;
			}
			/* overtime logic:
			 *  If you worked more than 40 hours in a week it is overtime
             *	If you worked more than 8 hours in a day it is overtime
			 *	If you worked more than 12 hours in a day it is double time
			 *	All else is regular time
			 */
            pay.regular += timeEntry;
			if (timeEntry > 8 && timeEntry <= 12) {
                pay.overtime += timeEntry - 8;
			} else if (timeEntry > 12) {
                pay.overtime += 4;
				pay.double += timeEntry - 12;
			}
		}
		// final calculations of pay
		pay.gross = (pay.regular + (pay.overtime * 0.5) + pay.double + pay.mealp) * payrate;
		pay.k401 = pay.gross * (k401 / 100);
        // as calculated online, paycheck is ~78% of gross pay - 401k
        pay.tax = (pay.gross - pay.k401) * 0.22;
        pay.paycheck = pay.gross - pay.k401 - pay.tax;
        
        return pay;
	};
    
    return factory;
}]);

// --------------------------------     IO to a txt file    -------------------------------------- //
    /*factory.loadHours = function () {
        $http.get("php/getdata.php")
            .success(function (data) {
                var i = 0,
                    hours = [];
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
                hours = data;
                //console.log(hours);
            }).error(function () {
                console.log("An unexpected error ocurred!");
            });
    };
    //This function saves the hours to a text document on the server
    factory.httpPost = function (hours) {
        //console.log("post starts");
        $http.post('php/setdata.php', JSON.stringify(hours))
            .error(function (status) {
                console.log(status);
            });
        //console.log("post finished");
        console.log("Hours Saved");
    };
    //This function resets the data then saves the cleared data to the server
    factory.clearHours = function () {
        //post to the server
        $http.post('php/setdata.php', JSON.stringify(window.hours))
            .error(function (status) {
                console.log(status);
            });
        console.log("Hours Cleared and Saved");
    };*/