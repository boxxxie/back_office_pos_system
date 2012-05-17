var ZEROED_FIELDS = {allDiscount: 0,
		   netsales: 0,
		   netsaletax1: 0,
		   netsaletax3: 0,
		   netsalestotal: 0,
		   netrefund: 0,
		   netrefundtax1: 0,
		   netrefundtax3: 0,
		   netrefundtotal: 0,
		   netsaleactivity: 0,
		   cashpayment: 0,
		   creditpayment: 0,
		   debitpayment: 0,
		   mobilepayment: 0,
		   otherpayment: 0,

		   cashtotal: 0,
		   credittotal: 0,
		   debittotal: 0,
		   mobiletotal: 0,
		   othertotal: 0,
		   noofsale: 0,
		   avgpayment: 0,
		   cashrefund: 0,
		   creditrefund: 0,
		   debitrefund: 0,
		   mobilerefund: 0,
		   otherrefund: 0,
		   noofrefund: 0,
		   avgrefund: 0,
		   menusalesno: 0,
		   menusalesamount: 0,
		   scansalesno: 0,
		   scansalesamount: 0,
		   ecrsalesno: 0,
		   ecrsalesamount: 0,
		   firstindex:0,
		   lastindex:0,
		   actual_tender:0};

function isValidDate(d){
    if ( Object.prototype.toString.call(d) !== "[object Date]" )
	return false;
    return !isNaN(d.getTime());
}

function formatTime(time){
    return time+":00-"+(Number(time)+1)+":00";
};

function relative_dates(){
    return {
	today : _.first(Date.today().toArray(),3),
	today_h : _.first(Date.today().toArray(),4),
	tomorrow : _.first(Date.today().addDays(1).toArray(),3),
	tomorrow_h : _.first(Date.today().addDays(1).toArray(),4),
	yesterday : _.first(Date.today().addDays(-1).toArray(),3),
	yesterday_h : _.first(Date.today().addDays(-1).toArray(),4),
	startOfMonth : _.first(Date.today().moveToFirstDayOfMonth().toArray(),3),
	startOfYear : (Date.today().getMonth()>0)? _.first(Date.today().moveToMonth(0,-1).moveToFirstDayOfMonth().toArray(),3):_.first(Date.today().moveToFirstDayOfMonth().toArray(),3)
    };
};

function returnQuery(callback){
    return function(query){
	callback(null, query);
    };
};

function typedTransactionRangeQuery(view,db,base){
    return function(startDate,endDate){
	var startKey = base.concat(startDate);
	var endKey = base.concat(endDate);
	var options = {
	    reduce:true,
	    //group_level:_.size(endKey),
	    startkey:startKey,
	    endkey:endKey
	};
	return queryF(view,db)(options);
    };
};
function typedTransactionRangeGroupedQuery(view,db,base){
    return function(startDate,endDate){
	var startKey = base.concat(startDate);
	var endKey = base.concat(endDate);
	var options = {
	    group_level:_.size(endKey),
	    startkey:startKey,
	    endkey:endKey,
	    inclusive_end: false
	};
	return queryF(view,db)(options);
    };
};
function transactionRangeQuery(start,end){
    return function(view,db,base){
	var startKey = base.concat(start);
	var endKey = base.concat(end);
	var options = {
	    reduce:false,
	    include_docs: true,
	    startkey:startKey,
	    endkey:endKey
	};
	return queryF(view,db)(options);
    };
};



function generalTransactionsIndexRangeFetcher(view,db,id,startIndex,endIndex,continuation){
    var transactionsQuery = transactionRangeQuery(startIndex,endIndex)(view,db,[id]);
    transactionsQuery(function(response){
			  function isVoid(transaction){return transaction.type == "VOID" || transaction.type == "VOIDREFUND";}
			  function docs(resp_data){return resp_data.doc;};
			  var transactions = _(response.rows).chain().map(docs).reject(isVoid).value();
			  continuation(transactions);
		      });
}

