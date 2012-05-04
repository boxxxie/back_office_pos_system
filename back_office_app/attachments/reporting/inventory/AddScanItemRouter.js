var menuInventoryaddScanItemRouter =
    new (Backbone.Router.extend(
	     {routes: {
		  "menuInventory/addScanItem":"main"
	      },
	      main:function(){
		  console.log("add scan item page");
		  $("#main").html(ich.inventoryManagementHome_TMP(autoBreadCrumb()));
		  var router = this;
		  router._setup(router);
		  router.views.input.setElement("#upc_search",true);
		  router.views.display.setElement("#item_display");
	      },
	      _setup:_.once(function(router){
				router.views = {
				    input: new upc_code_input_view({id:topLevelEntity(ReportData).id}),
				    display:new inv_display_view({id:topLevelEntity(ReportData).id})
				};
				router.views.input.on('add_item_to_company',router.views.display.addItemTo_company_and_reviewDB,router.views.display);
				router.views.input.on('loaded_from_rt7',router.views.display.addItemTo_company,router.views.display);
				router.views.input.on("item_already_in_company",router.views.display.displayItem,router.views.display);
			    })
	     }));


var upc_code_input_view =
    Backbone.View.extend(
	{
	    events:{
		"change input":"userChangedUpc",
		"click button":"userChangedUpc"
	    },
	    userChangedUpc:function(){
		var upc = _.str.trim(this.$el.find('input').val());
		var view = this;
		var entity_id = view.options.id;
		var model = new InventoryDoc({_id:entity_id+"-"+upc});
		model
		    .fetch(
			{
			    success:function(resp_model){
				view.trigger("item_already_in_company",resp_model);
			    },
			    error:function(){
				(new InventoryRT7Doc({_id:upc}))
				    .fetch({success:function(resp_model){
				     		model.clear({silent:true});
						model.set(_(resp_model.toJSON()).selectKeys('description'),{silent:true});
						view.trigger("loaded_from_rt7",model);
					    },
					    error:function(){
						model.clear({silent:true});
						view.trigger("add_item_to_company",model);
					    }});
			    }});
	    }
	}
    );

var inv_display_view =
    Backbone.View.extend(
	{
	    _renderItem:function(model,msg){
		if(msg){var tmpData = _.extend(model.toJSON(),{userMessage:msg});}
		else{var tmpData = model.toJSON();}
		this.$el.html(ich.inventoryForm_TMP(tmpData));
	    },
	    _disableSubmitButton:function(){
		this.$el.find("input,button").attr("disabled", true);
	    },
	    _saveItemsAndLog:function(callback){
		var view = this;
		return function(){
		    //extract model values from form/textbox
		    var formObj = varFormGrabber($("#inv_form"));
		    var upc = $("#upc_search").find(":text").val(); //query's the input field
		    var invObj = _.combine(formObj,{upccode:upc,
						  date:(new Date()).toJSON()});

		    var allStores = extractStores(ReportData);
		    var allGroups = extractGroups(ReportData);
		    var parents = _.values(getParentsInfo(ReportData));
		    var locationsToSaveTo = allStores.concat(parents,allGroups);
		    //create all of the models for the inv objects (all stores and groups and the company)

		    inv_helpers.saveOneInvItem(invObj,locationsToSaveTo)
		    (function(err,invItem){
			 if(err){
			     alert("There was an error saving the item: " + err.reason);
			 }
			 else{
			     view._submitButtonClick(
				 function(){
				     alert("you can not add the item again");
				 });
			 }
			 callback.apply(null,_(arguments).toArray());
		     });
		};
	    },
	    _submitButtonClick:function(fn){
		$("#addItemToCompany")
		    .button()
		    .click(
			function(){
			    fn();
			});
	    },
	    addItemTo_company:function(model){
	        var view = this;
	    	view._renderItem(model,"you can add this item to your inventory, it has a suggested description");
		view._submitButtonClick(
		    view._saveItemsAndLog
		    (function(err,savedInv){
			 if(err === undefined){
			     alert(savedInv.description + " has been added");
			 }
		     })
		);
	    },
	    addItemTo_company_and_reviewDB:function(model){
		var view = this;
	    	view._renderItem(model,"you can add this item to your inventory");
		view._submitButtonClick(
		    view._saveItemsAndLog
		    (function(err,savedInv){
			 var parents = getParentsInfo(ReportData);
			 var pInfo = [parents.company, parents.group, parents.store];
			 var ids = _(pInfo).chain()
                             .compact()
                             .mapRenameKeys("id","location_id")
                             .map(function(item){
				      return _(item).selectKeys('location_id','label','type');
				  })
                             .value();

			 var inv = _.chain(savedInv)
			     .selectKeys('date','upccode','description','price')
			     .value();

			 if(err === undefined){
			     alert(savedInv.description + " has been added");
			 }
			 //save the review doc anyway, even if there are errors saving the original document
			 var invItemForReview = new InventoryReviewDoc({ids:ids, inventory:inv});
			 invItemForReview.save(); //this will conflict sometimes, it's ok
		     })
		);
	    },
	    displayItem:function(model){
		var view = this;
		view._renderItem(model,
				 model.get("description") +
				 " is already in your inventory. It can not be added again.");
		view._disableSubmitButton();
	    }
	}
    );