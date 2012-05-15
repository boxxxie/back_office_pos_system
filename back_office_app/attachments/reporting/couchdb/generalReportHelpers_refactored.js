function applyReceiptInfo(templateData){
    return _.map(templateData, function(an_item){
		     var item = _.clone(an_item);
		     //FIXME : date format ("2011-12-20T21:27:37")
			//how about we return the date obj too instead of making it here?
		     var t = jodaDateParser(item.date);
		     item.processday = _(t.toDateString().split(' ')).chain().rest().join(' ').value();
		     item.processtime = t.toString("h:mm").concat(t.getHours()>=12?" PM":" AM");
		     item.transactionNumber = item.receipt_id+"-"+item.transactionNumber;
		     item.transaction_index = item.transaction_index+"";
		     if(item.type=="SALE") {item.type="SALE RECEIPT";}
		     else if(item.type=="REFUND") {item.type="REFUND RECEIPT";}
		     else if(item.type=="VOID") {item.type="SALE RECEIPT - VOIDED";}
		     else if(item.type=="VOIDREFUND") {item.type="REFUND RECEIPT - VOIDED";}
		     return item;
		 });
}
var _async = {
    generalQuery:function(view,db){
        return function(options){
            return function(callback){queryF(view,db)(options)(returnQuery(callback));};
        };
    },
    generalKeyQuery:function(view,db){
	    return function(key){
		var options = {
		    reduce: false,
		    include_docs: true,
		    key: key
		};
		return function(callback){queryF(view,db)(options)(returnQuery(callback));};
	    };
    },
    generalKeyQuery_noDocs:function(view,db){
		    return function(key){
		var options = {
		    reduce: false,
		    key: key
		};
		return function(callback){queryF(view,db)(options)(returnQuery(callback));};
	    };
    },
    transactionRangeQuery:function(start,end){
	return function(view,db,base){
	    var startKey = base.concat(start);
	    var endKey = base.concat(end);
	    var options = {
		reduce:false,
		include_docs: true,
		startkey:startKey,
		endkey:endKey
	    };
	    return function(callback){queryF(view,db)(options)(returnQuery(callback));};
	};
    },
    transactionRangeGroupedQuery:function(start,end){
	return function(view,db,base){
	    var startKey = base.concat(start);
	    var endKey = base.concat(end).concat({});
	    var options = {
		reduce:false,
		startkey:startKey,
		endkey:endKey
	    };
	    //todo: if statement for callback to insert our own
	    return function(callback){queryF(view,db)(options)(returnQuery(callback));};
	};
    },
    transactionRangeGroupLevelQuery:function(start,end,group_level){
	return function(view,db,base){
	    var startKey = base.concat(start);
	    var endKey = base.concat(end).concat({});
	    var options = {
		group_level:group_level,
		startkey:startKey,
		endkey:endKey
	    };
	    return function(callback){queryF(view,db)(options)(returnQuery(callback));};
	};
    },
    typedTransactionQuery:function(start,end){
	return function(view,db,base){
	    var startKey = base.concat(start);
	    var endKey = base.concat(end);
	    var options = {
		reduce:true,
		startkey:startKey,
		endkey:endKey
	    };
	    return function(callback){queryF(view,db)(options)(returnQuery(callback));};
	};
    },
    generalKeyReduceQuery:function(view,db){
	return function(key){
	    var startKey = ([]).concat(key);
	    var endKey = ([]).concat(key).concat({});
	    var options = {
		reduce:true,
		startkey:startKey,
		endkey:endKey
	    };
	    return function(callback){queryF(view,db)(options)(returnQuery(callback));};
	};
    },
    generalKeyGroupQuery:function(view,db){
	return function(groupLevel){
	    return function(key){
		var startKey = ([]).concat(key);
		var endKey = ([]).concat(key).concat({});
		var options = {
		    group_level:groupLevel,
		    startkey:startKey,
		    endkey:endKey
		};
		return function(callback){queryF(view,db)(options)(returnQuery(callback));};
	    };
	};
    },
    map:function(array,fn,runAfter){
	/*
	 * fn() must return a function of the form fn(err,response)
	 */
	async.map(array, 
		  function(array_item,callback){fn(array_item)(callback);},
		  runAfter);
    },
    parallel:function(array,fn,runAfter){
	/*
	 * fn() must return a function of the form fn(err,response)
	 *todo needs to look like this -> below 
	 * function(callback){async.parallel(_.map(store_ids,function(id){return keyQ(id);}),returnQuery(callback));}
	 */

    }
};

