//fixme these three reports need MAJOR refactoring, including all code that they touch
function log(text){return function(){console.log(text);};};
function generalReportRenderer(param,template,idField){
    function generateFormattedSales(sales){
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
				    var formattedSales = generateFormattedSales(listForTable);
				    var tmp_data = _.extend({},
							  param,
							  {list:listForTable},
							  {sales:formattedSales});
				    var html = ich[template](tmp_data);
				    $('#main').html(html); //fixme, this should be in a view
				    if(_.isFunction(callback)){callback(tmp_data);}
				});
    };
};

var mainReportRouter =
    new (Backbone.Router.extend(
	     {
		 routes: {
		     "main/":"mainReport",
		     "main/groups" :"groupsTable",
		     "main/group/:group_name/stores" :"storesTable",
		     "main/store/:store_name_num/terminals" :"terminalsTable",
		     "main/stores" :"storesTable",
		     "main/terminals" :"terminalsTable"
		 },
		 mainReport:function(){
		     generalReportRenderer(getReportParam(),
					   'mainManagementPage_TMP',
					   'company_id')
		     (function(param){
			  $("#dialog-quickView").html();
			  console.log("companyReportView rendercompanymanagement");});
		 },
		 groupsTable:function() {
		     var id = topLevelEntity(ReportData).id;
		     generalReportRenderer(getGroupsTableParam(id),
					   'groupstable_TMP',
					   'group_id')
		     (log("companyReportView renderGroupsTable"));
		 },
		 storesTable:function(group_name) {
		     if(group_name){
			 get_id_from_name(ReportData,group_name)
			 (function(id){
			      generalReportRenderer(getStoresTableParam(id),
						    'storestable_TMP',
						    'store_id')
			      (log("companyReportView renderStoresTable"));
			  });
		     }
		     else{
			 var id = topLevelEntity(ReportData).id;
			 generalReportRenderer(getStoresTableParam(id),
					       'storestable_TMP',
					       'store_id')
			 (log("companyReportView renderStoresTable"));
		     }
		 },
		 terminalsTable:function(store_name_num) {
		     if(store_name_num){
			 var store_name = _.str.trim(store_name_num.split('(')[0]);
			 get_id_from_name(ReportData,store_name)
			 (function(id){
			      generalReportRenderer(getTerminalsTableParam(id),
						    'terminalstable_TMP',
						    'terminal_id')
			      (log("companyReportView renderTerminalsTable"));
			  })
		     }
		     else{
			 var id = topLevelEntity(ReportData).id;
			 generalReportRenderer(getTerminalsTableParam(id),
					       'terminalstable_TMP',
					       'terminal_id')
			 (log("companyReportView renderTerminalsTable"));
		     }
		 }}));