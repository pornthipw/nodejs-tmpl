var express = require("express");
var handlebars = require('hbs');
var mongodb = require('mongodb');
var passport = require('passport');



var config = require('./config');
var routes = require('./routes');
var app = express();

app.configure(function() {  
  app.use(express.static(__dirname + '/public'));    
  app.set('views', __dirname + '/views');
  app.engine('html', handlebars.__express);  
  app.set('view engine', 'html');      
  app.use(express.cookieParser());  
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(express.methodOverride());
  app.use(passport.initialize());
  app.use(passport.session());
});

var test_data = 'ew0KICAidGl0bGUiOiAiQWxsIGFib3V0IDxwPiBUYWdzIiwNCiAgImJvZHkiOiAiPHA+VGhpcyBpcyBhIHBvc3QgYWJvdXQgJmx0O3AmZ3Q7IHRhZ3M8L3A+Ig0KfQ==';
var test_template = 'PGRpdiBjbGFzcz0iZW50cnkiPg0KICA8aDE+e3t0aXRsZX19PC9oMT4NCiAgPGRpdiBjbGFzcz0iYm9keSI+DQogICAge3t7Ym9keX19fQ0KICA8L2Rpdj4NCjwvZGl2Pg==';

var OpenIDStrategy = require('passport-openid').Strategy;

passport.serializeUser(function(user, done) {
  console.log('18 -'+user);
  done(null, user.identifier);
});

passport.deserializeUser(function(identifier, done) {
  console.log('23 -'+identifier);
  done(null, { identifier: identifier });
});

passport.use(new OpenIDStrategy({
    returnURL: config.site.baseUrl+'auth/openid/return',
    realm: config.site.baseUrl
  },
  function(identifier, profile, done) {
    process.nextTick(function () {
      
      // To keep the example simple, the user's OpenID identifier is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the OpenID identifier with a user record in your database,
      // and return that user instead.
      return done(null, { identifier: identifier })
    });
  }
));



app.get('/auth/openid', 
  passport.authenticate('openid', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
  
app.get('/auth/openid/return', 
  passport.authenticate('openid', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});

app.get('/user', function(req, res) {
  if(req.user) {
    res.json({'user':req.user});
  } else {
    res.json({'user':null});
  }
});



app.param('db', function(req, res, next) {
  var db = new mongodb.Db(req.params.db, new mongodb.Server(config.mongodb.server, config.mongodb.port, {'auto_reconnect':true}), {'safe':true});
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

//updatefile
app.post('/:db/files/:id', function (req,res) {
  var db = req.db;
  
  var fileId = db.bson_serializer.ObjectID.createFromHexString(req.params.id);
  console.log(fileId);   
  mongodb.GridStore.exist(db, fileId, function(err, exist) {                
    if(exist) {
      var gridStore = new mongodb.GridStore(db, fileId, 'w');
        gridStore.open(function(err, gridStore) {
        //gridStore.contentType = req.query.contentType;
        console.log(req.body.content);
        gridStore.write(new Buffer(req.body.content, "utf8"), function(err, gridStore) {                    
          if(!err) {
            gridStore.close(function(err, result) {                        
              if(!err) {
                res.json(result);
                db.close();
              }
            });
          }
        }); 
      });
    } 
  });
});

//update Metadata
app.post('/:db/metadata/:id', function (req,res) {
  console.log("update Metadata");
  var db = req.db;
  
  var fileId = db.bson_serializer.ObjectID.createFromHexString(req.params.id);
  //console.log(fileId); 
  //console.log(req.body.doc_name);
  
  //console.log('listFile ');
  db.collection('fs.files', function(err, collection) {
    if(err) {            
      console.log("Error :"+err);
      res.json({success:false,message:err});              
    }
    
    collection.findOne({_id:fileId},function(err, docs) {
        if(err) {
          res.json({success:false,message:err});              
        }
        docs['filename'] = req.body.doc_name;
        docs['metadata']['type'] = req.body.meta_type;
        console.log(docs);
        collection.save(docs, {safe:true}, function(err, result) {
          res.json(docs); 
        });
    });;            
  });   
  
  });



app.post('/:db/files', function (req,res){
  var db = req.db;
  console.log(req.body.content);
  console.log(req.body.filename);
  console.log(req.body.meta_type);
  if(req.body) {          
    //var gridStore = new mongodb.GridStore(db, new mongodb.ObjectID(),req.files.file.name, 'w', {content_type:req.files.file.type,metadata: {'title':req.body.title}}); 
   //var gridStore = new mongodb.GridStore(db, new mongodb.ObjectID(),'New File', 'w'); 
    var gridStore = new mongodb.GridStore(db, new mongodb.ObjectID(),req.body.filename, 'w',{metadata: {'type':req.body.meta_type}});   
    gridStore.open(function(err, gridStore) {
      gridStore.write(new Buffer(req.body.content, "utf8"),function(err, response) { 
        if(err) { 
          res.send(JSON.stringify({success:false,message:err}));              
        }
        gridStore.close(function(err, result) {
          if(err) {            
            res.send(JSON.stringify({success:false,message:err}));              
          }
          console.log(JSON.stringify(result));
          res.send(JSON.stringify({success:true, response:result})); 	  
          db.close();
        });
      });
    });    
  }
});



//getFile
app.get('/:db/files/:id', function (req,res){
  var db = req.db;
  fileId = new mongodb.ObjectID.createFromHexString(req.params.id);
  var fields = null;
  if(req.query.fields) {
    fields = JSON.parse(req.query.fields);  
  }
  
  var gridStore = new mongodb.GridStore(db, fileId, 'r');
    gridStore.open(function(err, gs) {
      var context = {};
                        
      gs.seek(0, function() {
        gs.read(function(err, data) {	    	    
          if(!err) {
            context ={success:true,content:data.toString('utf8')}; 	    
            if (fields && fields.indexOf("document") != -1) {
              gs.collection(function(err, collection) {		
                collection.findOne({_id:fileId}, function(err, doc) {
                  context['document'] = doc;
                  res.json(context);
                });
              });      		      
            } else {
              res.json(context);
            }	          
          } else {
            res.json({success:false});
          }	  
        });
      });
      
      
    });
});

//delete File 
app.delete('/:db/files/:id',function(req,res){
  console.log('deleteFile '+req.params.id);
  var db = req.db;
  if (req.params.id.length == 24) {
    try {
      fileId = new mongodb.ObjectID.createFromHexString(req.params.id);
      mongodb.GridStore.exist(db, fileId, function(err, exist) {   
          if(exist) {
            var gridStore = new mongodb.GridStore(db, fileId, 'w');
            gridStore.open(function(err, gs) {                        
                gs.unlink(function(err, result) { 
              if(!err) {                              
                  res.json({'response':req.params.id}); 
                  //client.close();                                        
              } else {
                  console.log(err);
              }
                });                        
            });//gridStore.open()
          } else {
              console.log(id +' does not exists');
          }
      });
    } catch (err) {
      console.log(err);
    }
  }
});

//List File
app.get('/:db/files', function(req, res) {  
  // req.params [year, element, type, item]  
  console.log('listFile ');
  var db = req.db;
  console.log('listFile ');
  db.collection('fs.files', function(err, collection) {
    if(err) {            
      console.log("Error :"+err);
      res.json({success:false,message:err});              
    }
    
    collection.find().toArray(function(err, docs) {
        if(err) {
          res.json({success:false,message:err});              
        }
        res.json(docs);          
    });            
  });                    
});



app.listen(config.site.port || 3000);
//app.listen(3000);