function extract(dataArrays,field){
    function extractProperty(data,field){
	return _(data.rows).pluck(field);
    }
    if(_.isEmpty(dataArrays)) {
	return [];	
    }

    else if(!_.isArray(dataArrays)){
	return extractProperty(dataArrays,field);
    }
    
    return _(dataArrays)
	.chain()
	.pluck('rows')
	.flatten()
	.pluck(field)
	.value();
}
function extractValue(dataArrays){
    return extract(dataArrays,'value');
}
function extractFirstValue(dataArrays){
    return _.first(extractValue(dataArrays));
}
function extractDoc(dataArrays){
    return extract(dataArrays,'doc');
}
function extractSum(dataArrays){
    var value = extractFirstValue(dataArrays);
    if(value && value.sum){
	return value.sum;
    }
    else{
	return 0;	
    }
}
function extractDocs(parallelFunctionsArray){
    return function(callback){
	async.parallel(parallelFunctionsArray,
		       function(err,responses){  
			   callback(err,extract(responses,'doc'));	  
		       });
    };
}
function extractVals(parallelFunctionsArray){
    return function(callback){
	async.parallel(parallelFunctionsArray,
		       function(err,responses){  
			   callback(err,extract(responses,'value'));	  
		       });
    };
}
function extractDocValMerge(parallelFunctionsArray){
    return function(callback){
	async.parallel(parallelFunctionsArray,
		       function(err,responses){  
			   var extractedDocs = extractDoc(responses);
			   var extractedValues = extractValue(responses);
			   var extractedData = _.zipMerge(extractedDocs,extractedValues);
			   callback(err,extractedData);	  
		       });
    };
}
function electronicPaymentsIndexRangeFetcher_F(id){
    var view = cdb.view('reporting','electronic_payments');
    var db = cdb.db('transactions',{},true);
    return function(startIndex,endIndex){
	var payments = _async.transactionRangeQuery(startIndex,endIndex)(view,db,[id]);
	return extractDocValMerge([payments]);
    };
}
function electronicPaymentsTotalsIndexRangeFetcher_F(id){
    var view = cdb.view('reporting','typed_electronic_payments');
    var db = cdb.db('transactions',{},true);
    return function(startIndex,endIndex){
	var debit_sale = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"sale","DEBIT"]);
	var visa_sale = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"sale","VISA"]);
	var mastercard_sale = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"sale","MASTERCARD"]);
	var amex_sale = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"sale","AMEX"]);
	var discover_sale = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"sale","DISCOVER"]);

	var debit_declined = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"declined","DEBIT"]);
	var visa_declined = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"declined","VISA"]);
	var mastercard_declined = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"declined","MASTERCARD"]);
	var amex_declined = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"declined","AMEX"]);
	var discover_declined = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"declined","DISCOVER"]);

	var debit_refund = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"refund","DEBIT"]);
	var visa_refund = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"refund","VISA"]);
	var mastercard_refund = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"refund","MASTERCARD"]);
	var amex_refund = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"refund","AMEX"]);
	var discover_refund = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"refund","DISCOVER"]);

	var voids = _async.typedTransactionQuery(startIndex,endIndex)(view,db,[id,"void","CARDVOID"]);

	return function(callback){
	    async.parallel({debit_sale :  debit_sale,
			    visa_sale : visa_sale,
			    mastercard_sale :  mastercard_sale,
			    amex_sale : amex_sale,
			    discover_sale :  discover_sale,

			    debit_declined : debit_declined,
			    visa_declined : visa_declined,
			    mastercard_declined : mastercard_declined,
			    amex_declined : amex_declined,
			    discover_declined : discover_declined,

			    debit_refund : debit_refund,
			    visa_refund : visa_refund,
			    mastercard_refund : mastercard_refund,
			    amex_refund : amex_refund,
			    discover_refund : discover_refund,

			   voids : voids},
			   function(err,responses){
			       var totals = {debit_sale : extractSum(responses.debit_sale),
					     visa_sale : extractSum(responses.visa_sale),
					     mastercard_sale :  extractSum(responses.mastercard_sale),
					     amex_sale : extractSum(responses.amex_sale),
					     discover_sale :  extractSum(responses.discover_sale),

					     debit_declined : extractSum(responses.debit_declined),
					     visa_declined : extractSum(responses.visa_declined),
					     mastercard_declined : extractSum(responses.mastercard_declined),
					     amex_declined : extractSum(responses.amex_declined),
					     discover_declined : extractSum(responses.discover_declined),

					     debit_refund : extractSum(responses.debit_refund),
					     visa_refund : extractSum(responses.visa_refund),
					     mastercard_refund :extractSum(responses. mastercard_refund),
					     amex_refund : extractSum(responses.amex_refund),
					     discover_refund : extractSum(responses.discover_refund),

					     voids : extractSum(responses.voids)
					    };

			       var credit = {credit_sale : _([totals.visa_sale,totals.mastercard_sale,totals.amex_sale,totals.discover_sale]).reduce(sum,0),
					     credit_refund : _([totals.visa_refund,totals.mastercard_refund,totals.amex_refund,totals.discover_refund]).reduce(sum,0),
					     credit_declined : _([totals.visa_declined,totals.mastercard_declined,totals.amex_declined,totals.discover_declined]).reduce(sum,0)};

			       var deposit = {deposit_sale : credit.credit_sale + totals.debit_sale,
					      deposit_refund : credit.credit_refund + totals.debit_refund,
					      deposit_declined : credit.credit_declined + totals.debit_declined};
			       
			       _.extend(totals,credit,deposit);
						
			       callback(err,totals);	  
			   });
	};
    };
}
function canceledTransactionsIndexRangeFetcher_F(id){
    var view = cdb.view('reporting','terminalID_type_index');
    var db = cdb.db('transactions',{},true);
    return function(startIndex,endIndex){
	var voids = _async.transactionRangeQuery(startIndex,endIndex)(view,db,[id,"VOID"]);
	var voidRefunds = _async.transactionRangeQuery(startIndex,endIndex)(view,db,[id,"VOIDREFUND"]);
	return extractDocs([voids,voidRefunds]);
    };
}
function discountTransactionsIndexRangeFetcher_F(id){
    var view = cdb.view('reporting','Discounts_terminalID_type_index');
    var db = cdb.db('transactions',{},true);
    return function(startIndex,endIndex){
	var sales = _async.transactionRangeQuery(startIndex,endIndex)(view,db,[id,"SALE"]);
	return extractDocs([sales]);
    };
}
function refundTransactionsIndexRangeFetcher_F(id){
    var view = cdb.view('reporting','terminalID_type_index');
    var db = cdb.db('transactions',{},true);
    return function(startIndex,endIndex){
	var refunds = _async.transactionRangeQuery(startIndex,endIndex)(view,db,[id,"REFUND"]);
	return extractDocs([refunds]);
    };
};

