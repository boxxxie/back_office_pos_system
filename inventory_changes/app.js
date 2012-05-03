 var couchapp = require('couchapp'),path = require('path');

ddoc =  { _id:'_design/app'};

ddoc.views = {};

ddoc.views.change_log = {
    map:function(doc){
	if(!doc.ids || doc.type)return;
	doc.ids.forEach(
	    function(item){
		emit(item.location_id,1);
	    });
    }
};

ddoc.views.change_stock_log = {
    map:function(doc){
        Date.prototype.toArray = function(){
            return [this.getFullYear(),
                (this.getMonth()+1),
                this.getDate(),
                this.getHours(),
                this.getMinutes(),
                this.getSeconds()];
        };
    if(!doc.ids || !doc.type) return;
    doc.ids.forEach(
        function(item){
            var key = ([]).concat(item.location_id).concat((new Date(doc.date)).toArray());
        emit(key,doc.add_stock_amount);
        });
    }
};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
    function validatePrices(obj){
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
    else if(newDoc._deleted === undefined && validatePrices(newDoc.inventory) === false){
	throw "inventory items must contain prices that are numeric values";
    }
};
ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));

module.exports = ddoc;