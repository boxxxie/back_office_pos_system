function voucherFetcher_f(company_id) {
    var voucherview = cdb.view("app","company_id_doc");
    var db_voucher = cdb.db("vouchers_rt7");


    var optionsForVoucher = {
        key : company_id,
        include_docs : true
    };
    
    return function(callback){
        query(optionsForVoucher, voucherview, db_voucher)
        (function(resp){
            callback(null, resp);
        });    
    };
    
};