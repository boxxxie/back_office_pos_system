var voucherHistoryView =
    Backbone.View.extend({
			     events:{
				 'click #generalgobtn':'generateReport',
				 'click .btndetails':'trigger_render_dialog',
				 'change #vouchersdown' : 'render_filtered_table'
			     },
			     initialize:function() {
    				 var view = this;
			     },
			     setup:function() {
			         var view = this;
			         $("#generalgobtn").button();
			     },
			     generateReport:function() {
			         var view = this;
			         var dropdownGroup = $("#groupsdown");
				 var dropdownStore = $("#storesdown");
				 var dropdownTerminal = $("#terminalsdown");
				 var voucherdown =$("#vouchersdown :selected");

				 if(!_.isEmpty($("#dateFrom").val()) && !_.isEmpty($("#dateTo").val())) {
				     var startDate = new Date($("#dateFrom").val());
				     var endDate = new Date($("#dateTo").val());
				     var endDateForQuery = new Date($("#dateTo").val());
				     endDateForQuery.addDays(1);

				     // this group/store/terminal dropdown boxes are hidden
				     // because this report is always company level so it doesn't need to be shown
				     // this ids is used for terminal name
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

				     // voucher report is always company level
				     otherTransactionsRangeFetcher(ReportData.company._id, startDate, endDateForQuery)
				     (function(err,resp){
					  if(!err) {
					      console.log("success fetch voucher");
					      console.log(resp);

					      var data_TMP = processTransactionsTMP(resp);

					      data_TMP = _.map(data_TMP,function(item){
								   var found_idname_pair = _.find(ids, function(idname){
												    return idname.id == item.terminal_id;
												});
								   return _.extend(item,{name:found_idname_pair.name});
							       });

					      view.trigger('update_vouchers_data',data_TMP);

					      var option = $("#vouchersdown").val();
					      view.trigger('render_filtered_table',option);
					  }
				      });
				 } else {
				     alert("Input Date");
				 }
			     },
			     render_filtered_table:function(event) {
				 this.trigger('render_filtered_table',event.currentTarget.value);
			     },
			     render_table:function(data) {
			         var totalrow = {};
				 totalrow.redeemed = currency_format(_.reduce(data, function(init, item){
										  return init + Number(item.voucherRedeemed);
									      }, 0));

				 var data_TMP = _.sortBy(data,function(item){return item.time.start;});
				 var html = ich.menuReportsVouchertable_TMP({items:data_TMP, totalrow:totalrow});

				 $("#voucherstable").html(html);
				 $(".btndetails").button();
			     },
			     trigger_render_dialog:function(event) {
			         var view = this;
			         var trans_id = event.currentTarget.id;
			         view.trigger('render_dialog',trans_id);
			     },
			     render_dialog:function(transData) {
			         var dialogtitle=getDialogTitle(ReportData,transData);

			         var btnData = transData;
				 btnData.discount=null;
				 _.applyToValues(ReportData,
						 function(o){
						     if(o.store_id==btnData.store_id){
							 btnData.storename = o.storeName;
						     }
						     return o;
						 }
						 ,true);

				 _.applyToValues(btnData,currency_format,true);

				 var html = ich.generalTransactionQuickViewDialog_TMP(btnData);
				 quickmenuReportsTransactionViewDialog(html, {title:dialogtitle});
			     }
			 });

var voucherHistoryRouter =
    new (Backbone.Router.extend({
				    routes: {
					"reports/voucher_history":"_setup"
				    },
				    initialize:function() {
					var router = this;
					router.view = new voucherHistoryView();
					router.vouchers_data= undefined;

					router.view.on('update_vouchers_data',router.update_vouchers_data,router);
					router.view.on('render_filtered_table',router.render_filtered_table,router);
					router.view.on('render_dialog',router.render_dialog,router);
				    },
				    _setup:function() {
					var router = this;
					router.vouchers_data= undefined;
					var html = ich.voucherHistoryReports_TMP(autoBreadCrumb());
					$("#main").html(html);

					resetDatePicker();
					resetDropdownBox(ReportData, true, true);
					$("#ulhierarchy").hide(); // this is always be company level , this is for getting terminal name

					this.view.setElement("#main").setup();
				    },
				    update_vouchers_data:function(data) {
					var router = this;
					router.vouchers_data = data;
				    },
				    render_filtered_table:function(option){
					//options "0" : all, "1" : Balance > 0 , "2" : Balance = 0
					var router = this;
					var data = router.vouchers_data;
					var filtered_data = data; //default

					if(data) {
					    switch(Number(option)) {
					    case 0:
						filtered_data = data;
						break;

					    case 1:
						filtered_data = _.filter(data,function(item){
									     return Number(item.voucherBalance) != 0;
									 });
						break;

					    case 2:
						filtered_data = _.filter(data,function(item){
									     return Number(item.voucherBalance)==0;
									 });
						break;
					    }
					    router.view.render_table(filtered_data);
					}
				    },
				    render_dialog:function(transaction_id) {
					var router = this;
					var foundTrans = _.find(router.vouchers_data, function(item){
								  return item._id == transaction_id;
							      });
					router.view.render_dialog(foundTrans);
				    }
				}));
