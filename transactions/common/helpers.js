var _ = require("views/lib/underscore");
require("views/lib/underscore_extended");
require("views/lib/underscore_walk");

function negate(num){
    if(_.isDefined(num) && _.isNumber(num)){
	return -num;
    }
    return num;
}
Date.prototype.toArray = function(){
    return [this.getFullYear(),
	    (this.getMonth()+1),
	    this.getDate(),
	    this.getHours(),
	    this.getMinutes(),
	    this.getSeconds()];
};

function toFixed(mag){
    function roundNumber(rnum, rlength) { // Arguments: number to round, number of decimal places
	var newnumber = Math.round(rnum*Math.pow(10,rlength))/Math.pow(10,rlength);
	return parseFloat(newnumber); // Output the result to the form field (change for your purposes)
    }
    return function(num){
	if(_.isNumber(num)){
	    return roundNumber(num,mag).toFixed(mag);
	}
	return num;
    };
}

var transactionType = {
    isVoid :function(transactionType){return _.contains(["VOID","VOIDREFUND","CARDVOID"],transactionType);},
    isAuthorized : function(authCode){return !_.contains(["void","declined","refund"],authCode);}
};
var paymentType = {
    isCredit:function(type){ return _.contains(["VISA","AMEX","MASTERCARD","DISCOVER"],type);},
    isDebit:function(type){ return _.contains(["DEBIT"],type);},
    isCash:function(type){ return _.contains(["CASH"],type);},
    isOther:function(type){ return _.contains(["OTHER"],type);},
    isVoid :function(type){return _.contains(["VOID","VOIDREFUND","CARDVOID"],type);},
    isRefund :function(type){return _.contains(["REFUND"],type);},
    isElectronic : function(payment){return !_.isUndefined(payment.paymentdetail) && !this.isOther(payment.type);}
};
function transactionDate(doc){
    return (new Date(doc.time.start)).toArray();
};
function ids(doc){
    return _.compact([doc.terminal_id,doc.store_id,doc.group_id,doc.company_id]);
};
function commonProperties(doc){
    if(_.isEmpty(doc.order)){
	var order = [
	    {
		"quantity": 1,
		"price": 0,
		"hasModifier": false,
		"applyTax1": true,
		"applyTax2": true,
		"applyTax3": false,
		"tax1": {
		    "number": "",
		    "percent": 0
		},
		"tax2": {
		    "number": "",
		    "percent": 0
		},
		"tax3": {
		    "number": "",
		    "percent": 0
		},
		"origin": "n/a",
		"discount": 0,
		"printInKitchen": false,
		"exempted": false,
		"tax1and2Value": 0,
		"tax3Value": 0,
		"actualprice": 0,
		"originalcost": 0,
		"description": "empty transaction"
	    }
	];
    }
    else{
	var order = doc.order;
    }
    if(_.isEmpty(doc.payments)){
	var payments = [
	    {
		"amount": 0,
		"approved": false,
		"manual": false,
		"swiped": false,
		"chip": false,
		"language": "",
		"type": "n/a"
	    }];
    }
    else{
	var payments = doc.payments;
    }
    return {
	date : transactionDate(doc),
	ids : ids(doc),
	index : doc.transaction_index,
	total : doc.total,
	discount : doc.discount,
	type : doc.type,
	subTotal : doc.subTotal,
	order : order,
	payments : payments
    };
};
function orderPriceNoTax(order){
    function sum(acc,cur){return acc+cur;};
    var prices = [];
    _.walk_pre(order,
		  function(o){
		      if(!o){return o;}
		      var quantity = Number(o.quantity)?Number(o.quantity):1;
		      if(o.actualprice){
			  prices.push(o.actualprice * quantity);
		      }
		      return o;
		  });
    return Number(toFixed(2)(prices.reduce(sum,0)));
};

