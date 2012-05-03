
Date.prototype.toArray = function(){
    return [this.getFullYear(),
	    (this.getMonth()+1),
	    this.getDate(),
	    this.getHours(),
	    this.getMinutes(),
	    this.getSeconds()];
};

function ids(doc){
    return [doc.store.ids.chain,
	    doc.store.ids.store,
	    doc.terminal_id];
};

function commonProperties(doc){
    var props = {};
    if(doc.ids){
	if(doc.ids.store){props.store = doc.ids.store;}
	if(doc.ids.store_min){props.store_min = doc.ids.store_min;}
	if(doc.ids.chain){props.company = doc.ids.chain;}
	if(doc.ids.chain_min){props.company_min = doc.ids.chain_min;}
	if(doc.ids.store_num){props.store_num = doc.ids.store_num;}
    }
    if(doc.address){
	if(doc.address.zip_postal){props.postalCode = doc.address.zip_postal;}
	if(doc.address.phones){props.phones = doc.address.phones;}
	if(doc.address.state_prov){props.province = doc.address.state_prov;}
	if(doc.address.country){props.country = doc.address.country;}
	if(doc.address.city){props.city = doc.address.city;}
    }
    return props;
};

function postalCodeArray(s){
    return s
	.postalCode
	.split(" ")
	.join("")
	.split("");
};

function areaCodes(s){
    return  s
	.phones
	.map(function(phone){
		 return phone.match(/\d{3}/)[0];
	     });  
};

module.exports = {
    commonProperties : commonProperties,
    postalCodeArray : postalCodeArray,
    areaCodes : areaCodes
};