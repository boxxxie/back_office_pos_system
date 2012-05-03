
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

function fetch_users_by_location_id(id) {
    return function(callback){
        queryF(cdb.view("app","lowestlevel_id"), cdb.db("_users"))
        ({key:id,include_docs:true})
        (function(response){
             callback(null,_.chain(response.rows).pluck('doc').map(simple_user_format).value());
         });
    };
};

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
