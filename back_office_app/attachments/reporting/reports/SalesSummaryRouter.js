var sales_summary_report_router =
    general_report_router.extend(
	{
	    export_csv:function(callback){
		console.log('export sales summary report')
		function convert_to_array(sales_summary_report){
		    return _.map(sales_summary_report.list,function(cashout){
				return [
				    cashout.groupName,
				    cashout.storeName,
				    cashout.storeNumber,
				    cashout.summary.numberoftransactions,
				    cashout.summary.sales,
				    cashout.summary.tax1,
				    cashout.summary.tax3,
				    cashout.summary.totalsales,
				    cashout.summary.cash,
				    cashout.summary.credit,
				    cashout.summary.debit,
				    cashout.summary.mobile,
				    cashout.summary.other
				]
			    })
		}
		callback(convert_to_array,'sales_summary_report')
	    },
	    fetch_inventory_report:function(callback) {
		function extractSalesSummaryTableInfo(cashouts) {
		    var entities = _(reportDataToArray(ReportData)).mapRenameKeys('number','storeNumber')
		    var cashout_summaries = _.map(cashouts, function(cashout){
						    var store_id = cashout.id
						    var store_info = _.find(entities,function(entity){return _.find(entity,function(val){return val === cashout.id})})
						    var sales_summary = getSummarySales(cashout.period)
						    return _.combine(store_info,
								{summary:sales_summary});
						})

		    var totals = _.chain(cashout_summaries)
			.pluck('summary')
			.reduce(_.add,{})
			.value()

		    var template_data = {
			totals:currency_formatter(totals),
			list:_.map(cashout_summaries,
				   function(cashout_report){
				       var formatted_summary = currency_formatter(cashout_report.summary)
				       return _.combine(cashout_report,{summary:formatted_summary})
				   })
		    }
		    return template_data
		};
		var router = this
		var start_date = router.startDate
		var end_date = router.endDate
		var store_ids = stores_from_id(router.selected_entity,ReportData)
		cashoutFetcher_Period(store_ids,start_date,end_date,
				      function(err,response){
	      				  var template_data = extractSalesSummaryTableInfo(response);
					  callback(template_data);
				      });
	    }
	})

new sales_summary_report_router(
    {
	route : new RegExp('reports/sales_summary'),
	report_table_template:'salesSummarytable_TMP',
	template:"report_TMP",
	title:'Sales Summary Report'
    });
