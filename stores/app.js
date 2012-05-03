 var couchapp = require('couchapp')
, path = require('path')
;

ddoc =
    { _id:'_design/app'
      , rewrites :
      [ {from:"/", to:'index.html'}
	, {from:"/api", to:'../../'}
	, {from:"/api/*", to:'../../*'}
	, {from:"/*", to:'*'}
      ]
    }
;

ddoc.views = {};

ddoc.views.campaignFilterQuery ={
    map:function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	var areaCodes = require("views/lib/helpers").areaCodes(s);
	emit(doc._id, {country:s.country,
		       province:s.province,
		       city:s.city,
		       areaCode:areaCodes[0],
		       postalCode:s.postalCode.split(" ").join(""),
		       store:s.store,
		       company:s.company});
    }
};
ddoc.views.ids_raw = {
    map:function(doc){
	emit(doc._id,1);
    },reduce:"_sum"
};
ddoc.views.ids = {
    map:function(doc){
	emit(doc._id,{company:doc.ids.chain,store:doc.ids.store});
    }
};
ddoc.views.companies={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	emit(s.company,1);
    },
    reduce : "_sum"
};
ddoc.views.stores={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	emit(s.store,1);
    },
    reduce : "_sum"
};
ddoc.views.cities={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	emit(s.city,1);
    },
    reduce : "_sum"
};
ddoc.views.state_province={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	emit(s.province,1);
    },
    reduce : "_sum"
};
ddoc.views.area_code={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	var areaCodes = require("views/lib/helpers").areaCodes(s);
	emitter = function(){
	    return function(areaCode){
		emit(areaCode,1);
	    };
	};
	areaCodes.forEach(emitter());
    },
    reduce : "_sum"
};

ddoc.views.postal_code={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	var postalCode = require("views/lib/helpers").postalCodeArray(s);
	emit(postalCode,1);
    },
    reduce : "_sum"
};

ddoc.views.postal_code_raw={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	var postalCode = s.postalCode;
	emit(postalCode,1);
    },
    reduce : "_sum"
};

ddoc.views.country_prov_city_postal_code={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	var postalCode = require("views/lib/helpers").postalCodeArray(s);
	key = ([])
	    .concat([s.country,s.province,s.city])
	    .concat(postalCode);
	emit(key,1);
    },
    reduce : "_sum"
};

ddoc.views.country_prov_city_postal_code_short={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	key = ([])
	    .concat([s.country,s.province,s.city])
	    .concat(s.postalCode);
	emit(key,1);
    },
    reduce : "_sum"
};

ddoc.views.country_prov_city_postal_code_store={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	var postalCode = require("views/lib/helpers").postalCodeArray(s);
	key = ([])
	    .concat([s.country,s.province,s.city])
	    .concat(postalCode);
	emit(key,doc);
    }
};

ddoc.views.country={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	emit(s.country,1);
    },reduce:"_sum"
};

ddoc.views.companyLongNameToShortName={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	emit([s.company,s.company_min],1);
    },reduce : "_sum"
};

ddoc.views.storeLongNameToShortName={
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	emit([s.store,s.store_min],1);
    },reduce : "_sum"
};

ddoc.views.id_company_store = {
    map : function(doc){
	var s = require("views/lib/helpers").commonProperties(doc);
	emit([doc._id,s.company,s.store],1);
    }
};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
    if(newDoc._deleted === true){
	if ( userCtx.roles.indexOf('_admin') === -1) {
	    throw "Only admin can delete documents on this database.";
	}
    }
    else{

    }
};

ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));


module.exports = ddoc;
