
var adminloginRouter =
    new (Backbone.Router.extend(
             {routes: {
              "":"adminLogin"
              },
              adminLogin:function(){
		  console.log("adminLogin");
		  var html = ich.adminLogin_TMP({});
		  $("#main").html(html);
		  this.view = new adminLoginView();
              }}));

var adminLoginView = Backbone.View.extend(
    {initialize:function(){
     var view = this;
	 function IE7_fix(){
             //this is for IE7
             if(_.isUndefined(window.console)){
               console = {log:function(){/*do nothing*/}};
             }
         }
         function renderCurrentTime(){
             var now = new Date();
             var dateString = now.toDateString() + " / " + now.toLocaleTimeString();
             $("#timespace").html(dateString);
         }
         function updateTimeEverySecond(){
             $(document).everyTime("1s",renderCurrentTime, 0);
         }
         function onPressEnter(fn){
             $(document).off('keyup');
             $(document).keyup(
		 function(event){
		     if(event.keyCode == 13){
			 fn();
		     }
		 });
         }
         function setupLoginButton(fn){
             $("#btnLogin").off('click');
             $("#btnLogin").click(fn);
         }
         function enableLoginButton(){
             setupLoginButton(_.once(login));
         }
         function enableLoginViaEnter(){
             onPressEnter(_.once(login));
         }
         function enableLogin(){
             enableLoginViaEnter();
             enableLoginButton();
         }
         function disableLogin(){
             disableLoginViaEnter();
             disableLoginButton();
         }
         function login() {
             var id = $('#userID').val();
             var pw = $('#password').val();
             //try to login to couchdb
             $.couch.login({name:id,password:pw,
			    success:function(response){
				console.log("successful user login");
				console.log(response);
				if(_.contains(response.roles,"rt7")) {
				    window.location.href = "#mainMenus";    
				} else if(_.contains(response.roles,"territory")) {
				    alert("you are territory guy");
				}
				
			    },
			    error:function(response){
				console.log("error logging in");
				alert("logging in failed, please enter a correct admin user-name and password");
				enableLogin();
			    }
			   });
         };
         IE7_fix();
         updateTimeEverySecond();
         enableLogin();
         $("#userID").focus();
     }
    });
    
function logout() {
    $.couch
    .logout(
        {success:function(){
         console.log("here i am, logout");
         window.location.href ='admin';
         }
    });
};
