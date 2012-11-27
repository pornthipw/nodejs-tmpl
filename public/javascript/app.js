var app = angular.module('gradfile', ['file_service','codemirror']);

app.config(function($routeProvider) {
  $routeProvider.when('/', {
    controller:fileCtrl, 
    templateUrl:'static/index.html'
  });
  $routeProvider.when('/edit/content/:contentId', { 
    controller:fileCtrl, 
    templateUrl:'static/form.html'
  });
  $routeProvider.when('/add/:contentId', {
    controller:fileCtrl, 
    templateUrl:'static/form.html'
  });
  $routeProvider.when('/public', {
    controller:publicCtrl, 
    templateUrl:'static/public.html'
  });
  $routeProvider.when('/document', {
    controller:fileCtrl,
    templateUrl:'static/document.html'
  });

});

function UserCtrl($scope, User, Logout) {
  $scope.user = User.get(function(response) {
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
  
  self.message = function(message) {
    $scope.message = message;
    setTimeout(function() {      
      $scope.$apply(function() {
        $scope.message = null;
      });
    }, 3000);
  };
  
  self.run = function() {
    if($scope.content && $scope.template_content) {      
      var template = Handlebars.compile($scope.template_content);      
      $scope.result_tmpl = template(JSON.parse($scope.content));
    }
  };
  
  self.update_file_list = function() {
    FileDB.query(function(response) {
      var result = [];
      if($scope.user == null) return result;
      $scope.total_haml = 0;  
      $scope.total_json = 0;  
      $scope.total_xml = 0; 
      $scope.total_unknown = 0;
      angular.forEach(response, function(v, i) {                
        if(v.metadata) {
            v.type = v.metadata.type;
            v.user = v.metadata.user;
            if($scope.user.user.identifier == v.metadata.user.identifier) {                            
              //console.log(v);              
              if (v.type == 'haml') { 
                $scope.total_haml ++; 
              } else {
                if (v.type == 'json') {
                  $scope.total_json ++; 
                } else {
                  if (v.type == 'xml') {
                    $scope.total_xml ++;
                  } else {
                    if (v.type == null ) {              
                      v.type = 'unknown'; 
                      $scope.total_unknown++;             
                    }    
                  }
                }
              }
              result.push(v);
            }
        }      
      });
      $scope.content_list = result;
      //console.log(result);
    });
  };
  
  
  $scope.user = User.get(function(response) {
    self.update_file_list();    
  });
  
  
  
  self.base64 = angular.injector(['file_service']).get('base64'); 

  $scope.$on('logout', function() {
    $scope.user = null;
    self.update_file_list();
  });
  
  $scope.items = [
  {
    id: 'json',
    name: 'Content'},
  {
    id: 'haml',
    name: 'Template'},
  {
    id: 'xml',
    name: 'XML'},
  ];
  
  
  
  //var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  //  lineNumbers: true                
  //});
  
  $scope.get = function(contentId) {
    self.current_id = contentId;
    FileDB.get({id:contentId, fields:JSON.stringify(["document"])}, function(response) {
      if(response.success) {
        self.current_document = response.document;
        
        $scope.document = new FileDB(self.current_document);                
        var meta = response.document.metadata;	        
        if(meta.type) {
          self.current_type = meta.type;
          if(meta.type == "haml") {
            $scope.template_content = self.base64.decode(response.content);
            $scope.ace_content = $scope.template_content;    
            $scope.base_64_content = response.content;        
          } else {	    
            if(meta.type == "json") {
              $scope.content = self.base64.decode(response.content);
              $scope.ace_content = $scope.content;
              $scope.base_64_content = response.content;
            } else {	    
                if(meta.type == "xml") {
                  $scope.xml_content = self.base64.decode(response.content);
                  $scope.ace_content = $scope.xml_content;
                  $scope.base_64_content = response.content;                      	    
                } else {                                    
                  $scope.ace_content = self.base64.decode(response.content); 
                  $scope.base_64_content = response.content;         
                }
              }
            } 
          } else {            
              $scope.ace_content = self.base64.decode(response.content);    
              $scope.base_64_content = response.content;       
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
      $scope.document._id = self.current_id;
      if(response.success) {        
        self.update_file_list();
      } else {                
        self.message(response.message);
      }
      self.update_file_list();
      
    });
  };
    
  $scope.save = function() {  
    if(self.current_id) {                   
      FileDB.save({id:self.current_id, 
        content:self.base64.encode($scope.ace_content)}, function(response) {	
          if(response.success) {
            self.update_file_list();
          } else {
            self.message(response.message);
          }          
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
    if(self.current_id) {  
      Convert.save({xml_content:self.base64.encode($scope.ace_content)}, function(response){
        if(response) {
          FileDB.save({
            content:self.base64.encode(JSON.stringify(response)),
            filename:"New JSON Document"}, function(response) {
              
              if(response.success) {
                MetaDB.save({id:response.response._id,
                  meta_type:'json',
                  doc_name:response.response.filename}, function(response) {	
                    
                    if(response.success) {
                      $scope.get(response.response._id)
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
      if(response.success) {
        self.update_file_list();
      }       
    });
  }; 
  
  $scope.del = function() {
    FileDB.remove({id:self.current_id}, function(response) {
      if(response.success) {
        self.update_file_list();
      } else {       
        self.message(response.message);
      }
    });
  }; 
  
  $scope.$watch('template_content + content', function(newValue, oldValue) {
    self.run();
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

function publicCtrl($scope, $location,$routeParams, FileDB,Logout) {    
  var self = this;
  self.base64 = angular.injector(['file_service']).get('base64'); 
  $scope.file_list = FileDB.query();
  
  
  FileDB.query(function(response) {
    var user_dict = {};
    angular.forEach(response, function(v, i) {
      if(v.metadata) {
        if(v.metadata.public) {
          var id = v.metadata.user.identifier;
          if(!(id in user_dict)) {
            user_dict[id] = {'name':id, 'files':[],'count':0};
          }        
          user_dict[id]['files'].push(v);
          user_dict[id]['count']++;
          console.log(user_dict[id]['count']);
        }
      } 
    });
    $scope.content_list = user_dict;
  });

  
  
  
  $scope.get = function(contentId) {
    self.current_id = contentId;
    FileDB.get({id:contentId, fields:JSON.stringify(["document"])}, function(response) {
      //console.log(response);
      if(response.success) {
        self.current_document = response.document;
        
        //console.log("---->"+response.content);
        $scope.document = new FileDB(self.current_document);                
        var meta = response.document.metadata;	        
        if(meta.type) {
          self.current_type = meta.type;
          if(meta.type == "haml") {
            $scope.template_content = self.base64.decode(response.content);
            $scope.ace_content = $scope.template_content;    
            $scope.base_64_content = response.content;        
            //self.current_ace = $scope.ace_content;
          } else {	    
            if(meta.type == "json") {
              $scope.content = self.base64.decode(response.content);
              $scope.ace_content = $scope.content;
              $scope.base_64_content = response.content;
              //self.current_ace = $scope.ace_content;
            } else {	    
                if(meta.type == "xml") {
                  $scope.xml_content = self.base64.decode(response.content);
                  $scope.ace_content = $scope.xml_content;
                  $scope.base_64_content = response.content;
                  //self.current_ace = $scope.ace_content;                        	    
                } else {                                    
                  $scope.ace_content = self.base64.decode(response.content); 
                  $scope.base_64_content = response.content;         
                }
              }
            } 
          } else {            
              $scope.ace_content = self.base64.decode(response.content);     
              $scope.base_64_content = response.content;      
          }
        }
    }); 
  };
  
  $scope.currentPage = 0;
  $scope.page = 0;
  $scope.pageSize = 10;    
    
  $scope.numberOfPages=function() {
    if($scope.content_list) {        
      var totalPage = Math.ceil($scope.content_list.length/$scope.pageSize);               
      return totalPage;          
    }
  };   
  
}