function todaysSalesFetcher(view,db,id,runAfter){
    var d = relative_dates();
    var sales = typedTransactionRangeQuery(view,db,[id,'SALE'])(d.today,d.tomorrow);
    var refunds = typedTransactionRangeQuery(view,db,[id,'REFUND'])(d.today,d.tomorrow);
    function sum(total,cur){
	return total + cur.value.sum;
    }
    function extractTotalSales(salesData,refundsData){
	function sum(total,cur){
	    return total + cur.value.sum;
	}
	var sales = 0, refunds = 0;
	_.isFirstNotEmpty(salesData.rows)? sales = _.first(salesData.rows).value.sum: sales = 0;
	_.isFirstNotEmpty(refundsData.rows)? refunds = _.first(refundsData.rows).value.sum: refunds = 0;
	return sales - refunds;
    }

    function extractTotalTransactions(salesData,refundsData){
	function sum(total,cur){
	    return total + cur.value.count;
	}
	var sales = 0, refunds = 0;
	_.isFirstNotEmpty(salesData.rows)? sales = _.first(salesData.rows).value.count: sales = 0;
	_.isFirstNotEmpty(refundsData.rows)? refunds = _.first(refundsData.rows).value.count: refunds = 0;
	return {transactions:sales+"" , refunds:refunds+""};
    }

    async
	.parallel(
	    {sales:function(callback){sales(returnQuery(callback));},
	     refunds:function(callback){refunds(returnQuery(callback));}
	    },
	    function(err,report){
		var sales = {};

		_.isFirstNotEmpty(report.sales.rows)? sales.sales_total = _.first(report.sales.rows).value.sum: sales.sales_total = 0;
		_.isFirstNotEmpty(report.refunds.rows)? sales.refunds_total = _.first(report.refunds.rows).value.sum: sales.refunds_total = 0;

		_.extend(sales,extractTotalTransactions(report.sales,report.refunds));

		sales.sales_minus_refunds = extractTotalSales(report.sales,report.refunds);

		sales.avgsale = Number(sales.sales_minus_refunds) / Number(sales.transactions);
		if(_.isNaN(sales.avgsale)){sales.avgsale = 0;}
		runAfter(sales);
	    });
};
function originTodaysSalesFetcher(view,db,id,runAfter){
    var d = relative_dates();
    var menuSales = typedTransactionRangeQuery(view,db,[id,'SALE','MENU'])(d.today,d.tomorrow);
    var menuRefunds = typedTransactionRangeQuery(view,db,[id,'REFUND','MENU'])(d.today,d.tomorrow);
    var scanSales = typedTransactionRangeQuery(view,db,[id,'SALE','INVENTORY'])(d.today,d.tomorrow);
    var scanRefunds = typedTransactionRangeQuery(view,db,[id,'REFUND','INVENTORY'])(d.today,d.tomorrow);
    var ecrSales = typedTransactionRangeQuery(view,db,[id,'SALE','ECR'])(d.today,d.tomorrow);
    var ecrRefunds = typedTransactionRangeQuery(view,db,[id,'REFUND','ECR'])(d.today,d.tomorrow);

    function extractTotalSales(salesData,refundsData){
	function sum(total,cur){
	    return total + cur.value.sum;
	}
	var sales = 0, refunds = 0;
	_.isFirstNotEmpty(salesData.rows)? sales = _.first(salesData.rows).value.sum: sales = 0;
	_.isFirstNotEmpty(refundsData.rows)? refunds = _.first(refundsData.rows).value.sum: refunds = 0;
	return sales;// - refunds;
    }

    async
	.parallel(
	    {menuSales:function(callback){menuSales(returnQuery(callback));},
	     menuRefunds:function(callback){menuRefunds(returnQuery(callback));},
	     scanSales:function(callback){scanSales(returnQuery(callback));},
	     scanRefunds:function(callback){scanRefunds(returnQuery(callback));},
	     ecrSales:function(callback){ecrSales(returnQuery(callback));},
	     ecrRefunds:function(callback){ecrRefunds(returnQuery(callback));}
	    },
	    function(err,report){
		var sales = {}, refunds = {};
		sales.menu = extractTotalSales(report.menuSales,report.menuRefunds);
		sales.scan = extractTotalSales(report.scanSales,report.scanRefunds);
		sales.ecr = extractTotalSales(report.ecrSales,report.ecrRefunds);

		refunds.menu = extractTotalSales(report.menuRefunds,report.menuRefunds);
		refunds.scan = extractTotalSales(report.scanRefunds,report.menuRefunds);
		refunds.ecr = extractTotalSales(report.ecrRefunds,report.menuRefunds);
		runAfter({origin_sales:sales,origin_refunds:refunds});
	    });
};



