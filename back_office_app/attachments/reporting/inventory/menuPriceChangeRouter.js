var menuModelforInventory;

var menuInventoryRouter = 
    new (Backbone.Router.extend(
	     {routes: {
		  "menuInventory/Inventory":"menuInventoryCompanyInventory",
		  "menuInventory/menuPriceChange":"menuInventoryCompanymenuPriceChange",
		  "menuInventory/groupReportInventory":"menuInventoryGroupInventory",
		  "menuInventory/storeReportInventory":"menuInventoryStoreInventory"
	      },
	      menuInventoryCompanyInventory:function() {
		  console.log("menuInventoryCompanyInventory");
	      },
	      menuInventoryGroupInventory:function() {
		  console.log("menuInventoryGroupInventory");
	      },
	      menuInventoryStoreInventory:function() {
		  console.log("menuInventoryStoreInventory");
	      },
	      menuInventoryCompanymenuPriceChange:function() {
	      	  console.log("menuInventoryCompanymenuPriceChange");
	      }
	     }));


var menuInventoryView = 
    Backbone.View.extend(
	{initialize:function(){
	     var view = this;
	     view.el = $("#main");
	     
	     _.bindAll(view, 
		       'renderMenuInventoryCompanyInventory',
		       'renderMenuInventoryGroupInventory',
		       'renderMenuInventoryStoreInventory',
		       'renderMenuInventoryCompanymenuPriceChange');
	     menuInventoryRouter
		 .bind('route:menuInventoryCompanyInventory', 
		       function(){
			   console.log("menuInventoryView, route:menuReportsCompanyInventory");
			   view.renderMenuInventoryCompanyInventory();
		       });
	     menuInventoryRouter
		 .bind('route:menuInventoryGroupInventory', 
		       function(){
			   console.log("menuInventoryView, route:menuReportsGroupInventory");
			   view.renderMenuInventoryGroupInventory();
		       });
	     menuInventoryRouter
		 .bind('route:menuInventoryStoreInventory',
		       function(){
			   console.log("menuInventoryView, route:menuReportsStoreInventory");
			   view.renderMenuInventoryStoreInventory();
		       });
	     menuInventoryRouter
		 .bind('route:menuInventoryCompanymenuPriceChange',
		       function(){
			   console.log("menuInventoryView, route:menuInventoryCompanymenuPriceChange");
			   view.renderMenuInventoryCompanymenuPriceChange();
		       });
	 },
	 renderMenuInventoryCompanyInventory: function() {
	     
	     var html = ich.menuInventory_TMP({ 
	     				       breadCrumb:breadCrumb(ReportData.company.companyName),
	     				       showMenuPriceChange:true});
	     $(this.el).html(html);
	 },
	 renderMenuInventoryGroupInventory: function() {
	     
	     var html = ich.menuInventory_TMP({ 
	 				       breadCrumb:breadCrumb(ReportData.companyName,
	 					     		     ReportData.group.groupName)});
	     $(this.el).html(html);
	 },
	 renderMenuInventoryStoreInventory: function() {
	     
	     var html = ich.menuInventory_TMP({ 
	 				       breadCrumb:breadCrumb(ReportData.companyName,
	 					     		     ReportData.groupName,
	 					     		     ReportData.store.storeName,
	 					     		     ReportData.store.number)});
	     $(this.el).html(html);
	 },
	 renderMenuInventoryCompanymenuPriceChange: function() {
	     var view = this;
	     fetch_company_menu(ReportData.company._id)
	     (function(err,menu){
	     	  if(!err) {
	    	      console.log(menu);
	    	      menuModelforInventory = menu;
	    	      
	    	      var html = ich.menuInventorymenuPriceChange_TMP({ 
	     							       breadCrumb:breadCrumb(ReportData.company.companyName)});
		      $(view.el).html(html);
		      
		      
		      var htmlleft = ich.menuSetMenus_Left_TMP({});
		      $("#menusetmenusleft").html(htmlleft);
		      
		      $("#menumodifiersbutton").button()
			  .click(function(){
				     view.renderMenuScreenPartial(0);
				     $("#menusetmenusright").html({});
				 });
		      
		      view.renderMenuScreenPartial(1);
		      view.renderMenuHeaderPartial();
		      
		      menuModelforInventory.bind("change:menuButtonHeaders",view.renderMenuHeaderPartial);
		      menuModelforInventory.bind("change:menuButtons", view.renderMenuScreenPartial);
		      
		      console.log("rendered menus for inventory");
		  } else {
		      alert("Please, Create Menu first.");
		      window.history.go(-1);
		  }
	      });
	 },
	 renderMenuHeaderPartial: function() {
	     var view = this;
	     var menuModelHeaders = menuModelforInventory.get('menuButtonHeaders');
	     
	     menuModelHeaders = _.map(menuModelHeaders, function(item) {
					  if(_.isEmpty(item.description1) 
			  		     && _.isEmpty(item.description2)
			  		     && _.isEmpty(item.description3)) {
				  	      item.description2="MENU" + item.menu_id;
					  }
					  return item;
				      });
	     
	     
	     var htmlbottom = ich.menuSetMenus_Bottom_TMP({menuButtonHeaders:menuModelHeaders});
	     $("#menusetmenusbottom").html(htmlbottom);
	     
	     _.each(menuModelHeaders, function(item){
		  	$("#menubuttonheader"+item.menu_id).button()
			    .click(function(){
				       view.renderMenuScreenPartial(item.menu_id);
				       $("#menusetmenusright").html({});
				   });
		    });
	 },
	 renderMenuScreenPartial: function(model,menus,item) {
	     if(_.isNumber(model)){
	 	 console.log("screen num : " + model);
	 	 var menuscreentitle;
	 	 
	 	 if(model==0) {
	 	     menuscreentitle = "MODIFIERS";
	 	 } else {
	 	     var header = menuModelforInventory.get_header(model);
	 	     menuscreentitle = "".concat(header.description1)
.concat(" ")
	 	    	 .concat(header.description2)
.concat(" ")
	 	    	 .concat(header.description3);
	 	 }
	 	 var menuScreen = menuModelforInventory.menu_screen(model);
		 var htmlcenter = ich.menuSetMenus_Center_TMP(_.extend({menuscreentitle:menuscreentitle},menuScreen));
		 $("#menusetmenuscenter").html(htmlcenter);

		 _.each(menuScreen.menu_screen, function(item){
		 	    _.each(item.row, function(rowitem) {
		 		       var btn = $('#'+rowitem.display.screen+"\\:"+rowitem.display.position)
		 			   .click(function(){
			    			      renderEditMenuPrice(rowitem.display.screen, rowitem.display.position);
				   		  });	
		 		   });	
			});
		 
		 console.log("menuscreen rendered");
	     } else if(!_.isEmpty(item)) {
		 console.log("screen num : " + item.display.screen);
		 
		 var menuscreentitle;
		 if(item.display.screen==0) {
	 	     menuscreentitle = "MODIFIERS";
	 	 } else {
	 	     var header = menuModelforInventory.get_header(item.display.screen);
	 	     menuscreentitle = "".concat(header.description1)
.concat(" ")
	 	    	 .concat(header.description2)
.concat(" ")
	 	    	 .concat(header.description3);
	 	 }

		 var menuScreen = menuModelforInventory.menu_screen(item.display.screen);	 	 
		 var htmlcenter = ich.menuSetMenus_Center_TMP(_.extend({menuscreentitle:menuscreentitle},menuScreen));
		 $("#menusetmenuscenter").html(htmlcenter);
		 
		 _.each(menuScreen.menu_screen, function(item){
		 	    _.each(item.row, function(rowitem) {
		 		       var btn = $('#'+rowitem.display.screen+"\\:"+rowitem.display.position)
		 			   .click(function(){
			    			      renderEditMenuPrice(rowitem.display.screen, rowitem.display.position);
				   		  });	
		 		   });	
			});
		 console.log("menuscreen rendered");
	     }
	 }
	});

