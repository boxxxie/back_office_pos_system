var menuReportsTaxCollectedRouter =
    new (Backbone.Router.extend(
	     {routes: {
	     	  "reports/tax_collected":"menuReportsCompanyTaxes"
	      },
	      menuReportsCompanyTaxes:function() {
		  console.log("menuReportsCompanyTaxes  ");
	      }
	     }));

var menuReportsTaxCollectedView =
    Backbone.View.extend(
	{initialize:function(){
	     var view = this;
	     view.el = $("#main");

	     _.bindAll(view, 'renderMenuReportsCompanyTaxes');
	     menuReportsTaxCollectedRouter
		 .bind('route:menuReportsCompanyTaxes',
		       function(){
			   console.log("menuReportsView, route:menuReportsCompanyTaxes");
			   view.renderMenuReportsCompanyTaxes();
		       });
	 },
	 renderMenuReportsCompanyTaxes: function() {
	     var html = ich.taxCollectedReports_TMP(autoBreadCrumb());
	     $(this.el).html(html);
	     resetDatePicker();
             resetDropdownBox(ReportData, true, true);
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderTaxCollectedTable();
			});
	     console.log("rendered general report");
	 }
	});

/******************************************** helper functions ************************************/
function renderTaxCollectedTable() {
    console.log("renderTaxCollectedTable");

    var dropdownGroup = $("#groupsdown");
    var dropdownStore = $("#storesdown");
    var dropdownTerminal = $("#terminalsdown");

    if(!_.isEmpty($("#dateFrom").val()) && !_.isEmpty($("#dateTo").val())) {
	var startDate = new Date($("#dateFrom").val());
	var endDate = new Date($("#dateTo").val());
	var endDateForQuery = new Date($("#dateTo").val());
	endDateForQuery.addDays(1);

	var ids;

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

	taxReportFetcher(ids,startDate,endDateForQuery,function(data_TMP){
			     //TODO: to be refracted
			     var totalrow={};
			     totalrow.sales = (_.reduce(data_TMP, function(init, item){
							    return init + Number(item.sales);
							}, 0)).toFixed(2);
			     totalrow.tax1 = (_.reduce(data_TMP, function(init, item){
							   return init + Number(item.tax1);
						       }, 0)).toFixed(2);
			     totalrow.tax3 = (_.reduce(data_TMP, function(init, item){
							   return init + Number(item.tax3);
						       }, 0)).toFixed(2);
			     totalrow.totalsales = (_.reduce(data_TMP, function(init, item){
								 return init + Number(item.totalsales);
							     }, 0)).toFixed(2);

			     data_TMP=
				 _.map(data_TMP, function(item){
					   item._id = item.id;
					   return item;
				       });
			     data_TMP = _.applyToValues(data_TMP,toFixed(2),true);


			     _.applyToValues(data_TMP, function(obj){
						 var strObj = obj+"";
						 if(strObj.indexOf(".")>=0) {
					     	     obj = currency_format(Number(obj));
						 }
						 return obj;
					     }, true);
			     _.applyToValues(totalrow, function(obj){
						 var strObj = obj+"";
						 if(strObj.indexOf(".")>=0) {
					     	     obj = currency_format(Number(obj));
						 }
						 return obj;
					     }, true);

			     data_TMP = appendGroupStoreInfoFromTerminalID(data_TMP);

			     var html = ich.taxCollectedtable_TMP({items:data_TMP, totalrow:totalrow});


			     $("#taxcollectedtable").html(html);
			     _.each(data_TMP, function(item){
					var btn = $('#'+item._id)
					    .button()
					    .click(function(){
					    	       var dialogtitle= getDialogTitle(ReportData,
										     item,
										     startDate,
										     endDateForQuery);
						       var firstindex = Number(item.firstindex)+"";
			     			       var lastindex = Number(item.lastindex)+"";
						       quickTaxView(item._id,dialogtitle ,firstindex,lastindex);
						   });
				    });
			 });

    } else {
   	alert("Input Date");
    }
};

function appendGroupStoreInfoFromTerminalID(list) {

    function getStoreIdFromTerminalId(obj, terminal_id){
	var storeid;
	_.prewalk(function(o){
		      if(o && o.terminals){
			  if(_.find(o.terminals, function(terminal){ return terminal.terminal_id == terminal_id;})) {
			      storeid = o.store_id;
			  }
		      }
		      return o;
		  },obj);
	return storeid;
    };

    list = _.map(list, function(item){
		     return _.extend({},item,{store_id:getStoreIdFromTerminalId(ReportData,item.id)});
		 });

    return appendGroupStoreInfoFromStoreID(list);
};