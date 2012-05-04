var groupReportRouter =
    new (Backbone.Router.extend(
	     {routes: {
		  "groupReport/":"groupReport",
		  "groupReport/stores":"groupReport_storesTable",
		  "groupReport/store/:store_id/terminals" :"groupReport_terminalsTable",
		  "groupReport/terminals":"groupReport_terminalsTable"
	      },
	      groupReport:function() {
	     	  console.log("groupReport ");
		  var id = topLevelEntity(ReportData).id;
		  generalReportRenderer(getReportParam(id),'groupManagementPage_TMP','group_id')
		  (function(){
	     	       $("dialog-quickView").html();
		       console.log("groupReportView renderGroupManagement");});
	      },
	      groupReport_storesTable:function() {
	     	  console.log("groupReport : storesTable ");
		  var id = topLevelEntity(ReportData).id;
		  generalReportRenderer(getStoresTableParam(id),'storestable_TMP','store_id')(log("groupReportView renderStoresTable"));
	      },
	      groupReport_terminalsTable:function() {
	     	  console.log("groupReport : terminalsTable ");
		  var id = topLevelEntity(ReportData).id;
		  generalReportRenderer(getTerminalsTableParam(id),'terminalstable_TMP','terminal_id')(log("groupReportView renderTerminalsTable"));
	      }}));
