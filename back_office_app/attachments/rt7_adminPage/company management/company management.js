
var Companies;
var rewardsModel;
var Locations;

function guidGenerator() {
    var S4 = function() {
	return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function checkLength(str, min, max) {
    if(str.length > max || str.length < min) {
	return false;
    } else {
	return true;
    }
};

function checkRegexp(str, regexp) {
    if(!(regexp.test(str) )) {
	return false;
    } else {
	return true;
    }
};

function validateCompany(newCompany_w_options, previous) {
    function userExists(user) {
	return Companies
	    .find(function(company) {
		      return company.get('user') == user;
		  });
    };

    function companyNameExists(companyName) {
	return Companies
	    .find(function(company) {
		      return company.get('companyName').toLowerCase() == _.str.trim(companyName.toLowerCase());
		  });
    };

    function companyOpNameExists(companyName) {
	return Companies
	    .find(function(company) {
		      return company.get('operationalname').toLowerCase() == companyName.toLowerCase();
		  });
    };

    function validateUserName(user, companyWithSameUserID, previous) {
	var results = [];
	if(_.isEmpty(user)) {
	    results = results.concat({
					 fieldname : "user",
					 isInvalid : true
				     });
	} else if(!checkRegexp(user, /^\w{1,8}$/)) {
	    results = results.concat({
					 fieldname : "user",
					 isInvalid : true,
					 errMsg : "The Master User ID length should be 1~8 characters"
				     });
	}
	return results;
    };

    function validatePassword(password) {
	var results = [];
	if(_.isEmpty(password)) {
	    results = results.concat({
					 fieldname : "password",
					 isInvalid : true
				     });
	}
	if(!checkRegexp(password, /^\w{1,8}$/)) {
	    results = results.concat({
					 fieldname : "password",
					 isInvalid : true,
					 errMsg : "The Master User Password length should be 1~8 characters"
				     });
	}
	return results;
    };

    function validateCompanyName(companyName, companyWithSameName, addingNewCompany, previous, fieldName) {
	var results = [];
	if(_.isEmpty(companyName)) {
	    results = results.concat({
					 fieldname : fieldName,
					 isInvalid : true
				     });
	}
	if((companyWithSameName && addingNewCompany) || (companyWithSameName && !previous) || companyWithSameName && companyWithSameName.get('_id') != previous._id) {
	    results = results.concat({
					 fieldname : fieldName,
					 isInvalid : true,
					 errMsg : "A Company with the same name already exists"
				     });
	}
	return results;
    };

    var results = [];
    var user = newCompany_w_options.user;
    var password = newCompany_w_options.password;
    var companyName = newCompany_w_options.companyName;
    var operationalname = newCompany_w_options.operationalname;
    var addingNewCompany = newCompany_w_options.isCreate;
    var companyWithSameName = companyNameExists(companyName);
    var companyWithSameOpName = companyOpNameExists(operationalname);
    var companyWithSameUserID = userExists(user);

    //verify user ID
    results = results.concat(validateUserName(user, companyWithSameUserID, previous));

    //verify password
    results = results.concat(validatePassword(password));

    //verify company operational name
    results = results.concat(validateCompanyName(operationalname, companyWithSameOpName, addingNewCompany, previous, 'operationalname'));

    //verify company name
    results = results.concat(validateCompanyName(companyName, companyWithSameName, addingNewCompany, previous, 'company-name'));

    return results;
};

function saveNewUser(user,password,options){
    (new (couchDoc.extend({db:"_users"}))
     ({_id:"org.couchdb.user:"+user.name}))
	.fetch(
	    //if we find a user, then this is actually an error and we need to overwrite the user data or alert the actual user as to what to do
	    {success:function(userModel){
		 //overwrite the user (but we can't overwrite the password)
		 if(options.overwrite){
		     userModel.save(user,options);
		 }
		 else{
		     options.error(1000,"user already exists","there was already a user in this entity(company/group/store) and we are not allowed to overwrite their details");
		 }
	     },
	     //if we don't find a user, then we make a new one (indented action)
	     error:function(){
		 $.couch.signup(user,password,options);
	     }
	    });
}

function addCompany(collection) {
    return {
	success : function(resp) {
	    collection.create(
		resp,{
		    success:
		    function(companyModel){
			var user = {
			    companyName:companyModel.get("companyName"),
			    roles:[
				"company_admin", "pos_sales", "pos_admin",
				{
				    "company_admin":true,
				    "company":true,
				    "store":true,
				    "group":true,
				    "pos_sales":true,
				    "pos_admin":true,
				    "userName":companyModel.get("user"),
				    enabled:true,
				    company_id:companyModel.id
				}
			    ],
			    name:companyModel.id + companyModel.get("user")
			};
			_.extend(user,
				 companyModel.get('contact'),
				 companyModel.get('address'),
				 {
				     exposed_password:companyModel.get("password")
				 },
				 {creationdate:new Date()});
			var password = companyModel.get("password");
			saveNewUser(user,password,
				    {success:
				     function(){
					 companyModel.collection.trigger("sync",companyModel.collection);
					 console.log("created a new company user");
				     },
				     error:
				     function(error_code,error_code_text,reason){
					 companyModel.collection.trigger("sync",companyModel.collection);
					 alert("user could not be created: " + reason);
					 console.log(arguments);
				     }
				    });
		    },
		    error:function(){
			console.log("error making company");
			console.log(arguments);
		    }
		});
	},
	validator : function(resp) {
	    return validateCompany(resp, null);
	}
    };
};
function editCompany(company) {
    return {
	success:function(resp) {
	    company.save(resp);
	},
	validator:function(resp) {
	    return validateCompany(resp, company.toJSON());
	}
    };
};
function deleteCompany(companyID) {
    var company = Companies.getModelById(companyID);
    var groups = company.get('hierarchy').groups;
    ;
    if(_.isEmpty(groups)) {
	company.destroy();
    } else {
	alert("can't delete. this company has group(s).");
    }
};

function addGroup(companyID) {
    var company = Companies.getModelById(companyID);
    return {
	success : function(resp) {
	    var newGroup = company.addGroup(resp);

	    var userData = {
                companyName:company.get("companyName"),
                groupName:newGroup.groupName,
		roles:[
		    "group_admin", "pos_sales", "pos_admin",
		    {
			"store":true,
			"group":true,
			group_admin:true,
			"pos_sales":true,
			"pos_admin":true,
			"userName":company.get("user"),
			enabled:true,
			company_id:company.get("_id"),
			group_id:newGroup.group_id,
			userName:newGroup.user,
			enabled:true
		    }
		],
                name:newGroup.group_id + newGroup.user};
	    _.extend(userData,
		     newGroup.contact,
		     newGroup.address,
		     {
			 exposed_password:newGroup.password
		     },
		     {creationdate:new Date()});
            var password = newGroup.password;
	    saveNewUser(userData,password);
	},
	validator : function(resp) {
	    return company.validateGroup(resp, null);
	}
    };
};
function editGroup(companyID, groupID) {
    var company = Companies.getModelById(companyID);
    var previousGroup = company.getGroup(groupID);
    return {
	success : function(resp) {
	    var newGroup = company.editGroup(resp, groupID);
	},
	validator : function(resp) {
	    return company.validateGroup(resp, previousGroup);
	}
    };
};
function deleteGroup(companyID, groupID) {
    var company = Companies.getModelById(companyID);
    var delGroup = company.deleteGroup(groupID);
}

function addStore(companyID, groupID) {
    var company = Companies.getModelById(companyID);
    var group = company.getGroup(groupID);
    var comparisonStores = company.getStores(groupID);
    return {
	success : function(resp) {
	    var newStore = company.addStore(groupID, resp);
	    var userData = {
                companyName:company.get("companyName"),
                groupName:group.groupName,
                storeName:newStore.storeName,
		roles:[
		    "store_admin", "pos_sales", "pos_admin",
		    {
			store_admin:true,
			"store":true,
			"pos_sales":true,
			"pos_admin":true,
			"userName":company.get("user"),
			enabled:true,
			company_id:company.get("_id"),
			group_id:group.group_id,
			store_id:newStore.store_id,
			userName:newStore.user,
			storeNumber:newStore.number,
			enabled:true
		    }
		],
                name:newStore.store_id+newStore.user
	    };
	    _.extend(userData,
		     newStore.contact,
		     newStore.address,
		     {
			 exposed_password:newStore.password
		     },
		     {creationdate:new Date()});
	    var password = newStore.password;
	    saveNewUser(userData,password);

	},
	validator : function(resp) {
	    return company.validateStore(resp, null, comparisonStores);
	}
    };
};

function editStore(companyID, groupID, storeID) {
    var company = Companies.getModelById(companyID);
    var previousStore = company.getStore(groupID, storeID);
    var comparisonStores = company.getStores(groupID);
    return {
	success : function(resp) {
	    var newStore = company.editStore(groupID, storeID, resp);
	},
	validator : function(resp) {
	    return company.validateStore(resp, previousStore, comparisonStores);
	}
    };
};

function deleteStore(companyID, groupID, storeID) {
    var company = Companies.getModelById(companyID);
    var delStore = company.deleteStore(groupID, storeID);
}

function addTerminal(companyID, groupID, storeID) {
    var company = Companies.getModelById(companyID);
    var comparisonTerminals = company.getTerminals(groupID, storeID);
    return {
	validator : function(resp) {
	    return company.validateTerminal(resp, null, comparisonTerminals);
	},
	success : function(resp) {
	    company.addTerminal(groupID, storeID, resp);
	}
    };
};

function editTerminal(companyID, groupID, storeID, terminalID) {
    var company = Companies.getModelById(companyID);
    var previousTerminal = company.getTerminal(groupID, storeID, terminalID);
    var comparisonTerminals = company.getTerminals(groupID, storeID);
    return {
	validator : function(resp) {
	    return company.validateTerminal(resp, previousTerminal, comparisonTerminals);
	},
	success : function(resp) {
	    company.editTerminal(groupID, storeID, terminalID, resp);
	},
	getUnmodifiedTerminal : function() {
	    return previousTerminal;
	}
    };
};

// delete company or group or store
function deleteThing(companyID, groupID, storeID) {
    if(!_.isEmpty(storeID)) {
	deleteStore(companyID, groupID, storeID);
    } else if(!_.isEmpty(groupID)) {
	deleteGroup(companyID, groupID);
    } else if(!_.isEmpty(companyID)) {
	deleteCompany(companyID);
    }
}

function quickView(template, companyID, groupID, storeID, terminalID) {
    var company = Companies.getModelById(companyID);
    var companyJSON = company.toJSON();
    var for_TMP;
    if(!_.isEmpty(terminalID)) {
	var terminal = company.getTerminal(groupID, storeID, terminalID);
	for_TMP = {
	    terminal : terminal
	};
    } else if(!_.isEmpty(storeID)) {
	var store = company.getStore(groupID, storeID);
	for_TMP = {
	    store : store
	};
    } else if(!_.isEmpty(groupID)) {
	var group = company.getGroup(groupID);
	for_TMP = {
	    group : group
	};
    } else {
	for_TMP = {
	    company : companyJSON
	};
    }
    var html = ich[template](for_TMP);
    quickViewDialog(html);
}

var companiesView;
var companiesViewTest;
var groupsView;
var groupsViewTest;
var storesView;
var storesViewTest;
var terminalsView;
var terminalsViewTest;

function breadCrumb(companyID, groupID, storeID, terminalID) {
    var companyName, groupName, storeName, storeNumber, terminalName;
    var company;
    if(companyID) {
	company = Companies.getModelById(companyID);
	companyName = company.get('companyName');
    }
    if(groupID) {
	groupName = company.getGroup(groupID).groupName;
    }
    if(storeID) {
	storeName = company.getStore(groupID, storeID).storeName;
	storeNumber = company.getStore(groupID, storeID).number;
    }
    if(terminalID) {
	terminalName = company.getTerminal(groupID, storeID, terminalID).id;
    }
    return {
	companyName : companyName,
	groupName : groupName,
	storeName : storeName,
	storeNumber : storeNumber,
	terminalName : terminalName
    };
}

function smartBreadCrumb(ReportData) {
    if(ReportData.store) {
	return {
	    breadCrumb : breadCrumb(ReportData.companyName, ReportData.groupName, ReportData.store.storeName, ReportData.store.number)
	};
    } else if(ReportData.group) {
	return {
	    breadCrumb : breadCrumb(ReportData.companyName, ReportData.group.groupName)
	};
    } else if(ReportData.company) {
	return {
	    breadCrumb : breadCrumb(ReportData.company.companyName)
	};
    } else {
	return {};
    }

}

function autoBreadCrumb() {
    return smartBreadCrumb(ReportData);
}

Companies = new (couchCollection(
		     {db:'companies'},
		     {model:Company,
		      getModelById : function(modelId){
			  return this.find(function(model){return model.get('_id') == modelId;});
		      },
		      getSelectedModel : function(){
			  return this.find(function(model){return model.selected == true;});
		      }
		     }));
Companies.fetch({error:function(response){alert(response.responseText);}});

var CompanyManagementRouter = new (Backbone.Router.extend(
				       {
					   routes: {
					       "companymanagement":"companyManagementHome",
					       "companymanagement/company/:_id": "modifyCompany",
					       "companymanagement/company/:_id/groups": "groupsManager" ,
					       "companymanagement/company/:_id/groups/:group_id": "modifyGroup",
					       "companymanagement/company/:_id/groups/:group_id/stores": "storesManager" ,
					       "companymanagement/company/:_id/groups/:group_id/stores/:storeName": "modifyStore",
					       "companymanagement/company/:_id/groups/:group_id/stores/:storeName/terminals": "terminalsManager",
					       "companymanagement/company/:_id/groups/:group_id/stores/:storeName/terminals/:terminalID": "modifyTerminal"
					   },
					   companyManagementHome:function(){
					       console.log("companyManagementHome");
					       var html = ich.company_management_page_TMP({createButtonLabel:"New Company"});
					       //TODO this should be refactored out to a render function
					       $('#main').html(html);
					       $("#create-dialog")
						   .html(ich.companyInputDialog_TMP(
							     {title:"Make a new Company",
							      company:{address:{},contact:{}}}));
					       CompanyCreateDialog("create-thing",addCompany(Companies));
					   },
					   modifyCompany:function(id){
					       console.log("modifyCompanies: " + id);
					   },
					   groupsManager:function(companyID){
					       console.log("groupsManager: " + companyID);
					       var company = Companies.getModelById(companyID);
					       company.unbind('change');
					       var companyJSON = company.toJSON();
					       var html = ich.group_management_page_TMP(_.extend({createButtonLabel:"New Group",
												  company:companyJSON},
												 breadCrumb(companyID)));
					       $("#main").html(html);
					       $("#create-dialog")
						   .html(ich.groupInputDialog_TMP(
							     {title:"Make a new Group",
							      group:{address:companyJSON.address,contact:companyJSON.contact}}));
					       GroupCreateDialog("create-thing",addGroup(companyID));
					   },
					   modifyGroup:function(companyID, groupID){
					       console.log("modifyGroup: " + companyID + " " + groupID);
					   },
					   storesManager:function(companyID, groupID){
					       console.log("storesManager: " + companyID + " , " + groupID);
					       var company = Companies.getModelById(companyID);
					       company.unbind('change');
					       var companyJSON = company.toJSON();
					       var stores = company.getStores(groupID);
					       var stores_w_ids = _.map(stores,function(store){return _.extend(store,{company_id:companyJSON._id});});
					       var html = ich.store_management_page_TMP(_.extend({createButtonLabel:"New Store",
												  company:companyJSON.operationalname,
												  company_id:company.get('_id'),
												  groupName:company.getGroup(groupID).groupName},
												 breadCrumb(companyID,groupID)));
					       $("#main").html(html);
					       $("#create-dialog")
						   .html(ich.storeInputDialog_TMP(
							     {title:"Make a new Store",
							      store:{address:{}, contact:{}}}));
					       StoreCreateDialog("create-thing", _.extend(addStore(companyID,groupID),{company:company, groupID:groupID} ));
					   },
					   modifyStore:function(companyID, groupID, storeID){
					       console.log("modifyStore: " + companyID + " " + groupID + " " + storeID);

					   },
					   terminalsManager:function(companyID, groupID, storeID){
					       this.view = new location_codes_view();
					       console.log("terminalsManager: " + companyID + " " + groupID + " " + storeID);
					       var company = Companies.getModelById(companyID);
					       company.unbind('change');
					       var companyJSON = company.toJSON();
					       var store = company.getStore(groupID,storeID);
					       var terminals = store.terminals;
					       var html = ich.terminal_management_page_TMP(
						   _.extend({createButtonLabel:"New Terminal",
							     operationalname:company.get('operationalname'),
							     company_id:company.get('_id'),
							     groupName:company.getGroup(groupID).groupName,
							     storeName:store.storeName},
							    breadCrumb(companyID,groupID,storeID)));
					       $("#main").html(html);
					       $("#create-dialog")
						   .html(ich.terminalInputDialog_TMP(
							     //{title:"Make a new Terminal",terminal:{}}));
							     {title:"Make a new Terminal",
							      companyCode:companyJSON.companyName,
							      storeCode:store.storeName}));
					       TerminalCreateDialog("create-thing",addTerminal(companyID,groupID,storeID));
					   },
					   modifyTerminal:function(companyID, groupID, storeID,terminalID){
					       console.log("modifyterminal: " + companyID + " " + groupID + " " + storeID + " " + terminalID);
					   }
				       }));
companiesView =
    Backbone.View.extend(
	{
	    initialize : function() {
		var view = this;
		_.bindAll(view, 'renderManagementPage', 'renderModifyPage');
		this.collection.bind('reset sync remove', view.renderManagementPage);
		CompanyManagementRouter.bind('route:companyManagementHome', function() {
						 console.log('companiesView:route:companyManagementHome');
						 view.el = _.first($("#list-things"));
						 view.renderManagementPage();
					     });
		CompanyManagementRouter.bind('route:modifyCompany', function(id) {
						 var company = Companies.getModelById(id);
						 company.bind('change', function() {
								  view.renderModifyPage(id);
							      });
						 console.log('companiesView:route:modifyCompany');
						 view.renderModifyPage(id);
					     });
	    },
	    renderManagementPage : function() {
		var view = this;
		var companies = this.collection.toJSON();
		var forTMP_w_stats = {
		    list : _.map(companies, function(company) {
				     var companyClone = _.clone(company);
				     var date = companyClone.creationdate;
				     _.extend(companyClone, {
						  creationdate : jodaDatePartFormatter(date)
					      });
				     var companyStats = view.collection.get(company._id).companyStats();
				     var quickViewArgs = {
					 template : "companyForm_TMP",
					 company_id : company._id
				     };
				     return _.extend(companyClone, companyStats, quickViewArgs);
				 })
		};
		var html = ich.companiesTabel_TMP(forTMP_w_stats);
		$(view.el).html(html);
		console.log("companiesView renderManagementPage");
		return this;
	    },
	    renderModifyPage : function(id) {
		var view = this;
		var company = Companies.getModelById(id);
		var companyJSON = company.toJSON();
		var db_users = cdb.db("users");
		
        db_users.openDoc(("org.couchdb.user:")
                            .concat(id)
                            .concat(companyJSON.user),
            {
                success:function(userDoc){
                    var updatedCompanyJSON = _.combine(companyJSON,{password:userDoc.exposed_password});
                    var html = ich.modify_company_page_TMP(_.extend({company : updatedCompanyJSON,
                                             company_id : id},
                                            breadCrumb(id)));
                    $("#main").html(html);
                    $('#form').find('input').attr("disabled", true);
                    $("#dialog-hook").html(ich.companyInputDialog_TMP({title : "Edit the Company",
                                               company : updatedCompanyJSON
                                              }));
            
                    $('#dialog-hook').find('#company-name,#operationalname,#user,#password').attr("disabled", true);
            
                    $("#btnModifyRewards")
                        .click(function() {
                               function saveRewardsProgram() {
                               return function(mobqreditsconversion, qriketconversion, qriketpercentage) {
                                   var rewardsJson = rewardsModel.toJSON();
                                   var rewardsdown = $("#rewardsdown");
                                   var opt = rewardsdown.val();
            
                                   if(opt == "none") {
                                   rewardsJson.use_mobqredits = false;
                                   rewardsJson.use_qriket = false;
                                   } else if(opt == "mobqredits") {
                                   rewardsJson.use_mobqredits = true;
                                   rewardsJson.use_qriket = false;
                                   } else {
                                   rewardsJson.use_mobqredits = false;
                                   rewardsJson.use_qriket = true;
                                   }
            
                                   rewardsModel.save({use_mobqredits : rewardsJson.use_mobqredits,
                                          mobqredits_conversion : mobqreditsconversion,
                                          use_qriket : rewardsJson.use_qriket,
                                          qriket_conversion : qriketconversion,
                                          qriket_percentage : qriketpercentage
                                         });
                               };
                               };
            
                               fetch_company_rewards(companyJSON._id)
                               (function(err, rewards) {
                                console.log(rewards);
                                rewardsModel = rewards;
                                var rewardsJson = rewardsModel.toJSON();
            
                                var html = ich.companyModifyRewardsDialog_TMP({MobQredits : rewardsJson});
            
                                companyModifyRewardsViewDialog(html,
                                               {title : "Modify Rewards Program",
                                                saveRewardsProgram : saveRewardsProgram(),
                                                MobQredits : rewardsJson
                                               });
                            });
                           });
                    CompanyModifyDialog("edit-thing", editCompany(company));
                    
                    $("#changepassword-thing").button()
                    .click(function(){
                        var newPassword = prompt("New Password");
                        if(newPassword!=null) {
                           $.couch.session({
                               success:function(session){
                                    var userModel = new UserDoc({name:(updatedCompanyJSON._id).concat(updatedCompanyJSON.user)});
                                    userModel.fetch({
                                        success:function(model){
                                            userModel.change_password(session,newPassword)
                                            (function(err,userDoc){
                                                if(err) {
                                                    alert(JSON.stringify(err));
                                                    return;
                                                }
                                                var newPassword_Company = _.combine(updatedCompanyJSON,{password:newPassword});
                                                (editCompany(company)).success(newPassword_Company);
                                                console.log("change success"); 
                                            });
                                        },
                                        error:function() {
                                            alert("Error occured. Please, try again");
                                        }
                                    });
                                },
                                error:function(){
                                    alert("Error occured. Please, try again");
                                }}); 
                        }
                    });
                    
                    console.log("companiesView renderModifyPage " + id);
                    //return this;
                },
                error:function() {
                    alert("Error occured. Please, try again");
                }
            });
	    },
	    updateModel : function() {
		this.company = this.collection.getModelById(Selection.get('company'));
		this.trigger("change:model");
	    }
	});
groupsView =
    Backbone.View.extend(
	{
	    initialize : function() {
		var view = this;
		_.bindAll(view, 'renderManagementPage', 'renderModifyPage');
		CompanyManagementRouter.bind('route:groupsManager', function(companyID) {
						 console.log('groupsView:route:groupsManager');
						 view.model = Companies.getModelById(companyID);
						 view.model.bind('add:group', function() {
								     view.renderManagementPage(companyID);
								 });
						 view.model.bind('delete:group', function() {
								     view.renderManagementPage(companyID);
								 });
						 view.el = _.first($("#list-things"));
						 view.renderManagementPage(companyID);
					     });
		CompanyManagementRouter.bind('route:modifyGroup', function(companyID, groupID) {
						 var company = Companies.getModelById(companyID);
						 view.model = company;
						 company.bind('change', function() {
								  view.renderModifyPage(companyID, groupID);
							      });
						 console.log('groupsView:route:modifyGroup' + " " + companyID + " " + groupID);
						 view.renderModifyPage(companyID, groupID);
					     });
	    },
	    renderManagementPage : function(companyID) {
		var view = this;
		var groups = view.model.getGroups();
		var forTMP = {
		    list : _.map(groups, function(group) {
				     var groupClone = _.clone(group);
				     var date = groupClone.creationdate;
				     _.extend(groupClone, {
						  creationdate : jodaDatePartFormatter(date)
					      });
				     var companyStats = view.model.companyStats(group.group_id);
				     var quickViewArgs = {
					 template : "groupForm_TMP",
					 company_id : companyID,
					 group_id : group.group_id
				     };
				     return _.extend(groupClone, companyStats, quickViewArgs);
				 })
		};
		var html = ich.groupsTabel_TMP(forTMP);
		$(view.el).html(html);
		console.log("renderManagementPage groupsView");
		return this;
	    },
	    renderModifyPage : function(companyID, groupID) {
		var view = this;
		var company = Companies.getModelById(companyID);
		var selectedgroup = view.model.getGroup(groupID);
		
		var db_users = cdb.db("users");
        
        db_users.openDoc(("org.couchdb.user:")
                            .concat(groupID)
                            .concat(selectedgroup.user),
            {
                success:function(userDoc) {
                    var updatedSelectedgroup = _.combine(selectedgroup,{password:userDoc.exposed_password});
                    $("#main").html(ich.modify_group_page_TMP(_.extend({
                                       company_id : company.get("_id"),
                                       group_id : selectedgroup.group_id,
                                       groupName : selectedgroup.groupName,
                                       operationalname : company.get("operationalname"),
                                       group : updatedSelectedgroup
                                   }, breadCrumb(companyID, groupID))));
                    $('#form').find('input').attr("disabled", true);
                    $("#dialog-hook").html(ich.groupInputDialog_TMP({
                                                title : "Edit the Group",
                                                group : updatedSelectedgroup
                                            }));
                    $('#dialog-hook').find('#group-name,#user,#password').attr("disabled", true);
            
                    GroupModifyDialog("edit-thing", _.extend(editGroup(companyID, groupID), {
                                             company : company,
                                             groupName : selectedgroup.groupName
                                         }));
                                         
                    $("#changepassword-thing").button()
                    .click(function(){
                        var newPassword = prompt("New Password");
                        if(newPassword!=null) {
                           $.couch.session({
                               success:function(session){
                                    var userModel = new UserDoc({name:(updatedSelectedgroup.group_id).concat(updatedSelectedgroup.user)});
                                    userModel.fetch({
                                        success:function(model){
                                            userModel.change_password(session,newPassword)
                                            (function(err,userDoc){
                                                if(err) {
                                                    alert(JSON.stringify(err));
                                                    return;
                                                }
                                                var newPassword_group = _.combine(updatedSelectedgroup,{password:newPassword});
                                                (editGroup(companyID,groupID)).success(newPassword_group);
                                                console.log("change success"); 
                                            });
                                        },
                                        error:function() {
                                            alert("Error occured. Please, try again");
                                        }
                                    });
                                },
                                error:function(){
                                    alert("Error occured. Please, try again");
                                }}); 
                        }
                    });
                    
                    
                    console.log("renderModifyPage groupsView");
                    //return this;
                },
                error:function() {
                    alert("Error occured. Please, try again");
                }
            });
	    },
	    updateModel : function() {
		this.company = this.collection.getModelById(Selection.get('company'));
		this.trigger("change:model");
	    }
	});
storesView =
    Backbone.View.extend(
	{
	    initialize : function() {
		var view = this;
		_.bindAll(view, 'renderManagementPage', 'renderModifyPage');

		CompanyManagementRouter.bind('route:storesManager', function(companyID, groupID) {
						 console.log('storeView:route:storesManager : ' + companyID + " " + groupID);
						 view.model = Companies.getModelById(companyID);
						 view.model.bind('add:store', function() {
								     view.renderManagementPage(companyID, groupID);
								 });
						 view.model.bind('delete:store', function() {
								     view.renderManagementPage(companyID, groupID);
								 });
						 view.el = _.first($("#list-things"));
						 view.renderManagementPage(companyID, groupID);
					     });
		CompanyManagementRouter.bind('route:modifyStore', function(companyID, groupID, storeID) {
						 var company = Companies.getModelById(companyID);
						 view.model = company;
						 company.bind('change', function() {
								  view.renderModifyPage(companyID, groupID, storeID);
							      });
						 console.log('storeView:route:modifyStore' + " " + companyID + " " + groupID + " " + storeID);
						 view.renderModifyPage(companyID, groupID, storeID);
					     });
	    },
	    renderManagementPage : function(companyID, groupID) {
		var view = this;
		var stores = view.model.getStores(groupID);
		var forTMP = {
		    list : _.map(stores, function(store) {
				     var storeClone = _.clone(store);
				     var date = storeClone.creationdate;
				     _.extend(storeClone, {
						  creationdate : jodaDatePartFormatter(date)
					      });
				     var companyStats = view.model.companyStats(groupID, store.store_id);
				     var quickViewArgs = {
					 template : "storeForm_TMP",
					 company_id : companyID,
					 group_id : groupID,
					 store_id : store.store_id
				     };
				     //fixme: i  don't know what the middle args are for
				     return _.extend(storeClone, companyStats, quickViewArgs);
				 })
		};
		var html = ich.storesTabel_TMP(forTMP);
		$(view.el).html(html);
		console.log("renderManagementPage store rendered");
	    },
	    renderModifyPage : function(companyID, groupID, storeID) {
		//var view = this;
		var company = Companies.getModelById(companyID);
		var group = company.getGroup(groupID);
		var storeToEdit = company.getStore(groupID, storeID);
		
		var db_users = cdb.db("users");
        
        db_users.openDoc(("org.couchdb.user:")
                            .concat(storeID)
                            .concat(storeToEdit.user),
            {
                success:function(userDoc) {
                    var updatedSelectedstore = _.combine(storeToEdit,{password:userDoc.exposed_password});
                    var html = ich.modify_store_page_TMP(_.extend({
                                  operationalname : company.get('operationalname'),
                                  company_id : company.get("_id"),
                                  group_id : group.group_id,
                                  groupName : group.groupName,
                                  storeName : storeToEdit.storeName,
                                  store_id : storeToEdit.store_id,
                                  store : updatedSelectedstore
                                  }, breadCrumb(companyID, groupID, storeID)));
                    $("#main").html(html);
                    $('#form').find('input').attr("disabled", true);
                    $("#dialog-hook").html(ich.storeInputDialog_TMP({
                                                title : "Edit the store",
                                                store : updatedSelectedstore
                                            }));
                    $('#dialog-hook').find('#store-name,#store-num,#user,#password').attr("disabled", true);
                    StoreModifyDialog("edit-thing", _.extend(editStore(companyID, groupID, storeID), {
                                             company : company,
                                             groupID : groupID,
                                             storeNum : storeToEdit.number
                                         }));
                    
                    $("#changepassword-thing").button()
                    .click(function(){
                        var newPassword = prompt("New Password");
                        if(newPassword!=null) {
                           $.couch.session({
                               success:function(session){
                                    var userModel = new UserDoc({name:(updatedSelectedstore.store_id).concat(updatedSelectedstore.user)});
                                    userModel.fetch({
                                        success:function(model){
                                            userModel.change_password(session,newPassword)
                                            (function(err,userDoc){
                                                if(err) {
                                                    alert(JSON.stringify(err));
                                                    return;
                                                }
                                                var newPassword_store = _.combine(updatedSelectedstore,{password:newPassword});
                                                (editStore(companyID,groupID,storeID)).success(newPassword_store);
                                                console.log("change success"); 
                                            });
                                        },
                                        error:function() {
                                            alert("Error occured. Please, try again");
                                        }
                                    });
                                },
                                error:function(){
                                    alert("Error occured. Please, try again");
                                }}); 
                        }
                    });
                    
                    
                    console.log("renderModifyPage stores view rendered " + companyID + "" + groupID + " " + storeID);
                },
                error:function() {
                    alert("Error occured. Please, try again");
                }
             });
	    }
	});
terminalsView =
    Backbone.View.extend(
	{
	    initialize : function() {
		var view = this;
		
		_.bindAll(view, 'renderManagementPage', 'renderModifyPage');
		CompanyManagementRouter.bind('route:terminalsManager', function(companyID, groupID, storeID) {
						 console.log('terminalsView:route:terminalsManager');
						 view.model = Companies.getModelById(companyID);
						 view.model.bind('add:terminal', function() {
								     view.renderManagementPage(companyID, groupID, storeID);
								 });
						 view.el = _.first($("#list-things"));
						 view.renderManagementPage(companyID, groupID, storeID);
					     });
		CompanyManagementRouter.bind('route:modifyTerminal', function(companyID, groupID, storeID, terminalID) {
						 var company = Companies.getModelById(companyID);
						 view.model = company;
						 company.bind('change', function() {
								  view.renderModifyPage(companyID, groupID, storeID, terminalID);
							      });
						 console.log('terminalsView:route:modifyTerminals' + " " + companyID + " " + groupID);
						 view.renderModifyPage(companyID, groupID, storeID, terminalID);
					     });
	    },
	    renderManagementPage : function(companyID, groupID, storeID) {
		var view = this;
		var forTMP = {
		    list : _.map(view.model.getTerminals(groupID, storeID), function(terminal) {
				     var clonedTerminal = _.clone(terminal);
				     var date = clonedTerminal.creationdate;
				     _.extend(clonedTerminal, {
						  creationdate : jodaDatePartFormatter(date)
					      });
				     var quickViewArgs = {
					 template : "terminalForm_TMP",
					 company_id : companyID,
					 group_id : groupID,
					 store_id : storeID,
					 terminal_id : terminal.terminal_id
				     };
				     return _.extend(clonedTerminal, quickViewArgs);
				 })
		};
		var html = ich.terminalsTabel_TMP(forTMP);
		$(view.el).html(html);
		console.log("renderManagementPage terminals view rendered");
		return view;
	    },
	    renderModifyPage : function(companyID, groupID, storeID, terminalID) {
		var view = this;
		var company = Companies.getModelById(companyID);
		var terminalToEdit = company.getTerminal(groupID, storeID, terminalID);
		var html = ich.modify_terminal_page_TMP(_.extend({
								     terminal : terminalToEdit
								 }, breadCrumb(companyID, groupID, storeID, terminalID), {
								     terminal_id : terminalID,
								     store_id : storeID,
								     group_id : groupID,
								     company_id : companyID
								 }));
		$("#main").html(html);
		$('#form').find('input').attr("disabled", true);
		$("#dialog-hook").html(ich.terminalInputDialog_TMP({
								       title : "Edit the Terminal",
								       //terminal : terminalToEdit
								       companyCode:terminalToEdit.companyCode,
                                       storeCode:terminalToEdit.storeCode
								   }));
		TerminalModifyDialog("edit-thing", editTerminal(companyID, groupID, storeID, terminalID));
		console.log("renderModifyPage terminals view rendered");
		return view;
	    }
	});


var location_codes_view = 
    Backbone.View.extend({
        initialize : function() {
            var view = this;
            $.couch.db("locations_rt7").allDocs({
                success:function(data){
                    console.log(data);
                    Locations = _.pluck(data.rows,"doc");
                    view.locations = Locations;
                },
                error:function() {
                    alert("Fail to load Locations. Please, try again.");
                },
                include_docs:true
            });
            
        },
        _reset : function(form,terminal) {
            var view = this;
            view.form = form;
            view.countryDrop = form.find("#countryCode");
            view.provinceDrop = form.find("#provinceCode");
            view.cityDrop = form.find("#cityCode");
            view.areaDrop = form.find("#areaCode");
            view.empty_all();
            view.load_countries();
            if(_.isNotEmpty(terminal)) {
                var terminal_label = form.find("#terminal-id");
                var storeCode = form.find("#storeCode");
                var companyCode = form.find("#companyCode");
                var postalCode = form.find("#postalCode");
                
                terminal_label.val(terminal.terminal_label);
                storeCode.val(terminal.storeCode);
                companyCode.val(terminal.companyCode);
                postalCode.val(terminal.postalCode);
                view.countryDrop.val(terminal.countryCode).change();
                view.provinceDrop.val(terminal.provinceCode).change();
                view.cityDrop.val(terminal.cityCode).change();
                view.areaDrop.val(terminal.areaCode).change();
            }
        },
        empty_countries:function() {
            var view = this;
            $('option', view.countryDrop).remove();
        },
        empty_provinces:function() {
            var view = this;
            $('option', view.provinceDrop).remove();
        },
        empty_cities:function() {
            var view = this;
            $('option', view.cityDrop).remove();
        },
        empty_area:function() {
            var view = this;
            $('option', view.areaDrop).remove();
        },
        empty_all:function() {
            var view = this;
            view.empty_countries();
            view.empty_provinces();
            view.empty_cities();
            view.empty_area();
        },
        load_countries:function() {
            var view = this;
            view.empty_all();
            view.countryDrop.append('<option value="">' + ' ' + '</option>');
            view.countryDrop.append('<option value="US">' + 'US' + '</option>');
            view.countryDrop.append('<option value="Canada">' + 'Canada' + '</option>');
            view.countryDrop
                .change(function(event){
                    view.empty_provinces();
                    view.empty_cities();                    
                    view.empty_area();
                    var country = $(this).val();
                    view.load_provinces(country);
                });
        },
        load_provinces:function(country) {
            var view = this;
            var selectedLocations = 
                _.filter(view.locations,function(item){
                    return item.country_code == country;  
                });
            var listProvinces = _(selectedLocations).chain()
                                    .pluck("province_code")
                                    .uniq()
                                    .sortBy(function(name){return name;})
                                    .value();
                                    
            view.provinceDrop.append('<option value="">' + ' ' + '</option>');
            _.each(listProvinces,function(item){
                view.provinceDrop.append('<option value=\"'+item.replace(/ /g,'\ ')+'\"">' + item + '</option>');
            });

            view.provinceDrop
                .change(function(event){
                    view.empty_cities();                    
                    view.empty_area();
                    var province = $(this).val();
                    view.load_cities(country, province);
                });
        },
        load_cities:function(country, province) {
            var view = this;
            var selectedLocations = 
                _.filter(view.locations,function(item){
                    return item.country_code == country && item.province_code==province;  
                });
            var listCities = _(selectedLocations).chain()
                                    .pluck("city_code")
                                    .uniq()
                                    .sortBy(function(name){return name;})
                                    .value();
            view.cityDrop.append('<option value="">' + ' ' + '</option>');
            _.each(listCities,function(item){
                view.cityDrop.append('<option value=\"'+item.replace(/ /g,'\ ')+'\">' + item + '</option>');
            });
            view.cityDrop
                .change(function(event){
                    view.empty_area();
                    var city = $(this).val();
                    view.load_area(country, province, city);
                });
        },
        load_area:function(country,province,city) {
            var view = this;
            var selectedLocations = 
                _.filter(view.locations,function(item){
                    return item.country_code == country && item.province_code==province && item.city_code==city;  
                });
            var listArea = _(selectedLocations).chain()
                                    .pluck("area_code")
                                    .uniq()
                                    .sortBy(function(name){return name;})
                                    .value();
            view.areaDrop.append('<option value="">' + ' ' + '</option>');
            _.each(listArea,function(item){
                view.areaDrop.append('<option value='+item+'>' + item + '</option>');
            });
        }
    });
