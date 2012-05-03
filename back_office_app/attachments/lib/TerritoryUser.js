var TerritoryUserDoc = UserDoc; 

var TerritoryUserCollection = couchCollection(
    {db:'_users'},
    {model:TerritoryUserDoc,
     findUser : function(userName) {
         return this.find(function(model){return (model.get("userName")).toLowerCase() == userName.toLowerCase();});
     }
    });

function fetchTerritoryUserCollection() {
    return function(callback){
        queryF(cdb.view("app","territory_users"), cdb.db("_users"))
        ({include_docs:true})
        (function(response){
             var user_collection = new TerritoryUserCollection();
             _.reduce(response.rows, function(collection,item){
              return collection.add(item.doc, {silent:true});
                      },user_collection);
             callback(null,user_collection);
         });
    };
};