var menuInventorytaxChangeLogRouter = 
    new (Backbone.Router.extend(
	     {routes: {
		  "menuInventory/companyReporttaxChangeLog":"menuInventoryTaxChangeLog",
		  "menuInventory/groupReporttaxChangeLog":"menuInventoryTaxChangeLog",
		  "menuInventory/storeReporttaxChangeLog":"menuInventoryTaxChangeLog"
	      },
	      menuInventoryTaxChangeLog:function() {
		  //inv_helpers.renderTaxChangesLog({el: $("#main")}, ReportData.company._id, "companyReport");
		  console.log("menuInventoryCompanytaxChangeLog");
		  inv_helpers.renderChangesLog({el: $("#main")},
					       "menuInventoryScanTaxLog_TMP",
					       inv_helpers._mainChangeLogTemplate("Tax"),
					       inventoryTaxChangeLog_fetch);
	      }
	     }));