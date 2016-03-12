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
    
    return factory;
}]);

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
