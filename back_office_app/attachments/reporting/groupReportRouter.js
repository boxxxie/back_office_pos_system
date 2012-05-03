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
	      },
	      groupReport_storesTable:function(group_id) {
	     	  console.log("groupReport : storesTable ");
	      },
	      groupReport_terminalsTable:function(store_id) {
	     	  console.log("groupReport : terminalsTable ");
	      }}));

var groupReportView = 
    Backbone.View.extend(
    	{initialize:function(){
	     var view = this;
	     view.el= $("#main");
	     
	     _.bindAll(view, 
		       'renderGroupReport', 
		       'renderStoresTable', 
		       'renderTerminalsTable');
	     groupReportRouter
		 .bind('route:groupReport', 
		       function(){
			   console.log("groupReportView, route:groupReport : company name : "+ 
				       ReportData.companyName);
			   view.model = ReportData.group; 
			   view.renderGroupReport();
		       });
	     groupReportRouter
		 .bind('route:groupReport_storesTable', 
		       function(group_id){
			   console.log("groupReportView, route:groupReport_storesTable : company name : "+
				       ReportData.companyName);
			   view.model = ReportData.group; 
			   view.renderStoresTable(group_id);
		       });
	     groupReportRouter
		 .bind('route:groupReport_terminalsTable', 
		       function(store_id) {
			   console.log("groupReportView, route:groupReport_storesTable: company name : "+
				       ReportData.companyName);
			   view.model = ReportData.group; 
			   view.renderTerminalsTable(store_id);
		       });
	 },
	 renderGroupReport: function() {
	     generalReportRenderer(this,getReportParam(),'groupManagementPage_TMP','group_id')
	     (function(){
	     	  $("dialog-quickView").html();
		  console.log("groupReportView renderGroupManagement");});
	 },
	 renderStoresTable : function(group_id) {
	     generalReportRenderer(this,getStoresTableParam(group_id),'storestable_TMP','store_id')(log("groupReportView renderStoresTable"));
	 },
	 renderTerminalsTable:function(store_id) {
	     generalReportRenderer(this,getTerminalsTableParam(store_id),'terminalstable_TMP','terminal_id')(log("groupReportView renderTerminalsTable"));
	 }
	 
	});
