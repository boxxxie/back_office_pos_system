(new (Backbone.Router.extend(
	  {routes: {
	       "reports/":"setup"
	   },
	   setup:function(){
	       var html = ich.menuReports_TMP(autoBreadCrumb());
	       $("#main").html(html);
	   }
	  })));
