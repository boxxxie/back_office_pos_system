
//relies on underscore lib
var _ = require("views/lib/underscore");

function walkDemo(o){
    console.log(o);
    if(typeof val == 'object'){
	for(var prop in o){
	    if(o.hasOwnProperty(prop)){
		var val = o[prop];
		walkDemo(val);
	    }
	}  
    } 
};

//the transformer needs to take in 1 args
//it needs to return the transformed obj. noop = return first arg;
function walk(o,transformer){
    //transforms data in a js object via a walk function
    o = transformer(o);
    var ret = _.clone(o);
    if(typeof o == 'object'){
	for(var prop in o){
	    if(o.hasOwnProperty(prop)){
		var val = o[prop];
		var transformedVal = walk(val,transformer);
		var walked = {};
		walked[prop] = transformedVal;
		_.extend(ret,walked);
	    }
	} 
    }  
    return ret;
};

module.exports = {
    walk : walk,
    walkDemo :walkDemo
};