function emitDoc(doc){
    //we have to do this because we need to recalculate the prices for each item in the order due to it being from menu/scan/ecr
    var d = commonProperties(doc);
    _.each(d.order, function(order){
	       _.each(d.ids, function(id){
			  var key = ([]).concat(id)
			      .concat(doc.type)
			      .concat(order.origin)
			      .concat(d.date);
			  emit(key, orderPriceNoTax(order));
		      });
	   });

}
function emit_ID_date(doc){
    var d = commonProperties(doc);
    if(d.type == "ABNORMAL"){
	return;
    }
    _.each(d.ids, function(id){
	       var key = ([]).concat(id)
		   .concat(d.date);
	       emit(key, 1);
	   });
}
function emit_ID_date_summary(doc){
    var d = commonProperties(doc);
    var smallDoc = _(doc).selectKeys('subTotal','total','tax1and2','tax3');
    if (d.type == "REFUND"){
	var transformed_doc = _(smallDoc).walk_pre(negate);
    }
    else if(d.type == "SALE"){
	var transformed_doc = smallDoc;
    }
    else {
	return;
    }
    _.each(d.ids, function(id){
	       var key = ([]).concat(id)
		   .concat(d.date);
	       emit(key, _.extend(transformed_doc,{count:1}));
	   });
}

function emitDocForInventoryReport(doc){
    function extractLabel(order){
	if(order.origin == "MENU"){
	    return order.description.trim().toLowerCase();
	}
	if(order.origin == "INVENTORY"){
	    return order.upccode + " - " + order.description.trim();
	}
	if(order.origin == "ECR"){
	    if(order.ecr_type.type.indexOf("DEPARTMENT") != -1){
		var origin = "DEPARTMENT";
 	    }
	    else{
		var origin = order.ecr_type.type;
	    }
	    return order.ecr_type.name.trim().toLowerCase();
	}
	return "n/a";
    };
    function extractOrigin(order){
	if(order.origin == "ECR"){
	    if(order.ecr_type.type.indexOf("DEPARTMENT") != -1){
		return "DEPARTMENT";
 	    }
	    else{
		return order.ecr_type.type;
	    }
	}
	else{
	    return order.origin;
	}
    };

    function emitInvItem(d,origin,label, quantity,price){
	var value = {quantity:quantity,price:price};
	_.each(d.ids, function(id){
		   var key = ([]).concat(id)
		       .concat(d.type)
		       .concat(origin)
		       .concat(d.date)
		       .concat(label);
		   emit(key, value);
	       });
    }

    //we have to do this because we need to recalculate the prices for each item in the order due to it being from menu/scan/ecr
    var d = commonProperties(doc);
    _.each(d.order, function(order){
	       var price = order.actualprice;
	       var quantity = Number(order.quantity)?Number(order.quantity):1;
	       var label = extractLabel(order);
	       var origin = extractOrigin(order);
	       emitInvItem(d,origin,label,quantity,price);
	       if(_.isNotEmpty(order.modifiers)){
		   _.each(order.modifiers,function(mod){
			     var price = Number(mod.price)?mod.price:0;
			     var quantity = Number(mod.quantity)?Number(mod.quantity):1;
			     var label = mod.description.toLowerCase();
			     emitInvItem(d,origin,label,quantity,price);
			 });
	       }
	   });
}

function emitValWithIds(doc,keyEnd,field,dontEmitZeros){
    var d = commonProperties(doc);
    var emitVal = d[field];
    if(!_.isUndefined(emitVal)){
	var numEmitVal = Number(emitVal);
	if(!_.isNaN(numEmitVal)){
	    if(dontEmitZeros && numEmitVal == 0){return;}
	    _.each(d.ids, function(id){
		       var key = ([]).concat(id)
			   .concat(d.type)
			   .concat(d[keyEnd]);
		       emit(key,Number(numEmitVal));
		   });
	}
    }
}
function emitDocDiscount(doc){
    //we have to do this because we need to recalculate the prices for each item in the order due to it being from menu/scan/ecr
    emitValWithIds(doc,'index','discount', true);
}
function emitDocNoOrigin(doc){
    emitValWithIds(doc,'date','subTotal');
}
function emitElectronicPayments(doc){
    if(_.isNotEmpty(doc.payments)){
	var d = commonProperties(doc);
	_.each(d.ids, function(id){
		   _.each(d.payments,function(payment){
			      var paymentAmount = payment.amount;
			      if(paymentType.isElectronic(payment)){
				  if(paymentAmount && paymentAmount != 0){
				      var authCode;
				      if(paymentType.isVoid(payment.type)){authCode = "void";}
				      else if(!payment.approved){authCode = "declined";}
				      else if(paymentType.isRefund(payment.paymentdetail.type)){
					  authCode = "refund";
					  //paymentAmount = negate(paymentAmount);
				      }
				      else{authCode = payment.paymentdetail.author;}
				      var payment_type;
				      var debit=0;
				      if(paymentType.isDebit(payment.type)){
					  debit = paymentAmount;
					  payment_type = "debit";
				      }
				      var credit=0;
				      if(paymentType.isCredit(payment.type)){
					  credit = paymentAmount;
					  payment_type = 'credit';
				      }
				      var key = ([]).concat(id).concat(doc.transaction_index);
				      emit(key, {amount:Number(paymentAmount),authCode:authCode,credit:credit,debit:debit});
				  }
			      }
			  });
	       });
    }
};



