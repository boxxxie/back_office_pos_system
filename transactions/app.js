var couchapp = require('couchapp'),
path = require('path');

ddoc = { _id:'_design/reporting'};

ddoc.views = {
    id_date :{
	map:function(doc){
	    require("views/lib/helpers").emit_ID_date(doc);
	}
    },
    id_date_sale_refund_summary :{
	map:function(doc){
	    require("views/lib/helpers").emit_ID_date_summary(doc);
	},reduce:function(key, values, rereduce) {
	    function addNumbers(a,b){
		var numA = Number(a);
		var numB = Number(b);
		if(isNaN(Number(a)) || isNaN(Number(b))){
		    return b;
		}
		return numA + numB;
	    }
	    function addPropertiesTogether(addTo,addFrom){
		if(addTo == {}){return addFrom;}
		for (var prop in addFrom) {
		    if(addTo[prop] == undefined){
			addTo[prop] = addFrom[prop];
		    }
		    else{
			addTo[prop] = addNumbers(addTo[prop],addFrom[prop]);
		    }
		};
		return addTo;
	    }
	    return values.reduce(addPropertiesTogether,{});
	}
    },
    inventory_report : {
	map:function(doc){
	    require("views/lib/helpers").emitDocForInventoryReport(doc);
	},
	reduce:function(key, values, rereduce) {
	    function addNumbers(a,b){
		var numA = Number(a);
		var numB = Number(b);
		if(isNaN(Number(a)) || isNaN(Number(b))){
		    return b;
		}
		return numA + numB;
	    }
	    function addPropertiesTogether(addTo,addFrom){
		if(addTo == {}){return addFrom;}
		for (var prop in addFrom) {
		    if(addTo[prop] == undefined){
			addTo[prop] = addFrom[prop];
		    }
		    else{
			addTo[prop] = addNumbers(addTo[prop],addFrom[prop]);
		    }
		};
		return addTo;
	    }
	    return values.reduce(addPropertiesTogether,{});
	}
    },
    id_type_origin_date : {
	map:function(doc){
	    require("views/lib/helpers").emitDoc(doc);
	},reduce:"_stats"
    },
    id_type_date : {
	map:function(doc){
	    require("views/lib/helpers").emitDocNoOrigin(doc);
	},reduce:"_stats"
    },
    terminalID_index : {
	map:function(doc){
	    emit([doc.terminal_id,doc.transaction_index],1);
	}
    },
    terminalID_type_index : {
	map:function(doc){
	    emit([doc.terminal_id,doc.type,doc.transaction_index],1);
	}
    },
    Discounts_terminalID_type_index : {
	map:function(doc){
	    require("views/lib/helpers").emitDocDiscount(doc);
	}//,reduce:"_stats"
    },
    electronic_payments : {
	map:function(doc){
	    require("views/lib/helpers").emitElectronicPayments(doc);
	},
	reduce:function(key, values, rereduce) {
	    function addNumbers(a,b){
		var numA = Number(a);
		var numB = Number(b);
		if(isNaN(Number(a)) || isNaN(Number(b))){
		    return b;
		}
		return numA + numB;
	    }
	    function addPropertiesTogether(addTo,addFrom){
		if(addTo == {}){return addFrom;}
		for (var prop in addFrom) {
		    if(addTo[prop] == undefined){
			addTo[prop] = addFrom[prop];
		    }
		    else{
			addTo[prop] = addNumbers(addTo[prop],addFrom[prop]);
		    }
		};
		return addTo;
	    }
	    return values.reduce(addPropertiesTogether,{});
	}
    },
    typed_electronic_payments : {
	map:function(doc){
	    require("views/lib/helpers").emitTypedElectronicPayments(doc);
	},
	reduce : "_stats"
    },
    voucher_id_date :{
        map:function(doc) {
            require("views/lib/helpers").emitVoucherPayment_id_date(doc);
        }
    },
    inventory_sold:{
	map:function(doc){
	    require("views/lib/helpers").emitInventoryStockSold(doc);
	},
	reduce:function(keys,values,rereduce){
	    var toString = Object.prototype.toString,
	    slice = Array.prototype.slice;
	    function isNumber(obj) {
		return toString.call(obj) == '[object Number]';
	    };
	    function isObject(obj) {
		return obj === Object(obj);
	    };
	    var isArray = Array.isArray;
	    function addNumbers(a,b){
		if(isNumber(a) || isNumber(b)){
		    return a + b;
		}
		return b;
	    }
	    function extend(obj) {
		slice.call(arguments, 1)
		    .forEach(function(source) {
				 for (var prop in source) {
				     if (source[prop] !== void 0) obj[prop] = source[prop];
				 }
			     });
		return obj;
	    };

	    // Create a (shallow-cloned) duplicate of an object.
	    function clone(obj) {
		if (!isObject(obj)) return obj;
		return isArray(obj) ? obj.slice() : extend({}, obj);
	    };

	    //fn({a:1},{a:1}) -> {a:2}
	    //make recursive
	    //fn({a:{b:1},c:1},{a:{b:1},c:1}) -> {a:{b:2},c:2}
	    function addPropertiesTogether(addTo,addFrom){
		function addPropertiesTogether_helper(addTo,addFrom){
		    var addToClone = clone(addTo);
		    for (var prop in addFrom) {
			if(addToClone[prop] === undefined){
			    addToClone[prop] = addFrom[prop];
			}
			else if(isObject(addFrom[prop])){ //maybe this would have to be replaced with a function too
			    addToClone[prop] = addPropertiesTogether_helper(addToClone[prop],addFrom[prop]);
			}
			else{
			    addToClone[prop] = addNumbers(addToClone[prop],addFrom[prop]);
			}
		    }
		    return addToClone;
		}
		return addPropertiesTogether_helper(addTo,addFrom);
	    }
	    return values.reduce(addPropertiesTogether,{});
	}
    }
};

ddoc.views.misc_receiptID =
    {map:function(doc) {
	 emit(doc.receipt_id+"-"+doc.transaction_index, doc._id);
     }
    };

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
    if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
	throw "Only admin can delete documents on this database.";
    }
};


//test _list
ddoc.lists = {
  test_list : function(head, req) {
      var pageIndex = 0, row;

      send("[");
      while(row = getRow()) {
        if(pageIndex % 50 == 0) {
          send(JSON.stringify(row));
        }
        pageIndex += 1;
      }
      send("]");
  }
};

ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));

module.exports = ddoc;
