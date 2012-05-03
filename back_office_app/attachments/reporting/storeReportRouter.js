var storeReportRouter = 
    new (Backbone.Router.extend(
	     {
		 routes: {
		     "storeReport/":"storeReport",
		     "storeReport/terminals":"storeReport_terminalsTable"		 
		 },

		 storeReport:function() {
	     	     console.log("storeReport ");
		 },
		 storeReport_terminalsTable:function(store_id) {
	     	     console.log("storeReport : terminalsTable ");
		 }
	     }));

var storeReportView = Backbone.View.extend(
    {initialize:function(){
	 var view = this;
	 view.el = $("#main");
	 _.bindAll(view, 
		   'renderStoreReport', 
		   'renderTerminalsTable');
	 storeReportRouter
	     .bind('route:storeReport', 
		   function(){
		       console.log("storeReportView, route:storeReport : companyname : " + 
				   ReportData.companyName + 
				   ", groupname : " + 
				   ReportData.groupName );
		       view.model = ReportData.store;
		       view.renderStoreReport();
		   });
	 storeReportRouter
	     .bind('route:storeReport_terminalsTable', 
		   function(){
		       console.log("storeReportView, route:storeReport_terminalsTable : companyname : " + 
				   ReportData.companyName + 
				   ", groupname : " +
				   ReportData.groupName );
		       view.model = ReportData.store;
		       view.renderTerminalsTable();
		   });
     },
     renderStoreReport: function() {
	 generalReportRenderer(this,getReportParam(),'storeManagementPage_TMP','store_id')
	 (function(){
	      $("dialog-quickView").html();
	      console.log("storeReportView renderStoreManagement");});
     },
     renderTerminalsTable: function() {
	 generalReportRenderer(this,getTerminalsTableParam(),'terminalstable_TMP','terminal_id')(log("storeReportView renderTerminalsTable"));
     }
    });