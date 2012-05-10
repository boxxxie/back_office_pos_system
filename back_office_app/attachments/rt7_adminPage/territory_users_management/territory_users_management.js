// TODO : functions..
// this function is in reportData.js ?
function simple_user_format(user){
    var user_roles_obj = _.chain(user.roles)
    .filter(_.isObj)
    .merge()
    .value();

    return _.chain(user)
    .removeKeys('roles')
    .combine(user_roles_obj)
    .value();
}

// TODO : views
var add_territory_user_view =
    Backbone.View.extend(
    {
        events:{
        "click":"add_user"
        },
        add_user:function(event){
        this.trigger('add-user');
        }
    });

var territoryUsersTableView =
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

        view.$el.html(ich.territoryUsersInfotable_TMP({list:user_list}));
        $('button').button();
        }
    });
    
// TODO : router
var territoryUsersRouter =
    new (Backbone.Router.extend(
         {
         routes: {
             "territoryusers":"setup"
         },
         initialize:function(){
             var router = this;
             //router.vent = _.extend({},Backbone.Events);
             router.template = 'territoryUsersManagement_TMP';
             var UserCollection = Backbone.Collection.extend({model:UserDoc});
             router.user_collection = new UserCollection();
             //router.current_user = new UserDoc();
             router.views = {
             territory_users_table : new territoryUsersTableView(),
             add_button : new add_territory_user_view()
             //,
             //current_user : new current_user_info_view({template:"logged_in_user_info_TMP"}),
             //navigation : new company_tree_navigation_view({vent:router.vent,auto_el:'#company-navigation',template:"hierarchy_list_TMP"})
             };

             router
             .user_collection
             .on('all',
                 function(evenStr,collection){router.views.territory_users_table.render(this.toJSON());});

             router
             .views
             .add_button
             .on('user-added', router.add_user);

             router.views.territory_users_table.on('edit-user',router.edit_user,router);
             router.views.territory_users_table.on('delete-user',router.delete_user,router);
             router.views.territory_users_table.on('change-user-password',router.change_user_password,router);
             //router.current_user.on('change',router.views.current_user.render,router.views.current_user);
             //router.views.current_user.on("change-current-user-password",router.change_user_password,router);
             router.views.add_button.on("add-user",router.add_user, router);

             //router.vent.on('change:selected-entity',router.load_users_for_id,router);
         },
         setup:function(){
             //alert("we are working on this menu");
             //window.history.go(-1);
            
             var router = this;
             var html = ich[router.template]();
                 $("#main").html(html);
             //router.views.current_user.setElement("#current_user");
             //router.current_user.set(ReportData.currentUser);
             //router.views.current_user.render(router.current_user);
             
             router
             .views
             .add_button
             .setElement("#addusers");
             router.views.territory_users_table.setElement("#territory_users_table");
             router.views.add_button.$el.find('input').button();

             //router.vent.trigger('render:navigation',ReportData);

             router.load_users();
         },
         load_users:function(){
             var router = this;
             fetch_territory_users()
             (function(err,users){
                 if(!err) {
                    router.user_collection.reset(users);
                 }
             });
         },
         change_user_password:function(user_id){
             var router = this;
             console.log("change_user_password");
             console.log(arguments);
             
             function edit_router_user_collection(user_doc,callback){
             var simple_user = simple_user_format(user_doc);
             router.user_collection.get(simple_user._id).set(simple_user);
             callback(undefined);
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
                 $.couch.session({success:function(session){
                     var user = router.user_collection.find(function(user){return user.get('_id') === user_id;});
                    async.waterfall(
                         [
                         user.change_password(session,new_password),
                         edit_router_user_collection
                         ],
                         report);
                 }});
             }

         },
         edit_user:function(user_id){
             var router = this;
             var user = router.user_collection.find(function(user){return user.get('_id') === user_id;});
             console.log("edit user: " + user_id);
             var userJSON = user.toJSON();
             console.log(userJSON);
             //we_are_fixing_this_feature("editing users is being fixed right now");return;
             
             function edit_router_user_collection(user_doc,callback){
             var simple_user = simple_user_format(user_doc);
             router.user_collection.get(simple_user._id).set(simple_user);
             callback(undefined);
             }
             
             function report(err){
             if(err){
                 alert(JSON.stringify(err));
             }
             }
             
             var user_edit_rules =  
                _.extend({}
                        ,{
                            consts : 
                                {
                                "creationdate": userJSON.creationdate,
                                "type": "user"
                                },
                                
                            display:
                            {
                                user_name:{"var":'userName',label:"User Name",enabled:false,value:userJSON.userName},
                                password:{"var":'password',label:"Password",enabled:false,value:userJSON.exposed_password},
                                is_enabled:{"var":"enabled",label:"Enabled",enabled:true,value:userJSON.enabled},
                                contact:[
                                {"var":"firstname",label:"First Name", enabled:true,value:userJSON.firstname},
                                {"var":"lastname",label:"Last Name", enabled:true,value:userJSON.lastname},
                                {"var":"website",label:"WebSite", enabled:true,value:userJSON.website},
                                {"var":"email", label:"Email",enabled:true,value:userJSON.email},
                                {"var":"phone", label:"Phone Number",enabled:true,value:userJSON.phone}
                                ],
                                address:[
                                {"var":"street0",label:"Street 0", enabled:true,value:userJSON.street0},
                                {"var":"street1", label:"Street 1",enabled:true,value:userJSON.street1},
                                {"var":"city", label:"City",enabled:true,value:userJSON.city},
                                {"var":"country", label:"Country",enabled:true,value:userJSON.country},
                                {"var":"province", label:"Province",enabled:true,value:userJSON.province},
                                {"var":"postalcode", label:"Postal Code",enabled:true,value:userJSON.postalcode}
                                ]
                            }
                        });
                        
             quickInputTerritoryUserInfoDialog(
             {
                 title:"Edit New User",
                 html:ich.inputTerritoryUserInfo_TMP(user_edit_rules.display), //here we have to merge the rules with the default_data to come up with the blueprint for the dialog
                 on_submit:function(simple_user_data){
                 console.log(simple_user_data);
                 function user_name(user){
                     return _.combine(user, {name:user.userName});
                 }
                 function apply_constants(consts){
                     return function(user){
                     return _.combine(user,consts);
                     };
                 }
                 function complex_user_format(user_data){
                     var extract_strings = ['company','company_admin','group','group_admin','store','store_admin','pos_sales','pos_admin'];
                     var extract_obj = ['companyName','company_id','groupName','group_id','storeName','store_id','storeNumber','userName','enabled'].concat(extract_strings);
                     //var roles_strings = _.chain(user_data).selectKeys(extract_strings).filter$(_.identity).keys().value();
                     var roles_strings = ["territory"];
                     var roles_complex = _.selectKeys(user_data,extract_obj);
                     var roles = roles_strings.concat(roles_complex);
                     return _.chain(user_data).removeKeys(extract_obj).combine({roles:roles}).value();
                 }
                 var user_data = _.compose(complex_user_format,
                             user_name)(_.combine(user_edit_rules.consts,
                                          simple_user_data,
                                          {exposed_password:simple_user_data.password}));

                 console.log("submitted user");
                 console.log(user_data);
                 
                 $.couch.session({
                     success: function(session) {
                         var user = router.user_collection.find(function(user){return user.get('_id') === user_id;});
                         async.waterfall(
                         [
                         user.updateUserDoc(session,user_data),
                         edit_router_user_collection
                         ],
                         report);
                     },
                     error:function() {
                         console.log("session error");
                     }
                     });
                 }
             });           
             
             //alert("editing users is being fixed right now");
         },
         add_user:function(){
             console.log("add user button pressed");
             var router = this;
             //assume that this is a company_admin level user making a company level user
            
             var user_creation_rules =  
                _.extend({}
                        ,{
                            consts : 
                                {
                                "creationdate": (new Date()).toJSON(),
                                "type": "user"
                                },
                                
                            display:
                            {
                                user_name:{"var":'userName',label:"User Name",enabled:true,value:""},
                                password:{"var":'password',label:"Password",enabled:true,value:""},
                                is_enabled:{"var":"enabled",label:"Enabled",enabled:true,value:true},
                                contact:[
                                {"var":"firstname",label:"First Name", enabled:true,value:""},
                                {"var":"lastname",label:"Last Name", enabled:true,value:""},
                                {"var":"website",label:"WebSite", enabled:true,value:""},
                                {"var":"email", label:"Email",enabled:true,value:""},
                                {"var":"phone", label:"Phone Number",enabled:true,value:""}
                                ],
                                address:[
                                {"var":"street0",label:"Street 0", enabled:true,value:""},
                                {"var":"street1", label:"Street 1",enabled:true,value:""},
                                {"var":"city", label:"City",enabled:true,value:""},
                                {"var":"country", label:"Country",enabled:true,value:""},
                                {"var":"province", label:"Province",enabled:true,value:""},
                                {"var":"postalcode", label:"Postal Code",enabled:true,value:""}
                                ]
                            }
                        });

             quickInputTerritoryUserInfoDialog(
             {
                 title:"Add New User",
                 html:ich.inputTerritoryUserInfo_TMP(user_creation_rules.display), //here we have to merge the rules with the default_data to come up with the blueprint for the dialog
                 on_submit:function(simple_user_data){
                 console.log(simple_user_data);
                 function user_name(user){
                     return _.combine(user, {name:user.userName});
                 }
                 function apply_constants(consts){
                     return function(user){
                     return _.combine(user,consts);
                     };
                 }
                 function complex_user_format(user_data){
                     var extract_strings = ['company','company_admin','group','group_admin','store','store_admin','pos_sales','pos_admin'];
                     var extract_obj = ['companyName','company_id','groupName','group_id','storeName','store_id','storeNumber','userName','enabled'].concat(extract_strings);
                     //var roles_strings = _.chain(user_data).selectKeys(extract_strings).filter$(_.identity).keys().value();
                     var roles_strings = ["territory"];
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
                         // alert("created new user: " + user_data.userName);
                         router.user_collection.add(simple_user_format(user_data));
                         },
                         error:function(err_code,err,err_message){
                         alert(err_message);
                         }});
                 }
             });
         }
         }));