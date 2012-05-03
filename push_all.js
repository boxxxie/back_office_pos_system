/*
 * Usage
 * $ node push_all.js db_account_name:password my_domain_name:port
 * $ node push_all.js paul:password localhost:5984
 */
var couchapp = require("couchapp");
var _ = require('underscore');

function main(user,ip){
    function couchapp_push_as_user(user,ip){
	return function(file,db){
	    couchapp
		.createApp(file,
			   'http://'+ user + '@' + ip + '/' + db,
			   function(design_doc){
			       design_doc.push()
			   })
	}
    }

    var push_couchapp = couchapp_push_as_user(user,ip);

    _({
	  //'locations/app.js':'locations_rt7',
	  'export_request/app.js':'export_requests_rt7',

	  'vouchers/app.js':'vouchers_rt7',

	  'users/app.js':'_users',
	  'users/validation.js':'_users',
	  'users/app.js':'users',
	  'users/validation.js':'users',
	  'users/app.js':'users_designs',
	  'users/validation.js':'users_designs',

	  'transactions/app.js':'transactions',
	  'transactions/app.js':'cashedout_transactions',
	  'transactions/pos.js':'transactions',
	  'transactions/pos.js':'cashedout_transactions',
	  'transactions/app.js':'transactions_designs',
	  'transactions/pos.js':'transactions_designs',

	  'terminals/app.js':'terminals_corp',
	  'terminals/app.js':'terminals_rt7',
	  'terminals/app.js':'terminals_designs',

	  //'stores/app.js':'stores',
	  'stores/app.js':'stores_designs',

	  'back_office_app/app.js':'rt7_backoffice_app',

	  'media_stats/app.js':'media_stats',
	  'media_stats/app.js':'media_stats_designs',

	  'inventory_changes/app.js':'inventory_changes',
	  'inventory_changes/app.js':'inventory_changes_designs',

	  'inventory/app.js':'inventory',
	  'inventory/app.js':'inventory_designs',

	  'companies/app.js':'companies',

	  'cashout/app.js':'cashouts',
	  'cashout/pos.js':'cashouts',
	  'cashout/app.js':'cashout_designs',
	  'cashout/pos.js':'cashout_designs',

	  'campaign-manager/app.js':'campaigns',
	  'campaign-manager/app.js':'campaigns_designs'

      })
	.each(function(db,file){
		  var loaded_doc =  require('./'+file)
		  push_couchapp(loaded_doc,db)
	      })

}
main.apply(null,_(process.argv).rest(2));
require.main === module;