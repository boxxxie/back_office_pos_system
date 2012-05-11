//todo make a user couchdoc that makes editing/changing passwords easy

var couchDoc = Backbone.Model.extend(
    {
        idAttribute: "_id",
        urlRoot:function(){
	    if(_.isUndefined(this.db)){
                return window.location.href+"api/";  //this almost may not work with a router
	    }
	    else{
		return window.location.protocol + "//" + window.location.hostname + ":" +window.location.port + "/" + this.db;
	    }
	},
	//urlRoot:window.location.protocol + "//" + window.location.hostname + ":" +window.location.port + "/" + dbName;
	//urlRoot:window.location.href+"api/",
	parse:function(resp, xhr) {
	    //xhr.statusText: "Created"
	    //resp -> "{"ok":true,"id":"80e3124756c1e5241a6665b683003c86","rev":"1-a013d28d19cf9ffc14b6a76f596fb7d4"}"
	    if(xhr && xhr.statusText == "Created"){ //this seems to take care of creating and editing docs, i'm not sure if this is the right solution, though
		return {_rev:resp.rev,_id:resp.id};
	    }
	    return resp;
	},
	save:function(attrs,options){
	    options || (options = {});
	    var model = this;
	    var success = options.success;
	    if(_.isUndefined(this.id)){
		//get uuid from couchdb and set the model's id to it, this may not work properly with many requests in a short time span
		var id = $.couch.newUUID(); //fixme: test this more on firefox
		var idObj = {};
		idObj[this.idAttribute] = id;
		this.set(idObj,{silent:true});
	    }
	    options.success = function(resp, status, xhr){
		if (success){success(resp, status, xhr);}
	    };
	    var error = options.error;
	    options.error = function(model, status, xhr){
		if(status.responseText == '{"error":"not_found","reason":"no_db_file"}'){
		}
		if (error){error(model, status, xhr);}
	    };
	    Backbone.Model.prototype.save.call(this, attrs, options);
	},
	destroy:function(options){
	    options || (options = {});
	    var model = this;
	    _.extend(options,{url: model.url()+"?rev="+model.get('_rev')});
	    Backbone.Model.prototype.destroy.call(this, options);
	}
    });

/*
 couch = {db:dbname} they are names referring to the names of the database and ddoc
 options =  what you would normally use in .extend()... if you overwrite url,parse, or other things that couchCollection use it will probably not work right
 */
var couchCollection = function(couch,options){
    couch || (couch = {});
    //couch.db || (couch.db = 'db');
    options || (options = {});
    var urlBase = window.location.protocol + "//" + window.location.hostname + ":" +window.location.port;// + "/";
    return Backbone.Collection.extend(
	_.extend(options,
		 {
		  url: (couch.db)? urlBase+ "/_rewrite/"+couch.db+"/" : urlBase + "/_rewrite/api/",// + couch.db, //FIXME: this has got to change
		  parse: function(response) {
		      return _(response.rows)
			  .chain()
			  .reject(function(item){return item.id.search('_design') == 0;}) //reject design docs
			  .pluck('doc')
			  .value();
		  },
		  fetch:function(options){
		      options || (options = {});
		      var fetch_options = _.extend(options,{url:this.url +"_all_docs", data:{include_docs:true}});
		      Backbone.Collection.prototype.fetch.call(this,fetch_options);
		  }
		 }));
};

function async_method(model,method,callback){
    var options = {
	success : function(resp, status, xhr){
	    callback(null,resp);
	},
	error : function(){
	    callback(arguments);
	}
    };
    model[method](options);
}

function async_session(callback){
    $.couch.session(
	{
	    success:function(resp){
		callback(null,resp);
	    },
	    error:function(code,type,message){
		callback({code:code,type:type,message:message});
	    }
	});
}