function todaysRefundsFetcher(view,db,id,runAfter){
    var d = relative_dates();
    var refunds = typedTransactionRangeQuery(view,db,[id,'REFUND'])(d.today,d.tomorrow);

    function extractTotalRefunds(refundsData){
	function sum(total,cur){
	    return total + cur.value.count;
	}
	var refunds = 0;
	_.isFirstNotEmpty(refundsData.rows)? refunds = _.first(refundsData.rows).value.count: refunds = 0;
	return refunds;
    }

    async
	.parallel(
	    {
		refunds:function(callback){refunds(returnQuery(callback));}
	    },
	    function(err,report){
		var refunds = extractTotalRefunds(report.refunds);
		runAfter(refunds);
	    });
};
function todaysVoidsFetcher(view,db,id,runAfter){
    var d = relative_dates();
    var refunds = typedTransactionRangeQuery(view,db,[id,'VOIDREFUND'])(d.today,d.tomorrow);
    var voids = typedTransactionRangeQuery(view,db,[id,'VOID'])(d.today,d.tomorrow);

    function extractTotal(refundsData){
	function sum(total,cur){
	    return total + cur.value.count;
	}
	var refunds = 0;
	_.isFirstNotEmpty(refundsData.rows)? refunds = _.first(refundsData.rows).value.count: refunds = 0;
	return refunds;
    }

    async
	.parallel(
	    {
		refunds:function(callback){refunds(returnQuery(callback));},
		voids:function(callback){voids(returnQuery(callback));}
	    },
	    function(err,report){
		var refunds = extractTotal(report.refunds);
		var voids = extractTotal(report.voids);
		var total = refunds + voids;
		runAfter(total);
	    });
};
function generalSalesReportFetcher(view,db,id,runAfter){
    var companySalesBaseKey = [id];
    var companySalesRangeQuery = typedTransactionRangeQuery(view,db,companySalesBaseKey);

    function extractTotalSales(salesData,refundData){
	function sum(total,cur){
	    return total + cur.value.sum;
	}
	var sales = 0;
	_.isFirstNotEmpty(salesData.rows)? sales = _.first(salesData.rows).value.sum: sales = 0;
	return sales;
    }
    var d = relative_dates();
    async
	.parallel(
	    {yesterdaysSales:function(callback){companySalesRangeQuery(d.yesterday,d.today)(returnQuery(callback));},
	     monthsSales:function(callback){companySalesRangeQuery(d.startOfMonth,d.tomorrow)(returnQuery(callback));},
	     yearsSales:function(callback){companySalesRangeQuery(d.startOfYear,d.tomorrow)(returnQuery(callback));}
	    },
	    function(err,report){
		var sales = {};
		sales.yesterdaysales= toFixed(2)(extractTotalSales(report.yesterdaysSales,report.yesterdaysRefunds));
		sales.mtdsales = toFixed(2)(extractTotalSales(report.monthsSales,report.monthsRefunds));
		sales.ytdsales = toFixed(2)(extractTotalSales(report.yearsSales,report.yearsRefunds));
		runAfter(sales);
	    });
};

