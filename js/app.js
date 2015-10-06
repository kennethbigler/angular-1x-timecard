/*global angular*/
var app = angular.module('myApp', ['ngCookies'])
// -----------------------------------     Filters    ------------------------------------------ //
        .filter('floor', function () {
            "use strict";
            return function (n) { return Math.floor(n); };
        })
// -----------------------------------     Services    ----------------------------------------- //
        .factory('quote', function ($http) {
            "use strict";
            // prepare data object for tesla stock quote
            var q = {
                total:	0,
                change: 0,
                color:	{"color": "green"}
            },
            // prepare the object for return
                service = {};
            // add server query function to get stock information
            service.getQ = function (s) {
                var url = "http://query.yahooapis.com/v1/public/yql",
                    symbol = s,
                    qstring = "select * from yahoo.finance.quotes where symbol in ('" + symbol + "')";

                $http.get(url + '?q=' + qstring + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env")
                    .success(function (data) {
                        //retrieve specific information I want to display
                        q.total = data.query.results.quote.LastTradePriceOnly;
                        q.change = data.query.results.quote.Change;
                        //change the color to simbolize possitive or negative change
                        if (q.change >= 0) {
                            q.color = {"color": "green"};
                        } else {
                            q.color = {"color": "red"};
                        }
                        //return needed variable
                        return q;
                    }).error(function (err) { return err; });
                // idk why I need this, but this seems to be what returns, it is the needed object data
                return q;
            };
            return service;
        })
        //use HTML5 local storage
        .factory('$localstorage', ['$window', function ($window) {
            'use strict';
            return {
                set: function (key, value) {
                    $window.localStorage[key] = value;
                },
                get: function (key, defaultValue) {
                    return $window.localStorage[key] || defaultValue;
                },
                putObject: function (key, value) {
                    $window.localStorage[key] = JSON.stringify(value);
                },
                getObject: function (key) {
                    return JSON.parse($window.localStorage[key] || '{}');
                },
                remove: function (key) {
                    $window.localStorage.removeItem(key);
                }
            };
        }]);