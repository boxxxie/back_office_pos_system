var menuReportsRefundsRouter =
    new (Backbone.Router.extend(
	     {routes: {
		  "reports/refunds":"menuReportsCompanyRefunds"
	      },
	      menuReportsCompanyRefunds:function() {
		  console.log("menuReportsCompanyRefunds  ");
	      }
	     }));

var menuReportsRefundsView =
    Backbone.View.extend(
	{initialize:function(){
	     var view = this;
	     view.el = $("#main");

	     _.bindAll(view, 'renderMenuReportsCompanyRefunds');
	     menuReportsRefundsRouter
		 .bind('route:menuReportsCompanyRefunds',
		       function(){
			   console.log("menuReportsView, route:menuReportsCompanyRefunds");
			   view.renderMenuReportsCompanyRefunds();
		       });
	 },
	 renderMenuReportsCompanyRefunds: function() {
	     var html = ich.menuReportsRefundsReports_TMP(autoBreadCrumb());
	     $(this.el).html(html);
	     resetDatePicker();
             resetDropdownBox(ReportData, true, true);
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderRefundsTable();
			});
	     console.log("rendered general report");
	 }
	});

/******************************************** helper functions ************************************/
function renderRefundsTable() {
    console.log("renderRefundsTable");

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

	refundTransactionsFromCashoutsFetcher(ids,startDate,endDateForQuery)
	(function(err,data_TMP){

	     var totalrow = {};
	     totalrow.numofrefund = data_TMP.length + "";
	     totalrow.subTotal = currency_format(_.reduce(data_TMP, function(init, item){
							      return init + Number(item.subTotal);
							  }, 0));
	     totalrow.tax1and2 = currency_format(_.reduce(data_TMP, function(init, item){
							      return init + Number(item.tax1and2);
							  }, 0));
	     totalrow.tax3 = currency_format(_.reduce(data_TMP, function(init, item){
							  return init + Number(item.tax3);
						      }, 0));
	     totalrow.total = currency_format(_.reduce(data_TMP, function(init, item){
							   return init + Number(item.total);
						       }, 0));


	     data_TMP = processTransactionsTMP(data_TMP);

	     var html = ich.menuReportsRefundstable_TMP({items:_.sortBy(data_TMP,function(datum){return datum.date}).reverse(), totalrow:totalrow});


	     $("#refundstable").html(html);

	     _.each(data_TMP, function(item){
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

    } else {
   	alert("Input Date");
    }
};
