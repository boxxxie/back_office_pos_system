#curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7admin:mydoghasthreeheads@192.168.1.254/_users","target":"_users","create_target":true}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://192.168.1.254/companies","target":"companies","create_target":true}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://192.168.1.254/transactions","target":"transactions","create_target":true}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://192.168.1.254/cashedout_transactions","target":"cashedout_transactions","create_target":true}' http://paul:password@localhost:5984/_replicate
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://192.168.1.254/cashouts","target":"cashouts","create_target":true}' http://paul:password@localhost:5984/_replicate
