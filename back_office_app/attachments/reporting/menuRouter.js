var menuModel;

var menuSetMenusRouter =
    new (Backbone.Router.extend(
	     {routes: {
	     	  "menuSetMenus/":"menuSetMenusCompany",
	     	  "menuSetMenus/groupReport":"menuSetMenusGroup",
	     	  "menuSetMenus/storeReport":"menuSetMenusStore"
	      },
	      menuSetMenusCompany:function() {
		  console.log("menuSetMenusCompany  ");
	      },
	      menuSetMenusGroup:function() {
		  console.log("menuSetMenusGroup  ");
		  alert("This feature is for company level users only.");
		  window.history.go(-1);
	      },
	      menuSetMenusStore:function() {
		  console.log("menuSetMenusStore  ");
		  alert("This feature is for company level users only.");
		  window.history.go(-1);
	      }
	     }));

var menuSetMenusView =
    Backbone.View.extend(
	{
	    initialize:function(){
		var view = this;
		view.el = $("#main");

		_.bindAll(view,
			  'renderMenuSetMenusCompany',
			  'renderMenuHeaderPartial',
			  'renderMenuScreenPartial');
		menuSetMenusRouter
		    .bind('route:menuSetMenusCompany',
			  function(){
			      console.log("menuReportsView, route:menuSetMenusCompany");
			      view.renderMenuSetMenusCompany();
			  });
	    },
	    renderMenuSetMenusCompany: function() {
		var view = this;
		fetch_company_menu(ReportData.company._id)
		(function(err,menu){
    		     console.log(menu);
    		     menuModel = menu;

    		     var html = ich.menuSetMenus_TMP({breadCrumb:breadCrumb(ReportData.company.companyName)});
		     $(view.el).html(html);


		     var htmlleft = ich.menuSetMenus_Left_TMP({});

		     //FIXME: put these in the view's events section

		     $('button').button();
		     $("#menusetmenusleft").html(htmlleft);

		     $("#menumodifiersbutton").click(function(){
							 view.renderMenuScreenPartial(0);
							 $("#menusetmenusright").html({}); //FIXME: make this subviews
						     });
		     $("#menumodifiersbutton2").click(function(){
							  view.renderMenuScreenPartial(5);
							  $("#menusetmenusright").html({});
						      });
		     $("#menueditheader1").click(function(){
						     renderEditHeader(1);
						 });
		     $("#menueditheader2").click(function(){
						     renderEditHeader(2);
						 });
		     $("#menueditheader3").click(function(){
						     renderEditHeader(3);
						 });
		     $("#menueditheader4").click(function(){
						     renderEditHeader(4);
						 });


		     view.renderMenuScreenPartial(1);
		     view.renderMenuHeaderPartial();

		     menuModel.on("change:menuButtonHeaders",view.renderMenuHeaderPartial);
		     menuModel.on("change:menuButtons", view.renderMenuScreenPartial);

		     console.log("rendered set menus");

		 });

	    },
	    renderMenuHeaderPartial: function() {
		var view = this;
		var menuModelHeaders = menuModel.get('menuButtonHeaders');

		menuModelHeaders = _.map(menuModelHeaders, function(item) {
					     if(_.isEmpty(item.description1)
			  			&& _.isEmpty(item.description2)
			  			&& _.isEmpty(item.description3)) {
				  		 item.description2="MENU" + item.menu_id;
					     }
					     return item;
					 });


		var htmlbottom = ich.menuSetMenus_Bottom_TMP({menuButtonHeaders:menuModelHeaders});
		$("#menusetmenusbottom").html(htmlbottom);

		_.each(menuModelHeaders, function(item){
		  	   $("#menubuttonheader"+item.menu_id).button()
			       .click(function(){
					  view.renderMenuScreenPartial(item.menu_id);
					  $("#menusetmenusright").html({});
				      });
		       });
	    },
	    renderMenuScreenPartial: function(model,menus,item) {
		if(_.isNumber(model)){
	 	    console.log("screen num : " + model);
	 	    var menuscreentitle;

	 	    if(model===0 || model==5) {
	 		menuscreentitle = "MODIFIERS".concat(model==5?"2":"");
	 	    } else {
	 		var header = menuModel.get_header(model);
	 		menuscreentitle = "".concat(header.description1)
	 	            .concat("\n")
	 	    	    .concat(header.description2)
	 	    	    .concat("\n")
	 	    	    .concat(header.description3);
	 	    }

	 	    var menuScreen = menuModel.menu_screen(model);
		    var htmlcenter = ich.menuSetMenus_Center_TMP(_.extend({menuscreentitle:menuscreentitle},menuScreen));
		    $("#menusetmenuscenter").html(htmlcenter);

		    _.each(menuScreen.menu_screen, function(item){
		 	       _.each(item.row, function(rowitem) {
		 			  var btn = $('#'+rowitem.display.screen+"\\:"+rowitem.display.position)
		 			      .click(function(){
			    				 renderEditMenuItem(rowitem.display.screen, rowitem.display.position);
				   		     });
		 		      });
			   });

		    console.log("menuscreen rendered");
		} else if(!_.isEmpty(item)) {
		    console.log("screen num : " + item.display.screen);

		    var menuscreentitle;
		    if(item.display.screen==0 || item.display.screen==5) {
	 		menuscreentitle = "MODIFIERS".concat(item.display.screen==5?"2":"");
	 	    } else {
	 		var header = menuModel.get_header(item.display.screen);
	 		menuscreentitle = "".concat(header.description1)
	 	            .concat("\n")
	 	    	    .concat(header.description2)
	 	    	    .concat("\n")
	 	    	    .concat(header.description3);
	 	    }

	 	    var menuScreen = menuModel.menu_screen(item.display.screen);
		    var htmlcenter = ich.menuSetMenus_Center_TMP(_.extend({menuscreentitle:menuscreentitle},menuScreen));
		    $("#menusetmenuscenter").html(htmlcenter);

		    _.each(menuScreen.menu_screen, function(item){
		 	       _.each(item.row, function(rowitem) {
		 			  var btn = $('#'+rowitem.display.screen+"\\:"+rowitem.display.position)
		 			      .click(function(){
			    				 //console.log("click event! : "+ this.id);
			    				 renderEditMenuItem(rowitem.display.screen, rowitem.display.position);
				   		     });
		 		      });
			   });

		    console.log("menuscreen rendered");
		}
	    }
	});

