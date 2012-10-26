var app = angular.module('file_service', ['ngResource']);

app.factory('FileDB', function($resource) {
    var FileDB  = $resource('grad_file/files/:id', {id:'@id', update: { method: 'PUT' }},{});                 
    return FileDB;
});

/*
app.factory('User', function($resource) {
    var User = $resource('userinfo', {});
    return User;
});
*/

/*
    factory('File', function($resource){
        var  File  = $resource('/mongo/files/:id', {id:'@_id'}, {
            query: {method:'GET',isArray:true},
            save_content: {method:'POST'}
        });    
        
        File.prototype.content = function(cb) {
            return File.get({id: this._id,content:true}, function(content) {
                cb(content);
            });
        };                     
        return File;

*/
