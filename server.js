var express = require("express");
var handlebars = require('hbs');
var mongodb = require('mongodb');

var config = require('./config');
var routes = require('./routes');
var app = express();

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));    
  app.set('views', __dirname + '/views');
  app.engine('html', handlebars.__express);  
  app.set('view engine', 'html');      
  app.use(express.methodOverride());
});

console.log("starting");

var test_data = 'ew0KICAidGl0bGUiOiAiQWxsIGFib3V0IDxwPiBUYWdzIiwNCiAgImJvZHkiOiAiPHA+VGhpcyBpcyBhIHBvc3QgYWJvdXQgJmx0O3AmZ3Q7IHRhZ3M8L3A+Ig0KfQ==';
var test_template = 'PGRpdiBjbGFzcz0iZW50cnkiPg0KICA8aDE+e3t0aXRsZX19PC9oMT4NCiAgPGRpdiBjbGFzcz0iYm9keSI+DQogICAge3t7Ym9keX19fQ0KICA8L2Rpdj4NCjwvZGl2Pg==';

app.post('/transform', function(req, res) {  
  //var data = new Buffer(req.body.data, 'base64').toString();
  //var template = new Buffer(req.body.template, 'base64').toString(); 
  
  var data = new Buffer(test_data, 'base64').toString();
  var template = new Buffer(test_template, 'base64').toString(); 
  
  var tmpl = handlebars.compile(template);
  var result = tmpl(JSON.parse(data));
  
  var content = new Buffer(result).toString('base64');
  
  res.json({'content':content});  
});

app.get('/', function(req, res){
  res.render('index');
})

app.listen(config.site.port || 3000);
//app.listen(3000);


