var express = require("express");
var xml2js = require('xml2js');
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

passport.serializeUser(function(user,done) {
  done(null, user.identifier, user.profile);
});

passport.deserializeUser(function(identifier, done) {
  done(null, { identifier: identifier });
});

passport.use(new OpenIDStrategy({
    returnURL: config.site.baseUrl+'auth/openid/return',
    realm: config.site.baseUrl,
    profile: true
  },
  function(identifier, profile, done) {
    console.log(profile);
    process.nextTick(function () {
      return done(null, { identifier: identifier, profile:profile })
    });
  }
));


app.get('/logout', function(req, res){
  req.logOut();
  res.json({"success":true});
});


app.get('/auth/openid', 
  passport.authenticate('openid', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect(config.site.baseUrl);
  });
  
app.get('/auth/openid/return', 
  passport.authenticate('openid', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect(config.site.baseUrl);
});

app.get('/user', function(req, res) {
  if(req.user) {
    res.json({'user':req.user});
  } else {
    res.json({'user':null});
  }
});




app.param('db', function(req, res, next) {
  var db = new mongodb.Db(req.params.db, 
    new mongodb.Server(
       config.mongodb.server, 
       config.mongodb.port, 
       {'auto_reconnect':true}
    ),{'safe':true}
  );

  db.open(function(err,db) {
    if(err) {
      console.log('Error Open DB -',err);
      res.send(500, err);
    } else {
      var required_authen = false;
      for(var idx in config.mongodb.auth) {
        if(config.mongodb.auth[idx].name == req.params.db) {
          required_authen = true;
          db.authenticate(
            config.mongodb.auth[idx].username, 
            config.mongodb.auth[idx].password, 
            function(err,result) {
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
  res.render('index', {baseHref:config.site.baseUrl});
});

//update File
app.post('/:db/files/:id', function (req,res) {   
  var db = req.db;
  var fileId = db.bson_serializer.ObjectID.createFromHexString(req.params.id);   
  db.collection('fs.files', function(err, collection) {
    collection.findOne({_id:fileId}, function(err, doc) {
      console.log(fileId);
      if (req.user) {
        if(doc.metadata.user.identifier && (doc.metadata.user.identifier == req.user.identifier)) {
          mongodb.GridStore.exist(db, fileId, function(err, exist) {
            if(exist) {
              var gridStore = new mongodb.GridStore(db, fileId, 'w');        
              gridStore.open(function(err, gridStore) {                               
                gridStore.write(new Buffer(req.body.content, "utf8"), function(err, gridStore) {                    
                  if(!err) {
                    gridStore.close(function(err, result) {                        
                      if(!err) {
                        res.json(result);
                        db.close();
                      }
                    });
                  } else {
                    res.json({"success":false, "message":err});
                    db.close();
                  }
              });  
             
              });
            } else {
              res.json({"success":false, "message":"File not found!"});
            } 
          });
        } else {
              res.json({"success":false, "message":"Not Allow!"});
	}
       } else {
        res.json({"success":false, "message":"You are not allow to update this file."});
        db.close();
      } 
    });
  });
});

app.put('/:db/files/:id', function (req,res) {
  var db = req.db;        
  var doc_id = db.bson_serializer.ObjectID.createFromHexString(req.params.id);  
  db.collection('fs.files', function(err, collection) {
    collection.findOne({_id:doc_id}, function(err, doc) {
      if(req.user) {
        if(doc.metadata.user.identifier && 
          (doc.metadata.user.identifier == req.user.identifier)) {
          collection.update({'_id':doc_id}, req.body, true, 
            function(err, doc) {  
              db.close();
              if(!err) {
                res.json({success:true});
              } else {
                res.json({success:false,message:err});
              }     
            }); 
        } else {
          res.json({"success":false, "message":"Not Allow!"});
	}
      } else {
        db.close();
        res.json({"success":false, 
          "message":"You are not allow to update this metatdata."});
      }
    });      
  });
});


//update Metadata
app.post('/:db/metadata/:id', function (req,res) {
  console.log("update Metadata");
  var db = req.db;
  
  var fileId = db.bson_serializer.ObjectID.createFromHexString(req.params.id);
  db.collection('fs.files', function(err, collection) {
    if(err) {            
      console.log("Error :"+err);
      res.json({success:false,message:err});              
    }
    if (req.user && req.body) {
      collection.findOne({_id:fileId},function(err, doc) {
          if(err) {
            res.json({success:false,message:err});              
          }
          doc['filename'] = req.body.doc_name;
          doc['metadata']['type'] = req.body.meta_type;
          doc['metadata']['public'] = req.body.meta_public;        
          collection.save(doc, {safe:true}, function(err, result) {
            if(!err) {
              res.json({success:true, document:doc}); 
            } else {
              res.json({success:false,message:err});              
            }
          });
      });
    } else {
       res.json({"success":false, "message":"You are not allow to update this metadata."});
    }
  });   
  
  });


//create File
app.post('/:db/files', function (req,res){
  var db = req.db;
  console.log(req.body.content);
  console.log(req.body.filename);
  console.log(req.body.meta_type);
  if(req.body) {          
    var gridStore = new mongodb.GridStore(db, new mongodb.ObjectID(),req.body.filename, 'w',{metadata: {'type':req.body.meta_type,'user':req.user}});   
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



//get File
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
            console.log(err);
            gs.unlink(function(u_err, result) {       
              if(!u_err) {
                res.json({success:false,message:err});
              } else {
                console.log(u_err);
              }
            });
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
	      gs.collection(function(err, collection) {
		collection.findOne({_id:fileId}, function(err, doc) {
		  if(err) {
		    res.json({"success":false, "message":err});
		  }
		  if(doc.metadata && req.user) {
		    if(doc.metadata.user.identifier && (doc.metadata.user.identifier == req.user.identifier)) {
		      gs.unlink(function(err, result) {       
			if(!err) {                              
			  res.json({"success":true,"message": req.params.id + " is deleted."}); 			  
			} else {
			  res.json({"success":false, "message":" "+err});
			}
		      });                        
		    } else {
		      res.json({"success":false, "message":"Not Allow!"});
		    }
		  } else {
		    res.json({"success":false, "message":"You are not allow to delete this file."});
		  }
		});
	      });                              
            });
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
  if(req.user) {    
    console.log(req.user.identifier);
  }
  //console.log("test public");
  //console.log(req.query.meta_public);
  var db = req.db;  
  db.collection('fs.files', function(err, collection) {
    if(err) {            
      console.log("Error :"+err);
      res.json({success:false,message:err});              
    }
    if(req.user) {    
      collection.find({$or: [{"metadata.public":true},{"metadata.user.identifier":req.user.identifier}]}).toArray(function(err, docs) {
        if(err) {
          res.json({success:false,message:err});              
        }
          res.json(docs);          
      });            
    } else {
      // all public file
      
      collection.find({"metadata.public":true}).toArray(function(err, docs) {
        if(err) {
          res.json({success:false,message:err});              
        }
          res.json(docs);          
      });  
      
      //res.json({success:false,message:"Required Login"});              
    }
  });                    
});

//convert to JSON
app.post('/ajax/xml2json', function(req, res) {
  //console.log("req.body.xml-->"+req.body.xml_content);

    var parser = new xml2js.Parser({
      attrkey: "$",
      charkey: "_",
      explicitArray: false,
      explicitCharkey: true,
      mergeAttrs: false,
      explicitRoot: true,
      normalize: false,
    });
    parser.addListener('end', function(result) {
      res.json(result);
    });        
    
    var data = new Buffer(req.body.xml_content, 'base64').toString();
    console.log("data->"+data);
    parser.parseString(data, function(err, result) {
      if(err) {                                
        console.log(err);                               
        res.json({status:'error while parsing xml',success:false,message:err});
      }  
      console.log("result->"+result);
      //res.json({success:true,message:"OK"});
      res.json(result);
            
    });    
});


app.listen(config.site.port || 3000);
//app.listen(3000);


