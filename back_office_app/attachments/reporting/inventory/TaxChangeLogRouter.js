var menuInventorytaxChangeLogRouter =
    new (Backbone.Router.extend(
	     {routes: {
		  "inventory/scan_tax_change_log":"menuInventoryTaxChangeLog"
	      },
	      menuInventoryTaxChangeLog:function() {
		  console.log("menuInventoryCompanytaxChangeLog");
		  inv_helpers.renderChangesLog({el: $("#main")},
					       "menuInventoryScanTaxLog_TMP",
					       inv_helpers._mainChangeLogTemplate("Tax"),
					       inventoryTaxChangeLog_fetch);
	      }
	     }));