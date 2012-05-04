var menuReportsCashOutsRouter = 
    new (Backbone.Router.extend(
	     {routes: {
	     	  "menuReports/CashOuts":"menuReportsCompanyCashouts",
	     	  "menuReports/groupReportCashOuts":"menuReportsGroupCashouts",
		  "menuReports/storeReportCashOuts":"menuReportsStoreCashouts"
	      },
	      menuReportsCompanyCashouts:function() {
		  console.log("menuReportsCompanyCashouts  ");
	      },
	      menuReportsGroupCashouts:function() {
		  console.log("menuReportsGroupCashouts  ");
	      },
	      menuReportsStoreCashouts:function() {
		  console.log("menuReportsStoreCashouts  ");
	      }
	     }));

var menuReportsCashOutsView = 
    Backbone.View.extend(
	{initialize:function(){
	     var view = this;
	     view.el = $("#main");
	     
	     _.bindAll(view, 
		       'renderMenuReportsCompanyCashouts',
		       'renderMenuReportsGroupCashouts',
		       'renderMenuReportsStoreCashouts');
	     menuReportsCashOutsRouter
		 .bind('route:menuReportsCompanyCashouts', 
		       function(){
			   console.log("menuReportsView, route:menuReportsCompanyCashouts");
			   view.renderMenuReportsCompanyCashouts();
		       });
	     menuReportsCashOutsRouter
		 .bind('route:menuReportsGroupCashouts', 
		       function(){
			   console.log("menuReportsView, route:menuReportsGroupCashouts");
			   view.renderMenuReportsGroupCashouts();
		       });
	     menuReportsCashOutsRouter
		 .bind('route:menuReportsStoreCashouts', 
		       function(){
			   console.log("menuReportsView, route:menuReportsStoreCashouts");
			   view.renderMenuReportsStoreCashouts();
		       });
	 },
	 renderMenuReportsCompanyCashouts: function() {
	     
	     var html = ich.menuReportsCashOutsReports_TMP({breadCrumb:breadCrumb(ReportData.company.companyName)});
	     $(this.el).html(html);
	     
             resetDatePicker();
	     
             resetDropdownBox(ReportData, true, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    rendermenuReportsCashOutsTable();
			});
	     
	     console.log("rendered general report");
	 },
	 renderMenuReportsGroupCashouts: function() {
	     
	     var html = ich.menuReportsCashOutsReports_TMP({breadCrumb:breadCrumb(ReportData.companyName, ReportData.group.groupName)});
	     $(this.el).html(html);
	     
	     resetDatePicker();
	     
             resetDropdownBox(ReportData, true, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    rendermenuReportsCashOutsTable();
			});
	     
	     console.log("rendered general report");
	 },
	 renderMenuReportsStoreCashouts: function() {
	     
	     var html = ich.menuReportsCashOutsReports_TMP({breadCrumb:breadCrumb(ReportData.companyName, ReportData.groupName, ReportData.store.storeName, ReportData.store.number)});
	     $(this.el).html(html);
	     
             resetDatePicker();
	     
             resetDropdownBox(ReportData, true, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    rendermenuReportsCashOutsTable();
			});
	     
	     console.log("rendered general report");
	 }
	});

/******************************************** helper functions ************************************/
function rendermenuReportsCashOutsTable() {
    console.log("renderCashOutsTable");
    
    var dropdownGroup = $("#groupsdown");
    var dropdownStore = $("#storesdown");
    var dropdownTerminal = $("#terminalsdown");

    if(!_.isEmpty($("#dateFrom").val()) && !_.isEmpty($("#dateTo").val())) {
	var startDate = new Date($("#dateFrom").val());
	var endDate = new Date($("#dateTo").val());
	var endDateForQuery = new Date($("#dateTo").val());
	var today = (new Date()).toString("MM/dd/yyyy");
	
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
	
	cashoutReportFetcher(ids,startDate,endDateForQuery)
	(function(data_TMP){
	     data_TMP = _.map(data_TMP, function(item){
				  return _.extend({},item,{store_id:item.cashout.store_id});
			      });
	     data_TMP = appendGroupStoreInfoFromStoreID(data_TMP);
	     
	     var numofcashout = data_TMP.length+"";
	     data_TMP = _.map(data_TMP, function(item){
				  var dialogtitle=getDialogTitle(ReportData,item);
				  item._id = item.id;
				  return _.extend(item, {dialogtitle:dialogtitle});
			      });

	     var html = ich.menuReportsCashOutstable_TMP({items:data_TMP, numofcashout:numofcashout});
	     
	     $("#cashoutstable").html(html);
	     
	     _.each(data_TMP, function(item){	
			var btn = $('#'+item._id)
			    .button()
			    .click(function(){
				       var data = item.cashout;
				       _.applyToValues(data, function(obj){
							   var strObj = obj+"";
							   if(strObj.indexOf(".")>=0) {
						     	       obj = currency_format(Number(obj));
							   }
							   return obj;
						       }, true);
				       
				       var actual_cash_count = Number(data.cashpayment) - Number(data.cashrefund);
				       var actual_tender = Number(data.actual_tender);
				       var over_short = actual_cash_count - actual_tender;
				       
				       var cashoutData = _.extend({actual_cash_count:currency_format(actual_cash_count),
						                   over_short:currency_format(over_short)}, data);
				       
				       var propsToChange = _.selectKeys(cashoutData,['netsalestotal', 'netrefundtotal', 'netsaleactivity', 'avgpayment', 'avgrefund' , 'cashtotal' , 'allDiscount', 'cancelledtotal','avgcancelled','menusalesamount', 'scansalesamount','ecrsalesamount','actual_cash_count','actual_tender','over_short']);
				       propsToChange =_(propsToChange).chain()
					   .map(function(val,key){
						    if(val.indexOf('-')>=0) { val = val.replace('-',''); val = "-$ " +val;}
						    else {val = "$ " +val;}
						    return [key,val];
						})
					   .toObject()
					   .value();
				       cashoutData = _.extend({},data,propsToChange); 
				       
				       var html = ich.menuReportsCashoutQuickViewDialog_TMP(cashoutData);
				       quickmenuReportsCashoutViewDialog(html, {title:item.dialogtitle});
				   });
		    });		
	 });
	
    } else {
   	alert("Input Date");
    }
};
