 var couchapp = require('couchapp'), path = require('path');

ddoc = { _id:'_design/app'};

ddoc.views = {};

ddoc.views.ids = {
    map:function(doc){
	emit(doc._id,doc.terminalId);
    }
};

ddoc.views.terminals_for_store = {
    map:function(doc){
	emit(doc.storeId,doc._id);
    }
};

ddoc.views.to_be_installed = {
    map:function(doc){
	var _ = require("views/lib/underscore");
	if(_.isEmpty(doc.uuid)&&
	   !_.isEmpty(doc.company_label)&&
	   !_.isEmpty(doc.group_label)&&
	   !_.isEmpty(doc.store_label)&&
	   !_.isEmpty(doc.terminal_label)){
	    emit([doc.company_label,doc.group_label,doc.store_label,doc.terminal_label],doc.terminal_id);
	}
    }
};

ddoc.views.to_be_installed_by_user = {
    map:function(doc){
    var _ = require("views/lib/underscore");
    if(_.isEmpty(doc.uuid)&&
       !_.isEmpty(doc.company_label)&&
       !_.isEmpty(doc.group_label)&&
       !_.isEmpty(doc.store_label)&&
       !_.isEmpty(doc.terminal_label)){
        emit([doc.creation_user,doc.company_label,doc.group_label,doc.store_label,doc.terminal_label],doc.terminal_id);
    }
    }
};

ddoc.views.campaignFilterQuery ={
    map:function(doc){
	var _ = require("views/lib/underscore");
	require("views/lib/underscore_extended");
	var loc = _.map$(doc.location,function(pair){
			   var key = _.first(pair);
			   var val = _.second(pair);
			   return [key,escape(val)]
		       });

	emit(doc.terminal_id, {
		 country:loc.countryCode,
		 city:loc.cityCode,
		 province:loc.provinceCode,
		 areaCode:loc.areaCode,
		 postalCode:loc.postalCode,
		 store:doc.store_id,
		 company:doc.company_id,
		 terminal:doc.terminal_id,
		 creation_date:doc.creationDate
	     });
    }
};

ddoc.views.country_prov_city_area_postal_code = {
    map:function(doc) {
        function postalCodeArray(s){
            return s
            .split(" ")
            .join("")
            .split("");
        };
        if(doc.location) {
            var loc = doc.location;
            var postalCode = postalCodeArray(loc.postalCode);
            var key = ([])
                      .concat([loc.countryCode, loc.provinceCode, loc.cityCode, loc.areaCode])
                      .concat(postalCode);
            emit(key,1);
        }
    },
    reduce : "_sum"
};

ddoc.views.country_prov_city_area_postal_code_company = {
    map:function(doc) {
        function postalCodeArray(s){
            return s
            .split(" ")
            .join("")
            .split("");
        };
        if(doc.location) {
            var loc = doc.location;
            var postalCode = postalCodeArray(loc.postalCode);
            var key = ([])
                      .concat([loc.countryCode, loc.provinceCode, loc.cityCode, loc.areaCode])
                      .concat((loc.postalCode&&loc.postalCode!="")?loc.postalCode:"none")
                      .concat(doc.company_label);
            emit(key,doc.company_id);
        }
    },
    reduce:"_count"
};

ddoc.views.country_prov_city_postal_code = {
    map:function(doc) {
        function postalCodeArray(s){
            return s
            .split(" ")
            .join("")
            .split("");
        };
        if(doc.location) {
            var loc = doc.location;
            var postalCode = postalCodeArray(loc.postalCode);
            var key = ([])
                      .concat([loc.countryCode, loc.provinceCode, loc.cityCode])
                      .concat(postalCode);
            emit(key,1);
        }
    },
    reduce : "_sum"
};

ddoc.views.country_prov_city_postal_code_short = {
    map:function(doc) {
        if(doc.location) {
            var loc = doc.location;

            var key = ([])
                      .concat([loc.countryCode, loc.provinceCode, loc.cityCode])
                      .concat(loc.postalCode);
            emit(key,1);
        }
    },
    reduce : "_sum"
};

ddoc.views.usersFilterQuery ={
    map:function(doc){
	emit(doc.terminal_id, {company:doc.company_id,
			       group:doc.group_id,
			       store:doc.store_id});
    }
};

ddoc.views.inventoryFilterQuery ={
    map:function(doc){
	emit(doc.terminal_id, {company:doc.company_id,
			       group:doc.group_id,
			       store:doc.store_id});
    }
};

ddoc.views.to_be_installed_by_user = {
    map:function(doc){
	var _ = require("views/lib/underscore");
	if(_.isEmpty(doc.uuid)&&
	   !_.isEmpty(doc.company_label)&&
	   !_.isEmpty(doc.group_label)&&
	   !_.isEmpty(doc.store_label)&&
	   !_.isEmpty(doc.terminal_label)){
	    emit([doc.creation_user,doc.company_label,doc.group_label,doc.store_label,doc.terminal_label],doc.terminal_id);
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