/*********************************************** helper functions *********************************************/
function renderEditMenuPrice(num,position) {
    if(_.isNumber(position)) {
	var button = menuModelforInventory.get_button(num,position);
	
	var htmlright = ich.menuSetMenus_Right_TMP(button);
	$("#menusetmenusright").html(htmlright);

	$('input:checkbox').parent().hide();
	$('#displayColor').parent().parent().hide();
	
	var txtLine1 = $("#editmenudescription0");
	var txtLine2 = $("#editmenudescription1");
	var txtLine3 = $("#editmenudescription2");
	var txtPrice = $("#editmenuprice");
	
	txtLine1.attr('disabled',true);
	txtLine2.attr('disabled',true);
	txtLine3.attr('disabled',true);
	txtPrice.val("");
	
	var btn = $("#btnMenuSave")
	    .click(function(){
		       console.log("menuInventory Price Change");
		       save_button_into_db();
		   });
	
    } else {
	//renderEditHeader ???
    }
};

function save_button_into_db() {
    var editDialog = $("#editMenuButton");

    var newButtonItemData = varFormGrabber(editDialog);
    var allStoreIDs = _.pluck(extractStores(ReportData),'id');
    var companyID = ReportData.company._id;

    function rebuildMenus(company_id,store_ids){
	console.log("company id"); console.log(company_id);
	console.log("stores to update menus for"); console.log(store_ids);

	var db = cdb.db("menu_buttons");
	var view = cdb.view("menubuttons","id");
	var keyQ = _async.generalKeyQuery(view,db);
	
	async.waterfall(
	    [keyQ(company_id),
	     function(company_response,callback){
		 async.forEach(
		     store_ids,
		     function(store_id,callback){
			 keyQ(store_id)
			 (function(err,storeMenuButtonsResp){
			      var allButtons =  storeMenuButtonsResp.rows.concat(company_response.rows);
			      var sparseStoreMenu = constructMenu_keyValue(allButtons);
			      var currentStoreMenu = new Menu({_id:store_id});
			      currentStoreMenu.fetch(
				  {success:function(model, response){
				       model.set_buttons(sparseStoreMenu);
				       model.save();
				       callback();
				   }, 
				   error:function(model,response){
				       currentStoreMenu.set_empty_menu().set_buttons(sparseStoreMenu);
				       currentStoreMenu.save();
				       callback();
				   }});
			  });},
		     function(err){console.log("finsihed updating the menus");});
	     }]);
	
    }
    function constructMenu_keyValue(couchDB_responses){
	return _(couchDB_responses).chain()
	    .map(function(response){
		     return {date: response.doc.date, menuButton: response.doc.menuButton};
		 })
	    .groupBy(function(item){
			 return item.menuButton.display.screen +":"+
			     item.menuButton.display.position;
		     })
	    .map(function(buttonChangeLog,location){
		     var mostRecentMenuButton = 
			 _(buttonChangeLog).chain()
			 .sortBy(function(item){return item.date;})
			 .last()
			 .value();
		     return mostRecentMenuButton.menuButton;
		 })
	    .value();
    }
    function makeButtons(newButtonItemData,company_id,allStore_ids){
	return function(ids_to_apply_changes_to){
	    var ids = _.isEmpty(ids_to_apply_changes_to) ? [company_id] : ids_to_apply_changes_to;
	    async.forEach
	    (ids,
	     function(id,callback){
   		 var button = new MenuButton({menuButton:newButtonItemData, 
					      date: (new Date()).toString(), 
					      id:id});
		 button.save({},{success:function(){
				     callback();
				 },
				 error:function(){
				     callback(true);
				 }});},
	     function(err){
		 if(err){
		     console.log("an error happened when trying to save the button");
		 }
		 rebuildMenus(company_id, allStore_ids);
	     });
	    
	};
    }
    var stores = extractStores(ReportData);
    var html = ich.menuInventoryApplyStoresQuickViewDialog_TMP({items:stores});
    menuInventoryApplyStoresViewDialog(html,{title:"Apply Price - new Price : $ " + 
					     currency_format(newButtonItemData.foodItem.price), 
					     stores:stores,
					     makeButtons:makeButtons(newButtonItemData,companyID,allStoreIDs)
					    });
    
};
