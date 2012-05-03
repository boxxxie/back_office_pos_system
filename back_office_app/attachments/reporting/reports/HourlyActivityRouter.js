var menuReportsHourlyActivityRouter = 
    new (Backbone.Router.extend(
	     {routes: {
		  "menuReports/companyReportHourlyActivity":"menuReportsCompanyHourly",
		  "menuReports/groupReportHourlyActivity":"menuReportsGroupHourly",
		  "menuReports/storeReportHourlyActivity":"menuReportsStoreHourly"
	      },
	      menuReportsCompanyHourly:function() {
		  console.log("menuReportsCompanyHourly  ");
	      },
	      menuReportsGroupHourly:function() {
		  console.log("menuReportsGroupHourly  ");
	      },
	      menuReportsStoreHourly:function() {
		  console.log("menuReportsStoreHourly  ");
	      }
	     }));


var menuReportsHourlyActivityView = 
    Backbone.View.extend(
	{initialize:function(){
	     var view = this;
	     view.el = $("#main");
	     
	     _.bindAll(view, 
		       'renderMenuReportsCompanyHourly',
		       'renderMenuReportsGroupHourly',
		       'renderMenuReportsStoreHourly');
	     menuReportsHourlyActivityRouter
		 .bind('route:menuReportsCompanyHourly', 
		       function(){
			   console.log("menuReportsHourlyActivityView, route:menuReportsCompanyHourly");
			   view.renderMenuReportsCompanyHourly();
		       });
	     menuReportsHourlyActivityRouter
		 .bind('route:menuReportsGroupHourly', 
		       function(){
			   console.log("menuReportsHourlyActivityView, route:menuReportsGroupHourly");
			   view.renderMenuReportsGroupHourly();
		       });
	     menuReportsHourlyActivityRouter
		 .bind('route:menuReportsStoreHourly', 
		       function(){
			   console.log("menuReportsHourlyActivityView, route:menuReportsStoreHourly");
			   view.renderMenuReportsStoreHourly();
		       });
	 },
	 renderMenuReportsCompanyHourly: function() {
	     
	     var html = ich.hourlyActivityReports_TMP({startPage:"companyReport", 
	     					       breadCrumb:breadCrumb(ReportData.company.companyName)});
	     $(this.el).html(html);
	     
	     
             resetDropdownBox(ReportData, true, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderHourlyActivityTable();
			});
	     
	     console.log("rendered general report");
	 },
	 renderMenuReportsGroupHourly: function() {
	     
	     var html = ich.hourlyActivityReports_TMP({startPage:"groupReport", 
	 					       breadCrumb:breadCrumb(ReportData.companyName,ReportData.group.groupName)});
	     $(this.el).html(html);
	     
             resetDropdownBox(ReportData, true, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderHourlyActivityTable();
			});
	     
	     console.log("rendered general report");
	 },
	 renderMenuReportsStoreHourly: function() {
	     
	     var html = ich.hourlyActivityReports_TMP({startPage:"storeReport", 
	 					       breadCrumb:breadCrumb(ReportData.companyName,
	 					     			     ReportData.groupName,
	 					     			     ReportData.store.storeName,
	 					     			     ReportData.store.number)});
	     $(this.el).html(html);
	     
             resetDropdownBox(ReportData, true, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderHourlyActivityTable();
			});
	     
	     console.log("rendered general report");
	 }
	});