function generalCashoutReportFetcher(view,db,id,runAfter){
    var companySalesBaseKey = [id];
    var companySalesRangeQuery = typedTransactionRangeQuery(view,db,companySalesBaseKey);
    var d = relative_dates();
    async
	.parallel(
	    {yesterday:function(callback){companySalesRangeQuery(d.yesterday,d.today)(returnQuery(callback));},
	     month:function(callback){companySalesRangeQuery(d.startOfMonth,d.tomorrow)(returnQuery(callback));},
	     year:function(callback){companySalesRangeQuery(d.startOfYear,d.tomorrow)(returnQuery(callback));}
	    },
	    function(err,report){
		var cashouts = {};
		cashouts.yesterday = (_.isFirstNotEmpty(report.yesterday.rows)? _.first(report.yesterday.rows).value:ZEROED_FIELDS);
		cashouts.mtd = (_.isFirstNotEmpty(report.month.rows)? _.first(report.month.rows).value:ZEROED_FIELDS);
		cashouts.ytd = (_.isFirstNotEmpty(report.year.rows)? _.first(report.year.rows).value:ZEROED_FIELDS);

		function appendCategorySalesPercent(total, cashoutReport) {
		    var cashout = _.clone(cashoutReport);
		    if(total!==0) {
			cashout.menusalespercent = cashout.menusalesamount / total*100;
			cashout.ecrsalespercent = cashout.ecrsalesamount / total*100;
			cashout.scansalespercent = cashout.scansalesamount / total*100;
		    } else {
			cashout.menusalespercent = 0;
			cashout.ecrsalespercent = 0;
			cashout.scansalespercent = 0;
		    }
		    return cashout;
		};

		function modifiedCashouts(input) {
		    var data = _.clone(input);

		    //TODO: avg Trans for payment/refund has to be done by server side ?!
		    if(data.noofsale!==0) {
		        data.avgpayment = data.netsalestotal / data.noofsale;
		    }

		    if(data.noofrefund!==0) {
			data.avgrefund = data.netrefundtotal / data.noofrefund;
		    }

		    return _.chain(data)
		    	.applyToValues(_.toNumber)
			//.extend(_.selectKeys(data, ['noofpayment','noofrefund']))
			.value();
		};

		var totalyesterday = cashouts.yesterday['menusalesamount'] + cashouts.yesterday['scansalesamount'] + cashouts.yesterday['ecrsalesamount'];
		var totalmtd = cashouts.mtd['menusalesamount'] + cashouts.mtd['scansalesamount'] + cashouts.mtd['ecrsalesamount'];
		var totalytd = cashouts.ytd['menusalesamount'] + cashouts.ytd['scansalesamount'] + cashouts.ytd['ecrsalesamount'];

		cashouts.yesterday = appendCategorySalesPercent(totalyesterday, cashouts.yesterday);
		cashouts.mtd = appendCategorySalesPercent(totalmtd, cashouts.mtd);
		cashouts.ytd = appendCategorySalesPercent(totalytd, cashouts.ytd);

		cashouts.yesterday = modifiedCashouts(cashouts.yesterday);
		cashouts.mtd = modifiedCashouts(cashouts.mtd);
		cashouts.ytd = modifiedCashouts(cashouts.ytd);


		runAfter(cashouts);
	    });
};
function generalCashoutFetcher_Period(view,db,id,startDate,endDate,runAfter){
    var companySalesBaseKey = [id];
    var companySalesRangeQuery = typedTransactionRangeQuery(view,db,companySalesBaseKey);

    var dateStart = _.first(startDate.toArray(),3);
    var dateEnd = _.first(endDate.toArray(),3);

    async
	.parallel(
	    {period:function(callback){companySalesRangeQuery(dateStart,dateEnd)(returnQuery(callback));}},
	    function(err,report){
		var cashouts = {};
		cashouts.period = (_.isFirstNotEmpty(report.period.rows)? _.first(report.period.rows).value:ZEROED_FIELDS);

		function appendCategorySalesPercent(total, cashoutReport) {
		    var cashout = _.clone(cashoutReport);
		    if(total!==0) {
			cashout.menusalespercent = cashout.menusalesamount / total*100;
			cashout.ecrsalespercent = cashout.ecrsalesamount / total*100;
			cashout.scansalespercent = cashout.scansalesamount / total*100;
		    } else {
			cashout.menusalespercent = 0;
			cashout.ecrsalespercent = 0;
			cashout.scansalespercent = 0;
		    }
		    return cashout;
		};

		function modifiedCashouts(input) {
		    var data = _.clone(input);
		    return _(data).chain()
		    //.applyToValues(toFixed(2))
			.extend(_.selectKeys(data, ['noofpayment','noofrefund','firstindex','lastindex']))
			.value();
		};

		var totalperiod = cashouts.period['menusalesamount'] + cashouts.period['scansalesamount'] + cashouts.period['ecrsalesamount'];

		cashouts.period = appendCategorySalesPercent(totalperiod, cashouts.period);
		cashouts.period = modifiedCashouts(cashouts.period);
		// add
		cashouts.id = id;

		runAfter(cashouts);
	    });
};
function generalCashoutListFetcher_Period(view,db,id,startDate,endDate,runAfter){
    var baseKey = [id];
    var dateStart = _.first(startDate.toArray(),3);
    var dateEnd = _.first(endDate.toArray(),3);

    var cashoutQuery = transactionRangeQuery(dateStart,dateEnd)(view,db,baseKey)
    (function(response){
	 runAfter(_.pluck(response.rows,'doc'));
     });
};

