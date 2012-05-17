var hourly_report_router =
    general_report_router.extend(
	{
	    export_csv:function(callback){
		function convert_to_array(hourly_report){
		    return _.map(hourly_report.hours,
			    function(hour){
				return [
				    hour.timerange,
				    hour.sale_transactions,
				    hour.refund_transactions,
				    hour.menu_sales,
				    hour.inventory_sales,
				    hour.ecr_sales,
				    hour.total_sales,
				    hour.avg_sales
				]
			    })
		}
		callback(convert_to_array,'hourly_activity_report')
	    },
	    fetch_inventory_report:function(callback) {

		var router = this;
		var start_date = _.first(router.startDate.toArray(),4);
		var end_date = _.first(router.endDate.toArray(),4);

		hourlyReportFetcher(router.selected_entity,start_date,end_date)
		(function(err,response){
		     function report_currency_formatter(o){
			 if(_.isObj(o)){
			     return _.map$(o,function(kv){
					  var key = kv[0];
					  var val = kv[1];
					  if(/sales/.test(key)){
					      return [key,currency_format(val)]
					  }
					  else{return [key,val]}
				      })
			 }
			 return o;
		     }
		     (callback(_.prewalk(report_currency_formatter,
					 {totals:response.totals,
					  hours:_.toArray(response.hours)}
					)));

		 });
	    }
	})

new hourly_report_router(
    {
	route : new RegExp("reports/hourly_activity"),
	report_table_template:'hourlyActivitytable_TMP',
	template:"report_TMP",
	title:'Hourly Activity Report'
    });