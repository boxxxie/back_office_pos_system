function negate(num){
    if(_.isNumber(num)){
	return -num;
    }
    return num;
}
function inventoryChangeLog(id){
    var view = cdb.view('app','change_log');
    var db = cdb.db('inventory_changes',{},true);
    var query = _async.generalKeyQuery(view,db)(id);
    return function(callback){
	query(function(err,response){
		  var inventoryChangeLog = _.chain(response.rows)
  		      .pluck('doc')
		      .map(function(item){
			       return _.extend({},
					  item.inventory, //todo, make a helper function that is the inverse of nest
					  {locations:item.ids},
					  {_id:item._id});})
		      .value();
		  callback(err,inventoryChangeLog);
	      });
    };
}
function inventoryChangeLogCompressedBy(id,field,compressFn){
    function date(item){
	return (new Date(item.date)).getTime();}
    return function(callback){
	inventoryChangeLog(id)
	(function(err,inventoryChangeLogResp){
	     var compressedInventoryChangeLog =
		 _.chain(inventoryChangeLogResp)
		 .groupBy('upccode')
		 .map(function(invItems){
			  return _.chain(invItems)
			      .sortBy(date)
			      .compress(compressFn)
			      .value();
		      })
		 .flatten()
		 .filter(_.has_F(field))
		 .sortBy(date)
		 .reverse()
		 .value();
	     callback(err,compressedInventoryChangeLog);
	 });
    };
}
function inventoryTaxChangeLog_fetch(id){
    function sameTaxes(item1,item2){
        return (_.isDefined(item1.apply_taxes)
	   && _.isDefined(item2.apply_taxes)
	   && _.isEqual(item1.apply_taxes, item2.apply_taxes));
    }
    return inventoryChangeLogCompressedBy(id,"apply_taxes",sameTaxes);
}
function inventoryPriceChangeLog_fetch(id){
    function samePrice(item1,item2){
        return (_.isDefined(item1.price)
	   && _.isDefined(item2.pric)
	   && item1.price.selling_price == item2.price.selling_price);
    }
    return inventoryChangeLogCompressedBy(id,"price",samePrice);
}
function currentInventoryFor(id){
    var view = cdb.view('app','id_upc_latestDate');
    var db = cdb.db('inventory',{},true);
    var query = _async.generalKeyGroupQuery(view,db)(2)(id);
    return function(callback){
	query(function(err,response){
		  var inventory = _.pluck(response.rows,'value');
		  callback(err,inventory);
	      });
    };
}
function inventoryTotalsRangeFetcher_F(id){
    var view = cdb.view('reporting','inventory_report');
    var db = cdb.db('cashedout_transactions',{},true);
    return function(startDate,endDate){
	var rangeQuery = _async.typedTransactionQuery(startDate,endDate);
	var rangeGroupedQuery = _async.transactionRangeGroupedQuery(startDate,endDate);

	return function(callback){
	    async.parallel(
		{
		    total_menu_sale : rangeQuery(view,db,[id,"SALE","MENU"]),
		    total_menu_refund : rangeQuery(view,db,[id,"REFUND","MENU"]),
		    all_menu_sales : rangeGroupedQuery(view,db,[id,"SALE","MENU"]),
		    all_menu_refunds : rangeGroupedQuery(view,db,[id,"REFUND","MENU"]),

		    total_scan_sale : rangeQuery(view,db,[id,"SALE","INVENTORY"]),
		    total_scan_refund : rangeQuery(view,db,[id,"REFUND","INVENTORY"]),
		    all_scan_sales : rangeGroupedQuery(view,db,[id,"SALE","INVENTORY"]),
		    all_scan_refunds : rangeGroupedQuery(view,db,[id,"REFUND","INVENTORY"]),

		    total_department_sale : rangeQuery(view,db,[id,"SALE","DEPARTMENT"]),
		    total_department_refund : rangeQuery(view,db,[id,"REFUND","DEPARTMENT"]),
		    all_department_sales : rangeGroupedQuery(view,db,[id,"SALE","DEPARTMENT"]),
		    all_department_refunds : rangeGroupedQuery(view,db,[id,"REFUND","DEPARTMENT"]),

		    total_scale_sale : rangeQuery(view,db,[id,"SALE","SCALE"]),
		    total_scale_refund : rangeQuery(view,db,[id,"REFUND","SCALE"]),
		    all_scale_sales : rangeGroupedQuery(view,db,[id,"SALE","SCALE"]),
		    all_scale_refunds : rangeGroupedQuery(view,db,[id,"REFUND","SCALE"]),


		    total_ecr_sale : rangeQuery(view,db,[id,"SALE","ECR"]),
		    total_ecr_refund : rangeQuery(view,db,[id,"REFUND","ECR"]),
		    all_ecr_sales : rangeGroupedQuery(view,db,[id,"SALE","ECR"]),
		    all_ecr_refunds : rangeGroupedQuery(view,db,[id,"REFUND","ECR"])

		},
		function(err,raw_resp){
		    function inventory_transform(items){
			function reduceValue(val,key){
			    var reducedVal = _(val).
				chain().
				mapSelectKeys('price','quantity').
				reduce(_.addPropertiesTogether,{}).
				value();
			    return _.extend({label:key},reducedVal);
			}

			var out = _(items).chain()
			    .map(function(item){
				     return _.extend({label : _(item.key).last()},item.value);
				 })
			    .groupBy(function(item){
					 return item.label;
				     })
			    .map(reduceValue)
			    .value();
			return out;
		    }
		    function totals_list(sales,refunds,typedSales,totalSales){
			function applyPercentages(typedSales,totalSales){
			    return function(item){
				if(typedSales == 0){
				    var typedPercentage = 0;
				}
				else{
				    var typedPercentage = item.totals.price/typedSales * 100;
				    var typedPercentage_rounded = Number(toFixed(2)(typedPercentage));
				}
				if(totalSales == 0){
				    var totalSalesPercentage = 0;
				}
				else{
				    var totalSalesPercentage = item.totals.price/totalSales * 100;
				    var totalSalesPercentage_rounded =  Number(toFixed(2)(totalSalesPercentage));
				}
				return _.extend({},item,{typedSalesPercentage: typedPercentage, totalSalesPercentage: totalSalesPercentage});
			    };
			}
			sales = sales.rows;
			refunds = _.applyToValues(refunds.rows,negate,true);
			var totals_labeled = _.map(inventory_transform(sales.concat(refunds)),function(item){ return _.nest(item,['price','quantity'],'totals');});
			var sales_labeled = _.map(inventory_transform(sales),function(item){ return _.nest(item,['price','quantity'],'sales');});
			var refunds_labeled = _.map(inventory_transform(refunds),function(item){ return _.nest(item,['price','quantity'],'refunds');});

			return _([])
			    .chain()
			    .concat(totals_labeled, sales_labeled, refunds_labeled)
			    .groupBy('label')
			    .mapMerge()
			    .map(applyPercentages(typedSales,totalSales))
			    .value();
		    }
		    function totals(sales,refunds){
			function defaultValue(o){
			    if(_.isEmpty(o.rows)){
				return {price:0,quantity:0};
			    }
			    else{
				return o.rows[0].value;
			    }
			}
			var salesVal = defaultValue(sales);
			var refundsVal =_.applyToValues(defaultValue(refunds),negate);
			return _([salesVal,refundsVal]).reduce(_.addPropertiesTogether,{});
		    }

		    function fillEmptyValue(total) {
			var returnVal = _.combine({},total);
			if(_.isEmpty(returnVal.sales)) {
			    returnVal.sales = {price:0.00,quantity:0};
			}
			if(_.isEmpty(returnVal.refunds)) {
			    returnVal.refunds = {price:0.00,quantity:0};
			}
			if(_.isEmpty(returnVal.totals)) {
			    returnVal.totals = {price:0.00,quantity:0};
			}
			if(!_.isNumber(returnVal.totalSalesPercentage)) {
			    returnVal.totalSalesPercentage = 0;
			}
			if(!_.isNumber(returnVal.typedSalesPercentage)) {
			    returnVal.typedSalesPercentage = 0;
			}
			return returnVal;
		    }

		    var resp = raw_resp;

		    var ecr_sales = _.reduce([totals(resp.total_department_sale,resp.total_department_refund),
					    totals(resp.total_scale_sale,resp.total_scale_refund),
					    totals(resp.total_ecr_sale,resp.total_ecr_refund)],
					   _.addPropertiesTogether,
					   {});

		    var menu_sales=totals(resp.total_menu_sale,resp.total_menu_refund);
		    var scan_sales=totals(resp.total_scan_sale,resp.total_scan_refund);

		    var totalSales = _.reduce([menu_sales,scan_sales,ecr_sales],_.addPropertiesTogether,{}).price;

		    var menu_sales_list = totals_list(resp.all_menu_sales,resp.all_menu_refunds,menu_sales.price,totalSales);
		    var menu_sales_totals = fillEmptyValue(_.reduce(menu_sales_list,_.addPropertiesTogether,{}));


		    var scan_sales_list =_(totals_list(resp.all_scan_sales,resp.all_scan_refunds,scan_sales.price,totalSales))
			.map(function(scan){
				 var labels = scan.label.split('-');
				 var upc = _.str.trim(_.first(labels));
				 var description =  _.str.trim(_.second(labels));
				 return _.extend({},scan,{upc: upc, label:description});
			     });

		    var scan_sales_totals = fillEmptyValue(_.reduce(scan_sales_list,_.addPropertiesTogether,{}));

		    var ecr_sales_list =totals_list(resp.all_ecr_sales,
						  resp.all_ecr_refunds,
						  ecr_sales.price,totalSales);
		    var department_sales_list=totals_list(resp.all_department_sales,
							resp.all_department_refunds,
							ecr_sales.price,totalSales);
		    var scale_sales_list=totals_list(resp.all_scale_sales,
						   resp.all_scale_refunds,
						   ecr_sales.price,totalSales);

		    var ecr_sales_totals = fillEmptyValue(_.reduce(ecr_sales_list.concat(department_sales_list).concat(scale_sales_list),
								 _.addPropertiesTogether,{}));

		    var scale_sales_list_formatted = _.prewalk(function(obj){
								 if(obj && obj.quantity){
								     return _.extend(obj,{quantity:obj.quantity.toFixed(3)});
								 }
								 return obj;
							     },
							     scale_sales_list);
		    function applyDefaultSalesFields(list){
			function applyDefault_sales_refunds(item){
			    return _.defaults(item,{sales:{price:0,quantity:0},refunds:{price:0,quantity:0}});
			}
			return _.map(list,applyDefault_sales_refunds);
		    }

		    var forTMP = {
			menu_sales_list: applyDefaultSalesFields(menu_sales_list),
			menu_list_totals:menu_sales_totals,
			menu_sales:menu_sales,

			scan_sales_list:applyDefaultSalesFields(scan_sales_list),
			scan_list_totals:scan_sales_totals,
			scan_sales:scan_sales,

			department_sales_list:applyDefaultSalesFields(department_sales_list),

			scale_sales_list:applyDefaultSalesFields(scale_sales_list_formatted),

			ecr_sales_list:applyDefaultSalesFields(ecr_sales_list),
			ecr_list_totals:ecr_sales_totals,

			ecr_sales:ecr_sales
		    };

		    var priceFormatedTMP = _(forTMP).chain()
			.applyToValues(function(item){
					   if(item.price){
					       return _.extend({},item,{price:currency_format(item.price)});
					   }
					   return item;
				       },true)
			.applyToValues(function(item){
					   if(_.isNumber(item.quantity)){
					       return _.extend({},item,{quantity:item.quantity+""});
					   }
					   return item;
				       },true)
			.applyToValues(toFixed(2),true)
			.value();

		    callback(err,priceFormatedTMP);
		});
	};
    };
}