function generalCashoutReportArrayFetcher(view,db,ids,runAfter){
    async.map(ids,
	      function(id,callback){
		  generalCashoutReportFetcher(view,db,id,
					      function(salesData){
						  callback(null,salesData);
					      });
	      },
	      runAfter);
};

function generalCashoutArrayFetcher_Period(view,db,ids,startDate,endDate,runAfter) {
    async.map(ids,
	      function(id,callback){
		  generalCashoutFetcher_Period(view,db,id,startDate,endDate,
					       function(salesData){
						   callback(null,salesData);
					       });
	      },
	      runAfter);
};

function generalCashoutListArrayFetcher_Period(view,db,ids,startDate,endDate,runAfter) {
    async.map(ids,
	      function(id,callback){generalCashoutListFetcher_Period(view,db,id,startDate,endDate,returnQuery(callback));},
	      runAfter);
};

function generalSalesReportArrayFetcher(view,db,ids,runAfter){
    async.map(ids,
	      function(id,callback){
		  generalSalesReportFetcher(view,db,id,
					    function(salesData){
						callback(null,salesData);
					    });
	      },
	      runAfter);
};
function originTodaysSalesArrayFetcher(view,db,ids,runAfter){
    async.map(ids,
	      function(id,callback){
		  originTodaysSalesFetcher(view,db,id,
					   function(salesData){
					       callback(null,salesData);
					   });
	      },
	      runAfter);
};
function todaysSalesArrayFetcher(view,db,ids,runAfter){
    async.map(ids,
	      function(id,callback){
		  todaysSalesFetcher(view,db,id,
				     function(salesData){
					 callback(null,salesData);
				     });
	      },
	      runAfter);
};

function transactionsSalesFetcher(ids,callback){
    var transactionsView = cdb.view('reporting','netsaleactivity');
    var transaction_db = cdb.db('cashouts',{},true);
    if(!_.isArray(ids)){ids = [ids];}
    return generalSalesReportArrayFetcher(transactionsView,transaction_db,ids,callback);
};

function cashoutFetcher(ids,callback){
    var transactionsView = cdb.view('reporting','cashouts_id_date');
    var transaction_db = cdb.db('cashouts',{},true);
    if(!_.isArray(ids)){
	return generalCashoutReportFetcher(transactionsView,transaction_db,ids,callback);
    }
    else{
	return generalCashoutReportArrayFetcher(transactionsView,transaction_db,ids,callback);
    }
};

function cashoutFetcher_Period(ids,startDate,endDate,callback){
    var view = cdb.view('reporting','cashouts_id_date');
    var db = cdb.db('cashouts',{},true);
    if(!_.isArray(ids)){
	return generalCashoutFetcher_Period(view,db,ids,startDate,endDate,callback);
    }
    else{
	return generalCashoutArrayFetcher_Period(view,db,ids,startDate,endDate,callback);
    }
};

function howAreWeDoingTodayReportFetcher(childrenObjs,parentObj){
    return function(runAfter){
	var childrenIDs = _.pluck(childrenObjs,'id');
	var parentID = parentObj.id;

	var transactionsView = cdb.view('reporting','id_type_origin_date');
	var transactionsTotalView = cdb.view('reporting','id_type_date');
	var transaction_db = cdb.db('transactions',{},true);
	if(!_.isArray(childrenIDs)){childrenIDs = [childrenIDs];}
	if(!_.isArray(parentID)){parentID = [parentID];}

	async
	    .parallel(
		{originSales:function(callback){originTodaysSalesArrayFetcher(transactionsView,transaction_db,childrenIDs,function(err,data){callback(null, data);});},
		 totalSales:function(callback){todaysSalesArrayFetcher(transactionsTotalView,transaction_db,childrenIDs,function(err,data){callback(null, data);});},
		 parentOriginSales:function(callback){originTodaysSalesArrayFetcher(transactionsView,transaction_db,parentID,function(err,data){callback(null, data);});},
		 parentTotalSales:function(callback){todaysSalesArrayFetcher(transactionsTotalView,transaction_db,parentID,function(err,data){callback(null, data);});}
		},
		function(err,report){
		    var salesActivityList = {items:_(report.originSales)
					   .chain()
					   .zip(report.totalSales,childrenObjs)
					   .map(function(group){return _.applyToValues(_.merge(group),toFixed(2));})
					   .value(),
					   total:_.applyToValues(_.extend({},
									  _.first(report.parentOriginSales),
									  _.first(report.parentTotalSales)),
								 toFixed(2))
					  };
		    runAfter(salesActivityList);
		});
    };
}

