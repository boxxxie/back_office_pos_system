(new (Backbone.Router.extend(
	  {routes: {
	       "reports/":"setup"
	   },
	   menu_options:{
	       sales_summay:{title:'Sales Summary',link:'sales_summary',img:'salessummary.png'},
	       sales_details:{title:'Sales Detail',link:'sales_details',img:'salesdetails.png'},
	       how_are_we_doing_today:{title:'How Are We Doing Today',link:'how_are_we_doing_today',img:'howarewedoingtoday.png'},
	       hourly_activity:{img:"hourlyactivity.png",title:'Hourly Activity',link:'hourly_activity'},
	       electronic_payments:{img:'epayment.png',title:'Electronic Payments',link:'electronic_payments'},
	       tax_collected:{img:'tax.png',title:'Tax Collected',link:'tax_collected'},
	       cash_outs:{img:'cashouts.png',title:'Cash Outs',link:'cash_outs'},
	       transactions_detail:{img:'transactionsdetails.png',title:'Transactions Detail',link:'transactions_detail'},
	       cancelled_transactions:{img:'cancelledtransactions.png',title:'Cancelled Transactions',link:'cancelled_transactions'},
	       refunds:{img:'refunds.png',title:'Refunds',link:'refunds'},
	       discounts:{img:'discounts.png',title:'Discounts',link:'discounts'},
	       voucher_history:{img:"voucherhistory.png",title:'Voucher History',link:'voucher_history'}
	   },
	   render:function(template_data){
	       var html = ich.menuReports_TMP(template_data);
	       $("#main").html(html);
	   },
	   setup:multimethod()
	   .dispatch(function(){
			 return topLevelEntity(ReportData).type;
		     })
	   .when('company',function(){
		     var options_list = _.toArray(this.menu_options);
		     var template_data = _.extend(autoBreadCrumb(),{options:options_list});
		     this.render(template_data);
		 })
	   .when('group',function(){
		     var options_list = _.chain(this.menu_options).removeKeys('voucher_history').toArray().value();
		     var template_data = _.extend(autoBreadCrumb(),{options:options_list});
		     this.render(template_data);
		 })
	   .when('store',function(){
		     var options_list = _.chain(this.menu_options).removeKeys('voucher_history').toArray().value();
		     var template_data = _.extend(autoBreadCrumb(),{options:options_list});
		     this.render(template_data);
		 })
	  })));
