//fixme these three reports need MAJOR refactoring, including all code that they touch
function log(text){return function(){console.log(text);};};
function generalReportRenderer(param,template,idField){
    function generateFormattedSales(sales){
	function safeSum(total,cur){
	    return total + Number(cur);
	};
	function sumSalesType(sales,type){
	    return _(sales)
		.chain()
		.pluck(type)
		.reduce(safeSum,0)
		.value();
	};
	return _.applyToValues({yesterdaysales:sumSalesType(sales,'yesterdaysales'),
				mtdsales:sumSalesType(sales,'mtdsales'),
				ytdsales:sumSalesType(sales,'ytdsales')},
			       currency_format);
    };

    return function(callback){
	extractSalesDataFromIds(param.list,idField, function(listForTable){
				    param.list =  listForTable;
				    var formattedSales = generateFormattedSales(param.list);
				    _.extend(param, {sales:formattedSales});
				    param.list=_.map(param.list, function(item){
				    			 item.yesterdaysales = currency_format(Number(item.yesterdaysales));
				    			 item.mtdsales = currency_format(Number(item.mtdsales));
				    			 item.ytdsales = currency_format(Number(item.ytdsales));
				    			 return item;
						     });
				    var html = ich[template](param);
				    $('#main').html(html); //fixme, this should be in a view
				    if(_.isFunction(callback)){callback(param);}
				});
    };
};

var companyReportRouter =
    new (Backbone.Router.extend(
	     {routes: {
		  "companyReport/":"companyReport",
		  "companyReport/groups" :"companyReport_groupsTable",
		  "companyReport/group/:group_id/stores" :"companyReport_storesTable",
		  "companyReport/store/:store_id/terminals" :"companyReport_terminalsTable",
		  "companyReport/stores" :"companyReport_storesTable",
		  "companyReport/terminals" :"companyReport_terminalsTable"
	      },
	      companyReport:function(){
		  console.log("companyReport  ");
		  generalReportRenderer(getReportParam(),'companyManagementPage_TMP','company_id')
		  (function(param){
		       $("#dialog-quickView").html();
		       console.log("companyReportView rendercompanymanagement");});
	      },
	      companyReport_groupsTable:function() {
	     	  console.log("companyReport : groupsTable  ");
		  var id = topLevelEntity(ReportData).id;
		  generalReportRenderer(getGroupsTableParam(id),'groupstable_TMP','group_id')(log("companyReportView renderGroupsTable"));

	      },
	      companyReport_storesTable:function() {
	     	  console.log("companyReport : storesTable ");
		  var id = topLevelEntity(ReportData).id;
		  generalReportRenderer(getStoresTableParam(id),'storestable_TMP','store_id')(log("companyReportView renderStoresTable"));
	      },
	      companyReport_terminalsTable:function() {
	     	  console.log("companyReport : terminalsTable ");
		  var id = topLevelEntity(ReportData).id;
		  generalReportRenderer(getTerminalsTableParam(id),'terminalstable_TMP','terminal_id')(log("companyReportView renderTerminalsTable"));
	      }}));