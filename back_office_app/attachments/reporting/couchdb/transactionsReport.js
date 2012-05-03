function transactionFormattingWalk(obj){
    if(obj.count || obj.count==0){
	return _.extend(obj,{count:obj.count+""});
    }
    if(obj.quantity){
	if(obj.origin == "SCALE"){
	    obj.quantity = toFixed(3)(obj.quantity);
	}
	else{
	    obj.quantity += "";
	}
    }
    if(obj.transactionNumber){
	obj.transactionNumber += "";
    }
    if(obj.time && obj.time.start) {
	_.extend(obj,{transtime:jodaTimePartFormatter(obj.time.start),
		      transdate:jodaDatePartFormatter(obj.time.start)});
    }
    return currency_format(obj);
}
function transactionsReportFetcher(start,end){
    return function(id){
	var view = cdb.view('reporting','id_date');
	var db = cdb.db('cashedout_transactions',{},true);
	var query = _async.transactionRangeQuery(start,end)(view,db,id);
	return function(callback){
	    query(function(err,response){
		      function calculateTotalsOverTransactions(transactions){
			  return _.chain(transactions)
			      .mapSelectKeys('type','tax1and2','subTotal','tax3','total')
			      .groupBy('type')
			      .filter$(function(transactions,type){return (type == "SALE" || type == "REFUND");})
			      .map(function(transactions,type){
				       if(type == "REFUND"){return _.prewalk(negate,transactions);}
				       return transactions;
				   })
			      .flatten()
			      .reduce(_.addPropertiesTogether,{})
			      .defaults({tax1and2:0,subTotal:0,tax3:0,total:0})
			      .value();
		      }
		      function startTime(transaction){
                                       return (new Date(transaction.time.start)).getTime();
                               };
		      
		      var transactions = _.chain(response.rows).pluck('doc').sortBy(startTime).reverse().value();
		      
		     var totalOverAllDates = calculateTotalsOverTransactions(transactions);
		      var result = {transactions:transactions,total:_.prewalk(currency_format,totalOverAllDates)};
		      callback(err,result);
		  });
	};
    };
}
function transactionsReportDaySummaryFetcher(start,end){
    return function(id){
	var view = cdb.view('reporting','id_date_sale_refund_summary');
	var db = cdb.db('cashedout_transactions',{},true);
	return function(callback){
	    _async.transactionRangeGroupLevelQuery(start,end,4)(view,db,id)
	    (function(err,resp){
		 var transactions = 
		     _.map(resp.rows,
			   function(item){
			       return _.extend({},
					       item.value,
					       {date : _.rest(item.key)},
					       {dateString : item.key[1]+"-"+item.key[2]+"-"+item.key[3]});
			       });
	      var total = _.reduce(transactions,_.addPropertiesTogether,{});
	      if(_.isEmpty(total)) {
	          total = {};
	          _.extend(total,{count:0, subTotal:0, tax1and2:0, tax3:0, total:0});
	      }
         var result = {transactions:transactions,total:total};
		 callback(err, result);});
	};
    };
}
