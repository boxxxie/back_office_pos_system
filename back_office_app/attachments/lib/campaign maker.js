var testData = {
    _id: "AllCanadaAllTerminal",
    _rev: "3-ed84300839289e02a0084409f1f6df06",
    name: "AllCanadaAllTerminal",
    time: {
	end: "2011-12-31T00:00:00.000-05:00",
	start: "2011-10-07T00:00:00.000-04:00"
    },
    description: "test description",
    advertiser: "test advertiser",
    salesperson: "test sales person",
    presentation_type: "captive",
    all_times: false,
    all_days: false,
    locations : [
	{country: 'Canada'} 
    ],
    days_and_hours: [
	{
            time: {
		end: "2011-10-07T17:02:00.000-04:00",
		start: "2011-10-07T16:10:00.000-04:00"
            },
            day: "FRI"
	},
	{
            time: {
		end: "2011-10-07T17:02:00.000-04:00",
		start: "2011-10-07T16:10:00.000-04:00"
            },
            day: "THU"
	},
	{
            time: {
		end: "2011-10-07T13:03:00.000-04:00",
		start: "2011-10-07T16:10:00.000-04:00"
            },
            day: "THU"
	}
    ],
    for_terminals_created_before: new Date(),

    images: [
	{
            file: "C:\\Users\\4\\Documents\\01\\CANADA.jpg"
	},
	{
            file: "C:\\Users\\4\\Documents\\02\\CANADA.jpg"
	}
    ],
    _attachments: {
	"C:\\Users\\4\\Documents\\02\\CANADA.jpg": {
            content_type: "image/jpeg",
            revpos: 3,
            digest: "md5-MesMX0p/a4Qa8Ltv7Dya7Q==",
            length: 105361,
            stub: true
	},
	"C:\\Users\\4\\Documents\\01\\CANADA.jpg": {
            content_type: "image/jpeg",
            revpos: 2,
            digest: "md5-UiP6U6RJISdaRc4N5Sfh1Q==",
            length: 125957,
            stub: true
	}
    }
};

function no_op(){};
function extractFormData(){
    return form2object("testForm", '.', true, nodeProcessor);}
