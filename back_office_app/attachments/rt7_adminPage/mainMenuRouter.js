
var mainMenuRouter =
    new (Backbone.Router.extend(
         {routes: {
          "mainMenus":"_setup"
          },
          _setup:function(){
              $.couch.session({
                  success:function(session){
                      //TODO : this doesn't work at IE7
                      //if(_.contains(session.userCtx.roles,"rt7")) {
                        if(_.contains(currentSession.roles, "rt7")) {
                            //window.location.href = "#mainMenus";
                            Companies.fetch({error:function(response){alert(response.responseText);}});
                            console.log("mainMenus");
                              var html = ich.mainMenu_TMP({label:"RT7 BackOffice"});
                              $("#main").html(html);    
                        //} else if(_.contains(session.userCtx.roles,"territory")) {
                        } else if(_.contains(currentSession.roles,"territory")) {
                            var roleObj = _.find(currentSession.roles,_.isObj);
                            console.log(roleObj);
                            
                            var userName = roleObj.userName;
                            console.log(userName);
                            $.couch.db("companies").view("app/creation_user_id", {
                                key:userName,
                                include_docs:true,
                                success:function(data) {
                                    console.log(data);
                                    var docs = _.pluck(data.rows,"doc");
                                    console.log(docs);
                                    Companies.reset(docs);
                                },
                                error:function(status) {
                                    console.log(status);
                                }
                            });
                            //window.location.href = "#territoryMainMenus";
                            //alert("you are territory guy");
                            console.log("mainMenus for territory");
                              var html = ich.mainMenu_TMP({label:"Territory"});
                              $("#main").html(html);
                              $("#main").find(".rt7_menu").hide();
                        } else {
                            window.location = "";
                        }
                  },
                  error:function() {
                      alert("login error.");
                  }
              });
          }}));