function emitTypedElectronicPayments(doc){
    if(_.isNotEmpty(doc.payments)){
	var d = commonProperties(doc);
	_.each(d.ids, function(id){
		   _.each(d.payments,function(payment){
			      var paymentAmount = payment.amount;
			      if(paymentType.isElectronic(payment)){
				  if(paymentAmount && paymentAmount != 0){
				      var payment_type,cardType = payment.type;
				      if(paymentType.isVoid(payment.type)){payment_type = 'void';}
				      else if(!payment.approved){payment_type = 'declined';}
				      else if(paymentType.isRefund(payment.paymentdetail.type)){
					  payment_type = 'refund';
					  //paymentAmount = negate(paymentAmount);
				      }
				      else{ payment_type = 'sale';}
				      var key = ([]).
					  concat(id).
					  concat(payment_type).
					  concat(cardType).
					  concat(doc.transaction_index);
				      emit(key, Number(paymentAmount));
				  }
			      }
			  });
	       });
    }
};


function emitVoucherPayment_id_date(doc){
    if(_.isNotEmpty(doc.payments)){
    var d = commonProperties(doc);
    
    transDate = new Date(doc.time.start),
    transDateArray = (transDate).toArray();
    
    _.each(d.ids, function(id){
           _.each(d.payments,function(payment){
                  var paymentAmount = payment.amount;
                  if(paymentType.isOther(payment.type)){
                      if(paymentAmount && paymentAmount != 0){
                          var bal = Number(payment.response.voucher_balance);
                          var redeemed = Number(payment.response.redeemed);
                          
                          var key = ([]).
                          concat(id).
                          concat(transDateArray);
                          
                          emit(key, {voucherBalance:bal, 
                                     voucherRedeemed:redeemed, 
                                     voucherID:payment.response.voucher_id,
                                     voucherName:payment.response.voucher_name,
                                     voucherType:payment.response.voucher_type});
                      }
                  }
              });
           });
    }
};

function emitInventoryStockSold(doc){
    if(_.contains(["REFUND","SALE"],doc.type)){
	//continue if transaction is sale or refund
    }
    else{
	return;
    }
    function isInventoryOrder(o){return o && o.origin && o.origin === "INVENTORY";}
    function adjustedQty(qty){
	if(doc.type === "REFUND"){
	    return negate(qty);
	}
	return qty;
    }
    var inventoryItems = [],
    dateSold = new Date(doc.time.start),
    dateSoldArray = (dateSold).toArray();
    function collectInventory(o){
	if(isInventoryOrder(o)){
	    var inv = {};
	    inv[o.upccode] = {qty:adjustedQty(o.quantity),
			      date:dateSold};
	    inventoryItems.push(inv);
	}
	return o;
    }
    if(_.isNotEmpty(doc.order)){
	_.walk_pre(doc.order,collectInventory);
	_.each(inventoryItems,function(inv){
		   _.each(ids(doc),
			  function(id){
			      var key = ([id]).concat(dateSoldArray);
			      emit(key,inv);
			  });
	       });
    }
}

if (typeof module !== 'undefined' &&
    module.exports) {
    module.exports.commonProperties = commonProperties;
    module.exports.emitDoc = emitDoc;
    module.exports.emitDocNoOrigin = emitDocNoOrigin;
    module.exports.emitDocDiscount = emitDocDiscount;
    module.exports.emitElectronicPayments = emitElectronicPayments;
    module.exports.emitTypedElectronicPayments = emitTypedElectronicPayments;
    module.exports.emitDocForInventoryReport = emitDocForInventoryReport;
    module.exports.emit_ID_date = emit_ID_date;
    module.exports.emit_ID_date_summary = emit_ID_date_summary;
    module.exports.emitInventoryStockSold = emitInventoryStockSold;
    module.exports.emitVoucherPayment_id_date = emitVoucherPayment_id_date;
}