function basicAutoComplete(view,db,input){
    groupQuery(view,db,1)
    (function(data){
	 var keys = extractKeys(data);
	 var DOM_element = "#"+input;
	 $(DOM_element).autocomplete({source:keys,
				      delay:0,
				      change:function(){
					  $(DOM_element).trigger('change');
				      },
				      select:function(e,ui){
					  $(DOM_element).val(ui.item.value);
					  $(DOM_element).trigger('change');
				      }
				     });
     });
};
function addButtonSetup(){
    $('#btnAdd')
	.click(function () {
		   var data = {index : $('#days_and_hours_list').children().length};

		   var html = ich.daySelection_TMP(data);
		   $(html).find(".startTime").first()
		       .timepicker({
				       timeOnly: true,
				       showButtonPanel: false
				   });
		   $(html).find(".endTime").first()
		       .timepicker({
				       timeOnly: true,
				       showButtonPanel: false
				   });
		   $(html).find('select').first()
		       .multiselect({
					height:210,
					minWidth:250,
					selectedList: 6, // 0-based index,
					selectedText: function(numChecked, numTotal, checkedItems){
					    if(numChecked == numTotal){
						return "Every Day";
					    }
					    return checkedItems
						.reduce(function(sum,cur){
							    if(sum == ""){
								return cur.title;    
							    }
							    return sum + "," + cur.title;
							},"");
					}
				    });
		   $(html).find('.checkAlltimes').first()
		       .click(function(){
				  if($(this).prop('checked')){
				      var times = $(this).parents('li').find('.startTime, .endTime');
				      times.filter('.startTime').val('00:01');
				      times.filter('.endTime').val('23:59');
				      times.parent().hide();
				  }
				  else{
				      $(this).parents('li').find('.startTime, .endTime')
					  .each(function(){
						    $(this).parent().show();
						});
				  }
			      });

		   // append it to the list, tada! 
		   //Now go do something more useful with this.
		   $('#days_and_hours_list').append(html);

		   // enable the "remove" button
		   $('#btnDel:first').attr('disabled',false);
	       });		    
};
function deleteButtonSetup(){
    $('#btnDel')
	.click(function() {
		   $('#days_and_hours_list').children().last().remove();
		   
		   // if only one element remains, disable the "remove" button
		   if ($('#days_and_hours_list').children().length == 0)
		       $('#btnDel').attr('disabled',true);
	       });
    $('#btnDel').attr('disabled',true);
};
function transform_campaign_for_form(camp){
    function create_for_terminals_field(camp){
	if(camp.for_terminals_created_before){
	    camp._for_terminals = "current";
	}
	else{camp._for_terminals = "future";}
	return camp;
    }
    function move_all_terminals_field(camp){
	if(!camp.locations){return camp;}
	var locations = camp.locations;
	function detectAllTerminalsObj(obj){return (!_.isUndefined(obj.all_terminals));}
	var all_terminals = _.detect(locations,detectAllTerminalsObj);
	if(all_terminals){
	    camp._all_terminals = all_terminals.all_terminals;
	    camp.locations = _.reject(locations,detectAllTerminalsObj);
	}
	return camp;
    }
    function transform_days_and_hours(camp){
	//holy shit compress duplicate times and concat the days into an array
	var grouped = _(camp.days_and_hours).chain()
	    .groupBy(function(obj){return new Date(obj.time.start).getTime() +
				   ":" +
				   new Date(obj.time.end).getTime();})
	    .value();
	var dateRanges = _.keys(grouped);
	camp.days_and_hours =  _(grouped).chain()
	    .keys()
	    .map(function(dateRange){return _.pluck(grouped[dateRange],'day');})
	    .zip(dateRanges)
	    .map(function(days_time_pair){
		     var days = _.first(days_time_pair);
		     var times = _.last(days_time_pair).split(":").map(Number);
		     var start = new Date(_.first(times));
		     var end = new Date(_.last(times));
		     return {day : days, time: {start :start ,end : end}};
		 })
	    .value();
	return camp;
    }

    function transform_countries(camp){
	camp.countries = _(camp.locations).chain().pluck('country').compact().unique().value();
	return camp;
    }
    var transformations = _.compose(create_for_terminals_field, 
				    move_all_terminals_field,
				    transform_days_and_hours,
				    transform_countries);
    return transformations(camp);
}
function finalSetup(){
    var transformedData = transform_campaign_for_form(testData);
    console.log(transformedData);

    function transformer(obj,$node){
	if(!obj){return obj;}
	var varType = $node.attr('var_type');
	if(varType){
	    switch (varType){
	    case "date":{return new Date(obj);}
	    case "time":{
		var d = new Date(obj);
		var hours = d.getHours();
		var minutes = d.getMinutes();
		if(minutes < 10){minutes = "0" + minutes;}
		return hours + ":" + minutes;}
	    }
	}
	return obj;
    };

    addButtonSetup();
    deleteButtonSetup();

    //add days_and_hours selectors so data can be entered into them from the fetched doc
    _(transformedData.days_and_hours.length).chain().range().each(function(){ $('#btnAdd').trigger('click');});
    
    //$("#for_terminals_created_before").val(new Date()); //for creating new compaigns
    var $formElements = $("#campaignForm").find('[name]');
    console.log($formElements);
    populateForm($formElements,transformedData,'name',transformer);
    console.log("done processing final setup");
};
var regionSelectorSettings = {
    minWidth:700,
    selectedList: 6,
    click: multiselectRefresh,
    checkAll:multiselectRefresh,
    uncheckAll:multiselectRefresh,
    optgroupToggle:multiselectRefresh,
    refresh: multiselectRefresh,
    position: {
	my: 'left bottom',
	at: 'left top'
    },
    selectedText: function(numChecked, numTotal, checkedItems){
	if(numChecked == numTotal){
	    return "ALL";
	}
	return checkedItems
	    .reduce(function(sum,cur){
			if(sum == ""){
			    return cur.title;    
			}
			return sum + "," + cur.title;
		    },"");
    }
};
function multiselectRefresh(trigger,whatisthis){
    console.log("multiselectRefresh");
    switch(trigger.target.id){
    case "countries": {updatedParentChildSelect($("#countries")); break;}
    case "provinces": {updatedParentChildSelect($("#provinces")); break;}
    case "cities": {updatedParentChildSelect($("#cities")); break;}
    }
};
function updatedParentChildSelect(parentNode){
//parent child does not refer to a visible hiarchy it more closely resembles members of a list
// 
//    var parentSelect = "provinces";
//    var childSelect = "cities";
//    var queryPath = ["Canada","Ontario"]; //query path needs to be calculated each time used

   // var parentNode = $("#"+parentSelect);
    var childNode = parentNode.nextAll('select').first();
    var parentSelect = parentNode.attr('id');
    var childSelect = childNode.attr('id');




    //add or remove entries from the povinces select group
    console.log('updated '+ parentSelect);
    var stores_db = db('stores_rt7');
    var reigion_v = appView('country_prov_city_postal_code_short');

    //REMOVE country optgroups from provinces select
    parentNode
	.multiselect('getUnChecked')
	.each(function(){
		  var parentLabel = $(this).val();
		  var childOptGrps = childNode.find('optgroup').filter('[label='+parentLabel+']');
		  if(!_.isEmpty(childOptGrps)){
		      childOptGrps.remove();
		      console.log("removed an option from: " + childSelect);
		      //if something get's unchecked, then it needs to referberate through the entire selection list
		      //this is currently not happening.
		      childNode.multiselect('refresh');
		  }
		});

    //ADD parentLabel/childLabel to child select
    parentNode
	.multiselect('getChecked')
	.filter(function(){
		    //only select countries that aren't already in the provinces optgroups
		    var parentLabel = $(this).val();
		    var childOptGrps = childNode.find('optgroup').filter('[label='+parentLabel+']');
		    return childOptGrps.empty();
		})
	.each(function(){
		  var parentLabel = $(this).val(); 
		  console.log("updating "+childSelect+" for "+ parentSelect + " -> " + parentLabel);
		  function queryPath(startNode, label){
		      var previousNode = startNode.prevAll('select').first();
		      var parentLabel;
		      if(previousNode.length === 0){
			  parentLabel = label;
		      }
		      else{
			  parentLabel = $(startNode).find('[value='+label+']').first().parent().attr('label');
		      }
		      if(previousNode.length === 0){
			  return [parentLabel];
		      }
		      return queryPath(previousNode,parentLabel).concat(label);
		  }
		  function extractOptGrpOptionPairFromMultiSelect(node){
		      var optionLabel = node.val();
		      return optionLabel;
		  }
		  var startingPoint = extractOptGrpOptionPairFromMultiSelect($(this));
		  var query = queryPath(parentNode,startingPoint);
		  peekingQuery(reigion_v,stores_db,query) //FIXME query path wrong
		  (function(data){
		       var keys = extractKeys(data);
		       var groupedByParent = _(keys)
			   .chain()
			   .map(function(item){
				   // var lastPair = (_.size(item) == 2)?item:_.last(item,2);
				    var lastPair = _.last(item,2);
				    var parent = _.first(lastPair);
				    var child = _.last(lastPair);
				    return {parentLabel:parent,childLabel:child};})
			   .groupBy(function(item){ return item.parentLabel; })
			   .value();
		       console.log("find which " +  childSelect + " to add to select");
		       var forTMP = {optGroups: _(groupedByParent)
				     .chain()
				     .keys()
				     .tap(console.log)
				     .map(function(parentLabel){
					      var optGroupLabel = parentLabel;
					      var options = _.map(groupedByParent[parentLabel],
								  function(item){
								      var value = item.childLabel, label = item.childLabel;
								      return {value:value,label:label};});
					      return {label:optGroupLabel,options:options};
					  })
				     .value()
				    };
		       if(!_.isEmpty(forTMP.optGroups)){
			   console.log(forTMP);
			   var optionsToAdd = ich.optionGroup_TMP(forTMP);
			   console.log(optionsToAdd);
			   childNode.append(optionsToAdd);
			   //may want to use _.after here
			   childNode.multiselect('refresh');
		       }
		       console.log("done updating "+ childSelect);
		   });

	      });
};
function countriesSetup(view,db){
    groupQuery(view,db,1)
    (function(data){
	 var TMP_data = {list :_.map(extractKeys(data),function(item){return {value:item,label:item};})};
	 var options = ich.options_TMP(TMP_data);
	 $('#countries').append(options);
	 var select = $('#countries');
	 select.multiselect(
	     _.extend(regionSelectorSettings,{ noneSelectedText:"Countries"}));
	 //FIXME:don't know if this works or not (NOT WORKING)
	 //select.multiselect().bind('refresh',updatedCountries);
	 console.log("done setting up countries");

	 provincesSetup(view,db);	     
     });
};