/******************************************** helper functions ************************************/

function renderEditPage(num,position) {
    if(_.isNumber(position)) { //fixme: what is this?
	//renderEditMenuItem
	var button = menuModel.get_button(num,position);
	var hexButtonColor = $.fn.colorPicker.toHex('rgb('+ button.display.color + ')');
	var buttonWithHexColor = _.combine(button,{display:{color:hexButtonColor}}); //we do this so that our color picker uses a hex color (it's saved as rgb)

	var htmlright = ich.menuSetMenus_Right_TMP(buttonWithHexColor);
	$("#menusetmenusright").html(htmlright);
	var btn = $("#btnMenuSave")
	    .click(function(){
		       console.log("menuSavebtn event");
		       saveEditMenu();
		   });

	// if modifier menu, disable modifier/read scale button
	// otherwise(menu), disable duplicate button
	if(num===0 || num===5) {
	    var btnHasModifier = $("#has_modifier");
	    var btnUseScale = $("#use_scale");
	    btnHasModifier.attr('disabled',true);
	    btnUseScale.attr('disabled',true);
	} else {
	    var btnDuplicate = $("#duplicate");
	    btnDuplicate.attr('disabled',true);
	}
	$("#displayColor").colorPicker()

    } else {
	//renderEditHeader
	var menu_id=num;
	var header  = menuModel.get_header(menu_id);

	var htmlright = ich.menuSetMenuHeader_TMP(header);
	$("#menusetmenusright").html(htmlright);

	$("#displayColor").colorPicker()

    }
};

function renderEditHeader(numHeader) {
    renderEditPage(numHeader);
};

function renderEditMenuItem(numScreen,position) {
    renderEditPage(numScreen,position);
};

function clearEditMenu() {

};

function closeEditMenu() {
    $("#menusetmenusright").html({});
};

function saveEditMenu() {
    var editDialog = $("#editMenuButton");

    var newButtonItemData = varFormGrabber(editDialog);
    var rgbButtonColor = _.map($.fn.colorPicker.hexToRgb(newButtonItemData.display.color),_.identity).join(',');
    var buttonWithRGBColor = _.combine(newButtonItemData,{display:{color:rgbButtonColor}});

    menuModel.set_button(buttonWithRGBColor);
    menuModel.save({},{
		       success:function(){
			   console.log('menu saved successfully');
		       },
		       error:function(error){
			   console.log(arguments);
			   if (JSON.parse(error.responseText).error === "conflict"){
			       alert('there was an error saving the menu, please refresh the menu screen');
			   }
			   else{
			       alert('there was an error saving the menu');
			   }
		       }
		   });

    console.log("menuModel, saved");
    closeEditMenu();
};

function clearEditHeader() {

}

function closeEditHeader() {
    $("#menusetmenusright").html({});
}

function saveEditHeader() {
    var editDialog = $("#editMenuHeaderButton");

    var newHeaderItemData = varFormGrabber(editDialog);

    console.log("newHeaderItemData");
    console.log(newHeaderItemData);

    menuModel.set_header(newHeaderItemData);
    menuModel.save();
    closeEditMenu();
}
