var urlBase = window.location.protocol + "//" + window.location.hostname + ":" +window.location.port + "/";
var db_menus = "menus_corp";
var Menu = couchDoc.extend(
    {
	urlRoot:urlBase + db_menus,
	menu_screen:function(screen){
	    var menuButtons = this.get('menuButtons');
	    if(!menuButtons || _.isEmpty(menuButtons)){
		this.set_empty_menu();
	    }
	    var buttonRows = _(this.get('menuButtons')).chain()
		.groupBy(function(button){return button.display.screen;})
		.peek(screen)
		.partition(4)
		.map(function(row){return {row:row};})
		.value();
	    return {menu_screen : buttonRows};
	},
	set_buttons:function(buttons){
	    var thisModel = this;
	    _.each(buttons,function(button){
		       thisModel.set_button(button);
		   });
	    return this;
	},
	set_button:function(button){
	    var screen = button.display.screen;
	    var position = button.display.position;
	    var menuButtons = this.get('menuButtons');
	    
	    var newMenuButtons = 
		_.map(menuButtons, function(menubutton){
	    		  if(menubutton.display.screen==screen && menubutton.display.position==position) {
	    		      return button;
	    		  }else {
	    		      return menubutton;
	    		  }
		      });
    
	    this.set({menuButtons:newMenuButtons},button);
	    return this;
	},
	set_header:function(newHeader){
	    var screen = newHeader.menu_id;
	    var menuHeaders = this.get('menuButtonHeaders');

	    var newHeaders = 
		_.map(menuHeaders, function(header){
	    		  if(header.menu_id == screen) {
	    		      return newHeader;
	    		  }else {
	    		      return header;
	    		  }
		      });

	    this.set({menuButtonHeaders:newHeaders},newHeader);
	},
	get_button:function(screen,position){
	    var menuButtons = this.get('menuButtons');
	    return this.find_button(menuButtons,screen,position);
	},
	get_header:function(screen){
	    var menuButtonHeaders = this.get('menuButtonHeaders');
	    return this.find_header(menuButtonHeaders,screen);
	},
	find_header:function(headers,screen){
	    return _(headers).find(function(button){return button.menu_id == screen;});
	},
	find_button:function(menuButtons,screen,position){
	    return _(menuButtons).find(function(button){return button.display.screen == screen && button.display.position == position;});
	},
	set_empty_menu :function(){
	    var white = "255,255,255";
	    var dark_green ="0,150,0";
	    function emptyMenuButton(){
		return {
		    "display": {
			"is_enabled": false,
			"image": "",
			"color": "255,255,255",
			"description": [" ", " ", " "]
		    },
		    "foodItem": {
			"price": "",
			"apply_taxes": {
			    "exemption": false,
			    "tax1": true,
			    "tax2": true,
			    "tax3": false
			},
			"use_scale": false,
			"print_to_kitchen": false,
			"duplicate": false,
			"has_modifier": false
		    }
		};
	    }
	    function emptyMenuButtonHeaders(){
		return[
		    {
			"description1": "",
			"description2": "",
			"description3": "",
			"defaultImage": "/assets/menu-1.png",
			"menu_id": 1,
			"image": "",
			"color": ""
		    },
		    {
			"description1": "",
			"description2": "",
			"description3": "",
			"defaultImage": "/assets/menu-2.png",
			"menu_id": 2,
			"image": "",
			"color": ""
		    },
		    {
			"description1": "",
			"description2": "",
			"description3": "",
			"defaultImage": "/assets/menu-3.png",
			"menu_id": 3,
			"image": "",
			"color": ""
		    },
		    {
			"description1": "",
			"description2": "",
			"description3": "",
			"defaultImage": "/assets/menu-4.png",
			"menu_id": 4,
			"image": "",
			"color": ""
		    }
		];
	    }
	    var num_of_menu_screens = 6;
	    var num_of_menu_buttons = 216;
	    var num_of_menu_buttons_per_screen = 36;
	    var menu = {};
	    menu.menuButtons = 
		_(num_of_menu_screens).chain().range().zip(_.range(1,num_of_menu_screens+1))
		.map(function(menu_screen){
			 return _(num_of_menu_buttons_per_screen).chain()
			     .range()
			     .map(function(menu_item){
				      var display = {display:_.extend({},emptyMenuButton().display,
								      {screen: _.first(menu_screen), position: menu_item})};
				      return _.extend({},emptyMenuButton(),display);
				  }).value();
		     })
		.flatten().
		map(function(button){
			if(button.display.screen == 0 || button.display.screen == 5){
			    button.display.color = dark_green;
			}
			return button;
		    })
		.value();
	    menu.menuButtonHeaders = emptyMenuButtonHeaders();
	    return this.set(menu);
	}
    });