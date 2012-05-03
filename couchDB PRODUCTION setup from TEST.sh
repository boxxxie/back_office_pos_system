## setting up reports enviornment from server
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/rt7_backoffice_app/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/cashouts/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/transactions/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/cashedout_transactions/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/menus_corp/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/menu_buttons/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/inventory/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/inventory_changes/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/terminals_rt7/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/stores/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/media_stats/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/campaigns/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/_users/_compact
#curl -H "Content-Type: application/json"  -X POST  http://paul:password@localhost:5984/users/_compact
#TODO add delay here too allow compaction to complete

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/rt7_backoffice_app","source":"rt7_backoffice_app","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/cashout_designs","source":"cashouts","create_target":true, "doc_ids":["_design/pos","_design/reporting"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/cashouts","source":"cashouts","create_target":true, "doc_ids":["_design/pos","_design/reporting"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/transactions_designs","source":"transactions","create_target":true, "doc_ids":["_design/pos","_design/reporting"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/transactions","source":"transactions","create_target":true, "doc_ids":["_design/pos","_design/reporting"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/cashedout_transactions","source":"transactions","create_target":true, "doc_ids":["_design/pos","_design/reporting"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/inventory_designs","source":"inventory","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/inventory","source":"inventory","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/inventory_changes","source":"inventory_changes","create_target":true, "doc_ids":["_design/app","_design/misc"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/inventory_changes_designs","source":"inventory_changes","create_target":true, "doc_ids":["_design/app","_design/misc"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/media_stats","source":"media_stats","create_target":true, "doc_ids":["_design/app","_design/reports"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/media_stats_designs","source":"media_stats","create_target":true, "doc_ids":["_design/app","_design/reports"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/menu_buttons","source":"menu_buttons","create_target":true, "doc_ids":["_design/menubuttons"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/stores_designs","source":"stores","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/terminals_rt7","source":"terminals_rt7","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/terminals_designs","source":"terminals_rt7","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/campaigns_designs","source":"campaigns","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/campaigns","source":"campaigns","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/_users","source":"_users","create_target":true, "doc_ids":["_design/_auth","_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/users","source":"users","create_target":true, "doc_ids":["_design/_auth","_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/users_designs","source":"_users","create_target":true, "doc_ids":["_design/_auth","_design/app"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/companies","source":"companies","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate

#curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/inv_new","source":"inv_new","create_target":true}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"target":"http://rt7 admin:my dog has three heads@108.174.27.163/install_files_rt7","source":"install_files_rt7","create_target":true}' http://paul:password@localhost:5984/_replicate

curl -X PUT "http://rt7 admin:my dog has three heads@108.174.27.163/inventory_rt7"
curl -X PUT "http://rt7 admin:my dog has three heads@108.174.27.163/inventory_review_rt7"
curl -X PUT "http://rt7 admin:my dog has three heads@108.174.27.163/menus_corp"
curl -X PUT "http://rt7 admin:my dog has three heads@108.174.27.163/rewards_rt7"
curl -X PUT "http://rt7 admin:my dog has three heads@108.174.27.163/terminals_corp"
curl -X PUT "http://rt7 admin:my dog has three heads@108.174.27.163/campaigns"
