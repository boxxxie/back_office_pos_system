function inject_script(string){
    var x = document.createElement('script');
    x.src = string
    document.body.appendChild(x);
}

inject_script("http://documentcloud.github.com/underscore/underscore-min.js")
inject_script("https://raw.github.com/boxxxie/underscore_extended/master/underscore_extended_browser.js")

function transform_users(){
    var _users_db = $.couch.db("_users");
    _users_db
	.allDocs(
	    {
		include_docs:true,
		success:function(resp){
		    var users = _.chain(resp.rows)
			.pluck('doc')
			.reject(function(doc){return /^_design/.test(doc._id)})
			.reject(function(user){return _.contains(user.roles,'_admin')})
			.value();
		    console.log(users)
		    var users_with_props_in_roles =
			_.map(users,function(user){
				  var split_user = _.splitKeys(user,
							     '_id',
							     '_rev',
							     'salt',
							     'password_sha',
							     'type',
							     'creationdate',
							     'name',
							     'roles',
							     'firstname',
							     'lastname',
							     'website',
							     'email',
							     'phone',
							     'street0',
							     'street1',
							     'city',
							     'country',
							     'province',
							     'postalcode')
				  var user_fields = _.first(split_user);
				  var role_fields = _.second(split_user);
				  var transformed_roles =
				      _.chain(user_fields.roles)
				      .map(function(role){
					       return _.obj(role,true)
					   })
				      .concat(role_fields)
				      .merge()
				      .value();
				  return  _.extend(_.clone(user_fields),{roles:[transformed_roles]});
			      });
		    console.log(users_with_props_in_roles)
		    _users_db.bulkSave({
					   docs:users_with_props_in_roles,
					   all_or_nothing:true
				       },
				       {
					   success:function(){console.log(arguments)}
				       })
		}
	    })
}

transform_users();

function delete_users(){
    var _users_db = $.couch.db("_users");
    _users_db
	.allDocs(
	    {
		include_docs:true,
		success:function(resp){
		    var users = _.chain(resp.rows)
			.pluck('doc')
			.reject(function(doc){return /^_design/.test(doc._id)})
			.reject(function(user){return _.contains(user.roles,'_admin')})
			.value();
		    console.log(users)
		    var enabled_users = _.map(users,function(user){return _.extend(user,{enabled:true})});
		    console.log(enabled_users)
		    _users_db.bulkRemove({
					     docs:enabled_users,
					     all_or_nothing:true
					 },
					 {
					     success:function(){
						 console.log(arguments)
					     }
					 })

		}
	    })
}