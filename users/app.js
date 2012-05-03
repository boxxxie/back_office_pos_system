 var couchapp = require('couchapp')
, path = require('path')
;

ddoc =  {_id:'_design/app'};

ddoc.views = {};
ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));

ddoc.filters = {};
ddoc.filters.forLocation = function(user, req) {
    var _ = require("views/lib/underscore");
    require("views/lib/underscore_extended")

    var locations = _.chain(user.roles)
	.filter(_.isObject)
	.mapSelectKeys('company_id','group_id','store_id')
	.map(_.toArray)
	.flatten()
	.value();

    log(locations);

    //assume that any of the values in the request could represent location information.
    return _.any(req.query,function(requestLocationID){
		return _.contains(locations,requestLocationID);
	    });
};

ddoc.views.territory_users={
    map:function(doc){
	var _ = require("views/lib/underscore");
	if(_.contains(doc.roles,'territory')){
	    emit(doc._id,doc.name);
	}
    }
}

ddoc.views.byName={
    map:function(doc){
	emit(doc.name,doc._id);
    }
}
ddoc.views.lowestlevel_id = {
    map:function(doc){
	var _ = require("views/lib/underscore");
	require("views/lib/underscore_extended");
	var user_roles_obj = _.chain(doc.roles).filter(_.isObj).merge().value();
	var store=user_roles_obj.store_id,
	group=user_roles_obj.group_id,
	company=user_roles_obj.company_id;
	var most_specific_id = _.either(store,group,company)
	if(most_specific_id){
	    emit(most_specific_id,1);
	}
    }
}
ddoc.views.id_doc = {
    map:function(doc){
	var _ = require("views/lib/underscore");
	require("views/lib/underscore_extended");
	var user_roles_obj = _.chain(doc.roles).filter(_.isObj).merge().value();
	var store=user_roles_obj.store_id,
	group=user_roles_obj.group_id,
	company=user_roles_obj.company_id;
	_.chain([store,group,company])
	    .compact()
	    .each(function(id){
		      emit(id,doc)
		  });
    }
}
ddoc.views.id = {
    map:function(doc){
	var _ = require("views/lib/underscore");
	require("views/lib/underscore_extended");
	var user_roles_obj = _.chain(doc.roles).filter(_.isObj).merge().value();
	var store=user_roles_obj.store_id,
	group=user_roles_obj.group_id,
	company=user_roles_obj.company_id;
	_.chain([store,group,company])
	    .compact()
	    .each(function(id){
		      emit(id,1)
		  });
    }
}


module.exports = ddoc;