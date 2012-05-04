var storeReportRouter =
    new (Backbone.Router.extend(
	     {
		 routes: {
		     "storeReport/":"storeReport",
		     "storeReport/terminals":"storeReport_terminalsTable"
		 },

		 storeReport:function() {
	     	     console.log("storeReport ");
		     var id = topLevelEntity(ReportData).id;
		     generalReportRenderer(getReportParam(id),'storeManagementPage_TMP','store_id')
		     (function(){
			  $("dialog-quickView").html();
			  console.log("storeReportView renderStoreManagement");});
		 },
		 storeReport_terminalsTable:function(store_id) {
	     	     console.log("storeReport : terminalsTable ");
		     var id = topLevelEntity(ReportData).id;
		     generalReportRenderer(getTerminalsTableParam(id),'terminalstable_TMP','terminal_id')(log("storeReportView renderTerminalsTable"));
		 }
	     }));