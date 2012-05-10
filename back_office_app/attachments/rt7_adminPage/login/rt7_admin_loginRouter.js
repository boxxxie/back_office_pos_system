Companies = new (couchCollection(
             {db:'companies'},
             {model:Company,
              getModelById : function(modelId){
              return this.find(function(model){return model.get('_id') == modelId;});
              },
              getSelectedModel : function(){
              return this.find(function(model){return model.selected == true;});
              }
             }));

currentUser = undefined;

var adminLoginView = Backbone.View.extend(
    {initialize:function(){
     var view = this;
     function IE7_fix(){
             //this is for IE7
             if(_.isUndefined(window.console)){
               console = {log:function(){/*do nothing*/}};
             }
         }
         IE7_fix();
     },
     setup:function() {
         var view = this;
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
                
                view.trigger("trigger-navigate",response);
                },
                error:function(response){
                console.log("error logging in");
                alert("logging in failed, please enter a correct admin user-name and password");
                enableLogin();
                }
               });
         };
         
         updateTimeEverySecond();
         enableLogin();
         $("#userID").focus();
     }
    });

var adminloginRouter =
    new (Backbone.Router.extend(
             {routes: {
              "":"adminLogin"
              },
              initialize:function(){
                 var router = this;
                this.view = new adminLoginView();
                this.view.on("trigger-navigate",function(response){
                  //Companies.fetch({error:function(response){alert(response.responseText);}});
                  currentUser = response; //TODO : navigate doesn't work at IE7
                  console.log(currentUser);
                  router.navigate("#mainMenus",{trigger:true});
                });    
              },
              adminLogin:function(){
                  var router = this;
                  $.couch.logout({
                      success:function(){
                          console.log("adminLogin");
                          var html = ich.adminLogin_TMP({});
                          $("#main").html(html);
                          router.view.setup();
                      }
                  });
              }
              }));

function logout() {
    $.couch
    .logout(
        {success:function(){
         console.log("here i am, logout");
         window.location.href ='admin';
         },
         error:function(){
             console.log("logout error");
         }
    });
};
