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


//connect database

app.param('db', function(req, res, next) {
  var db = new mongodb.Db(req.params.db, new mongodb.Server(config.mongodb.server, config.mongodb.port, {'auto_reconnect':true}));
  db.open(function(err,db) {
    if(err) {
      res.send(500, err);
    } else {
      var required_authen = false;
      for(var idx in config.mongodb.auth) {
	if(config.mongodb.auth[idx].name == req.params.db) {
	  required_authen = true;
	  db.authenticate(config.mongodb.auth[idx].username, config.mongodb.auth[idx].password, function(err,result) {
	    if(err) {
	      res.send(500, err);
	    } else {
	      if(result) {
		req.db = db;
		next();
	      } else {
		res.send(403, 'Unauthorized');
	      }
	    }
	  });
	}
      }
      if(!required_authen) {
	req.db = db;
	next();
      }
    }
  });
});

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
});

app.get('/:db/files/:id', function (req,res){ 
    var db = req.db;
});

app.post('/:db/files', function (req,res){
  
  var db = req.db;
  
  if(req.body) {          
    //var gridStore = new mongodb.GridStore(db, new mongodb.ObjectID(),req.files.file.name, 'w', {content_type:req.files.file.type,metadata: {'title':req.body.title}}); 
    var gridStore = new mongodb.GridStore(db, new mongodb.ObjectID(),req.body, 'w');   
    gridStore.open(function(err, gridStore) {
      gridStore.write(new Buffer(req.body, "utf8"),function(err, response) { 
	if(err) {          
          res.send(JSON.stringify({success:false,message:err}));              
        }
	gridStore.close(function(err, result) {
          if(err) {            
            res.send(JSON.stringify({success:false,message:err}));              
          }
          console.log(JSON.stringify(result));
          res.send(JSON.stringify({success:true, response:result})); 	  
	});
      });
    });    
  }
  
  //console.log(req.body);
    
});

app.post('/:db/files/:id', function (req,res){
  
  var db = req.db;
	
  var fileId = db.bson_serializer.ObjectID.createFromHexString(req.params.id);
  GridStore.exist(db, fileId, function(err, exist) {                
      if(exist) {
	  var gridStore = new mongodb.GridStore(client, fileId, 'w');
	  gridStore.open(function(err, gridStore) {
	      gridStore.contentType = req.query.contentType;
	      console.log(req.query.content);
	      gridStore.write(new Buffer(req.query.content, "utf8"), req.query.contentType,function(err, gridStore) {                    
		  if(!err) {
		      gridStore.close(function(err, result) {                        
			  if(!err) {
			      res.json(result);
			      client.close();
			  }
		      });
		  }
	      }); 
	  });
      } else {
	  res.json({'status':'Error', 'message': 'File Does Not Exists'});
	  client.close();
      }
  });
});


app.listen(config.site.port || 3000);
//app.listen(3000);


