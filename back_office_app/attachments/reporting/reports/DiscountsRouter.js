var menuReportsDiscountsRouter = 
    new (Backbone.Router.extend(
	     {routes: {
		  "menuReports/Discounts":"menuReportsCompanyDiscounts",
		  "menuReports/groupReportDiscounts":"menuReportsGroupDiscounts",
		  "menuReports/storeReportDiscounts":"menuReportsStoreDiscounts"
	      },
	      menuReportsCompanyDiscounts:function() {
		  console.log("menuReportsCompanyDiscounts  ");
	      },
	      menuReportsGroupDiscounts:function() {
		  console.log("menuReportsGroupDiscounts  ");
	      },
	      menuReportsStoreDiscounts:function() {
		  console.log("menuReportsStoreDiscounts  ");
	      }
	     }));

var menuReportsDiscountsView = 
    Backbone.View.extend(
	{initialize:function(){
	     var view = this;
	     view.el = $("#main");
	     
	     _.bindAll(view, 
		       'renderMenuReportsCompanyDiscounts',
		       'renderMenuReportsGroupDiscounts',
		       'renderMenuReportsStoreDiscounts');
	     menuReportsDiscountsRouter
		 .bind('route:menuReportsCompanyDiscounts', 
		       function(){
			   console.log("menuReportsView, route:menuReportsCompanyDiscounts");
			   view.renderMenuReportsCompanyDiscounts();
		       });
	     
	     menuReportsDiscountsRouter
		 .bind('route:menuReportsGroupDiscounts', 
		       function(){
			   console.log("menuReportsView, route:menuReportsGroupDiscounts");
			   view.renderMenuReportsGroupDiscounts();
		       });
	     
	     menuReportsDiscountsRouter
		 .bind('route:menuReportsStoreDiscounts', 
		       function(){
			   console.log("menuReportsView, route:menuReportsStoreDiscounts");
			   view.renderMenuReportsStoreDiscounts();
		       });
	 },
	 renderMenuReportsCompanyDiscounts: function() {
	     
	     var html = ich.menuReportsDiscountsReports_TMP({breadCrumb:breadCrumb(ReportData.company.companyName)});
	     $(this.el).html(html);
	     
	     resetDatePicker();
	     
             resetDropdownBox(ReportData, true, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderDiscountsTable();
			});
	     
	     console.log("rendered general report");
	 },
	 renderMenuReportsGroupDiscounts: function() {
	     
	     var html = ich.menuReportsDiscountsReports_TMP({breadCrumb:breadCrumb(ReportData.companyName, ReportData.group.groupName)});
	     $(this.el).html(html);
	     
	     resetDatePicker();
	     
             resetDropdownBox(ReportData, true, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderDiscountsTable();
			});
	     
	     console.log("rendered general report");
	 },
	 renderMenuReportsStoreDiscounts: function() {
	     
	     var html = ich.menuReportsDiscountsReports_TMP({breadCrumb:breadCrumb(ReportData.companyName, ReportData.groupName, ReportData.store.storeName, ReportData.store.number)});
	     $(this.el).html(html);
	     
	     resetDatePicker();
	     
             resetDropdownBox(ReportData, true, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderDiscountsTable();
			});
	     
	     console.log("rendered general report");
	 }
	});

/******************************************** helper functions ************************************/
function renderDiscountsTable() {
    console.log("renderDiscountsTable");
    
    var dropdownGroup = $("#groupsdown");
    var dropdownStore = $("#storesdown");
    var dropdownTerminal = $("#terminalsdown");

    if(!_.isEmpty($("#dateFrom").val()) && !_.isEmpty($("#dateTo").val())) {
	var startDate = new Date($("#dateFrom").val());
	var endDate = new Date($("#dateTo").val());
	var endDateForQuery = new Date($("#dateTo").val());
	endDateForQuery.addDays(1);
	
	//TODO
	if(dropdownTerminal.val()=="ALL") {
	    ids = _($('option', dropdownTerminal)).chain()
	    	.filter(function(item){ return item.value!=="ALL";})
	    	.map(function(item){
	    		 return {id:item.value, name:item.text};
	    	     })
	    	.value();
	} else {
	    var sd = $("#terminalsdown option:selected");
	    ids =[{id:sd.val(), name:sd.text()}];
	}
	console.log(ids);
	
	discountTransactionsFromCashoutsFetcher(ids,startDate,endDateForQuery)
	(function(err,data_TMP){
	     
	     var totalrow = {};
	     totalrow.numofdiscount = data_TMP.length + "";
	     totalrow.sales = (_.reduce(data_TMP, function(init, item){
					    return init + Number(item.sales);
					}, 0)).toFixed(2);
	     totalrow.discount = (_.reduce(data_TMP, function(init, item){
					       return init + Number(item.discount);
					   }, 0)).toFixed(2);
	     totalrow.tax1and2 = (_.reduce(data_TMP, function(init, item){
					       return init + Number(item.tax1and2);
					   }, 0)).toFixed(2);
	     totalrow.tax3 = (_.reduce(data_TMP, function(init, item){
					   return init + Number(item.tax3);
				       }, 0)).toFixed(2);
	     totalrow.total = (_.reduce(data_TMP, function(init, item){
					    return init + Number(item.total);
					}, 0)).toFixed(2);
	     
	     totalrow.percentdiscount = (Number(totalrow.sales)>0)?(Number(totalrow.discount)/Number(totalrow.sales)*100).toFixed(2):(Number(0)).toFixed(2);
	     
	     _.applyToValues(totalrow, function(obj){
				 var strObj = obj+"";
				 if(strObj.indexOf(".")>=0) {
				     obj = currency_format(Number(obj));
				 }
				 return obj;
			     }, true);
	     
	     data_TMP = _.map(data_TMP, function(item){
	     			  item.totaldiscount = item.discount;
	     			  if(_.isNumber(item.totaldiscount)) {
	     			      item.totaldiscount = (item.totaldiscount>0)? "-"+currency_format(item.totaldiscount):currency_format(item.totaldiscount);
	     			  }
	     			  return item; 
			      });
	     
	     data_TMP = processTransactionsTMP(data_TMP);
	     
	     
	     var html = ich.menuReportsDiscountstable_TMP({items:data_TMP, totalrow:totalrow});
	     
	     $("#discountstable").html(html);
	     
	     _.each(data_TMP, function(item){	
			var item = _.clone(item);
			
			var dialogtitle=getDialogTitle(ReportData,item);
			
			var btn = $('#'+item._id)
			    .button()
			    .click(function(){
				       var btnData = item;
				       _.applyToValues(ReportData,
						       function(o){
							   if(o.store_id==btnData.store_id){
							       btnData.storename = o.storeName;
							   }
							   return o;
						       }
						       ,true);
				       btnData.discount=null;
				       btnData.order = _.map(btnData.order, function(orderitem){
				       				 if(orderitem.discount) {
				       				     orderitem.discount = (Number(orderitem.discount)*Number(orderitem.quantity)).toFixed(2);
				       				 }
				       				 return orderitem;
							     });
				       
				       var html = ich.generalTransactionQuickViewDialog_TMP(btnData);
				       quickmenuReportsTransactionViewDialog(html, {title:dialogtitle});
				   });
		    });
	 });
	
    } else {
   	alert("Input Date");
    }
};
