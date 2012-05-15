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

    _([
	  {file:'export_request/app.js',db:'export_requests_rt7'},

	  {file:'vouchers/app.js',db:'vouchers_rt7'},

	  {file:'users/app.js',db:'_users'},
	  {file:'users/validation.js',db:'_users'},

	  //{file:'users/app.js',db:'users'},
	 //{file:'users/validation.js',db:'users'},

	  {file:'users/app.js',db:'users_designs'},
	  {file:'users/validation.js',db:'users_designs'},

	  {file:'transactions/app.js',db:'transactions'},
	  {file:'transactions/app.js',db:'cashedout_transactions'},
	  {file:'transactions/app.js',db:'transactions_designs'},

	  {file:'transactions/pos.js',db:'transactions'},
	  {file:'transactions/pos.js',db:'cashedout_transactions'},
	  {file:'transactions/pos.js',db:'transactions_designs'},

	  {file:'terminals/app.js',db:'terminals_corp'},
	  {file:'terminals/app.js',db:'terminals_rt7'},
	  {file:'terminals/app.js',db:'terminals_designs'},

	  {file:'stores/app.js',db:'stores_designs'},

	  {file:'back_office_app/app.js',db:'rt7_backoffice_app'},

	  {file:'media_stats/app.js',db:'media_stats'},
	  {file:'media_stats/app.js',db:'media_stats_designs'},

	  {file:'inventory_changes/app.js',db:'inventory_changes'},
	  {file:'inventory_changes/app.js',db:'inventory_changes_designs'},

	  {file:'inventory/app.js',db:'inventory'},
	  {file:'inventory/app.js',db:'inventory_designs'},

	  {file:'companies/app.js',db:'companies'},

	  {file:'cashout/app.js',db:'cashouts'},
	  {file:'cashout/pos.js',db:'cashouts'},

	  {file:'cashout/app.js',db:'cashout_designs'},
	  {file:'cashout/pos.js',db:'cashout_designs'},

	  {file:'campaign-manager/app.js',db:'campaigns'},
	  {file:'campaign-manager/app.js',db:'campaigns_designs'}

      ])
	.each(function(transfer){
		  var loaded_doc =  require('./'+transfer.file)
		  push_couchapp(loaded_doc,transfer.db)
	      })

}
main.apply(null,_(process.argv).rest(2));
require.main === module;