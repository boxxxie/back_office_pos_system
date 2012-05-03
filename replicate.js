var async = require('async')
var _ = require('underscore')
var couchdb = require('couchdb-api');
var user_pass = 'rt7admin:mydoghasthreeheads';
var dealscc = couchdb.srv(user_pass+'@208.124.150.146','80');
var local_db = couchdb.srv(user_pass+'@localhost')

//local_db.allDbs();
var dbname = 'rt7_backoffice_app';
local_db.db(dbname)
    .pull(dealscc.db(dbname),
	  function(err,data,resp){
	      console.log(err + ' '+ data + ' ' + resp)
	  })
/*
dealscc.allDbs(function(err,db_names){
		   console.log(db_names);
		   var dbs = _.map(db_names,function(name){
				     return [local_db.db(name),dealscc.db(name)]
				 })
		   async.forEach(dbs,
				 function(db_pair,cb){
				     var local = db_pair[0];
				     var remote = db_pair[1];
				     local.pull(remote,function(err, response){
						       console.log(response);
						       cb(err)
						   })
				 },
				 function(err){
				     if(err){console.log("there was an error replicating dbs: " + err)}
				     console.log('done')
				 })
	       });
*/