var UserDoc = couchDoc.extend(
    {
	db:"_users/",//TODO: use $.couch.authdbsomething to set this
	initialize:function(atts){
	    if(atts && atts.name){
		this.set({"_id":"org.couchdb.user:"+atts.name});
	    }
	},
	login:function(callback){
	    var user = this;
	    var SE_handler ={
		success:function(user_login_info){
    		    async.parallel({
    				       user_doc:async.apply(async_method,user,'fetch'),
    				       session_info:async.apply(async_session)
    				   },
    				   function(err,response){
    				       callback(err,response.user_doc,response.session_info);
    				   });
		},
		error:function(code,type,message){
		    callback({code:code,type:type,message:message});
		}
	    };
	    $.couch.login(
		_.extend(
		    {
			name:user.get('name'),
			password:user.get('password')
		    },
		    SE_handler));
	},
	signup:function(options){
	    /* should be in the form of:
	     * $.couch.signup({name:"user name", roles:["pos_sales"]},
	     "password",
	     {success:function(){
	     console.log(arguments);}})*/
	    var user = this.toJSON();
	    var password = user.password;
	    $.couch.signup(_.removeKeys(user,'_id','password'),
			   password,
			   options
			  );
	},
	url:function(){
	    return this.urlRoot() + this.id;
	},
	change_password:function(session, new_password) {
	    
            var userModel = this;
            var user = userModel.toJSON();
            return function(callback) {
            function verify_user(user){
                 if(user && user._id){
                     return false;
                 }
                 return {
                     code:5462,
                     type:"invalid user",
                     message:"There is a problem with your login sesssion, you may need to login again"
                 };
                 }
            function verify_session(session){
             if(session && session.info && session.info.authentication_db){
                 return false;
             }
             return {
                 code:4232,
                 type:"invalid session",
                 message:"There is a problem with your login session, you may need to login again"
             };
    
             }
             function verify_password(password){
             if(_.isEmpty(password)){
                 return {
                 code:2341,
                 type:'invalid password',
                 message:"The password was left blank"
                 };
             }
             return false;
             }
             function verify_user_session_password(session,new_password){
             return function(callback){
                 var first_error =
                 _.either(verify_user(user),
                      verify_session(session),
                      verify_password(new_password));
                 if(first_error){
                 callback(first_error);
                 }
                 else{
                 callback(null,
                      session.info.authentication_db,
                      new_password);
                 }
             };
             }
             function fetch_user_doc(authDB,new_password,callback){
                 var SE_handler = {
                     error: function (code,type,message) {
                     callback({code:code,type:type,message:message});
                     },
                     success: function (user_doc){
                     user_doc.password = new_password;
                     user_doc.exposed_password = new_password;
                     callback(undefined,user_doc,authDB);
                     }
                 };
                 $.couch
                     .db(authDB)
                     .openDoc(user._id,SE_handler);
             }
             function save_user_with_new_password(user_doc_new_password,authDB,callback){
             var SE_handler = {
                 success: function(){
                 callback(undefined,user_doc_new_password);
                 },
                 error: function (code,type,message) {
                 callback({code:code,type:type,message:message});
                 }
             };
             $.couch
                 .db(authDB)
                 .saveDoc(user_doc_new_password,SE_handler);
    
             }
           function report(err,userDoc){
                 return callback(err,userDoc);
                 }
          
          async.waterfall(
             [
             verify_user_session_password(session,new_password),
             fetch_user_doc,
             save_user_with_new_password
             ],
             report);	        
	    };
	},
	updateUserDoc:function(session, updatedUserDoc) {
	    var userModel = this;
            var user = userModel.toJSON();
            return function(callback) {
            function verify_user(user){
                 if(user && user._id){
                     return false;
                 }
                 return {
                     code:5462,
                     type:"invalid user",
                     message:"There is a problem with your login sesssion, you may need to login again"
                 };
                 }
            function verify_session(session){
             if(session && session.info && session.info.authentication_db){
                 return false;
             }
             return {
                 code:4232,
                 type:"invalid session",
                 message:"There is a problem with your login session, you may need to login again"
             };
    
             }
             function verify_password(password){
             if(_.isEmpty(password)){
                 return {
                 code:2341,
                 type:'invalid password',
                 message:"The password was left blank"
                 };
             }
             return false;
             }
             function verify_user_session_password(session,userDoc){
             return function(callback){
                 var first_error =
                 _.either(verify_user(user),
                      verify_session(session),
                      verify_password(userDoc.password));
                 if(first_error){
                 callback(first_error);
                 }
                 else{
                 callback(null,
                      session.info.authentication_db,
                      userDoc);
                 }
             };
             }
             function fetch_user_doc(authDB,userDoc,callback){
                 var SE_handler = {
                     error: function (code,type,message) {
                     callback({code:code,type:type,message:message});
                     },
                     success: function (user_doc){
                     //user_doc.password = new_password;
                     //user_doc.exposed_password = new_password;
                     var selectedObj = _.selectKeys(userDoc, ["country","province","city","street0","street1","postalcode"
                                                                ,"firstname","lastname","phone","email","website"
                                                                ,"roles","password","exposed_password"]);
                     //console.log("selectedObj");
                     //console.log(selectedObj);
                     
                     _.extend(user_doc,selectedObj);
                     
                     //console.log("updated user doc");
                     //console.log(user_doc);
                     
                     callback(undefined,user_doc,authDB);
                     }
                 };
                 $.couch
                     .db(authDB)
                     .openDoc(user._id,SE_handler);
             }
             function save_user_with_new_data(new_user_doc,authDB,callback){
             var SE_handler = {
                 success: function(){
                 callback(undefined,new_user_doc);
                 },
                 error: function (code,type,message) {
                 callback({code:code,type:type,message:message});
                 }
             };
             $.couch
                 .db(authDB)
                 .saveDoc(new_user_doc,SE_handler);
    
             }
           function report(err,userDoc){
                 return callback(err,userDoc);
                 }
          
          async.waterfall(
             [
             verify_user_session_password(session,updatedUserDoc),
             fetch_user_doc,
             save_user_with_new_data
             ],
             report);           
        };
	}
    });