function howAreWeDoingTodayTerminalReportFetcher(childrenObjs,parentObj,runAfter){
    var childrenIDs = _.pluck(childrenObjs,'id');
    var parentID = parentObj.id;

    var transactionsTotalView = cdb.view('reporting','id_type_date');
    var transaction_db = cdb.db('transactions',{},true);

    async
	.parallel({
		      hwdt: function(callback){howAreWeDoingTodayReportFetcher(childrenObjs,parentObj, function(data){callback(null,data);});},
		      voids:function(callback){todaysVoidsFetcher(transactionsTotalView,transaction_db, parentID,function(data){callback(null,data);});}
		  },
		  function(err,report){
		      var templateObj = _.merge([report.hwdt,{cancelledtransactions:report.voids}]);
		      runAfter(templateObj);
		  });
};

function typedTransactionDateRangeGroupedQuery(startDate,endDate){
    //the groupby value is based on the length of the date array given
    // var db = cdb.db('transactions',{},true);
    // var view = cdb.view('reporting','id_type_date');
    return function(view,db){
	return function (base){
	    var startKey = base.concat(startDate);
	    var endKey = base.concat(endDate);
	    var options = {
		group_level:_.size(endKey),
		startkey:startKey,
		endkey:endKey,
		inclusive_end: false
	    };
	    return queryF(view,db)(options);
	};
    };
}
function todaysHourlySalesFetcher(id){
    return function(start,end){
	return function(returnReport){
	    var d = relative_dates();
	    var todaysQuery = typedTransactionDateRangeGroupedQuery(d.today_h,d.tomorrow_h);
	    var sales = todaysQuery([id,'SALE']);
	    var refunds = todaysQuery([id,'REFUND']);


	    function assign(fn){
		function returnQuery(callback){
		    return function(query){
			callback(null, query);
		    };
		};
		return function(callback){
		    fn(returnQuery(callback));
		};
	    }
	    async
		.parallel(
		    {sales:assign(sales),
		     refunds:assign(refunds)
		    },
		    function(err,report){
			//need to join things together based on the same time from the key
			function time(item){
			    return item.key[5];
			}
			function hour(item){
			    return item.key[5];
			}
			function salesAmount(item){
			    if(_.isNumber(item.value.sum)){return item.value.sum;}
			    return 0;
			}
			function numSales(item){
			    if(_.isNumber(item.value.count)){return item.value.count;}
			    return 0;
			}
			function type(item){
			    return item.key[1];
			}
			function isSale(item){
			    return item.type === 'SALE';
			};
			function isRefund(item){
			    return item.type === 'REFUND';
			}

			function template(){
			    return {total:0,refunds:"0",transactions:"0",avgsale:0};
			}

			function transactionSummary(salesData,refundsData){
			    var sales = 0, refunds = 0, saleCount = 0, refundCount = 0, avgsale = 0, net_sales = 0;
			    if(_.isNotEmpty(salesData)){
				sales = salesData.value;
				saleCount = salesData.count;
			    }
			    if(_.isNotEmpty(refundsData)){
				refunds = refundsData.value;
				refundCount = refundsData.count;
			    };
			    net_sales = sales - refunds;
			    if(saleCount){avgsale = net_sales / saleCount;}
			    return {total:net_sales,refunds:refundCount+"",transactions:saleCount+"",avgsale:avgsale};
			}

			var stuff = _([]).
			    chain()
			    .concat(report.refunds.rows, report.sales.rows)
			    .map(function(item){return {type:type(item),time:hour(item),value:salesAmount(item),count:numSales(item)};})
			    .groupBy(function(item){return item.time;})
			    .map$(function(pair){
				     var time = _.first(pair);
				     var sale_refund = _.second(pair);
				     var sales = _(sale_refund).chain().filter(isSale).first().value();
				     var refunds = _(sale_refund).chain().filter(isRefund).first().value();
				     var summary = transactionSummary(sales,refunds);

				     var timeForKey = {};
				     timeForKey[time] = summary;
				     return [time,summary];
				 })
			    .value();

			var mergeTimes = _.chain(24)
			    .range()
			    .map(function(val,key){return [key,template()];})
			    .toObject()
			    .extend(stuff)
			    .map$(function(pair){
				     var time = _.first(pair);
				     var val = _.second(pair);
				     return [formatTime(time),val];
				 })
			    .value();
			returnReport(null,mergeTimes);
		    })
	}
    }
}
function originTodaysHourlySalesFetcher(id){
    return function(start,end){
	return function(returnReport){

	    var db = cdb.db('transactions',{},true);
	    var view = cdb.view('reporting','id_type_origin_date');

	    var todaysQuery = typedTransactionDateRangeGroupedQuery(start,end)(view,db);
	    var menuSales = todaysQuery([id,'SALE','MENU']);
	    var menuRefunds = todaysQuery([id,'REFUND','MENU']);
	    var scanSales = todaysQuery([id,'SALE','INVENTORY']);
	    var scanRefunds = todaysQuery([id,'REFUND','INVENTORY']);
	    var ecrSales = todaysQuery([id,'SALE','ECR']);
	    var ecrRefunds = todaysQuery([id,'REFUND','ECR']);

	    function assign(fn){
		function returnQuery(callback){
		    return function(query){
			callback(null, query);
		    };
		};
		return function(callback){
		    fn(returnQuery(callback));
		};
	    }
	    function hour(item){
		return item.key[6].toString();
	    }
	    function sales(item){
		return item.value.sum;
	    }
	    function type(item){
		return item.key[1];
	    }
	    function origin(item){
		return item.key[2].toLowerCase();
	    }
	    function transactions(item){
		return item.value.count;
	    }
	    function sales_query(fn){
		function returnQuery(callback){
		    return function(query){
			callback(null,_.map(query.rows, function(row){
						var transaction_stats= {
						    time:hour(row),
						    transactions:transactions(row),
						    sale_transactions:transactions(row),
						    total_sales:sales(row)
						};
						transaction_stats[origin(row).toLowerCase()+'_sales'] = transaction_stats.total_sales;
						return transaction_stats;
					    }))
		    };
		};
		return function(callback){
		    fn(returnQuery(callback));
		};
	    }
	    function refunds_query(fn){
		function returnQuery(callback){
		    return function(query){
			callback(null,_.map(query.rows, function(row){
						var transaction_stats= {
						    time:hour(row),
						    transactions:transactions(row),
						    refund_transactions:transactions(row),
						    total_sales:-sales(row)
						};
						transaction_stats[origin(row).toLowerCase()+'_sales'] = transaction_stats.total_sales;
						return transaction_stats;
					    }))
		    };
		};
		return function(callback){
		    fn(returnQuery(callback));
		};
	    }
	    async
		.parallel(
		    {
			menuSales:sales_query(menuSales),
			menuRefunds:refunds_query(menuRefunds),
			scanSales:sales_query(scanSales),
			scanRefunds:refunds_query(scanRefunds),
			ecrSales:sales_query(ecrSales),
			ecrRefunds:refunds_query(ecrRefunds)
		    },
		    function(err,report){
			function hourly_report_row_defaults(){
			    return {
				transactions:0,
				refund_transactions:0,
				sale_transactions:0,
				total_sales:0,
				ecr_sales:0,
				menu_sales:0,
				inventory_sales:0,
				avg_sales:0
			    }
			}
			var agrigated_reports =
			    _.chain([])
			    .concat(report.menuRefunds,
				    report.menuSales,
				    report.scanSales,
				    report.scanRefunds,
				    report.ecrSales,
				    report.ecrRefunds)
			    .value()

			var stats_by_hour =
			    _.chain(agrigated_reports)
			    .groupBy('time')
			    .map$(function(stats_kv){return [stats_kv[0],_.reduce(stats_kv[1],_.add)]})
			    .value();

			var stats_by_hour_with_defaults = _.chain(24)
			    .range()
			    .map(function(val,key){return [key,hourly_report_row_defaults()]})
			    .toObject()
			    .combine(stats_by_hour)
			    .map$(function(pair){
				      var time = formatTime(_.first(pair));
				     var val = _.second(pair);
				      return [time,
					 _.combine(val,
						   {
						       timerange:time,
						       avg_sales:val.transactions ? val.total_sales/val.transactions : 0
						   }
						  )];
				 })
			    .value();
			function tally_hour_totals(hours){
			    var totals = _.reduce(stats_by_hour_with_defaults,_.add);
			    totals.avg_sales = totals.transactions ? totals.total_sales/totals.transactions : 0;
			    return totals;
			}
			returnReport(null,{
				    hours:stats_by_hour_with_defaults,
				    totals:tally_hour_totals(stats_by_hour)
				});
		    });
	};
    }
}

