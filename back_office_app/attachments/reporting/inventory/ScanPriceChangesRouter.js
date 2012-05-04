var menuInventoryscanPriceChangeRouter = 
    new (Backbone.Router.extend(
	     {routes: {
		  "menuInventory/companyReportscanPriceChange":"menuInventoryScanPriceChange",
		  "menuInventory/groupReportscanPriceChange":"menuInventoryScanPriceChange",
		  "menuInventory/storeReportscanPriceChange":"menuInventoryScanPriceChange"
	      },
	      getTopView:_.once(function(){return new menuInventoryscanPriceChangeView();}),
	      menuInventoryScanPriceChange:function() {
		  console.log("menuInventory scanPriceChange");
		  var router = this;
		  router.view = this.getTopView();
		  router.view.setElement("#main");
		  router.view.render();
	      }
	     }));

var menuInventoryscanPriceChangeView = 
    Backbone.View.extend(
	{
	    render: function(searchQueryString) {
		console.log("renderScanPriceChange");
		var view = this;
		
		if(_.isEmpty(searchQueryString)){
		    var searchQuery = undefined;
		}
		else{
		    var searchQuery = searchQueryString;
		}
		
		var html = 
		    ich.menuInventoryScanItemPriceChanges_TMP(autoBreadCrumb());
		
		$(view.el).html(html);

		var userLevel = topLevelEntity(ReportData);

		currentInventoryFor(userLevel.id)
		(function(err,inventory){
		     //todo: maybe i can make filterSearch return on undefined input
		     var filteredInv = (searchQuery)?_.filterSearch_SubStr_SelectedKeys(inventory,searchQuery,"upccode","description","price"):inventory;
		     var formattedInv = _.prewalk(
			 function(item){
			     if(item && _.isDefined(item.selling_price)){
				 return _.combine(item,
						  {selling_price:currency_format(Number(item.selling_price))});
			     }
			     return item;
			 },filteredInv);

		     var html =  ich.menuInventoryScanPricetable_TMP({filter:searchQuery,list:formattedInv});
		     $(view.el).find("#priceChangeTable").html(html);

		     //set the search text box to filter the item list when 'enter' is clicked
		     $("#filterInv").keypress(
			 function(e){
			     var code = (e.keyCode ? e.keyCode : e.which), enterCode = 13;
			     if (code == enterCode){
				 view.render($(this).val());}
			 });

		     $("#submitPriceChanges").button().click(
			 function(){
			     var currentDate = new Date();
			     var newInvList = 
				 _.chain(varFormGrabber($("#priceChangeTable")))
				 .removeEmptyKeys()	  
				 .map(function(price,strUPC){
					  var upc = strUPC.replace("upc-","");//need to do this due to a limitation in forms.js
					  var invItem = _.find(filteredInv,function(item){return upc==item.upccode;});
					  var invItemReturn = _.selectKeys(invItem,"price","date","description","locid","upccode");
					  invItemReturn.price.selling_price = price;
					  invItemReturn.date = currentDate.toJSON();
					  return invItemReturn;
				      })
				 .value();
			     if(_.isEmpty(newInvList)){alert("there were no changes made");return;}
			     inv_helpers.saveInvChangesAndSelectStores(newInvList, userLevel.type,ReportData)
			     (function(err){view.render(searchQuery);});	     
			 });
		 });
	    }
	});