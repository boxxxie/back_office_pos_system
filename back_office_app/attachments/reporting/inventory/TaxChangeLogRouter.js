var menuInventorytaxChangeLogRouter = 
    new (Backbone.Router.extend(
	     {routes: {
		  "menuInventory/taxChangeLog":"menuInventoryTaxChangeLog",
		  "menuInventory/groupReporttaxChangeLog":"menuInventoryTaxChangeLog",
		  "menuInventory/storeReporttaxChangeLog":"menuInventoryTaxChangeLog"
	      },
	      menuInventoryTaxChangeLog:function() {
		  console.log("menuInventoryCompanytaxChangeLog");
		  inv_helpers.renderChangesLog({el: $("#main")},
					       "menuInventoryScanTaxLog_TMP",
					       inv_helpers._mainChangeLogTemplate("Tax"),
					       inventoryTaxChangeLog_fetch);
	      }
	     }));