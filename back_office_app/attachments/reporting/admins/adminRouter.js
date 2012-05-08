var current_user_info_view =
    Backbone.View.extend(
	{
	    events:{
		"click .change_logged_in_user_password":"change_password"
	    },
	    user_id:function(event){
		return event.currentTarget.id;
	    },
	    change_password:function(event){
		this.trigger("change-current-user-password",this.user_id(event));
	    },
	    render:function(current_user){
		console.log("render current user info");
		var el = this.$el;
		var template = this.options.template;
		if(template && el && current_user){
		    el.html(ich[template](current_user.toJSON()));
		    el.find('button').button();
		}
	    }
	});

var customer_admin_add_user_view =
    Backbone.View.extend(
	{
	    events:{
		"click":"add_user"
	    },
	    add_user:function(event){
		this.trigger('add-user');
	    }
	});

var menuAdminUsersView =
    Backbone.View.extend(
	{
	    events:{
		"click .edit_user":"edit_user",
		"click .delete_user":"delete_user",
		"click .edit_user_password":"change_password"
	    },
	    user_id:function(event){
		return event.currentTarget.id;
	    },
	    edit_user:function(event){
		this.trigger('edit-user',this.user_id(event));
	    },
	    delete_user:function(event){
		this.trigger('delete-user',this.user_id(event));
	    },
	    change_password:function(event){
		this.trigger('change-user-password',this.user_id(event));
	    },
	    render:function(users) {
		console.log("render users");
		var view = this;
		var user_list =
		    _.chain(users)
		    .sortBy(function(item){return new Date(item.creationdate);})
		    .reverse()
		    .value();

		view.$el.html(ich.adminUsersInfotable_TMP({list:user_list}));
		$('button').button();
	    }
	});

