var menuInventorypriceChangeLogRouter = 
    new (Backbone.Router.extend(
	     {routes: {
		  "inventory/price_change_log":"menuInventoryPriceChangeLog"
	      },
	      menuInventoryPriceChangeLog:function() {
		  //inv_helpers.renderPriceChangesLog({el: $("#main")});
		  inv_helpers.renderChangesLog({el: $("#main")},
					       "menuInventoryScanPriceLog_TMP",
					       inv_helpers._mainChangeLogTemplate("Price"),
					       inventoryPriceChangeLog_fetch);
		  console.log("menuInventory priceChangeLog");
	      }
	     }));
