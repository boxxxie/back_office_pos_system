var menuInventoryscanTaxChangeRouter = 
    new (Backbone.Router.extend(
	     {routes: {
		  "inventory/scan_tax_change":"menuInventoryScanTaxChange"
	      },
	      getTopView:_.once(function(){return new menuInventoryscanTaxChangeView();}),
	      menuInventoryScanTaxChange:function() {
		  console.log("menuInventory scanTaxChange");
		  var router = this;
		  router.view = this.getTopView();
		  router.view.setElement("#main");
		  router.view.render();
	      }
	     }));

var menuInventoryscanTaxChangeView = 
    Backbone.View.extend(
	{	    
	    render : function(searchQueryString) {
		console.log("renderScanPriceChange");
		var view = this;
		
		if(_.isEmpty(searchQueryString)){
		    var searchQuery = undefined;
		}
		else{
		    var searchQuery = searchQueryString;
		}
		
		var html = 
		    ich.menuInventoryScanItemTaxChanges_TMP(autoBreadCrumb());
		
		$(view.el).html(html);

		var userLevel = topLevelEntity(ReportData);

		currentInventoryFor(userLevel.id)
		(function(err,inventory){
		     //todo: maybe i can make filterSearch return on undefined input
		     var filteredInv = (searchQuery)?_.filterSearch_SubStr_SelectedKeys(inventory,searchQuery,"upccode","description","price"):inventory;
		     var formattedInv = _.prewalk(
			 function(item){
			     if(item.selling_price){
				 return _.combine(item,
						  {selling_price:currency_format(Number(item.selling_price))});
			     }
			     return item;
			 },filteredInv);

		     var html =  ich.menuInventoryScanTaxtable_TMP({filter:searchQuery,list:formattedInv});
		     $(view.el).find("#taxChangeTable").html(html);
		     
		     //set up the enabled/disabled buttons
		     _.each(formattedInv, function(item){
				var tg = $("#"+item.upccode);
				tg.click(function(){
		  			     var row = $(this).parent().parent().find("input");
		  			     if((_.first(row)).disabled) {
		  				 $(this).html("Disable");
		  				 _.each(row,function(item){item.disabled=false;});
		  			     } else {
		  				 $(this).html("Enable");
		  				 _.each(row,function(item){item.disabled=true;});
		  			     }
		  			 });
			    });
		     

		     //set the search text box to filter the item list when 'enter' is clicked
		     $("#filterInv").keypress(
			 function(e){
			     var code = (e.keyCode ? e.keyCode : e.which), enterCode = 13;
			     if (code == enterCode){
				 view.render($(this).val());}
			 });
		     $("#submitTaxChanges").button().click(
			 function(){
			     var currentDate = new Date();
			     var newInvList = 
				 _.chain(varFormGrabber($("#taxChangeTable")))
				 .map(function(item,strUPC){
					  var upc = strUPC.replace("upc-","");
					  var invItem = _.find(filteredInv,function(val,key){return upc==val.upccode;});
					  var invItemReturn = _.selectKeys(invItem,"apply_taxes","date","description","locid","upccode");
					  invItemReturn.apply_taxes = item.apply_taxes;
					  invItemReturn.date = currentDate;
					  return invItemReturn;
				      })
				 .filter(function(item){
					     return $("#"+item.upccode).html() == "Disable";
					 })
				 .value();
			     if(_.isEmpty(newInvList)){
				 alert("there were no changes made");
				 return;
			     }
			     inv_helpers.saveInvChangesAndSelectStores(newInvList, userLevel.type,ReportData)
			     (function(err){view.render(searchQuery);});
			 });
		     
		 });
	    }
	});