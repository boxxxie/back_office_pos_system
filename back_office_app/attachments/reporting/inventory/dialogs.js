function menuInventoryApplyStoresViewDialog (dialog_html,options) {

    var form = $(dialog_html).find("#formInventoryApplystores");
    var d = $("#dialog-quickView");
    d.html(dialog_html);
    d.find("#applyToAll").change(
	function(){
	    if($(this).is(":checked")){
		$(form).find("input").attr('disabled',true);
	    }
	    else{
		$(form).find("input").removeAttr('disabled');
	    }
	});

    var dialogOptions = _.extend(
	{autoOpen: false,
	 height: 450,
	 width: 424,
	 modal: true,
	 buttons: {
	     "Apply" : function() {
		 var checkedStores = form.find("input:checked").toArray();
		 var applyToAllStores =  d.find("#applyToAll").is(":checked");
		 var stores = options.stores;
		 var groups = options.groups;
		 var parents = options.parents;
		 if(_.isEmpty(checkedStores) && !applyToAllStores){
		     //user clicked apply button and there was nothing selected... do nothing
		     console.log("The price change will not be applied to any stores in this company");
		 }
		 else if (applyToAllStores ||
			  _.size(checkedStores) == _.size(stores)){
		     //this needs to be used in the below function as well

		     console.log("The price change will be applied to all stores in this company");
		     function safe_parents(parents){
			 if(parents){return parents}
			 return [];
		     }
		     options.makeButtons(_.chain(stores)
					 .concat(groupsFromStoreSets(stores,groups,ReportData))
					 .concat(safe_parents(parents))
					 .unique(false,function(item){return item.id;})
					 .value());
		 }
		 else{
		     var stores_to_update = _.chain(checkedStores)
			 .pluck('id')
			 .matchTo(stores,'id')
			 .value();

		     var groups_to_update = groupsFromStoreSets(stores_to_update,groups,ReportData);

		     console.log("The price change will be applied to selected stores");
		     console.log(stores_to_update);

		     options.makeButtons(stores_to_update.concat(groups_to_update));
		 }
		 d.dialog('close');
	     },
	     "Cancel" : function() {
		 d.dialog('close');
	     }
	 },
	 title:options.title
	},_.clone(options));

    d.dialog(dialogOptions);
    d.dialog("open");
};