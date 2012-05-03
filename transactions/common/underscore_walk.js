var _ = require("./underscore");

_.mixin({
	    walk_demo:function(node){
		console.log(node);
		return node;
	    },

	    //the transformer needs to take in 1 args
	    //it needs to return the transformed obj. noop = return first arg;
	    //refer to tests
	    walk:function(o,pretran,posttran){
		//transforms data in a js object via a walk function
		o = pretran(_.clone(o));
		var ret = o;
		if(_.isObject(o)){
		    for(var prop in o){
			if(o.hasOwnProperty(prop)){
			    var val = o[prop];
			    var transformedVal = posttran(_.walk(val,pretran,posttran));
			    var walked = {};
			    walked[prop] = transformedVal;
			    _.extend(ret,walked);
			}
		    } 
		}  
		return ret;
	    },
	    walk_pre:function(o,trans){
		return _.walk(o,trans,_.identity);
	    },
	    walk_pre_f:function(trans){
		return function(o){
		    return _.walk_pre(o,trans,_.identity);
		};
	    },
	    walk_pre_demo:function(node){
		_.walk_pre(node,_.walk_demo);
	    },
	    walk_post:function(o,trans){
		return _.walk(o,_.identity,trans);
	    },
	    walk_post_f:function(trans){
		return function (o){
		    return _.walk_post(o,trans);
		};
	    },
	    walk_post_demo:function(node){
		_.walk_post(node,_.walk_demo);
	    }
	});