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

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/rt7_backoffice_app","target":"rt7_backoffice_app","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/cashout_designs","target":"cashouts","create_target":true, "doc_ids":["_design/pos","_design/reporting"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/cashouts","target":"cashouts","create_target":true, "doc_ids":["_design/pos","_design/reporting"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/transactions_designs","target":"transactions","create_target":true, "doc_ids":["_design/pos","_design/reporting"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/transactions","target":"transactions","create_target":true, "doc_ids":["_design/pos","_design/reporting"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/cashedout_transactions","target":"transactions","create_target":true, "doc_ids":["_design/pos","_design/reporting"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/inventory_designs","target":"inventory","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/inventory","target":"inventory","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/inventory_changes","target":"inventory_changes","create_target":true, "doc_ids":["_design/app","_design/misc"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/inventory_changes_designs","target":"inventory_changes","create_target":true, "doc_ids":["_design/app","_design/misc"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/media_stats","target":"media_stats","create_target":true, "doc_ids":["_design/app","_design/reports"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/media_stats_designs","target":"media_stats","create_target":true, "doc_ids":["_design/app","_design/reports"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/menu_buttons","target":"menu_buttons","create_target":true, "doc_ids":["_design/menubuttons"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/stores_designs","target":"stores","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/terminals_rt7","target":"terminals_rt7","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/terminals_designs","target":"terminals_rt7","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/campaigns_designs","target":"campaigns","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/campaigns","target":"campaigns","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/_users","target":"_users","create_target":true, "doc_ids":["_design/_auth","_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/users","target":"users","create_target":true, "doc_ids":["_design/_auth","_design/app"]}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/users_designs","target":"_users","create_target":true, "doc_ids":["_design/_auth","_design/app"]}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/companies","target":"companies","create_target":true, "doc_ids":["_design/app"]}' http://paul:password@localhost:5984/_replicate

#curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/inv_new","target":"inv_new","create_target":true}' http://paul:password@localhost:5984/_replicate

curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/install_files_rt7","target":"install_files_rt7","create_target":true}' http://paul:password@localhost:5984/_replicate

curl -X PUT "http://paul:password@localhost:5984/inventory_rt7"
curl -X PUT "http://paul:password@localhost:5984/inventory_review_rt7"
curl -X PUT "http://paul:password@localhost:5984/menus_corp"
curl -X PUT "http://paul:password@localhost:5984/rewards_rt7"
curl -X PUT "http://paul:password@localhost:5984/terminals_corp"
curl -X PUT "http://paul:password@localhost:5984/campaigns"
