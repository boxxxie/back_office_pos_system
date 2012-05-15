(new (Backbone.Router.extend(
	  {routes: {
	       "inventory/":"setup"
	   },
	   menu_options:{
	       inventory_sold:{img:'reports/inventorysold.png',title:'Inventory Sold Report',link:'inventory_sold'},
	       idle_inventory:{img:'inventory-idle.png',title:'Idle Inventory Report',link:'idle_inventory'},
	       stock_management:{img:"inventory-idle.png",title:"Inventory Stock Management",link:'stock_management'},
	       scan_price_change:{img:"reports/scanprice.png",title:"SCAN Item Price Changes",link:'scan_price_change'},
	       scan_tax_change:{img:"reports/scantax.png",title:"SCAN Sales Tax Changes",link:"scan_tax_change"},
	       add_scan_item:{img:"reports/scanaddnew.png",title:"Add New Inventory SCAN Items",link:"add_scan_item"},
	       price_change_log:{img:"reports/pricelog.png",title:'Price Change Log',link:'price_change_log'},
	       scan_tax_change_log:{img:"reports/taxlog.png",title:"Tax Change Log",link:'scan_tax_change_log'},
	       menu_price_change:{img:"reports/menupricechange.png",title:"Menu Price Change",link:'menu_price_change'}
	   },
	   render:function(template_data){
	       var html = ich.menuInventory_TMP(template_data);
	       $("#main").html(html);
	   },
	   setup:multimethod()
	   .dispatch(function(){
			 return topLevelEntity(ReportData).type;
		     })
	   .when('company',function(){
		     var options_list = _.toArray(this.menu_options);
		     var template_data = _.extend(autoBreadCrumb(),{options:options_list});
		     this.render(template_data);
		 })
	   .when('group',function(){
		     var options_list = _.chain(this.menu_options).removeKeys('menu_price_change').toArray().value();
		     var template_data = _.extend(autoBreadCrumb(),{options:options_list});
		     this.render(template_data);
		 })
	   .when('store',function(){
		     var options_list = _.chain(this.menu_options).removeKeys('menu_price_change').toArray().value();
		     var template_data = _.extend(autoBreadCrumb(),{options:options_list});
		     this.render(template_data);
		 })
	  })));