app.directive('hrow', function() {
  return {
    restrict: 'E',
    scope: {info: '='},
    templateUrl: 'js/directives/hrow.html'
  };
});