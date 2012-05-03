 var couchapp = require('couchapp'), path = require('path');

ddoc = {_id:"_design/app"};
ddoc.views = {};

//test _list
ddoc.lists = {
  test_list : function(head, req) {
      var pageIndex = 0, row;

      send("[");
      while(row = getRow()) {
        if(pageIndex % 5 == 0) {
          send(JSON.stringify(row));
        }
        pageIndex += 1;
      }
      send("]");
  }
};

ddoc.views.upc = {
    map:function(doc){
	emit(doc.upccode,doc._id);
    }
};

ddoc.views.locid_upc={
    map:function(doc){
	if(!doc.type){
	    emit(doc.locid,doc.upccode);
	}
    }
}

ddoc.views.stock_locid_upc={
    map:function (doc) {
	var _ = require("views/lib/underscore");
	var inv_upc = doc.inventory.upccode,
	type = doc.type;
	if(type==="stock" &&
	   _.isArray(doc.ids))
	{
            _.each(doc.ids,
		   function(id){emit(id.location_id,inv_upc);});
	}
    }
}

ddoc.views.id_upc_latestDate = {

    map:function (doc){

	var _ = require("views/lib/underscore");
	require("views/lib/underscore_extended");
	emit([doc.locid, doc.upccode],_.removeKeys(doc,"_id","_rev"));
    },

    reduce:function (key,values,rereduce){
	function latestDate(returnItem,cur){
	    function isObject(obj) {
		return obj === Object(obj) && !(obj instanceof Array);
	    };
	    function extend_r(extendTo,extendFrom){
		function mergeRecursive(extendTo, extendFrom) {
		    for (var p in extendFrom) {
			if (isObject(extendFrom[p])) {
			    extendTo[p] = mergeRecursive({}, extendFrom[p]);
			} else {
			    extendTo[p] = extendFrom[p];
			}
		    }
		    return extendTo;
		}
		return mergeRecursive(extendTo, extendFrom);
	    }
	    function fill(fillIn,fillFrom){
		function mergeRecursive(fillIn, fillFrom) {
		    for (var p in fillFrom) {
			if (isObject(fillFrom[p])) {
			    if(fillIn[p] === undefined){
				fillIn[p] = mergeRecursive({}, fillFrom[p]);
			    }
			    else{
				fillIn[p] = mergeRecursive(fillIn[p], fillFrom[p]);
			    }
			}
			else if(fillIn[p] === undefined){
			    fillIn[p] = fillFrom[p];
			}
		    }
		    return fillIn;
		}
		return mergeRecursive(fillIn, fillFrom);
	    }

	    if(!returnItem.date){
		return cur;
	    }
	    var curDate = new Date(cur.date);
	    var returnDate = new Date(returnItem.date);
	    if(curDate >= returnDate){
		return extend_r(returnItem,cur);
	    }
	    else{
		return fill(returnItem,cur);
	    }
	}
	return values.reduce(latestDate,{});
    }
};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
    function validatePrices(obj){
	if(obj.type && obj.type == "stock"){return true;}
	if(obj && obj.price){
	    var sellingPrice = Number(obj.price.selling_price);
	    var standardPrice = Number(obj.price.standard_price);
	}
	if(sellingPrice === undefined && standardPrice === undefined){
	    return false;
	}
	else if(isNaN(sellingPrice) || isNaN(standardPrice)){
	    return false;
	}
	return true;
    }
    if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
	throw "Only admin can delete documents on this database.";
    }
    else if(newDoc._deleted === undefined && validatePrices(newDoc) === false){
	throw "inventory items must contain prices that are numeric values";
    }
};

ddoc.filters = {};
ddoc.filters.forLocation = function(doc, req) {
    var _ = require("views/lib/underscore");

    var location = doc.locid;

    var q = req.query;

    var locationToSendTo = _.find(req.query,function(val){
				      return val === location;
				  });
    return (locationToSendTo);
};
ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));

module.exports = ddoc;