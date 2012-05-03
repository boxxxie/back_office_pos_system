#this should transfer over only store users into some local temp db
curl -X POST -H "Content-Type: application/json" -d '{"source":"http://rt7 admin:my dog has three heads@192.168.1.254/users","target":"users2","create_target":true, "filter":"app/forLocation", "query_params": {"store":"1e950afb-e07d-3922-1cf1-96de4432c8e0"} }' http://paul:password@localhost:5984/_replicate
