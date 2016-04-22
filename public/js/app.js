var app = angular.module('app', []);

app.controller('controller', function($scope, $http){
  $http.get('/get').then(function(response){
    $scope.listat = response.data;
    console.log($scope.listat);
  });
});
