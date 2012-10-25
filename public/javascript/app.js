var app = angular.module('gradfile', ['file_service','ace']);

app.config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:fileCtrl, templateUrl:'static/index.html'}).
      when('/list', {controller:fileCtrl, templateUrl:'static/filelist.html'});
     // when('/detail/:fileId', {controller:detailCtrl, templateUrl:'static/detail.html'});
});

function fileCtrl($scope, FileDB) {    
    $scope.file_list = FileDB.query(function(result) {
	  console.log(result);
      });
    
    $scope.currentPage = 0;
    $scope.page = 0;
    $scope.pageSize = 2;    
    
    $scope.numberOfPages=function() {
      if($scope.file_list) {        
	var totalPage = Math.ceil($scope.file_list.length/$scope.pageSize);               
	return totalPage;          
      }
    };         
};

app.filter('startFrom', function() {
  return function(input, start) {        
    start = +start; //parse to int
    if(input) {
      return input.slice(start);
    } 
    return [];
  }
});     

/*

function detailCtrl($scope, $location,  $routeParams, FileDB){
    var self = this;
    
    File.get({id: $routeParams.fileId}, function(file) {
         self.original = file;
         $scope.file = new File(self.original);
         file.content(function(content) {
             $scope.content=content.content;
         });    
    });
         
    $scope.save = function() {        
        $scope.file.$save_content({content:$scope.content},function(result){
            console.log(result);
        });
    };
    
} 
*/
