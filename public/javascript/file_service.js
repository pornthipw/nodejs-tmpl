var app = angular.module('file_service', ['ngResource']);

app.factory('FileDB', function($resource) {
    var FileDB  = $resource('grad_file/files/:id', {id:'@id', update: { method: 'PUT' }},{});     
    FileDB .prototype.update = function(cb) {
        return FileDB .update({id: this._id.$oid},
            angular.extend({}, this, {_id:undefined}), cb);
    };                    
    return FileDB;   
});

app.factory('MetaDB', function($resource) {
    var MetaDB  = $resource('grad_file/metadata/:id', {id:'@id'},{});                      
    return MetaDB;   
});


app.factory('User', function($resource) {
    var User  = $resource('user', {}, {});         
    return User;   
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
