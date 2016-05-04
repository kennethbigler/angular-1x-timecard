/*global hourApp*/

hourApp.config(function ($routeProvider) {
    "use strict";
    $routeProvider
        .when('/', {
            templateUrl: 'app/components/hour/hour.html'//,
            //controller: 'HourController'
        }).when('/shuttle', {
            templateUrl: 'app/components/shuttle/shuttle.html'
        }).otherwise({ redirectTo: '/' });
    // use the HTML5 History API
    // $locationProvider.html5Mode(true);
});