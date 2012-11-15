var app = angular.module('gradfile', ['file_service','codemirror']);

app.config(function($routeProvider) {
  $routeProvider.when('/', {
    controller:fileCtrl, 
    templateUrl:'static/index.html'
  });
  $routeProvider.when('/add', {
    controller:CreateFileController, 
    templateUrl:'static/form.html'
  });
  $routeProvider.when('/edit/content/:contentId', { 
    controller:fileCtrl, 
    templateUrl:'static/form.html'
  });
  $routeProvider.when('/add/:contentId', {
    controller:fileCtrl, 
    templateUrl:'static/form.html'
  });
});

function UserCtrl($scope, User, Logout) {
  $scope.user = User.get(function(response) {
    console.log(response);
  });
  
  $scope.logout = function(){
    Logout.get(function(response){
      if(response.success){
        $scope.user = null;
        $scope.$broadcast('logout');
      }
    });
  };
}

function fileCtrl($scope, $location,$routeParams, User, FileDB, MetaDB,Convert ,Logout) {    
  var self = this;
  self.current_type = null;
  //self.current_document = null;
  
  self.run = function() {
    if($scope.content && $scope.template_content) {
      console.log($scope.template_content);
      var template = Handlebars.compile($scope.template_content);
      console.log(JSON.parse($scope.content));
      console.log(template(JSON.parse($scope.content)));      
      $scope.result_tmpl = template(JSON.parse($scope.content));
    }
  };
  
  self.update_file_list = function() {
    $scope.content_list = FileDB.query(function(response) {
      angular.forEach(response, function(v, i) {
        if(v.metadata) {
          v.type = v.metadata.type;
        }
      });
    });
  };
  
  self.update_file_list();
  
  self.base64 = angular.injector(['file_service']).get('base64'); 

  $scope.$on('logout', function() {
    $scope.user = null;
    self.update_file_list();
  });
  
  $scope.items = [
  {
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
  
  
  
  
  //$scope.template_list = FileDB.query 
    
  $scope.get = function(contentId) {
    self.current_id = contentId;
    FileDB.get({id:contentId, fields:JSON.stringify(["document"])}, function(response) {
      console.log(response);
      if(response.success) {
        self.current_document = response.document;
        $scope.document = new FileDB(self.current_document);        
        var meta = response.document.metadata;	        
        if(meta.type) {
          self.current_type = meta.type;
          if(meta.type == "haml") {
            $scope.template_content = self.base64.decode(response.content);
            $scope.ace_content = $scope.template_content;            
            //self.current_ace = $scope.ace_content;
          } else {	    
            if(meta.type == "json") {
              $scope.content = self.base64.decode(response.content);
              $scope.ace_content = $scope.content;
              //self.current_ace = $scope.ace_content;
            } else {	    
                if(meta.type == "xml") {
                  $scope.xml_content = self.base64.decode(response.content);
                  $scope.ace_content = $scope.xml_content;
                  //self.current_ace = $scope.ace_content;                        	    
                } else {
                  console.log(meta);
                  console.log(response.content);
                  $scope.ace_content = self.base64.decode(response.content);          
                }
              }
            }
          }
        }
    }); 
  };
  
  $scope.editMeta = function() {
    /*
    if(self.current_id) {        
      MetaDB.save({id:self.current_id, 
        doc_name:$scope.document.filename,
        meta_type:$scope.document.
        metadata.type, 
        meta_public:$scope.document.metadata.public}, function(response) {	
          console.log(response);
          if(response.success) {          
            self.update_file_list();
            // $scope.content_list = MetaDB.query();
          }     
          self.update_file_list();               
      });                         
    }
    */
    $scope.document.update(function(response) {
      if(response.success) {
        $scope.document._id = self.current_id;
        self.update_file_list();
      }
    });
  };
    
  $scope.save = function() {  
    if(self.current_id) {             
      console.log($scope.ace_content);           
      FileDB.save({id:self.current_id, 
        content:self.base64.encode($scope.ace_content)}, function(response) {	
          $scope.content_list = FileDB.query();
        });    
      if(self.current_type == 'json') {
        $scope.content = $scope.ace_content;
      } else {
        if(self.current_type == 'haml') {
          $scope.template_content = $scope.ace_content;
        }
      }
      self.run();
    } 
  };  
  
  $scope.create = function () {
    self.current_ace = null;
    FileDB.save({
      content:self.base64.encode("--New File--"),
      filename:"New Document"}, function(response) {
        if(response.success) {
          self.update_file_list();
          $scope.get(response.response._id)
        }
    }); 
  };  
  

  
  $scope.convert_to_json = function(){
    console.log("convert to JSON");
    if(self.current_id) {  
      Convert.save({xml_content:self.base64.encode($scope.ace_content)}, function(response){
        if(response) {
          console.log("response-->"+JSON.stringify(response));
          FileDB.save({
            content:self.base64.encode(JSON.stringify(response)),
            filename:"New JSON Document"}, function(response) {
              
              if(response.success) {
                console.log("_id -->"+response.response._id);
                MetaDB.save({id:response.response._id,
                  meta_type:'json',
                  doc_name:response.response.filename}, function(response) {	
                    
                    if(response.success) {
                      $scope.get(response.response._id)
                      //$scope.content_list = MetaDB.query();
                      self.update_file_list();
                    }
                  });
                   
              }
              self.update_file_list();              
            }); 
          }
      });
    };
  };
  
  $scope.destroy = function(contentId) {
    FileDB.remove({id:contentId}, function(response) {
      console.log(response);
      if(response.success) {
        self.update_file_list();
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
    self.run();
  });
  
  
  $scope.currentPage = 0;
  $scope.page = 0;
  $scope.pageSize = 10;    
    
  $scope.numberOfPages=function() {
    if($scope.content_list) {        
      var totalPage = Math.ceil($scope.content_list.length/$scope.pageSize);               
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
