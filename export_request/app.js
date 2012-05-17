 var couchapp = require('couchapp'), path = require('path');

ddoc = { _id:'_design/app'};

ddoc.views = {};
ddoc.shows = {
    csv:function(doc,req){
	function csvEscapeOnePerLine(arr){
	    var csv = '';
	    var arr_last = arr.length - 1;
	    for(var i = 0; i <= arr_last; i++){
		var value = arr[i].toString().replace(/"/g, '""');
		csv += '"' + value + '"';
		if( i !== arr_last ){
		    csv += ",";
		}
	    }
	    return csv;
	}
	if(doc && doc.file_name && doc.date && doc.file_ext){
	    var fileName = doc.file_name + '-' + doc.date +'.'+ doc.file_ext;
	}
	else if(doc && doc.file_name){
	    var fileName = doc.file_name +'.'+ doc.file_ext;
	}
	else{
	    var fileName = 'doc.txt';
	}
	return {
	    "headers" : {
		'Content-Type' : "text/csv",
		'Content-Disposition':'attachment; filename='+fileName
	    },
	    "body" : doc.content.map(csvEscapeOnePerLine).join('\n')
	}
    }
};


ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
    if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
	throw "Only admin can delete documents on this database.";
    }
};

ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));

module.exports = ddoc;