/*********************************** IDLE INVENTORY REPORT ******************************************/
function stockInventoryFetcher_F(id, originids) {
    var upcview = cdb.view("app","locid_upc");
    var stockview = cdb.view("app","stock_locid_upc");
    var db_inventory = cdb.db("inventory");
    var inventory_sold_view = cdb.view("reporting","inventory_sold");
    var db_transactions = cdb.db("transactions");

    var invQuery = _async.generalKeyQuery(upcview,db_inventory);
    var stockQuery = _async.generalKeyQuery(stockview,db_inventory);
    var transQuery = _async.generalQuery(inventory_sold_view,db_transactions);

    var optionsForQty = {
        group: true,
        group_level:1,
        startkey: ([]).concat(id),
        endkey: ([]).concat(id).concat({}),
        limit:1
    };

    return function(callback){
        async.parallel({
			   invlist : invQuery(id),
			   stocklist : stockQuery(id),
			   soldlist : transQuery(optionsForQty)
		       },
		       function(err,resp) {
			   function extractSoldList(value) {
			       // values -> {"1234" :{qty:12}, "45613" : {qty:1}}
			       // return value -> [Object { upc="1234", info={qty,date}}, Object { upc="45613", info={...}}]
			       return _.map(_.first(value),function(v,k){ return {upc:k, info:v};});
			   };

			   var invlist = _.pluck(resp.invlist.rows, "value");
			   var stocklist = _.pluck(resp.stocklist.rows, "value");
			   var stockDoclist = _.pluck(resp.stocklist.rows, "doc");
			   var invDoclist = _.pluck(resp.invlist.rows, "doc");
			   var soldlist = extractSoldList(_.pluck(resp.soldlist.rows, "value"));

			   var stockDocListOverInvDoc =
			       _.chain(stocklist)
			       .matchTo(invDoclist,"upccode")
			       .map(function(item){
					var foundStock = _.find(stockDoclist,function(doc){ return doc.inventory.upccode==item.upccode;});
					//var returnValue = _.clone(foundStock);
					var returnValue = _.combine({},foundStock);
					returnValue.inventory.price = item.price;
					returnValue.inventory.description = item.description;
					return returnValue;
				    })
			       .value();

			   var stocklistCompleted =
			       _.chain(invlist)
			       .difference(stocklist)
			       .matchTo(invDoclist,"upccode")
			       .map(function(item){
					return {inventory:_(item).removeKeys('_id','_rev'),
					   count:"0", //FIXME : BigInteger or BigDecimal
					   type:"stock",
					   ids:originids};
				    })
			       .concat(stockDocListOverInvDoc)
			       .value();

			   callback(err,{docList:stocklistCompleted,soldList:soldlist});
		       });
    };
};

