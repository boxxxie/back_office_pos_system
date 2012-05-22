
var RetailerUserDoc = UserDoc;

var CompanyForUser = couchDoc.extend({db:"companies",
                                      getGroups:function(){
                                          return this.get('hierarchy').groups;
                                      },
                                      getGroup:function(groupID){
                                          return _.find(this.getGroups(),function(group){ return group.group_id == groupID;});
                                      },
                                      getStores:function(groupID){
                                          var foundGroup = this.getGroup(groupID); //_.filter(groups,function(group){ return group.group_id == groupID;});
                                          return foundGroup.stores;
                                      },
                                      getStore:function(groupID,storeID){
                                          var stores = this.getStores(groupID);
                                          return _.find(stores,function(store){return store.store_id == storeID;});
                                      },
                                      editGroup:function(groupID,group){
                                          var groupToMod = this.getGroup(groupID);
                                          _.extend(groupToMod,group);
                                          this.save();
                                          return groupToMod;
                                      },
                                      editStore:function(groupID,storeID,store){
                                          var groupToAddTo = this.getGroup(groupID);
                                          var storeToMod = this.getStore(groupID,storeID);
                                          _.extend(storeToMod,store);
                                          groupToAddTo.stores = sortStoresByNum(groupToAddTo.stores);
                                          this.save();
                                          return storeToMod;
                                      }
                                     });

function sortStoresByNum(stores){
    return _.sortBy(stores, function(store){
                        var storeNumberMatch = store.number.match(/\d+/);
                        if(storeNumberMatch){
                            return Number(_.first(storeNumberMatch));
                        }
                        return 0;
                    });
};

var RetailerUserCollection = couchCollection(
    {db:'_users'},
    {model:RetailerUserDoc,
     findUser : function(userName) {
         return this.find(function(model){return (model.get("userName")).toLowerCase() == userName.toLowerCase();});
     }
    });

function fetchRetailerUserCollection_All(id) {
    return function(callback){
        queryF(cdb.view("app","id_doc"), cdb.db("_users"))
        ({key:id})
        (function(response){
             var user_collection = new RetailerUserCollection();
             _.reduce(response.rows, function(collection,item){
              return collection.add(item.value, {silent:true}); //FIXME: can do collection.reset
                      },user_collection);
             callback(null,user_collection);
         });
    };
};

function isBackOfficeAdminUser(user) {
    var list_name = _.compact([user.companyName, user.groupName, user.storeName]);
    switch(_.size(list_name)) {
        case 1: // company level backoffice user
            return _.contains(user.roles,"company_admin");
            break;
        case 2: // group level backoffice user
            return _.contains(user.roles,"group_admin");
            break;
        case 3: // store level backoffice user
            return _.contains(user.roles,"store_admin");
            break;
    }
    return false;
}



/**************************** NEW USERS STUFF *****************************/
function fetch_users_by_location_id(id) {
    return function(callback){
        queryF(cdb.view("app","lowestlevel_id"), cdb.db("_users"))
        ({key:id,include_docs:true})
        (function(response){
             callback(null,_.chain(response.rows).pluck('doc').map(simple_user_format).value());
         });
    };
};

function fetch_territory_users() {
    return function(callback){
        queryF(cdb.view("app","territory_users"), cdb.db("_users"))
        ({include_docs:true})
        (function(response){
             callback(null,_.chain(response.rows).pluck('doc').map(simple_user_format).value());
         });
    };
};

function generate_general_user_dialog_blueprint(reportData,entity_id,userJSON) {
    function role_helper(default_value){
	return function(name,label,enabled,value){
	    if(_.isArray(name)){
		var index = name[1]; //example : ['password','exposed_password']
		var var_name = name[0];
	    }
	    else{
		var index = name; //assume name is string
		var var_name = name;
	    }
	    if(_.isObject(value) && _.isDefined(value[index])){
		var set_value = value[index];
	    }
	    else{
		var set_value = default_value;
	    }
	    return {"var":var_name,label:label,enabled:enabled,value:set_value};
	}
    }
    var role_helper_true = role_helper(true);
    var role_helper_emptyStr = role_helper('');
    function getRolesForType(entity_type,userJSON) {
	if(entity_type === "company") {
            return [
		role_helper_true('company',"Company Manager",true,userJSON),
		role_helper_true('group',"Group Manager",true,userJSON),
		role_helper_true('store',"Store Manager",true,userJSON)
	    ]
        } else if(entity_type === "group") {
            return [
		role_helper_true('group',"Group Manager",true,userJSON),
		role_helper_true('store',"Store Manager",true,userJSON)
	    ]
        } else if(entity_type === "store") {
            return [
		role_helper_true('store',"Store Manager",true,userJSON),
		role_helper_true('pos_admin',"POS Admin",true,userJSON),
		role_helper_true('pos_sales',"POS User",true,userJSON)
	    ]
        } else {
            return []
        }
    }

    var str_entity_type = (reportData && entity_id)?entity_type_from_id(reportData,entity_id):undefined;
    var entity = (reportData && entity_id)?entity_from_id(reportData,entity_id):undefined;
    var isCreate = _.isUndefined(userJSON);
    var rolesForType = getRolesForType(str_entity_type,userJSON);

    return {
        consts : _.defaults(
            {
		"creationdate": isCreate?((new Date()).toJSON()):userJSON.creationdate,
		"type": "user"
            },
            entity
        ),
        display:
        {
            user_name:role_helper_true('userName',"User Name",isCreate,userJSON),
            password:role_helper_emptyStr(['password','exposed_password'],"Password",isCreate,userJSON),
            "roles": rolesForType,
            is_enabled:role_helper_true("enabled","Enabled",true,userJSON),
            contact:[
		role_helper_emptyStr("firstname","First Name",true,userJSON),
		role_helper_emptyStr("lastname","Last Name",true,userJSON),
		role_helper_emptyStr("website","WebSite",true,userJSON),
		role_helper_emptyStr("email","Email",true,userJSON),
		role_helper_emptyStr("phone","Phone Number",true,userJSON)
            ],
            address:[
		role_helper_emptyStr("street0","Street 0",true,userJSON),
		role_helper_emptyStr("street1","Street 1",true,userJSON),
		role_helper_emptyStr("city","City",true,userJSON),
		role_helper_emptyStr("country","Country",true,userJSON),
		role_helper_emptyStr("province","Province",true,userJSON),
		role_helper_emptyStr("postalcode","Postal Code",true,userJSON)
            ]
        }
    };
}

function generate_retailer_user_dialog_blueprint(reportData,entity_id,userJSON) {
    // create if userJSON exists otherwise edit
    return generate_general_user_dialog_blueprint(reportData,entity_id,userJSON);
}

function generate_territory_user_dialog_blueprint(userJSON) {
    // create if userJSON exists otherwise edit
    var blueprint = generate_general_user_dialog_blueprint(undefined,undefined,userJSON);
    // blueprint will has empty array of roles
    return _.removeKeys(blueprint,"roles");
}