function provincesSetup(view,db){
    var select = $('#provinces');
    select.multiselect(
	_.extend(regionSelectorSettings,{ noneSelectedText:"Provinces/States"}));
    console.log("done setting up provinces");
    citiesSetup();
};
function citiesSetup(view,db){
    var select = $('#cities');
    select.multiselect(
	_.extend(regionSelectorSettings,{ noneSelectedText:"Cities"}));
    console.log("done setting up cities");
    postalCodeSetup();
};
function postalCodeSetup(view,db){
    //FIXME should be select + input
    var select = $('#postalCodes');
    select.multiselect(
	_.extend(regionSelectorSettings,{ noneSelectedText:"Postal/Zip codes"}));
    console.log("done setting up postalCodes");
    finalSetup();
};

function doc_setup(){
    //FIXME: this doesn't prevent the user from entering a start date that is after the end date (which should not break the campaigns program)
    var stores_db = db('stores_rt7');
    var reigion_v = appView('country_prov_city_postal_code');

    //put a date picker on the start and end date inputs
    $("#startDate, #endDate").datepicker(
	{changeMonth: true,
	 changeYear: true,
	 numberOfMonths: 3});

    //setup logic (chained callbacks)
    countriesSetup(reigion_v,stores_db);//(provincesSetup(reigion_v,stores_db)(function(){console.log("done");}));
    //  (provincesSetup(reigion_v,stores_db)
    //     (finalSetup));
};

