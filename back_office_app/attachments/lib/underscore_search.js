_.mixin({
	    /* 
	     * like _.any, but will recursively search the array/object 
	     * _.search(1)([[{a:{b:1}}]]) -> true
	     */
	    search:function(compareFn){
		return function(searchFor,searchIn){
		    if(compareFn(searchFor,searchIn)){
			return true;
		    }else{
			return _.any(searchIn,
				     function(val){
					 if(compareFn(searchFor,val)){
					     return true;
					 }
					 else if (_.isObject(val) || _.isArray(val)){
					     return _.search(compareFn)(searchFor,val);
					 }
					 else{
					     return false;   
					 }
				     });
		    }
		};
	    }});
_.mixin({
	    search_Eq:_.search(_.isEqual),
	    search_Str:_.search(function(str,o){
                    if(_.isString(o)){
					return str.toLowerCase() == o.toLowerCase();
				    }
				    return false;}),
	    search_SubStr:_.search(function(str,o){
				       if(_.isString(o)){
					   return (o.toLowerCase().indexOf(str.toLowerCase()) != -1);
				       }
				       return false;}),
        search_SubStr_keys:_.search(function(str,o){
                       var selectedKeys = _.rest(2,arguments);
                       if(_.isString(o)){
                       return (o.toLowerCase().indexOf(str.toLowerCase()) != -1);
                       }
                       return false;}),
	    /*
	     * _.filterSearch([{a:{b:1}},{a:{b:2}}],1) -> [{a:{b:1}}]
	     */
	    filterSearch_Eq:function(list,searchObj){
		return _.filter(list,function(item){return _.search_Eq(searchObj,item);});
	    },
	    filterSearch_Str:function(list,searchStr){
		//_.filterSearchStr([{a:{b:'i'}},{a:{b:'r'}}],'I') -> [{a:{b:'i'}}]
		//todo, string stuff before running filter to make it run faster
		return _.filter(list,function(item){return _.search_Str(searchStr,item);});
	    },
	    filterSearch_SubStr:function(list,searchStr){
		//_.filterSearchStr([{a:{b:'ik'}},{a:{b:'r'}}],'I') -> [{a:{b:'ik'}}]
		//todo, string stuff before running filter to make it run faster
		return _.filter(list,function(item){return _.search_SubStr(searchStr,item);});
	    },
	    mapSearch_SubStr:function(list,searchStr){
        //_.filterSearchStr([{a:{b:'ik'}},{a:{b:'r'}}],'I') -> [{a:{b:'ik'}}]
        //todo, string stuff before running filter to make it run faster
        return _.map(list,function(item){return {found:_.search_SubStr(searchStr,item),item:item};});
        },
	    filterSearch_SubStr_SelectedKeys:function(list,searchStr){
	        var selectedKeys = _.rest(arguments,2);
	        return _.chain(list)
	          .mapSelectKeys(selectedKeys)
	          .mapSearch_SubStr(searchStr)
	          .filter(function(item){ return item.found;})
	          .pluck("item")
	          .value();
	    }
	});