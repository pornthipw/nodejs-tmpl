var app = angular.module('gradfile', ['file_service','ace']);

app.config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:fileCtrl, templateUrl:'static/index.html'}).
      when('/add', {controller:CreateFileController, templateUrl:'static/form.html'}).
      when('/edit/content/:contentId', { controller:fileCtrl, templateUrl:'static/form.html'}).
      when('/add/:contentId', {controller:fileCtrl, templateUrl:'static/form.html'});
});

function fileCtrl($scope, $location,$routeParams,FileDB) {    
  var self = this;
  $scope.content_list = FileDB.query(); 
    
  $scope.get = function(contentId) {
    console.log(contentId);
    self.current_id = contentId;
    FileDB.get({id:contentId}, function(response) {
      if(response.success) {
	self.base64 = angular.injector(['file_service']).get('base64');  
	console.log(response);
	console.log(response.content);
	console.log("decode-base64-->", self.base64.decode(response.content)); 
	
	//$scope.content = response.content;	
	$scope.content = self.base64.decode(response.content);
	//console.log("$scope.content-->"+$scope.content);
	console.log("encode-base64-->", self.base64.encode($scope.content));
	//console.log("decode-base64", $scope.base64.decode($scope.content));  
      }
    }); 
  };
    
  $scope.save = function() {  
    if(self.current_id) {  
      console.log("test update");
                
      FileDB.save({id:self.current_id, content:self.base64.encode($scope.content)}, function(response) {
	
      });    
    } else {

    }
  };  
  
  $scope.destroy = function() {
    console.log("test"+self.current_id);
    FileDB.remove({id:self.current_id}, function(response){
      console.log("OK");
      $scope.content_list = FileDB.query(); 
    });
  }; 
  
  $scope.transfer = function(){
      console.log("tran");
      $scope.base64 = angular.injector(['file_service']).get('base64');
      //console.log("encode-base64", $scope.base64.encode(self.content));

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


function CreateFileController($scope, $location, FileDB) {
  $scope.save = function() {    
    $scope.base64 = angular.injector(['file_service']).get('base64');
    console.log("encode-base64", $scope.base64.encode($scope.content));
    console.log("$scope.content"+$scope.content);
    FileDB.save({content:$scope.base64.encode($scope.content)}, function(response) {
     //$location.path('/');
    }); 
  };  
}
