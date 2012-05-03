var couchapp = require('couchapp'),
path = require('path');


ddoc = { _id:'_design/app'};
ddoc.filters = {};
ddoc.views = {};
ddoc.views.byEndDate={
    map:function(doc){
	var campaignEndDate = new Date(doc.time.end);
	Date.prototype.toArray = function(){return [this.getFullYear(),(this.getMonth()+1),this.getDate()];};
	emit(campaignEndDate.toArray(),doc);
    }
};
ddoc.views.dates={
    map:function(doc) {
	/* list campaigns bye day they are playing [yyyy,mm,dd]
	 * each campaign will most likely run for multiple days
	 * output each day.
	 *
	 * inclusive start
	 * inclusive end
	 * */

	require("views/lib/date-utils");
	Date.prototype.toArray = function(){return [this.getFullYear(),(this.getMonth()+1),this.getDate()];};
	var _ = require("views/lib/underscore");

	var start = new Date(doc.time.start);
	var end = new Date(doc.time.end);
	var outputDate = (new Date(start)).addDays(1);
	var days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

	function dayStrToNum(day){
	    return days.indexOf(day);
	};

	function getDaysOfWeekForCampaign(){
	    if(doc.all_days){
		return days.map(dayStrToNum);
	    }
	    else if(doc.days_and_hours){
		return _(doc.days_and_hours)
		    .chain()
		    .pluck('day')
		    .map(dayStrToNum).value();
	    }
	    else{
		return [];
	    }
	};
	var daysOfWeekToRunOn = getDaysOfWeekForCampaign();

	function dayOfWeekCheck(date){
	    return _.contains(daysOfWeekToRunOn,date.getDay());
	};

	emit(start.toArray() , doc._id);
	while (outputDate.between(start,end)) {
	    if(dayOfWeekCheck(outputDate)){
  		emit(outputDate.toArray(), doc._id);
	    }
	    outputDate.addDays(1);
	}
    }
};


ddoc.views.CampaignName = {
    map:function(doc) {
	emit(doc.name, doc);
    }
};

ddoc.views.advertisers = {
    map:function(doc) {
	emit(doc.advertiser,1);
    },reduce:"_sum"
};
ddoc.views.salesPeople = {
    map:function(doc) {
	emit(doc.salesperson,1);
    },reduce:"_sum"
};

ddoc.filters.forLocation = function(doc, req) {
    var _ = require("views/lib/underscore");
    require("views/lib/underscore_extended");
    
/*
    function contains(array, item){return (array.indexOf(item) != -1);};
    function isArray(obj) {return toString.call(obj) === '[object Array]';};
    function isEmpty(array){return (array.length != 0);};    
    Date.compareTo = function (date1, date2) {
        if (date1.valueOf() < date2.valueOf()) {
            return -1;
        } else if (date1.valueOf() > date2.valueOf()) {
            return 1;
        }
        return 0;
    };
    Date.prototype.isBefore = function (date){
        date = date ? date : new Date();
        return (Date.compareTo(this,date) < 0);
    };
  */  
    //log("campaign filter here, log!!!");
    
    var locations_in_doc = doc.locations;
    var locations_in_query = req.query;
    log("doc");
    log(doc);
    log("locs in doc");
    log(locations_in_doc);
    log("locs in query");
    log(locations_in_query);
    
    
    var results = _.some(locations_in_doc, function(loc){
        if(loc.all_terminals) {
            log("all_terminals");            
            return true;
        } else {
            var keys = _.keys(loc);
            var selected_obj_in_query = _.selectKeys(locations_in_query, keys);
            
            log("check!");
            log("loc");
            log(loc);
            log("selected key obj");
            log(selected_obj_in_query);
            log("is Equal?");
            log(_.isEqual(loc,selected_obj_in_query))
            if(_.isEqual(loc,selected_obj_in_query)){
                log("match!");
                return true;
            } else {
                return false;
            }
        }
    });
    //log(req.query);
    //log("not match!");
    log("result!");
    log(results);
    return results;
    //return true;

};

ddoc.views.lib = couchapp.loadFiles(path.join(__dirname, 'common'));

module.exports = ddoc;