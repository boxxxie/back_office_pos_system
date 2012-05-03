function sortStores(stores){
    return _.sortBy(stores, function(store){
			var storeNumberMatch = store.number.match(/\d+/);
			if(storeNumberMatch){
			    return Number(_.first(storeNumberMatch));
			}
			return 0;
		    });
};
function randInt_maker(length){
    return function(){
	return parseInt(Math.random()*Math.pow(10,length))+"";
    };
}
function validateUserName(user,itemWithSameUserID,previous,id_key){
    var results = [];
    if(_.isEmpty(user)){
	results = results.concat({fieldname:"user", isInvalid:true});
    }
    else if(!checkRegexp(user,/^\w{1,8}$/)){
	results = results.concat({fieldname:"user", isInvalid:true, errMsg:"The Master User ID length should be 1~8 characters"});
    }
    return results;
};
function validateItemName(itemName,itemWithSameName,addingNewItem,previous,id_key,fieldname,errMsg){
    if(_.isEmpty(itemName)){
	return {fieldname:fieldname, isInvalid:true};
    }
    else if((itemWithSameName && addingNewItem) ||
	    (itemWithSameName && !previous) ||
	    itemWithSameName && itemWithSameName[id_key].toLowerCase() != previous[id_key].toLowerCase()) {
	return {fieldname:fieldname, isInvalid:true, errMsg:errMsg};
    }
    return [];
};
function validatePassword(password){
    var results = [];
    if(_.isEmpty(password)){
	results = results.concat({fieldname:"password", isInvalid:true});
    }
    if(!checkRegexp(password,/^\w{1,8}$/)){
	results = results.concat({fieldname:"password", isInvalid:true, errMsg:"The Master User Password length should be 1~8 characters"});
    }
    return results;
};