var adminRouter =
    new (Backbone.Router.extend(
	     {
		 routes: {
		     "menuAdministration/":"setup"
		 },
		 initialize:function(){
		     var router = this;
		     router.vent = _.extend({},Backbone.Events);
		     router.template = 'adminManagement_TMP';
		     var UserCollection = Backbone.Collection.extend({model:UserDoc});
		     router.user_collection = new UserCollection();
		     router.current_user = new UserDoc();
		     router.views = {
			 user_table : new menuAdminUsersView(),
			 add_button : new customer_admin_add_user_view(),
			 current_user : new current_user_info_view({template:"logged_in_user_info_TMP"}),
			 navigation : new company_tree_navigation_view({vent:router.vent,auto_el:'#company-navigation',template:"hierarchy_list_TMP"})
		     };

		     router
			 .user_collection
			 .on('all',
			     function(evenStr,collection){router.views.user_table.render(this.toJSON());});

		     router
			 .views
			 .add_button
			 .on('user-added', router.add_user);

		     router.views.user_table.on('edit-user',router.edit_user,router);
		     router.views.user_table.on('delete-user',router.delete_user,router);
		     router.views.user_table.on('change-user-password',router.change_user_password,router);
		     router.current_user.on('change',router.views.current_user.render,router.views.current_user);
		     router.views.current_user.on("change-current-user-password",router.change_user_password,router);
		     router.views.add_button.on("add-user",router.add_user, router);

		     router.vent.on('change:selected-entity',router.load_users_for_id,router);
		 },
		 switch_company:function(){
		     console.log(arguments);
		 },
		 setup:function(){
		     var router = this;
		     var html = ich[router.template](_.combine(ReportData,autoBreadCrumb()));
    		     $("#main").html(html);
		     router.views.current_user.setElement("#current_user");
		     router.current_user.set(ReportData.currentUser);
		     router.views.current_user.render(router.current_user);
		     router
			 .views
			 .add_button
			 .setElement("#addusers")
			 .options.default_data = topLevelEntityInfo(ReportData);
		     router.views.user_table.setElement("#usersInfoTable");
		     router.views.add_button.$el.button();

		     router.vent.trigger('render:navigation',ReportData);

		     router.load_users();
		 },
		 load_users:function(){
		     var entity_id = topLevelEntity(ReportData).id;
		     var entity_name = $("#"+entity_id).attr('name');
		     this.load_users_for_id(entity_id,entity_name);
		 },
		 load_users_for_id:function(id, entity_name){
		     var router = this;
		     router.current_entity_id = id;
             $("#naviStringInOtherUser").html(entity_name);
		     router.user_collection.reset();
		     console.log("menuAdministration: " + id);
		     var breadCrumb = autoBreadCrumb(); //?
		     fetch_users_by_location_id(id)
		     (function(err,users){
			  if(_.isEmpty(users)) {
			      alert("There are no users for this entity");
			  }
 			  function exclude_logged_in_user(reportData,users_list){
			      return _.reject(users_list,function(user){return reportData.currentUser._id === user._id;});
			  }
			  router.user_collection.reset(exclude_logged_in_user(ReportData,users));
		      });
		 },
		 change_user_password:function(user_id){
		     var router = this;
		     console.log("change_user_password");
		     console.log(arguments);
		     
		     function login_with_new_password(user_doc,callback){
			 var SE_handler = {
			     success : function(){
				 var simple_user = simple_user_format(user_doc);
				 callback(undefined,simple_user);
			     },
			     error: function (code,type,message) {
				 callback({code:code,type:type,message:message});
			     }
			 };
			 var login_options =
			     _.extend({
					  name : user_doc.name,
					  password : user_doc.password
				      },
				      SE_handler);

			 $.couch.login(login_options);
		     }
		     
		     function edit_router_user_collection(user_doc,callback){
			 var simple_user = simple_user_format(user_doc);
			 router.user_collection.get(simple_user._id).set(simple_user);
			 callback(undefined);
		     }
		     
		     function setup_router_current_user(simple_user,callback){
			 router.current_user.set(simple_user);
			 callback(undefined,simple_user);
		     }
		     
		     function setup_report_data(simple_user,callback){
			 ReportData.currentUser = simple_user;
			 callback(undefined);
		     }
		     
		     function setup_session(callback){
			 $.couch.session(
			     {
				 success:function(resp){
				     ReportData.session = resp;
				     callback(undefined);
				 },
				 error:function(code,type,message){
				     callback({code:code,type:type,message:message});
				 }
			     });
		     }

		     function is_logged_in_user(logged_in_user,user_id_to_edit){
			 return logged_in_user.id === user_id_to_edit;
		     }

		     function report(err){
			 if(err){
			     alert(JSON.stringify(err));
			 }
		     }

		     var new_password = prompt("new password");
		     // new_password == null ; click cancel
		     // new_password == "" ; input empty and click ok
		     if(new_password!=null) {
		         var session = ReportData.session;
                 if(is_logged_in_user(router.current_user,user_id)){
                 var user = router.current_user;
                 async.waterfall(
                     [
                     user.change_password(session,new_password),
                     login_with_new_password,
                     setup_router_current_user,
                     setup_report_data,
                     setup_session
                     ],
                     report);
                 }
                 else{
                 var user = router.user_collection.find(function(user){return user.get('_id') === user_id;});
                 async.waterfall(
                     [
                     user.change_password(session,new_password),
                     edit_router_user_collection
                     ],
                     report);
                 }
		     }

		 },
		 edit_user:function(user_id){
		     console.log("edit user: " + user_id);
		     we_are_fixing_this_feature("editing users is being fixed right now");return;
		 },
		 add_user:function(){
		     console.log("add user button pressed");
		     var router = this;
		     //assume that this is a company_admin level user making a company level user

		     var generate_add_user_dialog_blueprint = multimethod()
			 .dispatch(function(reportData,entity_id){ return entity_type_from_id(reportData,entity_id); })
			 .when( "store" , function(reportData,entity_id){
				    return{
					consts : _.defaults(
					    {
						"creationdate": (new Date()).toJSON(),
						"type": "user"
					    },
					    entity_from_id(reportData,entity_id)),
					display:
					{
					    user_name:{"var":'userName',label:"User Name",enabled:true,value:""},
					    password:{"var":'password',label:"Password",enabled:true,value:""},
					    "roles": [
						{"var":'store',label:"Store Manager",enabled:true,value:false},
						{"var":'pos_admin',label:"POS Admin",enabled:true,value:false},
						{"var":'pos_sales',label:"POS User",enabled:true,value:false}
					    ],
					    is_enabled:{"var":"enabled",label:"Enabled",enabled:true,value:true},
					    contact:[
						{"var":"firstname",label:"First Name", enabled:true,value:""},
						{"var":"lastname",label:"Last Name", enabled:true,value:""},
						{"var":"website",label:"WebSite", enabled:true,value:""},
						{"var":"email", label:"Email",enabled:true,value:""},
						{"var":"phone", label:"Phone Number",enabled:true,value:""}
					    ],
					    address:[
						{"var":"street0",label:"Street", enabled:true,value:""},
						{"var":"street1", label:"Street",enabled:true,value:""},
						{"var":"city", label:"City",enabled:true,value:""},
						{"var":"country", label:"Country",enabled:true,value:""},
						{"var":"province", label:"Province",enabled:true,value:""},
						{"var":"postalcode", label:"Postal Code",enabled:true,value:""}
					    ]
					}
				    };
				})
			 .when( "group" , function(reportData,entity_id){
				    return {
					consts : _.defaults(
					    {
						"creationdate": (new Date()).toJSON(),
						"type": "user"
					    },
					    entity_from_id(reportData,entity_id)),
					display:
					{
					    user_name:{"var":'userName',label:"User Name",enabled:true,value:""},
					    password:{"var":'password',label:"Password",enabled:true,value:""},
					    "roles": [
						{"var":'group',label:"Group Manager",enabled:true,value:false},
						{"var":'store',label:"Store Manager",enabled:true,value:false},
						{"var":'pos_admin',label:"POS Admin",enabled:true,value:false},
						{"var":'pos_sales',label:"POS User",enabled:true,value:false}
					    ],
					    is_enabled:{"var":"enabled",label:"Enabled",enabled:true,value:true},
					    contact:[
						{"var":"firstname",label:"First Name", enabled:true,value:""},
						{"var":"lastname",label:"Last Name", enabled:true,value:""},
						{"var":"website",label:"WebSite", enabled:true,value:""},
						{"var":"email", label:"Email",enabled:true,value:""},
						{"var":"phone", label:"Phone Number",enabled:true,value:""}
					    ],
					    address:[
						{"var":"street0",label:"Street", enabled:true,value:""},
						{"var":"street1", label:"Street",enabled:true,value:""},
						{"var":"city", label:"City",enabled:true,value:""},
						{"var":"country", label:"Country",enabled:true,value:""},
						{"var":"province", label:"Province",enabled:true,value:""},
						{"var":"postalcode", label:"Postal Code",enabled:true,value:""}
					    ]
					}
				    };
				})
			 .when( "company" , function(reportData,entity_id){
				    return {
					consts : _.defaults(
					    {
						"creationdate": (new Date()).toJSON(),
						"type": "user"
					    },
					    entity_from_id(reportData,entity_id)),
					display:
					{
					    user_name:{"var":'userName',label:"User Name",enabled:true,value:""},
					    password:{"var":'password',label:"Password",enabled:true,value:""},
					    "roles": [
						{"var":'company',label:"Company Manager",enabled:true,value:false},
						{"var":'group',label:"Group Manager",enabled:true,value:false},
						{"var":'store',label:"Store Manager",enabled:true,value:false},
						{"var":'pos_admin',label:"POS Admin",enabled:true,value:false},
						{"var":'pos_sales',label:"POS User",enabled:true,value:false}
					    ],
					    is_enabled:{"var":"enabled",label:"Enabled",enabled:true,value:true},
					    contact:[
						{"var":"firstname",label:"First Name", enabled:true,value:""},
						{"var":"lastname",label:"Last Name", enabled:true,value:""},
						{"var":"website",label:"WebSite", enabled:true,value:""},
						{"var":"email", label:"Email",enabled:true,value:""},
						{"var":"phone", label:"Phone Number",enabled:true,value:""}
					    ],
					    address:[
						{"var":"street0",label:"Street", enabled:true,value:""},
						{"var":"street1", label:"Street",enabled:true,value:""},
						{"var":"city", label:"City",enabled:true,value:""},
						{"var":"country", label:"Country",enabled:true,value:""},
						{"var":"province", label:"Province",enabled:true,value:""},
						{"var":"postalcode", label:"Postal Code",enabled:true,value:""}
					    ]
					}
				    };
				});
			 //.default(undefined); //TODO : throw an error in IE7

		     var user_creation_rules =  generate_add_user_dialog_blueprint(ReportData,router.current_entity_id);
		     if(_.isUndefined(user_creation_rules)){
			 we_are_fixing_this_feature("support for creating users at other levels is being worked on");
			 return;
		     }
		     quickInputUserInfoDialog(
			 {
			     title:"Add New User",
			     html:ich.inputUserInfo_TMP(user_creation_rules.display), //here we have to merge the rules with the default_data to come up with the blueprint for the dialog
			     on_submit:function(simple_user_data){
				 console.log(simple_user_data);
				 function user_name(user){
				     return _.combine(user, {name:_.either(user.store_id,user.group_id,user.company_id)+user.userName});
				 }
				 function apply_constants(consts){
				     return function(user){
					 return _.combine(user,consts);
				     };
				 }
				 function complex_user_format(user_data){
				     var extract_strings = ['company','company_admin','group','group_admin','store','store_admin','pos_sales','pos_admin'];
				     var extract_obj = ['companyName','company_id','groupName','group_id','storeName','store_id','storeNumber','userName','enabled'].concat(extract_strings);
				     var roles_strings = _.chain(user_data).selectKeys(extract_strings).filter$(_.identity).keys().value();
				     var roles_complex = _.selectKeys(user_data,extract_obj);
				     var roles = roles_strings.concat(roles_complex);
				     return _.chain(user_data).removeKeys(extract_obj).combine({roles:roles}).value();
				 }
				 var user_data = _.compose(complex_user_format,
							 user_name)(_.combine(user_creation_rules.consts,
									      simple_user_data,
									      {exposed_password:simple_user_data.password}));

				 console.log("submitted user");
				 console.log(user_data);

				 (new UserDoc(user_data))
				     .signup(
					 {
					     success:function(resp){
						 //	alert("created new user: " + user_data.userName);
						 router.user_collection.add(simple_user_format(user_data));
					     },
					     error:function(err_code,err,err_message){
						 alert(err_message);
					     }});
			     }
			 });
		 }
	     }));