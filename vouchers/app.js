var couchapp = require('couchapp'),path = require('path')

ddoc = { _id:'_design/app'}

ddoc.views = {
       "company_id_doc": {
           "map": "function(doc) {\n  emit(doc.company_id, doc._id);\n}"
       }
   }

module.exports = ddoc;