var inventory_view =
    general_report_table_view.extend(
	{
	    initialize:function(options){
		var view = general_report_table_view.prototype.initialize.call(this,options);
		view.menu_table =
		    new templated_view({
					   template:'menuReportsInventoryMenutable_TMP',
					   auto_el:'#inventorymenutable'
				       });
		view.scan_table =
		    new templated_view({
					   template:'menuReportsInventoryScantable_TMP',
					   auto_el:'#inventoryscantable'
				       });
		view.ecr_table =
		    new templated_view({
					   template:'menuReportsInventoryEcrtable_TMP',
					   auto_el:'#inventoryecrtable'
				       });
		return view;
	    },
	    setup:function(){
		var view = general_report_table_view.prototype.setup.call(this);
		if(view.$('#inventorymenutable').size()){
		   //the divs for the tables are made, don't need to remake them
		}
		else{
		    //build the divs for the tables
		    view.$el.append(view.menu_table.make("div", {"id": "inventorymenutable"}));
		    view.$el.append(view.menu_table.make("div", {"id": "inventoryscantable"}));
		    view.$el.append(view.menu_table.make("div", {"id": "inventoryecrtable"}));
		}
		return view;
	    },
	    events:{
		'change #inventorydown':'select_table_category'
	    },
	    _render:function(data){
		var view = this;
		view.menu_table.render(data);
		view.scan_table.render(data);
		view.ecr_table.render(data);
		return view;
	    },
	    _show_hide_tables:multimethod()
		.dispatch(function(event){
			      var child_index = event.currentTarget.selectedIndex;
			      var category_selected = $(event.currentTarget.children[child_index]).val();
			      return category_selected;
			  })
		.when("ALL", function(){
			  this.menu_table.$el.show();
			  this.scan_table.$el.show();
			  this.ecr_table.$el.show();
		      })
		.when("Menu",function(){
			  this.menu_table.$el.show();
			  this.scan_table.$el.hide();
			  this.ecr_table.$el.hide();
		      })
		.when("Scan",function(){
			  this.menu_table.$el.hide();
			  this.scan_table.$el.show();
			  this.ecr_table.$el.hide();
		      })
		.when("ECR",function(){
			  this.menu_table.$el.hide();
			  this.scan_table.$el.hide();
			  this.ecr_table.$el.show();
		      }),
	    select_table_category:function(event){
		this._show_hide_tables(event);
	    },
	    _selection_obj:function(event){
		var child_index = event.currentTarget.selectedIndex;
		var el = $(event.currentTarget.children[child_index]);
		var selection = {
		    id : el.val(),
		    name : el.text()
		}
		return selection;
	    }
	});

var inventory_sold_report_router =
    general_report_router.extend(
	{
	    export_csv:function(callback){
		console.log('export inventory sold report')
		function convert_to_array(data){
		    return _.chain([
				  data.menu_sales_list,
				  data.scan_sales_list,
				  data.ecr_sales_list,
				  data.scale_sales_list
			      ])
			.flatten(true)
			.map(function(item){
				 if(item.upc){
				     var label = item.label +'-'+ item.upc
				 }
				 else{
				     var label = item.label
				 }
				 return [
				     label,
				     item.sales.quantity,
				     item.sales.price,
				     item.refunds.quantity,
				     item.refunds.price,
				     item.totals.quantity,
				     item.totals.price,
				     item.typedSalesPercentage,
				     item.totalSalesPercentage
				 ]
			     })
			.value()
		}
		callback(convert_to_array,'inventory_sold_report');
	    },
	    fetch_inventory_report:function(callback) {
		var router = this
		inventoryTotalsRangeFetcher_F(router.selected_entity)
		(router.startDate.toArray().slice(0,3), router.endDate.toArray().slice(0,3))
		(function(err,response) {
		     callback(response);
		 });
	    }
	});
new inventory_sold_report_router(
    {
	route : new RegExp('inventory/inventory_sold'),
	report_table_view:inventory_view,
	template:"report_TMP",
	title:'Inventory Sold Report'
    });