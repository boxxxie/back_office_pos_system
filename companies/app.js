var couchapp = require('couchapp'),
path = require('path');

ddoc = { _id:'_design/app'};

ddoc.views = {};

ddoc.views.creation_user_id = {
    map:function(doc) {
        emit(doc.creation_user, doc._id);
    }
};

ddoc.views.names_to_id = {
    map:function(doc){
	var _ = require("views/lib/underscore");

	var opName = doc.companyName.toLowerCase().trim();
	var compID = doc._id;

	var company_emit_value = compID;
	var company_emit_key = {company:opName};
	emit(company_emit_key,company_emit_value);
	_.each(doc.hierarchy.groups,
	       function(group){
		   var gpName = group.groupName.toLowerCase().trim();
		   var user = group.user.toLowerCase().trim();
		   var gpID = group.group_id;
		   var group_emit_value = gpID;
		   var group_emit_key = {company:opName, group:gpName};
		   emit(group_emit_key, group_emit_value);

		   _.each(group.stores,
			  function(store){
			      var sName = store.storeName.toLowerCase().trim();
			      var user = store.user.toLowerCase().trim();
			      var store_emit_value = store.store_id;
			      var store_emit_key = {company:opName, group:gpName, store:sName};
			      var store_emit_key2 = {company:opName, store:sName};
			      emit(store_emit_key,store_emit_value);
			      emit(store_emit_key2,store_emit_value);
			  });
	       });
    }
};

ddoc.views.receipt_id = {
    map:function(doc){
	var _ = require("views/lib/underscore");
	require("views/lib/underscore_extended");
	require("views/lib/underscore_walk");
	function emit_receipt_id(item){
	    if(!_.isEmpty(item.receipt_id)){
		emit(item.receipt_id,1);
	    }
	}
	_.prewalk(function(item){
		 emit_receipt_id(item);
		 return item;
		  },doc);
    }
};

ddoc.shows = {
    branch: function(doc,req){
	log('branch');
	log(doc);
	log(req.query);
	var args = req.query;

	var _ = require("views/lib/underscore");
	require("views/lib/underscore_extended");
	require("views/lib/underscore_walk");

	function getGroups(){return doc.hierarchy.groups;}
	function getGroup(groupID){return _.find(getGroups(),function(group){ return group.group_id == groupID;});};
	function getStores(groupID){return getGroup(groupID).stores;};
	function getStore(groupID,storeID){return _.find(getStores(groupID),function(store){return store.store_id == storeID;});};



	var groupID;
	_.prewalk(function(o){
		      log(o);
		      if(o && o.group_id){
			  log("go");
			  groupID =  o.group_id;
		      }
		      return o;
		  },
		  args);
	var storeID;
	_.prewalk(function(o){
		      if(o && o.store_id){
			  storeID = o.store_id;
		      }
		      return o;
		  },
		  args);

	log('group');
	log(groupID);
	log('store');
	log(storeID);

	if(_.isUndefined(groupID)&& _.isUndefined(storeID)){return JSON.stringify(doc);}

	if(_.isEmpty(groupID)){
	    throw['error', 'no_group_id', "The group ID wasn't given"];
	}

	var group = getGroup(groupID);
	if(_.isEmpty(group)){
	    throw['error', 'no_group', "The group wasn't found in this company"];
	}



	if(_.isEmpty(storeID)){return JSON.stringify(group);}

	var store = getStore(groupID,storeID);
	if(_.isEmpty(store)){throw(['error', 'no_store', "The store wasn't found in this company/group"]);}

	return JSON.stringify(store);

    }
};

ddoc.validate_doc_update = function (newDoc, oldDoc, committer, security) {

    var _ = require("views/lib/underscore");

    log("company validation");
    log(security);
    log(committer);
    log(newDoc);
    log(oldDoc);

    function committer_not_logged_in(committer) {
	if(committer.name == undefined) {
	    throw{forbidden:"Anonymous users may not add to the database. Please log in first."};
	}
    }

    function committer_is(role){
	return function(committer){
	    return _.contains(committer.roles,role);
	};
    }

    var committer_is_server_admin = committer_is('_admin');
    var committer_is_rt7_admin = committer_is('rt7');
    var committer_is_territorial = committer_is('territory');

    if(committer_is_server_admin){
	return;
    }

    if (newDoc._deleted === true &&
	(committer_is_server_admin(committer) || committer_is_rt7_admin(committer))) {
	return ;
    }
    else if(newDoc._deleted === true){
	throw "Only admins can delete documents on this database.";
    }


    if(committer_is_rt7_admin(committer) === false || committer_is_territorial === false){
	throw{unauthorized: "only RT7 committers may edit files in this Database"};
    }

    committer_not_logged_in(committer);

};
ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));

module.exports = ddoc;