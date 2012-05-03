 var couchapp = require('couchapp'), path = require('path');

ddoc =  {_id:'_design/_auth'};

ddoc.views = {};
ddoc.views.getUserById = {
    map:function(doc){
	emit(doc._id,doc);
    }
};
ddoc.views.getUserByUserName = {
    map:function(doc){
	emit(doc.userName,doc);
    }
};

ddoc.validate_doc_update =
    function(new_doc, old_doc, committer, security) {
	log("user validation");
	log("committer");
	log(committer);
	log("old_doc");
	log(old_doc);
	log("new_doc");
	log(new_doc);
	log("security");
	log(security);

	var _ = require("views/lib/underscore");
	require("views/lib/underscore_extended");

	var user_is_new = old_doc == undefined;
	function is_admin(committer){return _.contains(committer.roles,'_admin');}
	function committer_is_user(committer,user_doc){
	    return committer.name === user_doc.name;
	}
	function is_system_role(str){return /^_/.test(str);}
	function role_changes_allowed(changedRoles,committer,grantable_roles){
	    var roles_grantable_by_committer = _.chain(grantable_roles)
		.filter(function(grantable_roles,user_role){
			    return _.contains(committer.roles,user_role);
			})
		.flatten()
		.value();

	    var new_roles_grantable_by_committer = _.intersection(changedRoles,roles_grantable_by_committer);
	    var new_roles_not_grantable_by_committer = _.difference(changedRoles,new_roles_grantable_by_committer);

	    if(_.isEmpty(new_roles_not_grantable_by_committer) === false){
		var error_message =  committer.name + " is not permitted to grant user roles: " + new_roles_not_grantable_by_committer.join(", ");
		throw({forbidden: error_message});
	    }
	}
	function role_changes_allowed_by_committer(changed_roles){
	    //maybe this should be moved outside of the validation and into the user doc? maybe not
	    var grantable_roles={
		rt7:["pos_sales","pos_admin","company","store","group","company_admin","store_admin","group_admin","territory"],
		territory:["pos_sales","pos_admin","company","store","group","company_admin","store_admin","group_admin"],
		store:["pos_sales","pos_admin"],
		group:["store","pos_sales","pos_admin"],
		company:["group","store","pos_sales","pos_admin"],
		store_admin:["pos_sales","pos_admin","store"],
		group_admin:["store","pos_sales","pos_admin","group","store_admin"],
		company_admin:["group","store","pos_sales","pos_admin","company","group_admin","store_admin"]
	    };
	    return role_changes_allowed(changed_roles,committer,grantable_roles);
	}
	var validations = {
	    first:{
		'committer is anonymous':function(){
		    return (function (committer){
			   if(committer.name == undefined){
			       throw {forbidden:"Anonymous users can not create/edit/delete users. Please log in and try again."};
			   }
		       })(committer);
		}
	    },
	    deletion:{
		'user deletion only allowed by admins and the user thyself':function(){
		    return (function(new_doc,committer){
			   // allow deletes by admins and matching users
			   // without checking the other fields
			   if (is_admin(committer) || committer_is_user(committer,old_doc)) { return ;}
			   else {
			       throw({forbidden: 'Only admins may delete other users.'});
			   }
		       })(new_doc,committer);
		} //TODO: add deletion rules
	    },
	    always:{
		'doc type is user':function(){
		    return  (function (new_doc){
			    if (new_doc.type !== 'user') {
				throw({forbidden : 'doc.type must be user'});
			    }
			})(new_doc);
		},
		'doc has a name field':function(){
		    return 	(function (new_doc){
			     if (!_.has(new_doc,'name')) {
				 throw({forbidden: 'doc.name is required'});
			     }
			 })(new_doc);
		},
		'roles field is an array':function(){
		    return 	(function (new_doc){
			     if (_.has(new_doc,'roles') && !_.isArray(new_doc.roles)) {
				 throw({forbidden: 'doc.roles must be an array'});
			     }
			 })(new_doc);
		},
		'name field is properly formatted':function(){
		    return 	(function (new_doc){
			     if (new_doc._id !== ('org.couchdb.user:' + new_doc.name)) {
				 throw({forbidden: 'Doc ID must be of the form org.couchdb.user:name'});
			     }
			 })(new_doc);
		},
		'password field is properly formatted':function(){
		    return (function (new_doc){
			   if (new_doc.password_sha && !new_doc.salt) {
			       throw({forbidden: 'Users with password_sha must have a salt.' +
				  'See /_utils/script/couch.js for example code.'});
			   }
		       })(new_doc);
		},
		'no system roles in users db':function(){
		    return (function (new_doc){
			   if(_.any(new_doc.roles,is_system_role)){
			       throw{forbidden:'No system roles (starting with underscore) in users db.'};
			   };
		       })(new_doc);
		}
	    },
	    creation:{
		'no system names as names':function(){
		    return (function(new_doc){
			   if (is_system_role(new_doc.name)) {
			       throw({forbidden: 'Username may not start with underscore.'});
			   }
		       })(new_doc);
		},
		'user has been made with allowed roles':function(){
		    return (function(new_doc){
			   role_changes_allowed_by_committer(new_doc.roles);
		       })(new_doc);
		}
	    },
	    edit:{
		'name field is not allowed to change':function(){
		    return (function (new_doc,old_doc){
			   if (old_doc) {
			       if (old_doc.name !== new_doc.name) {
				   throw({forbidden: 'Usernames can not be changed.'});
			       }
			   }
		       })(new_doc,old_doc);
		},
		'role changes made follow specific guidelines':function(){
		    return(function(new_doc,old_doc,committer){
			  var new_roles = new_doc.roles,
			  old_roles = old_doc.roles,
			  changed_roles = _.difference(new_roles,old_roles);

			  role_changes_allowed_by_committer(changed_roles);
			  if(_.size(changed_roles)){
			      throw({forbidden: 'Only _admin may edit roles'});
			  }
		      })(new_doc,old_doc,committer);
		},
		'user password changes follow specific guidelines':function(){
		    return (function(new_doc,old_doc,committer){
			   //these are the rules for who is allowed to change passwords of other users
			   //eg:store can change only pos role passwords...
			   var password_changing_guidelines={
			       rt7:["pos_sales","pos_admin","company","store","group","company_admin","store_admin","group_admin","territory"],
			       territory:["pos_sales","pos_admin","company","store","group","company_admin","store_admin","group_admin"],
			       store:["pos_sales","pos_admin"],
			       group:["store","pos_sales","pos_admin"],
			       company:["group","store","pos_sales","pos_admin"],
			       store_admin:["pos_sales","pos_admin","store"],
			       group_admin:["store","pos_sales","pos_admin","group","store_admin"],
			       company_admin:["group","store","pos_sales","pos_admin","company","group_admin","store_admin"]
			   };
			   function password_changed(old_doc,new_doc){
			       return old_doc.password_sha !== new_doc.password_sha;
			   }
			   function committer_is_not_allowed_to_change_password(password_rules,committer,new_doc){
			       return _.chain(committer.roles)
				   .map(function(role){ //match the committer roles to the password change rules
					    return password_rules[role];
					})
				   .flatten()
				   .compact()
				   .unique()
				   .intersection(new_doc.roles)
				   .isEmpty() //if there are no matches then the committer is not allowed to change this user's password
				   .value();
			   }
			   if(is_admin(committer)){return;}
			   if(password_changed(old_doc,new_doc) === false){return;}
			   if(committer_is_user(committer,new_doc)){return;}
			   if(committer_is_not_allowed_to_change_password(password_changing_guidelines,committer,new_doc)){
			       throw"you are not allowed to change the password of this user, please log in as the user or log in with an account with more authority";
			   }
		       })(new_doc,old_doc,committer);
		}
	    }
	};

	function execute_all(obj){
	    function execute(fn){fn();}
	    _.each(obj,execute);
	}


	if(is_admin(committer)) return; //let the admin do whatever they want

	execute_all(validations.first);

/*
	if (new_doc._deleted === true) {
	    execute_all(validations.deletion);
	    return; //we can assume that the document has been deleted, or not changed, no need for further validation
	}

	execute_all(validations.always);

	if(user_is_new){
	    execute_all(validations.creation);
	}
	else{
	    execute_all(validations.edit);
	}
*/

    };

ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));

module.exports = ddoc;