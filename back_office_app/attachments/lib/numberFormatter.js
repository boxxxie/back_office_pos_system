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

function currency_format(num){
    if(_.isNumber(num)){
    return format(",##0.00",toFixed(2)(num));
    }
    return num;
}