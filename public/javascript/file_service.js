var app = angular.module('file_service', ['ngResource']);

app.factory('FileDB', function($resource) {
    var FileDB  = $resource('smis_file/files/:id', {id:'@id'},{
      update: { method: 'PUT' }
    });     
    
    FileDB.prototype.update = function(cb) {
      console.log('FileDb');
      console.log(this);
      console.log(angular.extend({'a':1}, {'b':2}));
      
      var x = angular.extend({}, this);
      console.log('X');
      console.log(x);
      return FileDB.update({id: this._id},
            angular.extend({}, this, {_id:undefined}), cb);
    };                    
    
    return FileDB;   
});

app.factory('MetaDB', function($resource) {
    var MetaDB  = $resource('smis_file/metadata/:id', {id:'@id'},{});                      
    return MetaDB;               
    
});

app.factory('Convert', function($resource) {
  var Convert  = $resource('ajax/xml2json/',  {},{}); 
    //var Convert  = $resource('ajax/xml2json/',  {update: { method: 'PUT' }},{}); 
    /*
    Convert.prototype.update = function(cb) {
      return Convert.update({content: this._id},
	angular.extend({}, this, {_id:undefined}), cb);
      };
      */
    
    return Convert;   
});

app.factory('User', function($resource) {
    var User  = $resource('user',{}, {});   
    return User;   
});


app.factory('Logout', function($resource) {
    var Logout  = $resource('logout',{}, {});   
    return Logout ;   
});

app.factory('base64', function() {
    return {

        name: 'Base64',
        readonly: false,
	
        encode: function(input) {	  	  	  	  
          return window.btoa($.utf8.encode(input));
        },

        decode: function(input) {	  
            return $.utf8.decode(window.atob(input));	    	    
        }

    };
});




/*
app.factory('base64', ['$window', function($window) {
    return {

        name: 'Base64',
        readonly: false,

        encode: function(input) {
            return $window.btoa(input);
        },

        decode: function(input) {
            return $window.atob(input);
        }

    };
}]);



app.factory('User', function($resource) {
    var User = $resource('userinfo', {});
    return User;
});
*/
