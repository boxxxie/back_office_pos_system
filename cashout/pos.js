var couchapp = require('couchapp'),
path = require('path');	

ddoc = { _id:'_design/pos'};

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
ddoc.views={
    "cashoutnum": {
        "map": "function(doc) {\n  emit(doc.cashoutnumber, doc);\n}"
    },
    "getcashoutByDate": {
        "map": "function(doc) {\n  emit(doc.cashouttime, doc);\n}"
    },
    "getcashoutByDate_id": {
        "map": "function(doc) {\n  emit(doc.cashouttime, doc._id);\n}"
    }
};

ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));

module.exports = ddoc;