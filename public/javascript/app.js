var app = angular.module('gradfile', ['file_service','ace','codemirror']);

app.config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:fileCtrl, templateUrl:'static/index.html'}).
      when('/add', {controller:CreateFileController, templateUrl:'static/form.html'}).
      when('/edit/content/:contentId', { controller:fileCtrl, templateUrl:'static/form.html'}).
      when('/add/:contentId', {controller:fileCtrl, templateUrl:'static/form.html'});
});

function UserCtrl($scope, User) {
  $scope.user = User.get(function(response) {
    console.log(response);
  });
  
}

function fileCtrl($scope, $location,$routeParams, User, FileDB, MetaDB) {    
  var self = this;
  self.base64 = angular.injector(['file_service']).get('base64'); 
  
$scope.items = [{
        id: 'content',
        name: 'content'},
    {
        id: 'template',
        name: 'template'}];
  
  $scope.user = User.get(function(response) {
    console.log(response);
  });
  
  //var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  //  lineNumbers: true                
  //});
  
  $scope.content_list = FileDB.query(); 
    
  $scope.get = function(contentId) {
    console.log(contentId);
    self.current_id = contentId;
    FileDB.get({id:contentId, fields:JSON.stringify(["document"])}, function(response) {
      if(response.success) {
	$scope.document = response.document;
	var meta = response.document.metadata;	
	console.log(response.document);
	if(meta) {
	  if(meta.type == "template") {
	    $scope.template_content = self.base64.decode(response.content);
	    $scope.ace_content = $scope.template_content;
	  } else {	    
	    if(meta.type == "content") {
	      $scope.content = self.base64.decode(response.content);
	      $scope.ace_content = $scope.content;
	    } 	      	    
	  }
	} else {
	  $scope.ace_content = self.base64.decode(response.content);
	} 
	
        
        //console.log(response);
        //console.log(response.content);
        //console.log("decode-base64-->", self.base64.decode(response.content)); 
	
        
        
        //console.log("$scope.content-->"+$scope.content);
        //console.log("encode-base64-->", self.base64.encode($scope.content));
        //console.log("decode-base64", $scope.base64.decode($scope.content));  
	
      }
    }); 
  };
  
  
  $scope.view_info = function(contentId){
    console.log(contentId);
      FileDB.get({id:contentId}, function(response) {
      if(response.success) {
        self.base64 = angular.injector(['file_service']).get('base64');  
        //console.log(response);
        //console.log(response.content);
        //console.log("decode-base64-->", self.base64.decode(response.content)); 
	
        $scope.contentInfo = self.base64.decode(response.content);
	$('#contentviewModal').modal('hide');
	
        //$scope.ace_content = $scope.content;
        //console.log("$scope.content-->"+$scope.content);
        //console.log("encode-base64-->", self.base64.encode($scope.content));
        //console.log("decode-base64", $scope.base64.decode($scope.content));  
	
      }
    }); 
  };
  
  $scope.editMeta = function(){
    
    if(self.current_id) {        
      console.log("test"+$scope.document.filename);       
      MetaDB.save({id:self.current_id, doc_name:$scope.document.filename,meta_type:$scope.document.metadata.type}, function(response) {	
        if(response.success) {
          $scope.content_list = MetaDB.query();
        }
      });    
    } else {
    }
  };
    
  $scope.save = function() {  
    if(self.current_id) {                        
      FileDB.save({id:self.current_id, content:self.base64.encode($scope.ace_content)}, function(response) {	
        $scope.content_list = FileDB.query();
      });    
    } else {
    }
  };  
  
  $scope.destroy = function() {
    //console.log("test"+self.current_id);
    FileDB.remove({id:self.current_id}, function(response){
      //console.log("OK");
      $scope.content_list = FileDB.query(); 
    });
  }; 
  
  $scope.transfer = function(){
      console.log("tran");
      $scope.base64 = angular.injector(['file_service']).get('base64');
      //console.log("encode-base64", $scope.base64.encode(self.content));

  };  
  
  $scope.gettempl = function(contentId) {
      console.log("templ");
      console.log(contentId);
      self.templateId = contentId;
      FileDB.get({id:self.templateId}, function(response) { 
      if(response.success) {
        self.base64 = angular.injector(['file_service']).get('base64');  
        
        $scope.template_content = self.base64.decode(response.content);	  
        $scope.ace_content = $scope.template_content;
      }	
    });
  };
  
  $scope.$watch('template_content + content', function(newValue, oldValue) {
    if($scope.content && $scope.template_content) {
      var template = Handlebars.compile($scope.template_content);
      console.log(JSON.parse($scope.content));
      console.log(template(JSON.parse($scope.content)));      
      $scope.result_tmpl = template(JSON.parse($scope.content));
    }
  });
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
     $location.path('/');
    }); 
  };  
}
