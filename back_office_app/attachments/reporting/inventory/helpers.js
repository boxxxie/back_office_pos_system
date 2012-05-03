var inv_helpers =
    {renderChangesLog : function(view,mainTMP,tableTMP,fetcher){
	 var html = ich[mainTMP](_.extend({startPage:ReportData.startPage},autoBreadCrumb()));
	 $(view.el).html(html);
	 var id = topLevelEntity(ReportData).id;
	 fetcher(id)
	 (function(err,resp_raw){
	      var resp = _.map(resp_raw, function(aitem){
				   var item = _.clone(aitem);
		  		   item.date = dateFormatter(new Date(item.date));
  				   if(_.isDefined(item.price)) {
		  		       item.price.selling_price = currency_format(Number(item.price.selling_price));
		  		   }
				   item.locations = _.filter(item.locations,_.has_F('label'));
		  		   return item;
		  	       });

	      var html =  ich[tableTMP]({list:resp});
	      $(view.el).find("#changeLogTable").html(html);
	      //set the buttons to open a dialog list of the stores that apply to each price change
	      _.each(resp,function(item){
			 $("#"+item._id).button().click(
			     function(){
			     var newLocations = _(extractStores(ReportData)).chain()
			                             .pluck("id")
			                             .matchTo(item.locations,"location_id")
			                             .mapRenameKeys("name","storeName","number","storeNumber")
			                             .value();
				 detailsDialog(ich.simpleList_TMP({items:newLocations}),
					       {title:"changes applied to these locations"});
			     });
		     });
	  });
     },
     _mainChangeLogTemplate:function(templateType){
	  if(topLevelEntity(ReportData).type == 'store'){
	     return "menuInventoryScan"+templateType+"Logtable_store_TMP";
	 }
	 else{
	     return "menuInventoryScan"+templateType+"Logtable_TMP";
	 }
     },

     //TODO newItemList should be a backbone collection
     //inv_doc should be a backbone model.
     //remove allStore_ids
     //fixme: depricated
     saveNewInvItems:function(newItemList,origins,stores,groups){
	 return function(runAfter){
	     return function(locationsToSaveTo){ //this list of ids probably isn't needed if we are sending models to the fn

		 var entitys = origins.concat(stores).concat(groups);
		 var group_ids_to_save_to = _.chain(locationsToSaveTo)
		     .map(function(store){
				 return groupFromStoreID(ReportData,store.id);
			     })
		     .unique()
		     .value();

		 var locationsToReportTo = _.chain([origins,locationsToSaveTo])
		     .flatten()
		     .pluck('id')
		     .concat(group_ids_to_save_to)
		     .unique()
		     .matchTo(entitys,'id')
		     .value();

		 inv_helpers.saveManyInvItems(newItemList,locationsToSaveTo,locationsToReportTo)(runAfter);

	     };
	 };
     },

     modelsFromIds:function(attrs,idsToSaveTo){
	 //idsToSaveTo is a list of group/company/store with .id where the item is going to be changed
	 //attrs are the changes made to the inv doc
	 return function(callback){
	     var upc = attrs.upccode;
	     var generalInvItemData =  attrs;
	     var models = async.map(idsToSaveTo,
				    function(item,fetched){
					var inv = new InventoryDoc({_id: item.id+"-"+upc});
					inv.fetch(
					    {
						success:function(model){
						    fetched(null,
							    model.set(_.combine(
									       generalInvItemData,
									       {locid:item.id}),
								      {silent:true}));
						},
						error:function(){
						    fetched(null,inv.set(_.combine(
										  generalInvItemData,
										  {locid:item.id}),
									 {silent:true}));
						}
					    });
				    },
				    function(err,resp){
					callback(null,resp);
				    });
	 };
     },
     changesLogFromModels:function(invChange,locationsUpdated){
	 return function(callback){
	     var itemToSave = _.chain(locationsUpdated)
		 .unique(false,function(item){return _.either(item.id,item.location_id);})
                 .mapRenameKeys("id","location_id")
                 .value();

	     var newInvChange = new InventoryChangesDoc({inventory : invChange,
							 ids : itemToSave});
	     callback(null,newInvChange);
	 };
     },
     saveOneInvItem :function(attrs,locationsToSaveTo,locationsToReport){
	 if(locationsToReport === undefined){
	     locationsToReport = locationsToSaveTo;
	 }
	 return function(callback){
	     function modelSaveError(callback){
		 //resp.responseText
		 //"{"error":"case_clause","reason":"inventory items must contain prices that are numeric values"}
		 return function(resp){
		     //fixme: maybe this needs to be in the save function
		     var error = JSON.parse(resp.responseText);
		     callback.apply(null,[error]);
		 };
	     }
	     async.parallel(
		 [inv_helpers.modelsFromIds(attrs,locationsToSaveTo), //fetch needed models
		  inv_helpers.changesLogFromModels(attrs,locationsToReport)], //create change log
		 //save all of the models
		 function(err,modelsToSave){
		     async.forEach(_.flatten(modelsToSave),
				   function(model,cb){
				       model.save({},
						  {success:function(){cb();},
						   error:modelSaveError(cb)});
				   },
				   function(err){
				       callback.apply(null,[err,attrs]);
				   }
				  );
		 });
	 };
     },
     saveManyInvItems : function(items,locationsToSaveTo,locationsToReport){
	 return function (callback){
	      async.forEach(items,
			    function(item,callback){
				inv_helpers.saveOneInvItem(item,locationsToSaveTo,locationsToReport)(callback);
			    },
			    callback);
	 };
    },
     saveInvChangesAndSelectStores : function(newInvList,userLevel,reportData){
	 return function(runAfter){
	     var parents = _.values(getParentsInfo(reportData));
	     //the store level doesn't need to have a dialog because there is only one place to save to.
	     if(userLevel == 'store'){
		 async.forEach(newInvList,
			       function(invItemObj,callback){
				   inv_helpers.saveOneInvItem(invItemObj,parents)
				   (callback);
			       },
			       runAfter
			      );
	     }
	     else{
		 var stores = extractStores(reportData);
		 var groups = extractGroups(reportData);
		 //template for the dialog
		 var html = ich.menuInventoryApplyStoresQuickViewDialog_TMP({items:stores});
		 menuInventoryApplyStoresViewDialog(
		     html,
		     {title:"Apply changes to stores",
		      stores:stores,
		      groups:groups,
		      parents:parents,
		      makeButtons:inv_helpers.saveNewInvItems(newInvList,parents,stores,groups)
		      (runAfter)});
	     }
	 };
     }
};