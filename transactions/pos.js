var couchapp = require('couchapp'),
path = require('path');

ddoc = { _id:'_design/pos'};

ddoc.views= {
       "getTransactionByDate": {
           "map": "function(doc) {\n  emit(doc.time.start, doc);\n}"
       },
       "indexed": {
           "map": "function(doc) {\n  emit(doc.transaction_index, doc);\n}"
       },
       "indexed_notVoid": {
           "map": "function(doc) {\n  if(doc.type!=\"VOID\" && doc.type!=\"VOIDREFUND\" && doc.type!=\"ABNORMAL\") {\n    emit(doc.transaction_index, doc);\n  }\n}"
       }
}

ddoc.filters ={
    forTerminal2: function(doc,req){
	var terminal_id = req.query.terminal;

	if(!terminal_id){return false;}

	var terminal_id_from_doc = doc.terminal_id;
	if(terminal_id == terminal_id_from_doc){
	    return true;
	}
	return false;
    }
};

ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));

module.exports = ddoc;