var Company = couchDoc.extend(	
    {defaults: function() {
	 return {
	     companyName:"unknown",
	     hierarchy:{groups:[]}
	 };
     },
     addGroup: function(group){
	 var oldHierarchy = this.get('hierarchy');
	 var groups = oldHierarchy.groups;
	 groups || (groups = []);
	 var newGroup = _.extend(group,{group_id:guidGenerator()});
	 var newGroups = groups.concat(newGroup);
	 var newHierarchy = {groups : newGroups};
	 this.set({hierarchy:newHierarchy});
	 this.save();
	 this.trigger("add:group"); //triggers go last
     return newGroup;
     },
     editGroup:function(group,groupID){
	 var groupToMod = this.getGroup(groupID);
	 _.extend(groupToMod,group);
	 this.save();
	 return groupToMod;
     },
     validateGroup : function (newGroup,previous) {
	 function userExists(groups,user){
	     return _.find(groups,function(group){return group.user==user;});
	 };
	 function groupNameExists(groups,groupName){
	     return _.find(groups,function(group){return group.groupName==groupName;});
	 };
	 var results = [];
	 var groups = this.get('hierarchy').groups;
    
	 var user = newGroup.user;
	 var password = newGroup.password;
	 var groupName = newGroup.groupName;
	 var addingNewGroup = newGroup.isCreate;
	 var groupWithSameName = groupNameExists(groups,groupName);
	 var groupWithSameUserID = userExists(groups,user);
	 
	 //verify user ID
	 results = results.concat(
	     validateUserName(user,groupWithSameUserID,previous,'group_id'));

	 //verify password
	 results = results.concat(
	     validatePassword(password));
	 
	 //validate group name
	 results = results.concat(
	     validateItemName(groupName,groupWithSameName,addingNewGroup,previous,'group_id','group-name',"A Group with the same name in this Company already exists"));
	 
	 return results;
     },
     deleteGroup:function(groupID) {
     	 var groupToDel = this.getGroup(groupID);
     	 var stores = this.getStores(groupID);
     	 if((typeof stores === "undefined") || stores.length==0) {
     	     var oldHierarchy = this.get('hierarchy');
	     var groups = oldHierarchy.groups;
	     var groupToDel = _.find(groups, function(group) {return group.group_id==groupID;});
	     var newGroups = _.reject(groups, function(group) {return group.group_id==groupID;});
	     var newHierarchy = {groups : newGroups};
	     this.set({hierarchy:newHierarchy});
	     this.save();
	     this.trigger("delete:group"); //triggers go last
	     console.log("delete completed");
	     return groupToDel;
     	 } else {
     	     alert("Can't delete group, group has store(s)");
     	 }
     },
     
     addStore: function(groupID,storeToAdd){
	 var groupToAddTo = this.getGroup(groupID);
	 var stores = groupToAddTo.stores;
	 stores || (stores = []);
	 //this is supposed to check if we are adding a dup store number to this group of stores
	 if(!_(stores).chain().pluck('number').contains(storeToAdd.number).value()) {
	     var newStore = _.extend(storeToAdd,{store_id:guidGenerator()});
	     var newStores = stores.concat(newStore);
	     groupToAddTo.stores = sortStores(newStores);
	     this.save();
	     this.trigger("add:store"); //triggers go last
	     return newStore;
	 } else {
	     alert("The store you tried to add had the same number as one already in this group, please choose a different store number");
	 }
     },
     editStore:function(groupID,storeID,store){
	 var groupToAddTo = this.getGroup(groupID);
	 var storeToMod = this.getStore(groupID,storeID);
	 _.extend(storeToMod,store);
	 groupToAddTo.stores = sortStores(groupToAddTo.stores);
	 this.save();
	 return storeToMod;
     },
     validateStore : function (newStore,previous,stores) {
	 function userExists(stores,user){
	     return _.find(stores,function(store){return store.user==user;});
	 };
	 function storeNameExists(stores,storeName){
	     return _.find(stores,function(store){return store.storeName==storeName;});
	 };
	 function storeNumberExists(stores,storeNumber){
	     return _.find(stores,function(store){return store.number==storeNumber;});
	 };
	 var results = [];
    
	 var user = newStore.user;
	 var password = newStore.password;
	 var storeName = newStore.storeName;
	 var storeNumber = newStore.number;
	 var addingNewStore = newStore.isCreate;
	 var storeWithSameName = storeNameExists(stores,storeName);
	 var storeWithSameNumber = storeNumberExists(stores,storeNumber);
	 var storeWithSameUserID = userExists(stores,user);
	 
	 //verify user ID
	 results = results.concat(
	     validateUserName(user,storeWithSameUserID,previous,'store_id'));

	 //verify password
	 results = results.concat(
	     validatePassword(password));
	 
	 //validate store name
	 results = results.concat(
	     validateItemName(storeName,storeWithSameName,addingNewStore,previous,'store_id','store-name',"A Store with the same name in this Group already exists"));

	 //validate store number
	 results = results.concat(
	     validateItemName(storeNumber,storeWithSameNumber,addingNewStore,previous,'number','store-num',"A Store with the same number in this Group already exists"));
	 
	 return results;
     },
     deleteStore:function(groupID,storeID) {
     	 var terminals = this.getTerminals(groupID,storeID);
     	 if((typeof terminals === "undefined") || terminals.length==0) {
     	     var groupToDelTo = this.getGroup(groupID);
	     //var stores = this.getStores(groupID);
	     var delToStore = _.find(groupToDelTo.stores, function(store) {return store.store_id==storeID;});
	     var newStores = _.reject(groupToDelTo.stores, function(store) {return store.store_id==storeID;});
	     groupToDelTo.stores = newStores;
	     this.save();
	     this.trigger("delete:store"); //triggers go last
	     console.log("delete completed");
	     return delToStore;
     	 } else {
     	     alert("Can't delete store, store has terminal(s)");
     	 }
     },
     
     addTerminal: function(groupID,storeID,terminalToAdd){
	 var receipt_id_maker = randInt_maker(10);
	 var storeToAddTo = this.getStore(groupID,storeID);
	 var storeTerminals = storeToAddTo.terminals;
	 storeTerminals || (storeTerminals = []);
	 
	 //verify if terminal has the same label as another
	 if(_(storeTerminals).chain().pluck('terminal_label').contains(terminalToAdd.terminal_label).value()) {
	     alert("The terminal you tried to add had the same ID as one already in this store, please choose a different ID");
	     return;
	 }

	 var newTerminals = storeTerminals.concat(_.extend(terminalToAdd,{terminal_id:guidGenerator(),receipt_id:receipt_id_maker()}));
	 storeToAddTo.terminals = newTerminals;
	 this.save();
	 this.trigger("add:terminal"); //triggers go last
     },
     editTerminal:function(groupID,storeID,terminalID,terminal){
	 var terminalToMod = this.getTerminal(groupID,storeID,terminalID);
	 _.extend(terminalToMod,terminal);
	 this.save();
	 //TODO : update terminals_rt7
	 newLocation = _.selectKeys(terminal,"countryCode","provinceCode","cityCode","postalCode","areaCode");
	 $.couch.db("terminals_rt7").view("app/campaignFilterQuery",{
	     success:function(data){
	         //console.log(data);
	         var terminalDoc = (_.first(data.rows)).doc;
	         terminalDoc.location = newLocation;
	         $.couch.db("terminals_rt7").saveDoc(terminalDoc,{
	             success:function(data){
	                 alert("Success Edit Terminal");
	             },
	             error:function(status){
	                 //console.log(status);
	                 alert(status);
	             }
	         });
	     },
	     error:function(){
	         alert("Error Occured. Please, try again.");
	     },
	     key:terminalID,
	     include_docs:true
	 });
	 
     },
     validateTerminal : function (newTerminal,previous,terminals) {
	 function terminalIDExists(terminals,terminalName){
	     return _.find(terminals,function(terminal){return terminal.terminal_label == terminalName;});
	 };
	 var results = [];
	 var terminalID = newTerminal.terminal_label;
	 var addingNewTerminal = newTerminal.isCreate;
	 var terminalWithSameID = terminalIDExists(terminals,terminalID);
	 	 
	 //validate terminal label
	 results = results.concat(
	     validateItemName(terminalID,terminalWithSameID,addingNewTerminal,previous,'terminal_label','terminal-id',"A Terminal with the same ID in this Store already exists"));
	 return results;
     },
     deleteTerminal:function(groupID,storeID,terminalID){
     	 var terminals = this.getTerminals(groupID,storeID);
     	 if((typeof terminals === "undefined") || terminals.length==0) {
	     var stores = this.getStores(gorupID);
	     var newStores = _.reject(stores, function(store) {return store.store_id==storeID;});
	     stores = newStores;
	     this.save();
	     console.log("delete completed");
     	 } else {
     	     alert("Can't delete store, store has terminal(s)");
     	 }
     },
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
     getTerminals:function(groupID,storeID){
	 var foundStore = this.getStore(groupID,storeID);
	 return foundStore.terminals;
     },
     getTerminal:function(groupID,storeID,terminalID){
	 var terminals = this.getTerminals(groupID,storeID);
	 return _.find(terminals,function(terminal){return terminal.terminal_id == terminalID;});	 
     },
     companyStats:function(groupID,storeID){
	 var groups = this.get('hierarchy').groups;
	 if(groupID){
	     groups = _.filter(groups,function(group){return group.group_id == groupID;}); //using filter instead of find because i only want to deal with arrays
	 }
	 var stores = _(groups).chain().map(function(group){return group.stores;}).flatten().compact().value();
	 if(storeID){
	     stores = _.filter(stores,function(store){return store.store_id == storeID;}); //using filter instead of find because i only want to deal with arrays
	 }
	 var terminals = _(stores).chain().map(function(store){return store.terminals;}).flatten().compact().value();
	 return {group_num:_.size(groups),
		 store_num:_.size(stores),
		 terminal_num:_.size(terminals)
		};	 
     }
    });
