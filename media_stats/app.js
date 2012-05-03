 var couchapp = require('couchapp'), path = require('path');

ddoc = { _id:'_design/app' };

ddoc.views = {};
ddoc.views.duration = {
    map:function(doc){
	Date.prototype.toArray = function(){
	    return [this.getFullYear(),
		    (this.getMonth()+1),
		    this.getDate(),
		    this.getHours(),
		    this.getMinutes(),
		    this.getSeconds()];
	};
	var start = new Date(doc.time.start);
	var end = new Date(doc.time.end);
	var startArr = start.toArray();
	var duration = (end - start)/1000;
	var key = ([])
	    .concat({campaign_name:doc.campaign_name,
		     location:doc.location,
		     media_name:doc.media_name,
		     mode:doc.mode})
	    .concat(startArr);
	emit(key,duration);
    },
    reduce:"_stats"
};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {   
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
    throw "Only admin can delete documents on this database.";
  } 
};


module.exports = ddoc;