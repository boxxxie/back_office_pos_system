var menuReportsTransactionsDetailRouter = 
    new (Backbone.Router.extend(
	     {routes: {
	     	  "menuReports/companyReportTransactionsDetail":"menuReportsCompanyTransactionsDetail",
	     	  "menuReports/groupReportTransactionsDetail":"menuReportsGroupTransactionsDetail",
	  	  "menuReports/storeReportTransactionsDetail":"menuReportsStoreTransactionsDetail"
	      },
	      menuReportsCompanyTransactionsDetail:function() {
		  console.log("menuReportsCompanyTransactionsDetail  ");
	      },
	      menuReportsGroupTransactionsDetail:function() {
		  console.log("menuReportsGroupTransactionsDetail  ");
	      },
	      menuReportsStoreTransactionsDetail:function() {
		  console.log("menuReportsStoreTransactionsDetail  ");
	      }
	     }));

var menuReportsTransactionsDetailView = 
    Backbone.View.extend(
	{initialize:function(){
	     var view = this;
	     view.el = $("#main");
	     
	     _.bindAll(view, 
		       'renderMenuReportsCompanyTransactionsDetail',
		       'renderMenuReportsGroupTransactionsDetail',
		       'renderMenuReportsStoreTransactionsDetail');
	     menuReportsTransactionsDetailRouter
		 .bind('route:menuReportsCompanyTransactionsDetail', 
		       function(){
			   console.log("menuReportsView, route:menuReportsCompanyTransactionsDetail");
			   view.renderMenuReportsCompanyTransactionsDetail();
		       });
	     menuReportsTransactionsDetailRouter
		 .bind('route:menuReportsGroupTransactionsDetail', 
		       function(){
			   console.log("menuReportsView, route:menuReportsGroupTransactionsDetail");
			   view.renderMenuReportsGroupTransactionsDetail();
		       });
	     menuReportsTransactionsDetailRouter
		 .bind('route:menuReportsStoreTransactionsDetail', 
		       function(){
			   console.log("menuReportsView, route:menuReportsStoreTransactionsDetail");
			   view.renderMenuReportsStoreTransactionsDetail();
		       });
	 },
	 renderMenuReportsCompanyTransactionsDetail: function() {
	     
	     var html = ich.transactionsDetailReports_TMP({startPage:"companyReport", 
	     						   breadCrumb:breadCrumb(ReportData.company.companyName)});
	     $(this.el).html(html);
	     $("#btnBack2").hide();
	     
	     resetDatePicker();
	     
             resetDropdownBox(ReportData, false, false);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderTransactionsDetailTable();
			});
	     
	     console.log("rendered general report");
	 },
	 renderMenuReportsGroupTransactionsDetail: function() {
	     
	     var html = ich.transactionsDetailReports_TMP({startPage:"groupReport", 
	     						   breadCrumb:breadCrumb(ReportData.companyName, 
										 ReportData.group.groupName)});
	     $(this.el).html(html);
	     $("#btnBack2").hide();
	     
	     resetDatePicker();
	     
             resetDropdownBox(ReportData, false, false);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderTransactionsDetailTable();
			});
	     
	     console.log("rendered general report");
	 },
	 renderMenuReportsStoreTransactionsDetail: function() {
	     
	     var html = ich.transactionsDetailReports_TMP({startPage:"storeReport", 
	     						   breadCrumb:breadCrumb(ReportData.companyName, 
										 ReportData.groupName, 
										 ReportData.store.storeName, 
										 ReportData.store.number)});
	     $(this.el).html(html);
	     $("#btnBack2").hide();
	     
	     resetDatePicker();
	     
             resetDropdownBox(ReportData, false, false);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderTransactionsDetailTable();
			});
	     
	     console.log("rendered general report");
	 }
	});

