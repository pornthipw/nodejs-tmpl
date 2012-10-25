var mongodb = require('mongodb');
var config = require('../config');

//Add routes from other files

exports.index = function(req, res) {
  console.log('User name :' + req.user);
  var ctx = {
     title : 'Graduate File', 
  }; 
  res.render('index', { user: req.user});   
  //res.send(JSON.stringify({success:true})); 
  //res.send(req.user + ' users online');
  //res.render('index', ctx);
};

exports.getFile = function(req, res, next) {
    var db = req.db;
    if (req.params.file.length == 24) {
    //Convert id string to mongodb object ID
	try {
	    id = new mongodb.ObjectID.createFromHexString(req.params.file);
	    var gridStore = new mongodb.GridStore(db, id, 'r');
	    gridStore.open(function(err, gs) {
		gs.collection(function(err, collection) {
		    collection.find({_id:id}).toArray(function(err,docs) {
			var doc = docs[0];
			console.log(doc.filename);
			var stream = gs.stream(true);
			res.setHeader('Content-dispostion', 'attachment;filename='+doc.filename);
			res.setHeader('Content-type',doc.contentType);
			stream.on("data", function(chunk) {
			    res.write(chunk);
			});
		
			stream.on("end", function() {
			    res.end();
			});
		    });
		});
	    });
	} catch (err) {
	}
    }    
    console.log('getFile '+req.params.file);
};

exports.deleteFile = function(req, res, next) {
    console.log('deleteFile '+req.params.file);
    var db = req.db;
    if (req.params.file.length == 24) {
        try {
            id = new mongodb.ObjectID.createFromHexString(req.params.file);
            mongodb.GridStore.exist(db, id, function(err, exist) {   
                if(exist) {
                    var gridStore = new mongodb.GridStore(db, id, 'w');
                    gridStore.open(function(err, gs) {                        
                        gs.unlink(function(err, result) { 
                            if(!err) {                              
                                res.json({'delete':req.params.file}); 
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
};


exports.listFile = function(req, res, next) {  
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
        //console.log(docs);
        res.json(docs); 
        //res.json({success:true,doc:docs});           
    });            
  });                    
};

exports.storeFile = function(req, res, next) {      
  var db = req.db;
  if(req.files.file) {          
    var gridStore = new mongodb.GridStore(db, new mongodb.ObjectID(),req.files.file.name, 'w', {content_type:req.files.file.type,metadata: {'title':req.body.title}});    
    gridStore.open(function(err, gridStore) {
      gridStore.writeFile(req.files.file.path, function(err, doc) {                
        if(err) {          
          res.send(JSON.stringify({success:false,message:err}));              
        }

        gridStore.close(function(err, result) {
          if(err) {            
            res.send(JSON.stringify({success:false,message:err}));              
          }
          console.log(JSON.stringify(result));
          res.send(JSON.stringify({success:true, doc:result}));                          
        });
      });
    });    
  }
};
