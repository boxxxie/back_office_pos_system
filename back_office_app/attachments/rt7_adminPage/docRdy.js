$(document)
    .ready(function() {
           //this is for IE7
           if(_.isUndefined(window.console)){
           console = {log:function(){/*do nothing*/}};
           }
           doc_setup();
       });


function doc_setup() {
    updateDate();

    // company management view
    companiesViewTest = new companiesView({collection : Companies});
    groupsViewTest = new groupsView();
    storesViewTest = new storesView();
    terminalsViewTest = new terminalsView();
    
    // inventory management view
    var InvItemDisplay = new AddViewInventoryView();
    
    Backbone.history.start();
};

function updateDate() {
      var ts = $("#timespace");
      $(document).everyTime("1s", function(){
      var date = new Date();
      ts.empty();
      ts.append(date.toDateString() + " / " + date.toLocaleTimeString());
      }, 0);
};

function showMsg() {
    alert("Sorry, We are working on this menu.");
}

function isTerritoryUser(session) {
    var roleObj = _.find(session.roles,_.isObj);
    return (session && session.roles && _.contains(session.roles,"territory"));
}