function hourlyReportFetcher(id,start,end){
    return originTodaysHourlySalesFetcher(id)(start,end)
};


function taxReportFetcher(terminals,startDate,endDate,callback){
    var transactionsView = cdb.view('reporting','cashouts_id_date');
    var transaction_db = cdb.db('cashouts',{},true);

    function resultFetcher(terminals,callback){
    	return function(err,cashoutData){
	    function extractTemplateData(extendedCashoutData){
		function extractTaxTotals(cashout){
		    var tax1 = toFixed(2)((Number(cashout.netsaletax1) -  Number(cashout.netrefundtax1)));
		    var tax3 = toFixed(2)((Number(cashout.netsaletax3) -  Number(cashout.netrefundtax3)));
		    return {sales : cashout.netsales - cashout.netrefund, totalsales : cashout.netsaleactivity, tax1 :tax1, tax3:tax3, firstindex:cashout.firstindex, lastindex:cashout.lastindex};
		}
		return _.extend({},
			   extractTaxTotals(extendedCashoutData.period),
			   _.selectKeys(extendedCashoutData,['id','name'])
			  );
	    }
	    var forTMP = _(terminals)
		.chain()
		.zip(cashoutData)
		.map(function(pair){
			 return _.extend(_.first(pair),_.second(pair));
		     })
		.map(extractTemplateData)
		.value();
	    callback(forTMP);
	};
    }

    if(_.isArray(terminals)){
	var ids = _.pluck(terminals,'id');
	return generalCashoutArrayFetcher_Period(transactionsView,transaction_db,ids,startDate,endDate,resultFetcher(terminals,callback));
    }
    else{
	var ids = _.pluck([terminals],'id');
	return generalCashoutArrayFetcher_Period(transactionsView,transaction_db,ids,startDate,endDate,resultFetcher([terminals],callback));
    }
};

