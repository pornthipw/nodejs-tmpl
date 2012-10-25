var app = angular.module('file_service', ['ngResource']);

app.factory('FileDB', function($resource) {
    var FileDB  = $resource('grad_file/files/:id', {id:'@id'},{});                 
    return FileDB;
});

app.factory('User', function($resource) {
    var User = $resource('userinfo', {});
    return User;
});


