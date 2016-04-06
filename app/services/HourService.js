/*jslint continue:true */
/*global console, app */

// ----------------------------------     Service    ---------------------------------------- //
// old functions require '$http' to be passed in as well, replaced by '$localstorage'
app.factory('HourService', ["$localstorage", "$quote", function ($localstorage, $quote) {
    "use strict";
    var factory = {};

    // get data from web for tesla stock quote
	factory.getQ = function () {
        return $quote.getQ('tsla');
    };
    
    factory.hours = function () {
        var hours = $localstorage.getObject('hours'),
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
        var p = $localstorage.getObject('payrate');
        console.log(p);
        if (isNaN(p)) {
            return 10;
        }
        return p;
    };
    
    factory.k401 = function () {
        var k = $localstorage.getObject('k401');
        if (isNaN(k)) {
            return 4;
        }
        return k;
    };
    
    factory.clearHours = function () {
		$localstorage.remove('hours');
        $localstorage.remove('payrate');
        $localstorage.remove('k401');
		window.location.reload();
	};
    
	factory.saveHours = function (p, k, h) {
		$localstorage.put('payrate', p);
        $localstorage.put('k401', k);
        $localstorage.putObject('hours', h);
		console.log("hours saved");
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
                overtime:	0,
                regular:	0,
                taxh:		0,
                gross:		0,
                paycheck:	0,
                tax:		0,
                k401:		0,
                total:      0
            },
		    timeEntry = 0,
            days = 0,
            workdays = 0,
            i = 0,
            temp = 0;

		for (i = 0; i < hours.length; i += 1) {
			timeEntry = (hours[i].wout - hours[i].win) - (hours[i].lin - hours[i].lout);
			// compensate for minutes        (/ 60)
			// compensate for seconds        (/ 60)
			// compensate for milliseconds   (/ 1,000)
			// total                         (/ 3,600,000)
			timeEntry = timeEntry / 3600000;
			// add to days and calculate total
            days += 1;
			if (timeEntry > 0) {
                pay.total += timeEntry;
				workdays += 1;
			} else { continue; }

            /* overtime logic:
			 *  If you worked 7 days in a week, the 7th day is overtime
			 *  If you worked anything over 8 hours on the 7th day it is double time
			 */
			if (days === 7) {
				if (workdays === 7) {
					if (timeEntry > 8) {
						pay.overtime += (timeEntry - 8) * (4 / 3);
						pay.overtime += 8;
					} else {
						pay.overtime += timeEntry;
					}
				}
                if (pay.regular > 40) {
                    temp = pay.regular - 40;
                    pay.overtime += temp;
                    pay.regular = 40;
                }
				workdays = 0;
				days = 0;
				continue;
			}
			/* overtime logic:
			 *  If you worked more than 40 hours in a week it is overtime
             *	If you worked more than 8 hours in a day it is overtime
			 *	If you worked more than 12 hours in a day it is double time
			 *	All else is regular time
			 */
			if (timeEntry <= 8) {
				pay.regular += timeEntry;
			} else if (timeEntry > 8 && timeEntry <= 12) {
				pay.regular += 8;
                pay.overtime += (timeEntry - 8);
			} else if (timeEntry > 12) {
				pay.regular += 8;
                pay.overtime += 4;
				pay.overtime += (timeEntry - 12) * (4 / 3);
			}
		}
		// overtime should be 1.5x pay, so I added overtime x 0.5
		pay.gross = (pay.total + (pay.overtime * 0.5)) * payrate;
		//as calculated online, paycheck is ~78% of gross pay
		pay.k401 = pay.gross * (k401 / 100);
        pay.paycheck = (pay.gross - pay.k401) * 0.78;
		pay.tax = (pay.gross - pay.k401) * 0.22;
		
		//hours worked for the government
		pay.taxh = pay.tax / payrate;
        
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