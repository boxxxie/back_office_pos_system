
var menuReportsRouter = 
    new (Backbone.Router.extend(
	     {routes: {
		  "menuReports/companyReport":"menuReportsCompany",
		  "menuReports/groupReport":"menuReportsGroup",
		  "menuReports/storeReport":"menuReportsStore"
	      },
	      menuReportsCompany:function(){
		  console.log("menuCompanyReport  ");
	      },
	      menuReportsGroup:function() {
	     	  console.log("menuGroupReport  ");
	      },
	      menuReportsStore:function(group_id) {
	     	  console.log("menuStoreReport ");
	      }
	     }));


var menuReportsView = 
    Backbone.View.extend(
	{initialize:function(){
	     var view = this;
	     view.el = $("#main");
	     
	     _.bindAll(view, 
		       'renderMenuReportsCompany' , 
		       'renderMenuReportsGroup', 
		       'renderMenuReportsStore'
			);
	     menuReportsRouter
		 .bind('route:menuReportsCompany', 
		       function(){
			   console.log("menuReportsView, route:menuReportsCompany");
			   view.renderMenuReportsCompany();
		       });
	     menuReportsRouter
		 .bind('route:menuReportsGroup', 
		       function(){
			   console.log("menuReportsView, route:menuReportsGroup");
			   view.renderMenuReportsGroup();						
		       });

	     menuReportsRouter
		 .bind('route:menuReportsStore', 
		       function(group_id){
			   console.log("menuReportsView, route:menuReportsStore");
			   view.renderMenuReportsStore(group_id);						
		       });
	 },
	 renderMenuReportsCompany: function() {
	     var html = ich.menuReports_TMP({startPage:"companyReport", 
	     							breadCrumb:breadCrumb(ReportData.company.companyName)});
	     $(this.el).html(html);
	     console.log("renderMenuReportsCompany");	
	 },
	 renderMenuReportsGroup: function() {
	     var html = ich.menuReports_TMP({startPage:"groupReport", 
	     				     breadCrumb:breadCrumb(ReportData.companyName,
	     				     					ReportData.group.groupName)});
	     $(this.el).html(html);
	     console.log("renderMenuReportsGroup");
	 },
	 renderMenuReportsStore: function() {
	     var html = ich.menuReports_TMP({startPage:"storeReport", 
	     				     breadCrumb:breadCrumb(ReportData.companyName,
	     				     					ReportData.groupName,
	     				     					ReportData.store.storeName,
	     				     					ReportData.store.number)});
	     $(this.el).html(html);
	     console.log("renderMenuReportsStore");
	 }
	});