function generalCashoutListFetcher_Period_F(startDate,endDate){
    var view = cdb.view('reporting','cashouts_id_date');
    var db = cdb.db('cashouts',{},true);
    return function(id){
	var dateStart = date.toArray.until.day(startDate);
	var dateEnd = date.toArray.until.day(endDate);
	var cashouts = _async.transactionRangeQuery(dateStart,dateEnd)(view,db,[id]);
	return extractDocs([cashouts]);
    };
};
function generalCashoutFetcher_Period_F(startDate,endDate){
    var view = cdb.view('reporting','cashouts_id_date');
    var db = cdb.db('cashouts',{},true);
    return function(id){
	return function(callback){
	    
            var baseKey = [id];
	    var dateStart = date.toArray.until.day(startDate);
	    var dateEnd = date.toArray.until.day(endDate);

            var cashoutQuery = _async.typedTransactionQuery(dateStart,dateEnd)(view,db,baseKey);
	    
	    cashoutQuery
	    (function(err,report){
		 var cashouts = (_.isFirstNotEmpty(report.rows)? _.first(report.rows).value:ZEROED_FIELDS);

		 function appendCategorySalesPercent(total, cashoutReport) {
		     var cashout = _.clone(cashoutReport);
		     if(total!=0) {
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
			 .applyToValues(toFixed(2))
			 .extend(_.selectKeys(data, ['noofpayment','noofrefund','firstindex','lastindex']))
			 .value();
		 };
		 
		 var totalperiod = cashouts['menusalesamount'] + cashouts['scansalesamount'] + cashouts['ecrsalesamount'];
		 
		 cashouts = appendCategorySalesPercent(totalperiod, cashouts);
		 cashouts = modifiedCashouts(cashouts); 
		 cashouts.id  = id;
		 
		 callback(null,cashouts);      
	     });
	};
    };
};
function transactionsFromIndexRange(indexFn,transactionFn){
    return function(terminal_id){
	return function(continuation){
	    async
		.waterfall([indexFn(terminal_id),
			    function(indexObj,callback){
				transactionFn(terminal_id)(indexObj.firstindex,indexObj.lastindex)
				(continuation);
			    }]);
	};
    };
}
function processTransactions(mapFn,callback){
    return function(err,transactions){
	var terminals_merged_with_reduced_transactions = 
	    _(transactions)
	    .chain()
	    .flatten()
	    .map(mapFn)
	    .value(); 
	callback(err,terminals_merged_with_reduced_transactions);
    };
};

function mapReduceTransactions(mapFn,reduceFn,callback){
    return function(err,transactions){
	var terminals_merged_with_reduced_transactions = 
	    _(transactions)
	    .chain()
	    .flatten()
	    .map(mapFn)
	    .reduce(reduceFn,{})
	    .value(); 
	callback(err,terminals_merged_with_reduced_transactions);
    };
};
function mapReduceTransactionsFromCashouts(terminals,startDate,endDate){
    return function (IndexRangeFetcher,mapFn,reduceFn){
	return function(callback) {
	    if(!_.isArray(terminals)){terminals = [terminals];}
	    var ids = _.pluck(terminals,'id');
	    _async.map(ids,
		       transactionsFromIndexRange(generalCashoutFetcher_Period_F(startDate,endDate),
						  IndexRangeFetcher),
		       mapReduceTransactions(mapFn,reduceFn,callback));
	};
    };
}

function processedTransactionsFromCashouts(terminals,startDate,endDate){
    return function (IndexRangeFetcher,mapFn){
	return function(callback) {
	    if(!_.isArray(terminals)){terminals = [terminals];}
	    var ids = _.pluck(terminals,'id');
	    _async.map(ids,
		       transactionsFromIndexRange(generalCashoutFetcher_Period_F(startDate,endDate),
						  IndexRangeFetcher),
		       processTransactions(mapFn,callback));
	};
    };
}

function processedReducedTransactionsFromCashouts(terminals,startDate,endDate){
    return function (IndexRangeFetcher){
	return function(callback) {
	    if(!_.isArray(terminals)){terminals = [terminals];}
	    var ids = _.pluck(terminals,'id');
	    _async.map(ids,
		       transactionsFromIndexRange(generalCashoutFetcher_Period_F(startDate,endDate),
						  IndexRangeFetcher),
		       returnQuery(callback));
	};
    };
}
function canceledTransactionsFromCashoutsFetcher(terminals,startDate,endDate){
    function cancelledMap(terminals){
	return function(transaction){
	    var terminalForTransaction = _.find(terminals, function(ter){return transaction.terminal_id==ter.id;});
	    return _.extend({},transaction,terminalForTransaction,{date: jodaDateFormatter(transaction.time.start)});
	};
    };
    return processedTransactionsFromCashouts(terminals,startDate,endDate)(canceledTransactionsIndexRangeFetcher_F,cancelledMap(terminals));
};
function refundTransactionsFromCashoutsFetcher(terminals,startDate,endDate){
    function refundMap(terminals){
	return function(transaction){
	    var terminalForTransaction = _.find(terminals, function(ter){return transaction.terminal_id==ter.id;});
	    return _.extend({},
			    transaction,
			    terminalForTransaction,
			    {date: jodaDateFormatter(transaction.time.start)});
	};
    };
    return processedTransactionsFromCashouts(terminals,startDate,endDate)(refundTransactionsIndexRangeFetcher_F,refundMap(terminals));
};
function discountTransactionsFromCashoutsFetcher(terminals,startDate,endDate){
    function discountMap(terminals){
	return function(transaction){
	    var terminalForTransaction = _.find(terminals, function(ter){return transaction.terminal_id==ter.id;});
	    var sales = transaction.discount+transaction.subTotal;
	    return _.extend({},
			    transaction,
			    terminalForTransaction,
			    {date:jodaDateFormatter(transaction.time.start)},
			    {sales:sales},
			    {percentdiscount:transaction.discount/sales*100});
	};
    };
    return processedTransactionsFromCashouts(terminals,startDate,endDate)(discountTransactionsIndexRangeFetcher_F,discountMap(terminals));
};

/********************************** voucher report **********************************/
function otherTransactionsRangeFetcher(id, startDate, endDate) {
    return function(callback){
        var dateStart = date.toArray.until.day(startDate);
        var dateEnd = date.toArray.until.day(endDate);
        
        $.couch.db("cashedout_transactions").view("reporting/voucher_id_date", {
            reduce:false,
            startkey:[id].concat(dateStart),
            endkey:[id].concat(dateEnd),
            include_docs:true,
            success:function(resp){
                var data = _.map(resp.rows,function(row){
                    var doc = row.doc;
                    var val = row.value;
                    
                    return _.extend(val,doc,{date: jodaDateFormatter(doc.time.start)});
                });
                
                callback(undefined,data);
            },
            error:function(status) {
                callback(status,undefined);
            }
        });
    };
}
/************************************************************************************/

function cashoutReportFetcher(terminals,startDate,endDate){
    function processCashouts(terminals,callback){
	return function(err,cashouts){
	    var templateData =
		_(cashouts).chain()
	    	.flatten()
		.map(function(cashout){
			 var transformedCashout 
			     =  {cashout : cashout,
				 id: cashout._id,
				 name: cashout.terminalname,
				 cashouttime: jodaDateFormatter(cashout.cashouttime),
				 cashoutnumber: cashout.cashoutnumber.toString()};
			 return transformedCashout;
		     })
        	.value();	    
	    callback(templateData);
	};
    }
    if(!_.isArray(terminals)){terminals = [terminals];}
    var ids = _.pluck(terminals,'id');
    return function(callback){
	_async.map(ids,
		   generalCashoutListFetcher_Period_F(startDate,endDate),
		   processCashouts(terminals,callback));
    };
}

function electronicPaymentsReportFetcher(terminals,startDate,endDate){
    function paymentMap(terminals){
	return function(transaction){
	    var terminalForTransaction = _.find(terminals, function(ter){return transaction.terminal_id==ter.id;});
	    var sales = transaction.discount+transaction.subTotal;
	    return _.extend({},
			    transaction,
			    terminalForTransaction,
			    {date: jodaDateFormatter(transaction.time.start)},
			    {sales: sales});
	};
    };
    return function(callback){
	async.parallel({
			   paymentList: processedTransactionsFromCashouts(terminals,startDate,endDate)(electronicPaymentsIndexRangeFetcher_F,paymentMap(terminals)),
			   totals: mapReduceTransactionsFromCashouts(terminals,startDate,endDate)(electronicPaymentsTotalsIndexRangeFetcher_F,identity,_.addPropertiesTogether)
		       },
		       callback);
    };
};