function range_of_dates(start_date,end_date){
    var dayCounter = start_date.clone();
    var daysList = [dayCounter.clone()];
    while(Date.compare(dayCounter.addDays(1),end_date) !== 1){
	daysList.push(dayCounter.clone());
    }
    return daysList;
}
var sales_details_report_router =
    general_report_router.extend(
	{
	    export_csv:function(callback){
		console.log('export sales details report')

		function convert_to_array(report){
		    function detail_part_to_array(report_item,detail_part){
			return [
			    report_item.date,
			    report_item.groupName,
			    report_item.storeName,
			    report_item.storeNumber,
			    detail_part,
			    report_item[detail_part].numberoftransactions,
			    report_item[detail_part].sales,
			    report_item[detail_part].tax1,
			    report_item[detail_part].tax3,
			    report_item[detail_part].totalsales,
			    report_item[detail_part].cash,
			    report_item[detail_part].credit,
			    report_item[detail_part].debit,
			    report_item[detail_part].mobile,
			    report_item[detail_part].other
			];
		    }
		    return _.chain(report.list)
			.map(function(report_item){
				 return [
				     detail_part_to_array(report_item,'sales'),
				     detail_part_to_array(report_item,'refunds'),
				     detail_part_to_array(report_item,'totals'),
				 ]
			     })
			.flatten(true) //this is a flatten of 1 level, it acts as mapcat in other languages
			.value();
		}
		callback(convert_to_array,'sales_details_report')
	    },
	    fetch_inventory_report:function(callback) {
		function extractTableInfo(cashouts) {
		    var entities = _(reportDataToArray(ReportData)).mapRenameKeys('number','storeNumber');
		    var cashout_summaries = _.map(cashouts, function(cashout){
						    var store_id = cashout.id
						    var store_info = _.chain(entities)
							.find(function(entity){return _.find(entity,function(val){return val === cashout.id})})
							.pick('storeNumber','storeName','groupName')
							.value();
						    var sales_info = cashout_sales_part(cashout.period);
						    var refund_info = cashout_refund_part(cashout.period);
						    var totals = cashout_total(cashout.period);
						    return _.combine(store_info,
								{
								    date:cashout.date,
								    refunds:refund_info,
								    sales:sales_info,
								    totals:totals
								});
						})

		    var totals = _.chain(cashout_summaries)
			.pluck('totals')
			.reduce(_.add,{})
			.value()

		    var template_data = {
			totals:currency_formatter(totals),
			list:_.map(cashout_summaries,
				   function(cashout_report){
				       var formatted_fields = {
					   refunds:currency_formatter(cashout_report.refunds),
					   sales:currency_formatter(cashout_report.sales),
					   totals:currency_formatter(cashout_report.totals)
				       };
				       return _.combine(cashout_report,formatted_fields)
				   })
		    }
		    return template_data
		};
		var router = this;
		var start_date = router.startDate;
		var end_date = router.endDate;
		var store_ids = storeIDs_from_id(ReportData,router.selected_entity);
		var daysList = range_of_dates(start_date,end_date);

		async.map(daysList,
			  function(day,callback){
			      var next_day = day.clone().addDays(1);
			      cashoutFetcher_Period(store_ids,day,next_day,
						    function(err,data){
							var withDates = _(data).mapCombine({date:datePartFormatter(day)});
							callback(err,withDates);
						    });
			  },
			  function(a,nested_cashouts){
	      		      var cashouts = _(nested_cashouts).flatten();
			      callback(extractTableInfo(cashouts));
			  });
	    }
	});

new sales_details_report_router(
    {
	route : new RegExp('reports/sales_details'),
	report_table_template:'salesDetailtable_TMP',
	template:"report_TMP",
	title:'Sales Details Report'
    });