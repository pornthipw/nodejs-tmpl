var app = angular.module('gradfile', ['file_service','ace']);

app.config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:fileCtrl, templateUrl:'static/index.html'}).
      when('/add', {controller:CreateFileController, templateUrl:'static/form.html'}).
      when('/edit/content/:contentId', { controller:fileCtrl, templateUrl:'static/form.html'}).
      when('/add/:contentId', {controller:fileCtrl, templateUrl:'static/form.html'});
      //when('/detail/:contentId', {controller:detailCtrl, templateUrl:'static/detail.html'});
});

function fileCtrl($scope, $location,$routeParams,FileDB) {    
    var self = this;
    /*$scope.content_list = FileDB.query(function(result) {
	  console.log(result);
      });
    */
     $scope.content_list = FileDB.query(); 
    
  $scope.get = function(contentId) {
    FileDB.get({id:contentId}, function(response) {
      self.original = response;
      $scope.content = new FileDB(self.original);      
    }); 
  };
    
    $scope.save = function() {  
    if($scope.content._id) {      
      $scope.content.update(function() {
        $scope.content_list = FileDB.query(); 
	//$location.path('/');
      });    
    } else {
        FileDB.save($scope.content, function(response) {
          $scope.content_list = FileDB.query(); 
        });    
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
function CreateFileController($scope, $location, FileDB) {
  $scope.save = function() {    
    console.log($scope.content);
    FileDB.save($scope.content, function(response) {
      $location.path('/');
    }); 
       
  };  
}