function taxReportTransactionsFetcher(terminal,startIndex,endIndex,callback){
    var view = cdb.view('reporting','terminalID_index');
    var db = cdb.db('transactions',{},true);

    function resultFetcher(terminal,callback){
    	return function(transactions){
	    function extractTemplateData(transaction){
		function isRefund(transaction){return transaction.type == "REFUND";}
		function switchSign(number){return 0 - number;};

		function extractTaxTotals(transaction){
		    var tax1 = transaction.tax1and2;
		    var tax3 = transaction.tax3;
		    return {sales : transaction.subTotal, totalsales : transaction.total, tax1 :tax1, tax3:tax3};
		};

		var moneyFields = extractTaxTotals(transaction);
		if(isRefund(transaction)){
		    moneyFields = _.applyToValues(moneyFields,switchSign);
		}
		return _.extend({},
			   moneyFields,
			   {date: jodaDateFormatter(transaction.time.start)},
			   {transaction:transaction.transactionNumber.toString()},
			   {type:transaction.type}
			  );
	    }
	    var transactionsTaxData = _(transactions).map(extractTemplateData);

	    var defaultTotalsData = {sales : 0, totalsales : 0, tax1 :0, tax3:0};
	    var totalsTaxData =
		_(transactionsTaxData)
		.chain()
		.reduce(_.addPropertiesTogether,{})
		.value();
	    var safeTotalsTaxData = _(defaultTotalsData).chain().extend(totalsTaxData).applyToValues(toFixed(2)).value();

	    callback({items:_.map(transactionsTaxData,function(t){return _.applyToValues(t,toFixed(2));}),
		      totals:safeTotalsTaxData});
	};
    }

    return generalTransactionsIndexRangeFetcher(view,db,terminal,Number(startIndex),Number(endIndex),resultFetcher(terminal,callback));
};
