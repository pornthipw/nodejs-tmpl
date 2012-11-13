var app = angular.module('gradfile', ['file_service','codemirror']);

app.config(function($routeProvider) {
    $routeProvider.
      when('/', {controller:fileCtrl, templateUrl:'static/index.html'}).
      when('/add', {controller:CreateFileController, templateUrl:'static/form.html'}).
      when('/edit/content/:contentId', { controller:fileCtrl, templateUrl:'static/form.html'}).
      when('/add/:contentId', {controller:fileCtrl, templateUrl:'static/form.html'});
});

function UserCtrl($scope, User,Logout) {
  $scope.user = User.get(function(response) {
    console.log(response);
  });
  
  $scope.logout = function(){
    Logout.get(function(response){
      if (response.success){
          $scope.user = null;
      }
      //console.log(response);
    });
    
  };

}

function fileCtrl($scope, $location,$routeParams, User, FileDB, MetaDB,Convert ,Logout) {    
  var self = this;
  self.base64 = angular.injector(['file_service']).get('base64'); 
  
  $scope.items = [{
        id: 'json',
        name: 'json'},
    {
        id: 'haml',
        name: 'haml'},
    {
        id: 'xml',
        name: 'xml'},
    ];
  
  $scope.user = User.get(function(response) {
    console.log(response);
  });
  
  //var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  //  lineNumbers: true                
  //});
  
  
  $scope.content_list = FileDB.query(); 
    
  $scope.get = function(contentId) {
    self.current_id = contentId;
    FileDB.get({id:contentId, fields:JSON.stringify(["document"])}, function(response) {
      console.log(response);
      if(response.success) {
        $scope.document = response.document;
        var meta = response.document.metadata;	        
        if(meta.type) {
          if(meta.type == "haml") {
            $scope.template_content = self.base64.decode(response.content);
            $scope.ace_content = $scope.template_content;
            //self.current_ace = $scope.ace_content;
          } else {	    
            if(meta.type == "json") {
              $scope.content = self.base64.decode(response.content);
              $scope.ace_content = $scope.content;
              //self.current_ace = $scope.ace_content;
            } 	 
	    
	    if(meta.type == "xml") {
              $scope.xml_content = self.base64.decode(response.content);
              $scope.ace_content = $scope.xml_content;
              //self.current_ace = $scope.ace_content;
            } 	
	         	    
          }
        } else {
	  console.log(meta);
	  console.log(response.content);
          $scope.ace_content = self.base64.decode(response.content);
          //self.current_ace = $scope.ace_content;
        }
	
      }
    }); 
  };
  
  $scope.editMeta = function(){
    if(self.current_id) {        
      console.log($scope.document.metadata.type);  
      console.log($scope.document.filename); 
      console.log($scope.document.metadata.public);

      MetaDB.save({id:self.current_id, doc_name:$scope.document.filename,meta_type:$scope.document.metadata.type, meta_public:$scope.document.metadata.public}, function(response) {	
        if(response.success) {
          $scope.content_list = MetaDB.query();
        }
      }); 
        
    } else {
    }
  };
    
  $scope.save = function() {  
    if(self.current_id) {             
      console.log($scope.ace_content);           
      FileDB.save({id:self.current_id, content:self.base64.encode($scope.ace_content)}, function(response) {	
        $scope.content_list = FileDB.query();
      });    
    } else {
      /*
      $scope.base64 = angular.injector(['file_service']).get('base64');
      FileDB.save({content:$scope.base64.encode($scope.content)}, function(response) {
           $scope.content_list = FileDB.query();
      });  
      */ 
    }
  };  
  
  $scope.create = function () {
    self.current_ace = null;
    FileDB.save({
      content:self.base64.encode("--New File--"),
      filename:"New Document"}, function(response) {
        if(response.success) {
          $scope.content_list = FileDB.query(); 
          $scope.get(response.response._id)
        }
    }); 
  };  
  

  
  $scope.convert_to_json = function(){
    console.log("convert to JSON");
    if(self.current_id) {  
      //console.log(self.current_id);
      //console.log("content");
      //console.log($scope.ace_content);
      Convert.save({xml_content:self.base64.encode($scope.ace_content)}, function(response){
	//console.log(JSON.stringify(["response"]));
	if(response) {
	  //console.log("response-->"+JSON.parse(response.result));
	  console.log("response-->"+JSON.stringify(response));
	  
	  FileDB.save({
	    //content:self.base64.encode("--New JSON File1--"),
	    //content:self.base64.encode(response),
	    content:self.base64.encode(JSON.stringify(response)),
	    filename:"New JSON Document"}, function(response) {
	      if(response.success) {
		//$scope.content_list = FileDB.query(); 
		//$scope.get(response.response._id)
		console.log("_id -->"+response.response._id);
		//console.log("filename -->"+response.response.filename);
		
		
		MetaDB.save({id:response.response._id,meta_type:'json',doc_name:response.response.filename}, function(response) {	
		  if(response.success) {
		    $scope.get(response.response._id)
		    $scope.content_list = MetaDB.query();
		  }
		}); 
		
	      }
	      $scope.content_list = FileDB.query();
	    }); 
	    
	}
	
	//if
	//if(response.success){
	//  console.log("OK");
	//}
	
      });
      //content:self.base64.encode($scope.ace_content)
      
       
    };
  };
  
  $scope.destroy = function(contentId) {
    FileDB.remove({id:contentId}, function(response) {
      console.log(response);
      if(response.success) {
	$scope.content_list = FileDB.query(); 
      } 
      $scope.message = response.message;
	setTimeout(function() {
	  console.log('clear message');
	  $scope.$apply(function() {
	    $scope.message = null;
	  });
      }, 3000);
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
  
    $scope.items = [{
        id: 'content',
        name: 'content'},
    {
        id: 'template',
        name: 'template'}];
        
  $scope.save = function() {    
    $scope.base64 = angular.injector(['file_service']).get('base64');
    console.log("encode-base64", $scope.base64.encode($scope.content));
    console.log("$scope.content"+$scope.content);
    //FileDB.save({content:$scope.base64.encode($scope.content),filename:$scope.base64.encode($scope.filename),meta_type:$scope.base64.encode($scope.meta_type)}, function(response) {
    FileDB.save({content:$scope.base64.encode($scope.content),filename:$scope.filename,meta_type:$scope.meta_type}, function(response) {
    //FileDB.save({content:$scope.base64.encode($scope.content)}, function(response) {
     $location.path('/');
    }); 
  };  
}
