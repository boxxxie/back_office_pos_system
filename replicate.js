var async = require('async')
var _ = require('underscore')
var couchdb = require('couchdb-api');

const dealscc_info = {
    "host": '208.124.150.146',
    "port":  80,
    "party": false,
    "user":  'rt7admin',
    "pass":  'mydoghasthreeheads',
    "ssl":   false,
    "debug": "warn"
};
var dealscc_db = couchdb.connect(dealscc_info);
const local_info = {
    "host": '127.0.0.1',
    "port":  5984,
    "party": false,
    "user":  'rt7admin',
    "pass":  'mydoghasthreeheads',
    "ssl":   false,
    "debug": "warn"
};
var local_db = couchdb.connect(local_info);

//local_db.allDbs();
var dbname = 'rt7_backoffice_app';
local_db
    .login(local.user,local.pass)
    .db(dbname)
    .pull(dealscc.db(dbname),
	  function(err,data,resp){
	      console.log(err + ' '+ data + ' ' + resp)
	  })
