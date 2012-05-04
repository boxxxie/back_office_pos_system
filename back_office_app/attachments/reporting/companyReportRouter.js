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
				    var formattedSales = generateFormattedSales(listForTable);
				    var tmp_data = _.extend({},
							  param,
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
		     "companyReport/":"mainReport",
		     "companyReport/groups" :"groupsTable",
		     "companyReport/group/:group_id/stores" :"storesTable",
		     "companyReport/store/:store_id/terminals" :"terminalsTable",
		     "companyReport/stores" :"storesTable",
		     "companyReport/terminals" :"terminalsTable",

		     "groupReport/":"mainReport",
		     "groupReport/stores":"storesTable",
		     "groupReport/store/:store_id/terminals" :"terminalsTable",
		     "groupReport/terminals":"terminalsTable",

		     "storeReport/":"mainReport",
		     "storeReport/terminals":"terminalsTable"
		 },
		 mainReport:function(){
		     generalReportRenderer(getReportParam(),
					   'mainManagementPage_TMP',
					   'company_id')
		     (function(param){
			  $("#dialog-quickView").html();
			  console.log("companyReportView rendercompanymanagement");});
		 },
		 storesTable:function() {
		     var id = topLevelEntity(ReportData).id;
		     generalReportRenderer(getStoresTableParam(id),
					   'storestable_TMP',
					   'store_id')
		     (log("companyReportView renderStoresTable"));
		 },
		 groupsTable:function() {
		     var id = topLevelEntity(ReportData).id;
		     generalReportRenderer(getGroupsTableParam(id),
					   'groupstable_TMP',
					   'group_id')
		     (log("companyReportView renderGroupsTable"));

		 },
		 terminalsTable:function() {
		     var id = topLevelEntity(ReportData).id;
		     generalReportRenderer(getTerminalsTableParam(id),
					   'terminalstable_TMP',
					   'terminal_id')
		     (log("companyReportView renderTerminalsTable"));
		 }}));