function idleInventoryFetcher_F(id, days) {
    var upcview = cdb.view("app","locid_upc");
    var stockview = cdb.view("app","stock_locid_upc");
    var db_inventory = cdb.db("inventory");
    var inventory_sold_view = cdb.view("reporting","inventory_sold");
    var db_transactions = cdb.db("transactions");

    var invQuery = _async.generalKeyQuery(upcview,db_inventory);
    var stockQuery = _async.generalKeyQuery(stockview,db_inventory);
    var transQuery = _async.generalQuery(inventory_sold_view,db_transactions);

    var currentDateForQuery = (new Date()).addDays(1).toArray().slice(0,3);
    var pastDate = (new Date()).addDays(-Number(days)).toArray().slice(0,3);

    var optionsForAllSoldList = {
        group: true,
        group_level:1,
        startkey: ([]).concat(id),
        endkey:([]).concat(id).concat({}),
        limit:1
    };

    var optionsForPartialSoldList = {
        descending : true,
        group: true,
        group_level:1,
        startkey:([]).concat(id).concat(currentDateForQuery),
        endkey: ([]).concat(id).concat(pastDate)
    };

    return function(callback){
        async.parallel({
			   invlist : invQuery(id),
			   stocklist : stockQuery(id),
			   all_soldlist : transQuery(optionsForAllSoldList),
			   period_soldlist : transQuery(optionsForPartialSoldList)
		       },
		       function(err,resp) {
			   function extractSoldList(value) {
			       // values -> {"1234" :{qty:12}, "45613" : {qty:1}}
			       // return value -> [Object { upc="1234", info={qty,date}}, Object { upc="45613", info={...}}]
			       return _.map(_.first(value),function(v,k){ return {upc:k, info:v};});
			   };
			   function getElapsedDays(from, to) {
			       var date1 = new Date(from);
			       var date2 = new Date(to);
			       date1.setHours(0); date1.setMinutes(0); date1.setSeconds(0); date1.setMilliseconds(0);
			       date2.setHours(0); date2.setMinutes(0); date2.setSeconds(0); date2.setMilliseconds(0);

			       return (date2.getTime()-date1.getTime())/(1000*60*60*24);
			   };

			   var stocklist = _.pluck(resp.stocklist.rows, "value");
			   var stockDoclist = _.pluck(resp.stocklist.rows, "doc");
			   var invDoclist = _.pluck(resp.invlist.rows, "doc");
			   var all_soldlist = extractSoldList(_.pluck(resp.all_soldlist.rows, "value"));
			   var period_soldlist = extractSoldList(_.pluck(resp.period_soldlist.rows, "value"));
			   var diff_soldlist = _.difference(all_soldlist,period_soldlist);

			   var result =
			       _.chain(stockDoclist)
			       .reject(function(item){
					   return !_.isEmpty(_.find(period_soldlist,function(itm){
								   return itm.upc == item.inventory.upccode;
							       }));
				       })
			       .map(function(item){
					var soldItem = _.find(diff_soldlist,function(itm){
								return itm.upc == item.inventory.upccode;
							    });

					var foundInv = _.find(invDoclist, function(inv){ return inv.upccode == item.inventory.upccode;});
					var invItem = _.combine({},item);
					invItem.inventory.price = foundInv.price;
					invItem.inventory.description = foundInv.description;

					if(_.isEmpty(soldItem)) {
					    return _.combine({date_last_sold:"never been sold",
							 days:"0",
							 qty:item.count},
							invItem);

					} else {
					    var last_sold = getDateObjFromStr(soldItem.info.date);
					    return _.combine({date_last_sold:datePartFormatter(last_sold),
							 days:getElapsedDays(last_sold,new Date())+"",
							 qty:(Number(item.count)-Number(soldItem.info.qty)).toString()},
							invItem);
					}
				    })
			       .value();

			   callback(err,result);
		       });
    };
};
