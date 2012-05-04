var loginRouter =
    new (Backbone.Router.extend(
	     {routes: {
		  "":"reportLogin"
	      },
	      reportLogin:function(){
		  console.log("reportLogin");
		  var html = ich.layerLogin_TMP({});
		  $("#main").html(html);
	      }}));

var reportLoginView = Backbone.View.extend(
    {initialize:function(){
	 var view = this;
	 _.bindAll(view, 'renderLoginPage');
	 loginRouter.bind('route:reportLogin',
			  function(){
			      console.log('reportLoginView:route:reportLogin');
			      view.el= _.first($("ids_form"));
			      view.renderLoginPage();});
     },
     renderLoginPage:function(){
	 var view = this;
	 console.log("reportview renderLoginPage");
     }
    });

function login() {
    var $form = $("#ids_form");
    var formEntries = varFormGrabber($form);
    _.log("form entries")(formEntries);
    var location_key = _.chain(formEntries).selectKeys('company','group','store').removeEmptyKeys().value();
    var user_pass_key = _.selectKeys(formEntries,['user','password']);
    var login_key_form_raw = _.extend(location_key,user_pass_key);
    _.log('location_key')(location_key);
    _.log("login_key_form_raw")(login_key_form_raw);
    _.log("user_pass_key")(user_pass_key);

    //FIXME : key non-sensitive, perhaps walk or other things will be better
    function toLowerCase(str){
	if(_.isString(str)){
	    return str.toLowerCase();
	}
	return str;
    }
    function applyToVal(fn){
	return function(pair){
	    var key = _.first(pair);
	    var val = _.second(pair);
	    return [key,fn(val)];
	};
    }
    //transform the form data (removing empty fields and normalizing the user data (cept the password)
    var login_key = _.chain(login_key_form_raw)
	.removeKeys('password')
	.filter$(_.isNotEmpty)
	.map$(applyToVal(toLowerCase))
	.extend({password:login_key_form_raw.password})
	.value();

    _.log("login key")(login_key);

    function is_user_login_info_valid(login_key){
	return function(callback){
	    if(_.isEmpty(login_key.password) || _.isEmpty(login_key.user)){
		callback({
			     code:2342,
			     type:"invalid user information",
			     message:"User name or Password was left blank"
			 });
	    }
	    else{
		callback(null,login_key);
	    }
	};
    }

    function fetch_user_login_info(login_key,callback){
	var companiesDB = cdb.db('companies');
	var name_to_id_view = appView("names_to_id");
	keyQuery(name_to_id_view, companiesDB, _.selectKeys(login_key,'company','group','store'))
	(function (resp){
	     console.log(resp);
	     var accountMatches = resp.rows;
	     if(_.isNotEmpty(accountMatches) && _.isDefined(_.first(accountMatches).value)){
		 var location_id_for_user = _.first(accountMatches).value;
		 callback(null,{name:location_id_for_user+login_key.user,password:login_key.password});
	     }
	     else{
		 var error = {code:401,type:"unauthorized",message:"User name or password is wrong for this company"};
		 callback(error);
	     }
	 });
    }

    function user_login(login_info,callback){
	    var user = new UserDoc(login_info);
	    user.login(callback);
    }

    function fetch_company_info_for_user(user, session, callback){
	var companiesDB = cdb.db('companies');
	var name_to_id_view = appView("names_to_id");
	var branch_show = appShow("branch");

	function user_roles_obj(user){
	    return _.chain(user.toJSON().roles).filter(_.isObj).merge().value();
	}
	var user_roles = user_roles_obj(user);
	var company_id = user_roles.company_id;

	companiesDB
	    .show(branch_show,
		  company_id,
		  {data : user_roles,
		   success:function(company_branch_data){
		       var current_user = simple_user_format(user.toJSON());
		       var user_company_info = _.selectKeys(current_user,'company_id','companyName','group_id','groupName','storeName','storeNumber','store_id');
		       var amalgamated_logged_in_user_data = _.combine({currentUser:current_user,session:session},user_company_info);
		       callback(null, amalgamated_logged_in_user_data, company_branch_data);
		   },
		   error:function(){
		       callback({
				    code:1,
				    type:"company information",
				    message:"unable to retrieve company information for this user"})
		   }
		  });
    }

    function populate_report_data(login_data, branch, callback){
	if(login_data.store_id) {
	    var type = 'store';
	}
	else if(login_data.group_id) {
	    var type = 'group';
	}
	else if(login_data.company_id) {
	    var type = 'company';
	}

	if(type){
	    callback(null,_.combine(login_data,
				    _.obj(type,branch),
				    _.obj('startPage',type+"Report")));
	}
	else{
	    callback({code:3,
		      type:'company information',
		      message:'there is an error with the user login data'})
	}
    }


    async.waterfall([
			is_user_login_info_valid(login_key),
			fetch_user_login_info,
			user_login,
			fetch_company_info_for_user,
			populate_report_data
		    ],
		    function(err, reportData){
			if(err){
			    alert(err.message);
			}
			else{
			    ReportData = reportData;
			    window.location.href = "#main/";
			}
		    });
}

function logout() {
    $.couch
	.logout(
	    {success:function(){
		 ReportData=undefined;
		 window.location.href ='';
	     }
	});
    function reset(){
	ReportData=undefined;
	window.location.href ='';
    }
    var SE_handler = {
	success:reset,
	error: function (code,type,message) {
	    alert(message);
	    reset();
	}
    }
    $.couch.logout(SE_handler);
};
