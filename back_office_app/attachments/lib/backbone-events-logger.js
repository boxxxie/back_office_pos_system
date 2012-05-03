    //trying to display all events triggered use this before other backbone code is used (put in own file)
    Backbone.Events.trigger = 
	(function(orig) { 
	     return function() { 
		 console.log('triggered: ',this,arguments); 
		 return orig.apply(this, arguments); 
	     }; 
	 })(Backbone.Events.trigger);