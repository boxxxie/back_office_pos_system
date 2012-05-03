
var mainMenuRouter =
    new (Backbone.Router.extend(
         {routes: {
          "mainMenus":"_setup"
          },
          _setup:function(){
          console.log("mainMenus");
          var html = ich.mainMenu_TMP({});
          $("#main").html(html);
          }}));