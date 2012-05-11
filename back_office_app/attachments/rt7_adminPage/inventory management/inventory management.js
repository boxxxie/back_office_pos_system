
function addItem(viewItem){
	return {success: function(resp){
		    _.extend(resp,{creationdate:new Date()});
		    viewItem.save(resp);}};};

function editItem(viewItem){
	return {success: function(resp){
		    viewItem.save(resp);}};};


function editReviewItem(collection) {
	return {success: function(resp) {
		    var invModel = collection.get(resp._id);
		    
		    invModel.save(resp,{
				      success:function() {
					  collection.trigger("change",collection.toJSON());
					  $("#upc").val(""); 
				      }
				  });
		}   
	       };  
    };
    
var InventoryManagementRouter = new 
    (Backbone.Router.extend(
	 {
             routes: {
		 "inventorymanagement":"inventoryManagementHome",
		 "inventorymanagement/review/":"reviewInventoryHome",
		 "inventorymanagement/add_view/": "addviewInventoryHome",
		 "inventorymanagement/add_view/upc/":"addviewInventoryHome",
		 "inventorymanagement/add_view/upc/:upc": "addmodifyInventory"  
             },
             inventoryManagementHome:function(){
                 
                 if(isTerritoryUser(currentSession)) {
                    window.history.go(-1);
                }
                 
		 console.log("inventoryManagementHome");
		 var html = ich.inventoryManagementHome_TMP({});
		 $("#main").html(html);
             },
             reviewInventoryHome:function(){
                 
                 if(isTerritoryUser(currentSession)) {
                    window.history.go(-1);
                }
                 
		 var html = ich.reviewInventoryPage_TMP({});
		 $("#main").html(html);
		 var view = this.view;
		 var invCollection = new (couchCollection(
					      {db:'inventory_review_rt7'},
					      {model:InventoryReviewDoc,
					      getJSONbyUPC:function(upccode){
					          var colJSON = this.toJSON();
					          return _.filter(colJSON,function(inv){return inv.inventory.upccode==upccode;});
					      }}));
		 
		 invCollection.fetch({
					 success:function(collection){
					     console.log(collection);
					     view = new ReviewInventoryView({collection:collection});                    
					 },
					 error:function(a,b,c) {
					     console.log([a,b,c]);
					 }
				     });
             },
             addviewInventoryHome:function(){
                 
                 if(isTerritoryUser(currentSession)) {
                    window.history.go(-1);
                }
                
		 var html = ich.addInventoryPage_TMP({});
		 $("#main").html(html);
		 $("#upc").focus();
		 
		 $("#upc").keypress(
                     function(e){
                         var code = (e.keyCode ? e.keyCode : e.which), enterCode = 13;
                         if (code == enterCode){
                         var upc = $(this).val();
                         window.location.href ='#inventorymanagement/add_view/upc/'+_.escape(upc);
                         $(this).focus();
                         $(this).val('');
                         }
                     });
             }
	 }));


    var ReviewInventoryView = 
	Backbone.View.extend({
				 initialize:function() {
				     var view = this;
				     var collectionInv = view.collection;
				     (collectionInv).on("change",view._renderTable,view);
				     view._initUPCbox();
				     view._renderTable(collectionInv.toJSON());
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
				 _searchInv:function(searchString) {
				     var view = this;
				     var collectionInv = view.collection;
				     
				     if(_.isEmpty(searchString)){
					 var searchQuery = undefined;
				     }
				     else{
					 var searchQuery = searchString;
				     }
				     
				     if(!searchQuery) {
					 view._renderTable(collectionInv.toJSON());
				     } else {
					 console.log("look for upc code : " + searchQuery);
					 var listJSON = collectionInv.getJSONbyUPC(searchQuery);
					 if(_.size(listJSON)>0) {
					     view._renderTable(listJSON);
					 } else {
					     view._renderTable({});
					 }
				     }            
				 },
				 _renderTable:function(listInv) {
				     var view = this;
				     var collectionInv = view.collection;
				     
					     var list = _(listInv).chain()
					 .sortBy(function(item){return (_.isNaN((new Date(item.inventory.date)).getTime()))?getDateObjFromStr(item.inventory.date):new Date(item.inventory.date);})
					 .map(function(item){
						  var cloneItem = _.clone(item);
						  var companyInfo = _.find(cloneItem.ids, function(id){
									       return id.type=="company";
									   });
						  var groupInfo = _.find(cloneItem.ids, function(id){
									     return id.type=="group";
									 });
						  var storeInfo = _.find(cloneItem.ids, function(id){
									     return id.type=="store";
									 });
						  
						  var returnData = _.combine(cloneItem,{companyName:companyInfo.label,
											groupName:_.isEmpty(groupInfo)?undefined:groupInfo.label,
											storeName:_.isEmpty(storeInfo)?undefined:storeInfo.label});
						  
						  returnData.inventory.date = jodaDateFormatter(returnData.inventory.date); 
						  returnData.inventory.price.selling_price = currency_format(Number(returnData.inventory.price.selling_price)); 
						  return returnData;            
					      })
					 .value()
					 .reverse();
				     
				     var html = ich.reviewInventoryTable_TMP({list:list});
				     $("#mainintmp").html(html);
				     
				     _.each(list,function(item){
						$("#edit-"+item._id).button().click(function(){
											var invRT7 = new InventoryRT7Doc({_id:item.inventory.upccode});
											invRT7.fetch({
													 success:function(model) {
													     $("#dialog-hook").html(ich.inventoryReviewModifyDialog_TMP(_.extend({title:"Edit "+item.inventory.upccode+" Information"}
																						 ,{inventory_review:item
																						   ,inventory_rt7:model.toJSON()})));
													     
													     InventoryReviewItemModifyDialog("", {collection:collectionInv
																		  ,invRT7Model:model
																		  ,reviewInvID:item._id});
													 },
													 error:function() {
													     //TODO : no inventory found in RT7 inventory db
													     $("#dialog-hook").html(ich.inventoryReviewImportDialog_TMP(_.extend({title:"Edit "+item.inventory.upccode+" Information"}
																						 ,item)));
													     InventoryReviewItemImportDialog("");
													 }
												     });
										    });
						
						$("#del-"+item._id).button().click(function(){
										       var invModel = collectionInv.get(item._id);
										       invModel.destroy({success:function(){
													     collectionInv.trigger("change",collectionInv.toJSON());                        
													 }});
										   });                
					    });
				 }   
			     });    
    
    var AddViewInventoryView = 
	Backbone.View.extend(
	    {initialize:function(){
		 var view = this;
		 _.bindAll(view, 'renderManagementPage','renderModifyPage');
		 InventoryManagementRouter.bind('route:addviewInventoryHome', function(){
				    console.log('inventoryView:route:addviewInventoryHome');
				    view.el= _.first($("#mainintmp"));				
				    view.renderManagementPage();});
		 InventoryManagementRouter.bind('route:addmodifyInventory', function(upc){
				    upc = _.unEscape(upc);
				    //fetch model based on upc code
				    view.el= _.first($("#mainintmp"));
				    view.model = new InventoryRT7Doc({_id:upc});
				    view.model.bind('change',function(){view.renderModifyPage(upc);});
				    view.model.bind('not_found',function(){view.renderAddPage(upc);});
				    view.model.fetch({error:function(a,b,c){
							  console.log("couldn't load model");
							  view.model.trigger('not_found');
						      }});
				    console.log('InventoryView:route:modifyInventory');});
		 
	     },
	     renderManagementPage:function(){
		 var view = this;
		 if(view.model){
		     $(this.el).html("");
		 }
		 $("#upc").focus();
		 console.log("InventoryView renderManagementPage");
		 return this;
	     },
	     renderModifyPage:function(upc){
		 var view = this;
		 var html = ich.inventoryViewPage_TMP(_.extend({upc:upc},view.model.toJSON()));
		 $(html).find('input').attr('disabled',true);
		 $(this.el).html(html);
		 $("#dialog-hook").html(ich.inventoryInputDialog_TMP(_.extend({title:"Edit "+upc+" Information"},view.model.toJSON())));
		 InventoryItemModifyDialog("edit-thing",editItem(view.model));
		 console.log("InventoryView renderModifyPage " + upc);
		 $("#upc").focus();
		 return this;
	     },
	     renderAddPage:function(upc){
		 var view = this;
		 var html = ich.inventoryAddPage_TMP({createButtonLabel:"add (" + upc + ") to the Inventory",upc:upc });
		 $(this.el).html(html);
		 $("#dialog-hook").html(ich.inventoryInputDialog_TMP({title:"Add "+upc+" to the Inventory",_id:upc,location:{},apply_taxes:{},price:{selling_price:"0.00"}}));
		 InventoryItemCreateDialog("create-thing",addItem(view.model));
		 $("#upc").focus();
		 console.log("InventoryView renderAddPage " + upc);
		 return this;
	     }
	    });



