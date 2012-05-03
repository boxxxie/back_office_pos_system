var idleInventoryRouter = 
    new (Backbone.Router.extend({
				    routes: {
					"menuInventory/IdleInventory":"idleInventory"
				    },
				    idleInventory:function() {
					this._setup();
				    },
				    _setup:function() {
					var html = ich.idleInventoryReports_TMP(_.extend({startPage:ReportData.startPage},autoBreadCrumb()));
					$("#main").html(html);
					
					resetDropdownBox(ReportData, false, false);
					
					// TODO : view
					var view = this.view;
					view = new idleInventoryView();  
				    }
				}));

var idleInventoryView =
    Backbone.View.extend({
			     initialize:function() {
				 var view = this;
				 var btn = $("#generalgobtn");
				 btn.button()
				     .click(function() {
						var group = $("#groupsdown :selected");
						var store = $("#storesdown :selected");
						var days = $("#txtInputday").val();
						
						idleInventoryFetcher_F(store.val(),days)
						(function(err,resp){
						     //console.log(resp);
						     $("#idleinventorymain").html(ich.inventoryStockMain_TMP({}));
						     $("#submitAddStock").hide();
						     
						     view.idleInvList = resp;
						     view._initUPCbox();
						     view._renderTable(resp);
						 });
					    });
			     },
			     _initUPCbox:function() {
				 var view = this;
				 $("#upc").keypress(
				     function(e){
					 var code = (e.keyCode ? e.keyCode : e.which), enterCode = 13;
					 if (code == enterCode){
					     view._searchInv($(this).val());}
				     });
			     },
			     _searchInv:function(searchString){
				 var view = this;
				 var idleInvList = view.idleInvList;
				 
				 if(_.isEmpty(searchString)){
				     var searchQuery = undefined;
				 }
				 else{
				     var searchQuery = searchString;
				 }
				 
				 if(!searchQuery) {
				     view._renderTable(idleInvList);
				 } else {
				     //var listJSON = invCollection.getJSONbyUPC(_.str.trim(searchQuery));
				     var foundList = _.filter(idleInvList,function(item){ return item.inventory.upccode == _.str.trim(searchQuery);});
				     
				     if(_.size(foundList)>0) {
					 view._renderTable(foundList);
				     } else {
					 view._renderTable({});
				     }
				 } 
			     },
			     _renderTable:function(list) {
				 var view = this;
				 var idleInvList = view.idleInvList;
				 
				 var for_TMP = 
				     _.chain(_.combine({},list))
				     .map(function(item_constant){
					      var item = _.combine({},item_constant);
					      item.inventory.price.selling_price = currency_format(Number(item.inventory.price.selling_price));
					      return item;
					  })
				     .sortBy(function(item){ return item.inventory.upccode;})
				     .value();
				 
				 var html = ich.idleInventorytable_TMP({items:for_TMP});
				 $("#inventorystocktable").html(html);
			     }
			 });