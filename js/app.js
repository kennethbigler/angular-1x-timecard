var app = angular.module('myApp', ['ngCookies']).filter('floor', function() {
    return function(n){
        return Math.floor(n);
    };
});