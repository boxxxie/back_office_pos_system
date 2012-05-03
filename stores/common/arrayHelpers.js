isArray =  function(obj) {
    return toString.call(obj) === '[object Array]';
};

var flatten = function(arr) {
    return arr.reduce(function(memo, value) {
			  if (isArray(value)) {
			      return memo.concat(flatten(value));
			  }
			  else {
			      memo[memo.length] = value;
			      return memo;
			  }
		      }, []);
};

Array.prototype.flatten = function(){
    return flatten(this);  
};
Array.prototype.contains = function(item){
    return (this.indexOf(item) != -1);
};

module.exports = {
    prototype : Array.prototype
};