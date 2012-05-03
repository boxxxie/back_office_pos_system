var _ = require("views/lib/underscore");

Date.prototype.toArray = function(){
    return [this.getFullYear(),
       (this.getMonth()+1),
       this.getDate(),
       this.getHours(),
       this.getMinutes(),
       this.getSeconds()];
}

function transactionDate(doc){
    return (new Date(doc.cashouttime)).toArray();
}

function ids(doc){
    return _.compact([doc.terminal_id,doc.store_id,doc.group_id,doc.company_id]);
}

function commonProperties(doc){
    return {
	date : transactionDate(doc),
	ids : ids(doc)
    }
}

function emitNumericField(doc,field){
    var d = commonProperties(doc);
    d.ids.forEach(function(id){
		      var key = ([]).concat(id).concat(d.date);
		      emit(key,Number(doc[field]));
		  })
}

function emitDoc(doc){
    function convertSecondItemToNumber(pair){
	var converted = Number(pair[1]);
	if(!isNaN(converted)){pair[1] = converted;}
	return pair;
    }
    var d = commonProperties(doc);
    var emitted_doc = _(doc).chain()
	.selectKeys(["firstindex",
		     "lastindex",
		     "netsales",
		     "netsaletax1",
		     "netsaletax3",
		     "netsalestotal",
		     "netrefund",
		     "netrefundtax1",
		     "netrefundtax3",
		     "netrefundtotal",
		     "netsaleactivity",
		     "cashpayment",
		     "creditpayment",
		     "debitpayment",
		     "mobilepayment",
		     "otherpayment",
		     "cashtotal",
		     "credittotal",
		     "debittotal",
		     "mobiletotal",
		     "othertotal",
		     "noofsale",
		     "avgpayment",
		     "cashrefund",
		     "creditrefund",
		     "debitrefund",
		     "mobilerefund",
		     "otherrefund",
		     "noofrefund",
		     "avgrefund",
		     "menusalesno",
		     "menusalesamount",
		     "scansalesno",
		     "scansalesamount",
		     "ecrsalesno",
		     "ecrsalesamount",
		     "allDiscount",
		     "actual_tender"])
	.kv()
	.map(convertSecondItemToNumber)
	.toObject()
	.value();
    d.ids.forEach(function(id){
		      var key = ([]).concat(id).concat(d.date);
		      emit(key,emitted_doc);
		  });
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports.commonProperties = commonProperties;
    module.exports.emitNumericField = emitNumericField;
    module.exports.emitDoc = emitDoc;
}