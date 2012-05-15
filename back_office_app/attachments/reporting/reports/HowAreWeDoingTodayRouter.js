
/*************************************** company level : How Are We Doing Today ******************************/
var menuReportsHowAreWeDoingTodayCompanyRouter =
    new (Backbone.Router.extend(
	     {routes: {
		  "reports/how_are_we_doing_today" : "mainRender",
		  "reports/how_are_we_doing_today/group/:group_name" :"renderStores",
		  "reports/how_are_we_doing_today/store/:store_name" :"renderTerminals"
	      },

	      mainRender:function() {
	     	  var entity = topLevelEntity(ReportData);
		  renderHowAreWeTable(entity.id,function(template_data){
					  $('#main').html(template_data);
				      })
	      },
	      renderStores:function(group_name) {
		  get_id_from_name(ReportData,group_name)
		  (function(id){
		       renderHowAreWeTable(id,function(template_data){
					       $('#main').html(template_data);
					   })
		   });
	     	  console.log("HowAreWeCompany_storesTable");
	      },
	      renderTerminals:function(store_name_with_number) {
		  var store_name = _.str.trim(store_name_with_number.split('(')[0]);
		  get_id_from_name(ReportData,store_name)
		  (function(id){
		       renderHowAreWeTable(id,function(template_data){
					       $('#main').html(template_data);
					   })
		   });
	     	  console.log("HowAreWeCompany_terminalsTable");
	      }
	     }));


/********************************************* helper functions *******************************************/

function renderHowAreWeTable(id,callback) {
    var parent_info = entity_from_id(ReportData,id);
    var child_type = child_type_of(parent_info.type);
    var children = entities_info_from_id(ReportData,id,child_type);
    var breadcrumb = parent_info;

    howAreWeDoingTodayReportFetcher(children, parent_info.id)
    (function(response){
	 function convert_decimal_to_num(o){
	     function isDecimal(str){
		 return /\d*\.\d+/.test(str);
	     }
	     var num = Number(o)
	     if(!isDecimal(o) || isNaN(num)){
		 return o;
	     }
	     return num;
	 }
	 var stats_numeric = _.prewalk(convert_decimal_to_num,response)

	 var children_stats = _.map(stats_numeric.items,
			       function(item){
				   return _.combine(item,
					       {origin_sales:
						{total:
						 item.origin_sales.menu +
						 item.origin_sales.ecr +
						 item.origin_sales.scan}},
					       {origin_refunds:
						{total:
						 item.origin_refunds.menu +
						 item.origin_refunds.ecr +
						 item.origin_refunds.scan}},
					       {linkaddress:"#reports/how_are_we_doing_today/"+child_type+"/" + item.name })
			       });
	 var parent_stats ={
	     total:{
		 origin_sales:{
		     total: _.chain(stats_numeric.total.origin_sales)
			 .pick('menu','ecr','scan')
			 .values()
			 .reduce(sum,0)
			 .value()
		 },
		 origin_refunds:{
		     total: _.chain(stats_numeric.total.origin_refunds)
			 .pick('menu','ecr','scan')
			 .values()
			 .reduce(sum,0)
			 .value()
		 }
	     }
	 }
	 var template_data =
	     _.combine(
		 stats_numeric,
		 parent_stats,
		 {items:children_stats},
		 breadCrumb,
		 {namefield:_.str.capitalize(child_type)});

	 var formatted_template_data = _.prewalk(currency_format,template_data);

	 callback(ich.generaltable_HowAreWeToday_TMP(formatted_template_data));
     });
}
