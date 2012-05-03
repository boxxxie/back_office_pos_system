var couchapp = require('couchapp'), path = require('path'); 

ddoc = { _id:'_design/reporting'};

ddoc.views = {};

ddoc.views.netsaleactivity = {
    map:function(doc){
	require("views/lib/helpers").emitNumericField(doc,'netsaleactivity');
    },reduce:"_stats"}

ddoc.views.cashouts_id_date = {
    map:function(doc){
	require("views/lib/helpers").emitDoc(doc);
    },
    reduce:function(key, values, rereduce) {
	function addPropertiesTogether(addTo,addFrom){
	    if(addTo == {}){return addFrom;}
	    for (var prop in addFrom) {
		if(addTo[prop] == undefined){
		    addTo[prop] = addFrom[prop];
		}
		else if(prop == "firstindex"){
		    addTo[prop] = Math.min(addTo[prop],addFrom[prop]);
		}
		else if(prop == "lastindex"){
		    addTo[prop] = Math.max(addTo[prop],addFrom[prop]);
		}
		else{
		    addTo[prop] += addFrom[prop];
		}
	    };
	    return addTo;
	}
	return values.reduce(addPropertiesTogether,{})
    }
};


ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
    if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
	throw "Only admin can delete documents on this database.";
    }
};
ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));

module.exports = ddoc;