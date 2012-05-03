 var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc =  { _id:'_design/app' };

ddoc.views = {};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
    throw "Only admin can delete documents on this database.";
  }
};


module.exports = ddoc;