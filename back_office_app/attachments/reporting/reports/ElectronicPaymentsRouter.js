var menuReportsElectronicPaymentsRouter =
    new (Backbone.Router.extend(
	     {routes: {
	     	  "reports/electronic_payments":"menuReportsCompanyPayments"
	      },
	      menuReportsCompanyPayments:function() {
		  console.log("menuReportsCompanyPayments  ");
	      }
	     }));

var menuReportsElectronicPaymentsView =
    Backbone.View.extend(
	{initialize:function(){
	     var view = this;
	     view.el = $("#main");

	     _.bindAll(view,
		       'renderMenuReportsCompanyPayments');
	     menuReportsElectronicPaymentsRouter
		 .bind('route:menuReportsCompanyPayments',
		       function(){
			   console.log("menuReportsView, route:menuReportsCompanyPayments");
			   view.renderMenuReportsCompanyPayments();
		       });

	 },
	 renderMenuReportsCompanyPayments: function() {

	     var html = ich.electronicPaymentsReports_TMP(autoBreadCrumb());
	     $(this.el).html(html);

	     resetDatePicker();

             resetDropdownBox(ReportData, true, true);

	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderElectronicPaymentsTable();
			});

	     console.log("rendered general report");
	 }
	});

/******************************************** helper functions ************************************/
function renderElectronicPaymentsTable() {
    console.log("renderElectronicPaymentsTable");

    var dropdownGroup = $("#groupsdown");
    var dropdownStore = $("#storesdown");
    var dropdownTerminal = $("#terminalsdown");

    if(!_.isEmpty($("#dateFrom").val()) && !_.isEmpty($("#dateTo").val())) {
	var startDate = new Date($("#dateFrom").val());
	var endDate = new Date($("#dateTo").val());
	var endDateForQuery = new Date($("#dateTo").val());
	endDateForQuery.addDays(1);

	var ids;

	if(dropdownTerminal.val()=="ALL") {
	    ids = _($('option', dropdownTerminal)).chain()
	    	.filter(function(item){ return item.value!=="ALL";})
	    	.map(function(item){
	    		 return {id:item.value, name:item.text};
	    	     })
	    	.value();
	} else {
	    var sd = $("#terminalsdown option:selected");
	    ids =[{id:sd.val(), name:sd.text()}];
	}

	console.log(ids);
	electronicPaymentsReportFetcher(ids,startDate,endDateForQuery)
	(function(err,response){

	     var data_TMP = response.paymentList;
	     var totals = _.applyToValues(response.totals, toFixed(2));

	     data_TMP = processTransactionsTMP(data_TMP);

	     totals =
		 _.applyToValues(totals,function(obj){
		     		     var strObj = obj+"";
				     if(strObj.indexOf(".")>=0) {
					 obj = currency_format(Number(obj));
				     }
				     return obj;
				 },true);

	     var data = _(data_TMP).chain()
		 .map(function(item){
			  if(item.authCode=="refund") {
	                      var propsToChange = _.selectKeys(item,['credit','debit','sales','subTotal','tax1and2','tax3','total']);

			      propsToChange =_(propsToChange).chain()
				  .map(function(val,key){
					   if(val!="0.00") {val = "-"+val;}
					   return [key,val];
				       })
				  .toObject()
				  .value();
			      return _.extend({},item, propsToChange);
			  }
			  return item;
		      })
		 .value();

	     if(_.isEmpty(data_TMP)){
		 var formatted_totals = false;
	     }
	     else{
		 var formatted_totals = _(totals).chain()
		     .map(function(val,key){
			      if( (/_refund/).test(key)) {
	        		  if(val!="0.00") { val = "-"+val; }
	    		      }
			      return [key,val];
			  })
		     .toObject()
		     .value();
	     }

	     var html = ich.electronicPaymentstable_TMP({items:data,totals:formatted_totals});
	     $("#reporttable").html(html);

	     _.each(data_TMP, function(item){
			var item = _.clone(item);

			var dialogtitle=getDialogTitle(ReportData,item);

			$("[id]")
			    .filter(function(){return $(this).attr('id') == item._id;})
			    .each(function(){$(this).button()
				      .click(function(){
						 var btnData = item;
						 btnData.discount=null;
						 //TODO:
						 //btnData.storename = ReportData.store.storeName;
						 //FIXME: use walk,
						 _.applyToValues(ReportData,
								 function(o){
								     if(o.store_id==btnData.store_id){
									 btnData.storename = o.storeName;
								     }
								     return o;
								 }
								 ,true);

						 _.applyToValues(btnData,currency_format,true);

						 var html = ich.generalTransactionQuickViewDialog_TMP(btnData);
						 quickmenuReportsTransactionViewDialog(html, {title:dialogtitle});
					     });
				     });
		    });

	 });
    } else {
   	alert("Input Date");
    }
}

function getDialogTitle(ReportData, item, startDate, endDate) {
    var companyName, groupName, storeName, terminalName;
    if(!_.isEmpty(ReportData.company)){
	companyName = ReportData.company.companyName;
    } else {
    	companyName = ReportData.companyName;
    }
    groupName = item.groupName;
    storeName = item.storeName;
    storeNumber = item.storeNumber;
    terminalName = item.name;

    var title = "".concat("Company : ").concat(companyName);
    if(groupName) title = title.concat(" , Group : ").concat(groupName);
    if(storeName) title = title.concat(" , Store : ").concat(storeName);
    if(storeNumber) title = title.concat(" , Store #: ").concat(storeNumber);
    title = title.concat(" , Terminal : ")
	.concat(terminalName);
    if(startDate) {
	title= title.concat(" , Date : ")
	    .concat(startDate.toString("yyyy/MM/dd"))
	    .concat(" ~ ")
	    .concat(endDate.toString("yyyy/MM/dd"));
    }

    return title;
};


//FIXME:
function appendGroupStoreInfoFromStoreID(list) {
    function getGroupName(groups, store_id) {
	var name="";
	_.each(groups, function(group){
		   name = !_(group.stores).chain()
		       .pluck("store_id")
		       .filter(function(id){return id==store_id;})
		       .isEmpty()
		       .value()? group.groupName:name;
	       });
	return name;
    };

    function getStoreNameNum(groups, store_id) {
	var namenum ={name:"",num:""};
	_.each(groups, function(group){
		   _.each(group.stores, function(store){
			      namenum.name = store.store_id==store_id?store.storeName:namenum.name;
			      namenum.num = store.store_id==store_id?store.number:namenum.num;
			  });
	       });
	return namenum;
    };


    var result = {};

    if(!_.isEmpty(ReportData.company)) {
	var groups = ReportData.company.hierarchy.groups;
	result = _.map(list, function(item){
			   var namenum = getStoreNameNum(groups,item.store_id);
			   return _.extend({},item,{groupName:getGroupName(groups,item.store_id),
					      storeName:namenum.name,
					      storeNumber:namenum.num
					     });
		       });

	return result;

    } else if(!_.isEmpty(ReportData.group)) {
	var groups = [ReportData.group];
	result = _.map(list, function(item){
			   var namenum = getStoreNameNum(groups,item.store_id);
			   return _.extend({},item,{groupName:getGroupName(groups,item.store_id),
					      storeName:namenum.name,
					      storeNumber:namenum.num
					     });
		       });

	return result;

    } else if(!_.isEmpty(ReportData.store)) {
	result = _.map(list, function(item){
			   return _.extend({},item,{groupName:ReportData.groupName,
					      storeName:ReportData.store.storeName,
					      storeNumber:ReportData.store.number
					     });
		       });

	return result;
    }
};