/******************************************** helper functions ************************************/
function renderTransactionsDetailTable() {
    function getTerminalLabel(terminal_id) {
    	var terminal_label = "";
    	_.prewalk(
	    function(obj) {
		if(obj && obj.terminal_id == terminal_id) {
		    terminal_label = obj.terminal_label;
		}
		return obj;
	    },ReportData);
	return terminal_label;	
    };
    function renderTransactionDetail(startDate, endDateForQuery, option) {
        transactionsReportFetcher(startDate,endDateForQuery)
        ([option.id])
        (function(err,resp){
             var respForBtn = _.extend({},resp);
             
             resp.transactions = _.map(resp.transactions, function(item) {
					   var terminal_label = getTerminalLabel(item.terminal_id);
					   return _.extend(item,{name:terminal_label} 
							   ,{date:item.time.start}
							   ,{transdate:jodaDatePartFormatter(item.time.start)}
							   ,{transtime:jodaTimePartFormatter(item.time.start)}
							   ,{subTotal:currency_format(item.subTotal)}
							   ,{tax1and2:currency_format(item.tax1and2)}
							   ,{tax3:currency_format(item.tax3)}
							   ,{total:currency_format(item.total)});
				       });
             
             var html = ich.transactionsDetailTable_TMP(resp);
             $("#transactionsdetailtable").html(html);
             $("#printdetail").click(function(){
					 if(_(resp.transactions).size()>0) {
					     var form = $("#transactionsdetailtable");
					     form.find("#detail").hide();
					     form.find("#printdetail").hide();
					     var exBorder = form.find("table").attr("border");
					     form.find("table").attr("border",1);
					     
					     var w = window.open();
					     if(_.isEmpty(ReportData.company)) {
						 w.document.write("Company : " + ReportData.companyName );    
					     } else {
						 w.document.write("Company : " + ReportData.company.companyName);
					     }
					     w.document.write(" , Store : " + $("#storesdown option:selected").text());
					     
					     w.document.write(form.html());
					     w.document.close();
					     w.focus();
					     w.print();
					     w.close();
					     
					     form.find("#detail").show();
					     form.find("#printdetail").show();
					     form.find("table").attr("border",exBorder);
					 } else {
					     alert("No transactions to save.");
					 }
				     });
             
             
             $("#transactionssummarytable").hide();             
             $("#ulGroupDropDown").find("select").attr("disabled",true);
             $("#dateRangePicker").hide();
             $("#generalgobtn").hide();
             $("#btnBackHistory").hide();
             $("#btnBack2").show();
             
             $("#btnBack2").click(function(){
				      $("#transactionssummarytable").show();
				      $("#transactionsdetailtable").html({});
				      $("#ulGroupDropDown").find("select").attr("disabled",false);
				      $("#dateRangePicker").show();
				      $("#generalgobtn").show();
				      $("#btnBackHistory").show();
				      $("#btnBack2").hide();
				  });
             
             
             respForBtn.transactions = _.map(respForBtn.transactions, function(item) {
						 var terminal_label = getTerminalLabel(item.terminal_id);
                                                 return _.extend(item,{name:terminal_label} 
                                                                 ,{date:item.time.start});
                                             });
             
             respForBtn.transactions = processTransactionsTMP(respForBtn.transactions);
             
             _.each(respForBtn.transactions, function(item) {
			var item = _.clone(item);
			
			var dialogtitle=getDialogTitle(ReportData,item);
			
			var btn = $('#'+item._id)
                            .each(function(){
				      $(this).button()
					  .click(function(){
						     var btnData = item;
						     btnData.discount=null;
						     //TODO use walk
						     _.applyToValues(ReportData,
								     function(o){
									 if(o.store_id==btnData.store_id){
									     btnData.storename = o.storeName;
									 }
									 return o;
								     }
								     ,true);
						     
						     var html = ich.generalTransactionQuickViewDialog_TMP(btnData);
						     quickmenuReportsTransactionViewDialog(html, {title:dialogtitle});
						 });
				  });
                    });
         });
    };
    
    console.log("renderTransactionsDetailTable");
    var dropdownGroup = $("#groupsdown");
    var dropdownStore = $("#storesdown");
    
    if(!_.isEmpty($("#dateFrom").val()) && !_.isEmpty($("#dateTo").val())) {
	var startDate = new Date($("#dateFrom").val());
	var endDate = new Date($("#dateTo").val());
	var endDateForQuery = new Date($("#dateTo").val());
	endDateForQuery.addDays(1);
	
	var sd = $("#storesdown option:selected");
	ids =[{id:sd.val(), name:sd.text()}];
	
	console.log(ids);
	
	startDate = startDate.toArray().slice(0,3);
	endDateForQuery = endDateForQuery.toArray().slice(0,3);
	
	transactionsReportDaySummaryFetcher(startDate,endDateForQuery)
	([_.first(ids).id])
	(function(err,resp){
	     var formattedTemplateData = _.prewalk(transactionFormattingWalk,resp);
	     $("#transactionssummarytable").html(ich.transactionsSummaryTable_TMP({list:formattedTemplateData.transactions,total:formattedTemplateData.total}));
	     
	     _.each(resp.transactions,function(item){
			var row = $("#"+item.dateString);
			row.click(function(){
				      var startDate = item.date;
				      var endDate = date_array.inc_day(startDate);
				      renderTransactionDetail(startDate,endDate,{id:_.first(ids).id});
				  });
		    });
	 });
    } 
};