/************************************ helper functions **********************************************/
function renderHourlyActivityTable() {
    var dropdownGroup = $("#groupsdown");
    var dropdownStore = $("#storesdown");
    var dropdownTerminal = $("#terminalsdown");
    var id;
    
    if(dropdownTerminal.val()!="ALL") {
	//alert("terminal id : "+dropdownTerminal.val());
	id=dropdownTerminal.val();
    } else if(dropdownStore.val()!="ALL") {
	//alert("store id : "+dropdownStore.val());
	id=dropdownStore.val();
    } else if(dropdownGroup.val()!="ALL" && dropdownGroup.val()!="") {
	//alert("group id : "+dropdownGroup.val());
	id = dropdownGroup.val();
    } else {
	if(dropdownGroup.val()=="ALL") {
	    //  alert("company id : "+ReportData.company._id);
	    id=ReportData.company._id;
	} else if(dropdownGroup.val()=="") {
	    //alert("store id : "+ ReportData.store.store_id);
	    id=ReportData.store.store_id;
	}
    }
    
    //TODO : hourly activity talble data 
    hourlyReportFetcher(id, function(data_param){
    			    var totalrow={};
    			    totalrow.transactions = (_.reduce(data_param, function(init, item){
								  return init + Number(item.transactions);
							      }, 0))+"";
			    totalrow.refunds = (_.reduce(data_param, function(init, item){
							     return init + Number(item.refunds);
							 }, 0))+"";
			    totalrow.menu = (_.reduce(data_param, function(init, item){
							  return init + Number(item.menu);
						      }, 0)).toFixed(2);
			    totalrow.inventory = (_.reduce(data_param, function(init, item){
							       return init + Number(item.inventory);
							   }, 0)).toFixed(2);
			    totalrow.ecr = (_.reduce(data_param, function(init, item){
							 return init + Number(item.ecr);
						     }, 0)).toFixed(2);
			    totalrow.total = (_.reduce(data_param, function(init, item){
							   return init + Number(item.total);
						       }, 0)).toFixed(2);
			    if((Number(totalrow.transactions)-Number(totalrow.refunds))!=0) {
				totalrow.avgsale = (Number(totalrow.total)/(Number(totalrow.transactions))).toFixed(2);
			    } else {
				totalrow.avgsale = "0.00";
			    }
			    
			    data_param = _.map(data_param, function(item){
	    					   //item.avgsale = currency_format(Number(item.avgsale));
	    					   //item.ecr = currency_format(Number(item.ecr));
	    					   //item.inventory = currency_format(Number(item.inventory));
	    					   //item.menu = currency_format(Number(item.menu));
	    					   //item.total = currency_format(Number(item.total));
	    					   item.avgsale = Number(item.avgsale)>=0?currency_format(Number(item.avgsale)):"-"+currency_format(Number(item.avgsale)*-1);
	    					   item.ecr = Number(item.ecr)>=0?currency_format(Number(item.ecr)):"-"+currency_format(Number(item.ecr)*-1);
	    					   item.inventory = Number(item.inventory)>=0?currency_format(Number(item.inventory)):"-"+currency_format(Number(item.inventory)*-1);
	    					   item.menu = Number(item.menu)>=0?currency_format(Number(item.menu)):"-"+currency_format(Number(item.menu)*-1);
	    					   item.total = Number(item.total)>=0?currency_format(Number(item.total)):"-"+currency_format(Number(item.total)*-1);
	    					   
						   return item;	    		
	    				       });
    			    
			    //totalrow.avgsale = currency_format(totalrow.avgsale);
    			    //totalrow.ecr = currency_format(totalrow.ecr);
    			    //totalrow.inventory = currency_format(totalrow.inventory);
    			    //totalrow.menu = currency_format(totalrow.menu);
    			    //totalrow.total = currency_format(totalrow.total);
    			    totalrow.avgsale = Number(totalrow.avgsale)>=0?currency_format(Number(totalrow.avgsale)):"-"+currency_format(Number(totalrow.avgsale)*-1);
			    totalrow.ecr = Number(totalrow.ecr)>=0?currency_format(Number(totalrow.ecr)):"-"+currency_format(Number(totalrow.ecr)*-1);
			    totalrow.inventory = Number(totalrow.inventory)>=0?currency_format(Number(totalrow.inventory)):"-"+currency_format(Number(totalrow.inventory)*-1);
			    totalrow.menu = Number(totalrow.menu)>=0?currency_format(Number(totalrow.menu)):"-"+currency_format(Number(totalrow.menu)*-1);
			    totalrow.total = Number(totalrow.total)>=0?currency_format(Number(totalrow.total)):"-"+currency_format(Number(totalrow.total)*-1);
    			    
    			    var data = {items:data_param, totalrow:totalrow};
			    var html = ich.hourlyActivitytable_TMP(data);
    			    $("#hourlytable").html(html);    	
			});
};

