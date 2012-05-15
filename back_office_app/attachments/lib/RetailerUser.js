
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
    function getRolesForType(str_entity_type,userJSON) {
        var roles = [];
        var isCreate = _.isUndefined(userJSON);
        if(str_entity_type == "company") {
            roles = roles.concat({"var":'company',label:"Company Manager",enabled:true,value:isCreate?true:userJSON.company});
            roles = roles.concat({"var":'group',label:"Group Manager",enabled:true,value:isCreate?true:userJSON.group});
            roles = roles.concat({"var":'store',label:"Store Manager",enabled:true,value:isCreate?true:userJSON.store});
        } else if(str_entity_type == "group") {
            roles = roles.concat({"var":'group',label:"Group Manager",enabled:true,value:isCreate?true:userJSON.group});
            roles = roles.concat({"var":'store',label:"Store Manager",enabled:true,value:isCreate?true:userJSON.store});
        } else if(str_entity_type == "group") {
            roles = roles.concat({"var":'store',label:"Store Manager",enabled:true,value:isCreate?true:userJSON.store});
            roles = roles.concat({"var":'pos_admin',label:"POS Admin",enabled:true,value:isCreate?true:userJSON.pos_admin});
            roles = roles.concat({"var":'pos_sales',label:"POS User",enabled:true,value:isCreate?true:userJSON.pos_sales});
        } else {
            
        }
        return roles;
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
            user_name:{"var":'userName',label:"User Name",enabled:isCreate,value:isCreate?"":userJSON.userName},
            password:{"var":'password',label:"Password",enabled:isCreate,value:isCreate?"":userJSON.exposed_password},
            "roles": rolesForType,
            is_enabled:{"var":"enabled",label:"Enabled",enabled:true,value:isCreate?true:userJSON.enabled},
            contact:[
            {"var":"firstname",label:"First Name", enabled:true,value:isCreate?"":userJSON.firstname},
            {"var":"lastname",label:"Last Name", enabled:true,value:isCreate?"":userJSON.lastname},
            {"var":"website",label:"WebSite", enabled:true,value:isCreate?"":userJSON.website},
            {"var":"email", label:"Email",enabled:true,value:isCreate?"":userJSON.email},
            {"var":"phone", label:"Phone Number",enabled:true,value:isCreate?"":userJSON.phone}
            ],
            address:[
            {"var":"street0",label:"Street 0", enabled:true,value:isCreate?"":userJSON.street0},
            {"var":"street1", label:"Street 1",enabled:true,value:isCreate?"":userJSON.street1},
            {"var":"city", label:"City",enabled:true,value:isCreate?"":userJSON.city},
            {"var":"country", label:"Country",enabled:true,value:isCreate?"":userJSON.country},
            {"var":"province", label:"Province",enabled:true,value:isCreate?"":userJSON.province},
            {"var":"postalcode", label:"Postal Code",enabled:true,value:isCreate?"":userJSON.postalcode}
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