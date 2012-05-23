var genericErrorClass = "ui-state-error";
var genericHighlightClass = "ui-state-highlight";
function PostValidator($node,tips,validationResults) {
    function clearErrorsAndTips(){
	tips.html("");
    }
    function tagFieldName($node,fieldName){
	function tagField($field){$field.addClass(genericErrorClass);}
	function tagID($node,field_id){tagField($node.find("#"+field_id));}
	return function(item){
	    tagID($node,item[fieldName]);
	};
    }
    var tag_fieldname_field = tagFieldName($node,'fieldname');
    function displayTip(tips,message){
	$(tips).html(message);
	$(tips).addClass(genericHighlightClass);
	setTimeout(function() {$(tips).removeClass(genericHighlightClass, 1500 );}, 500 );
    };

    clearErrorsAndTips();
    var invalidsWithEmptyMessages = _.filter(validationResults, function(validationResult){return validationResult.isInvalid && _.isEmpty(validationResult.errMsg);});
    var foundInvalidFieldWithMessage = _.filter(validationResults, function(validationResult){return validationResult.isInvalid && !_.isEmpty(validationResult.errMsg);});
    if(!_.isEmpty(foundInvalidFieldWithMessage) &&
       _.isEmpty(invalidsWithEmptyMessages)){
	var tipMessage = ich.tips_TMP({tips: _.map(foundInvalidFieldWithMessage,function(invalid){return invalid.errMsg;})});
	_.each(foundInvalidFieldWithMessage,tag_fieldname_field);
	displayTip(tips,tipMessage);
    }
    else {
	_.each(invalidsWithEmptyMessages,tag_fieldname_field);
	displayTip(tips,"The highlighted fields are required!");
    }
};

function CompanyCreateDialog (attachTo,options){
    _.extend(options,{clearOnExit:true, isCreate:true});
    CompanyInputDialog(attachTo,options);
};
function CompanyModifyDialog (attachTo,options){
    CompanyInputDialog(attachTo,options);
};
function GroupCreateDialog (attachTo,options){
    _.extend(options,{clearOnExit:true, isCreate:true});
    GroupInputDialog(attachTo,options);
};
function GroupModifyDialog (attachTo,options){
    GroupInputDialog(attachTo,options);
};
function StoreCreateDialog (attachTo,options){
    _.extend(options,{clearOnExit:true, isCreate:true});
    StoreInputDialog(attachTo,options);
};
function StoreModifyDialog (attachTo,options){
    StoreInputDialog(attachTo,options);
};
function TerminalCreateDialog (attachTo,options){
    _.extend(options,{clearOnExit:true, isCreate:true});
    TerminalInputDialog(attachTo,options);
};
function TerminalModifyDialog (attachTo,options){
    TerminalInputDialog(attachTo,options);
};
function CompanyInputDialog (attachTo,options) {
    // a workaround for a flaw in the demo system (http://dev.jqueryui.com/ticket/4375), ignore!
    $("#dialog:ui-dialog").dialog( "destroy" );
    var tips = $(".validateTips");
    var d = $("#dialog-form");

    var user = d.find("#user"),
    password = d.find("#password"),
    companyName = d.find("#company-name"),
    firstname = d.find("#contact\\.firstname"),
    lastname = d.find("#contact\\.lastname"),
    website = d.find("#contact\\.website"),
    email = d.find("#contact\\.email"),
    phone = d.find("#contact\\.phone"),
    street0 = d.find("#address\\.street0"),
    street1 = d.find("#address\\.street1"),
    street2 = d.find("#address\\.street2"),
    city = d.find("#address\\.city"),
    province = d.find("#address\\.province"),
    country = d.find("#address\\.country"),
    postalcode = d.find("#address\\.postalcode"),
    operationalname = d.find("#operationalname"),


    allFields = $([])
    	.add(user)
	.add(companyName)
	.add(firstname)
	.add(lastname)
	.add(website)
	.add(email)
	.add(phone)
	.add(street0)
	.add(street1)
	.add(street2)
	.add(city)
	.add(province)
	.add(country)
	.add(postalcode)
	.add(operationalname)
	.add(password);

    d.dialog(
	{
	    autoOpen: false,
	    height: 900,
	    width: 500,
	    modal: true,
	    close: function() {
		if(options.clearOnExit) {
		    allFields.val("").removeClass(genericErrorClass);
		}
	    },
	    buttons: {
		"Submit" : function() {
		    $.couch.session({
					success:function(sessionData) {
					    var newCompanyData =
						{user:user.val(),
						 password:password.val(),
						 contact:{firstname : firstname.val(),
							  lastname : lastname.val(),
							  website : website.val(),
							  email : email.val(),
							  phone : phone.val()},
						 address:{street0:street0.val(),
							  street1:street1.val(),
							  street2:street2.val(),
							  city:city.val(),
							  country:country.val(),
							  province:province.val(),
							  postalcode:postalcode.val()},
						 operationalname:operationalname.val(),
						 companyName:companyName.val()};

					    var newCompanyData_w_options = _.clone(newCompanyData);

					    if(options.isCreate) {
						_.extend(newCompanyData, {creationdate:new Date(),creation_user:sessionData.userCtx.name});
						_.extend(newCompanyData_w_options, {isCreate:options.isCreate});
					    }

					    var validationResults = options.validator(newCompanyData_w_options);

					    var passedValidation;
					    (_.isEmpty(validationResults))?passedValidation=true:passedValidation=false;
					    allFields.removeClass(genericErrorClass);

					    if (passedValidation) {
						options.success(newCompanyData);
						allFields.val("");
						d.dialog("close");
					    }
					    else{
						PostValidator(d,tips,validationResults);
					    }
					},
					error:function() {
					    alert("Error occured while creating Company!");
					}
				    });
		},
		Cancel: function() {
		    d.dialog("close");
		}
	    }
	});


    $("#"+attachTo).button().click(function() {
				       d.dialog("open");
				   });
};
function GroupInputDialog (attachTo,options) {
    // a workaround for a flaw in the demo system (http://dev.jqueryui.com/ticket/4375), ignore!
    $("#dialog:ui-dialog").dialog("destroy");
    var d = $("#dialog-form");
    var tips = $(".validateTips");
    var groupName = d.find("#group-name"),
    user = d.find("#user"),
    password = d.find("#password"),
    firstname = d.find("#contact\\.firstname"),
    lastname = d.find("#contact\\.lastname"),
    website = d.find("#contact\\.website"),
    email = d.find("#contact\\.email"),
    phone = d.find("#contact\\.phone"),
    street0 = d.find("#address\\.street0"),
    street1 = d.find("#address\\.street1"),
    street2 = d.find("#address\\.street2"),
    city = d.find("#address\\.city"),
    province = d.find("#address\\.province"),
    country = d.find("#address\\.country"),
    postalcode = d.find("#address\\.postalcode"),


    allFields = $([])
	.add(groupName)
   	.add(user)
	.add(firstname)
	.add(lastname)
	.add(website)
	.add(email)
	.add(phone)
	.add(street0)
	.add(street1)
	.add(street2)
	.add(city)
	.add(province)
	.add(country)
	.add(postalcode)
	.add(password);

    var dialogOptions = _.extend(
	{autoOpen: false,
	 height: 900,
	 width: 500,
	 modal: true,
	 close: function() {
	     if(options.clearOnExit) {
		 allFields.val("").removeClass( "ui-state-error" );
	     }
	 },
	 buttons: {
	     "Submit": function() {
		 var newGroupData =
		     {user:user.val(),
		      password:password.val(),
		      contact:{firstname : firstname.val(),
			       lastname : lastname.val(),
			       website : website.val(),
			       email : email.val(),
			       phone : phone.val()},
		      address:{street0:street0.val(),
			       street1:street1.val(),
			       street2:street2.val(),
			       city:city.val(),
			       country:country.val(),
			       province:province.val(),
			       postalcode:postalcode.val()},
		      groupName:groupName.val()};
		 var newGroupData_w_options = _.clone(newGroupData);

		 if(options.isCreate) {
		     _.extend(newGroupData, {creationdate:new Date()});
		     _.extend(newGroupData_w_options, {isCreate:options.isCreate});
		 }
		 var validationResults = options.validator(newGroupData_w_options);

		 var passedValidation;
		 (_.isEmpty(validationResults))?passedValidation=true:passedValidation=false;
		 allFields.removeClass(genericErrorClass);

		 if(passedValidation) {
		     options.success(newGroupData);
		     allFields.val("");
		     d.dialog("close");
		 }
		 else{
		     PostValidator(d,tips,validationResults);
		 }
	     },
	     Cancel: function() {
		 d.dialog("close");
	     }
	 }
	},_.clone(options));

    d.dialog(dialogOptions);
    $("#"+attachTo).button().click(function() {
				       d.dialog( "open" );
				   });
};
function StoreInputDialog (attachTo,options) {
    // a workaround for a flaw in the demo system (http://dev.jqueryui.com/ticket/4375), ignore!
    $("#dialog:ui-dialog").dialog( "destroy" );
    var d = $("#dialog-form");
    var tips = $(".validateTips");

    var user = d.find("#user"),
    password = d.find("#password"),
    storeName = d.find("#store-name"),
    storeNum = d.find("#store-num"),
    firstname = d.find("#contact\\.firstname"),
    lastname = d.find("#contact\\.lastname"),
    website = d.find("#contact\\.website"),
    email = d.find("#contact\\.email"),
    phone = d.find("#contact\\.phone"),
    street0 = d.find("#address\\.street0"),
    street1 = d.find("#address\\.street1"),
    street2 = d.find("#address\\.street2"),
    city = d.find("#address\\.city"),
    province = d.find("#address\\.province"),
    country = d.find("#address\\.country"),
    postalcode = d.find("#address\\.postalcode"),
    chase_merchant_number = d.find("#chase_merchant_number"),
    chase_merchant_id = d.find("#chase_merchant_id"),
    chase_client_id = d.find("#chase_client_id"),
    chase_sic_code = d.find("#chase_sic_code"),
    chase_user_name = d.find("#chase_user_name"),
    chase_user_password = d.find("#chase_user_password"),
    tax_1_number = d.find("#tax_1_number"),
    tax_1_rate = d.find("#tax_1_rate"),
    tax_2_number = d.find("#tax_2_number"),
    tax_2_rate = d.find("#tax_2_rate"),
    tax_3_number = d.find("#tax_3_number"),
    tax_3_rate = d.find("#tax_3_rate"),


    allFields = $([])
	.add(user)
	.add(storeName)
	.add(storeNum)
	.add(firstname)
	.add(lastname)
	.add(website)
	.add(email)
	.add(phone)
	.add(street0)
	.add(street1)
	.add(street2)
 	.add(city)
	.add(province)
	.add(country)
	.add(postalcode)
	.add(password)
        .add(chase_merchant_number)
	.add(chase_merchant_id)
	.add(chase_client_id)
	.add(chase_sic_code)
	.add(chase_user_name)
	.add(chase_user_password)
	.add(tax_1_rate)
	.add(tax_1_number)
	.add(tax_2_rate)
	.add(tax_2_number)
	.add(tax_3_rate)
	.add(tax_3_number);

    d.dialog(
	{
	    autoOpen: false,
	    height: 900,
	    width: 500,
	    modal: true,
	    buttons: {
		"Submit": function() {

		    var newStoreData =
			{user:user.val(),
			 password:password.val(),
			 contact:{firstname : firstname.val(),
				  lastname : lastname.val(),
				  website : website.val(),
				  email : email.val(),
				  phone : phone.val()},
			 address:{street0:street0.val(),
				  street1:street1.val(),
				  street2:street2.val(),
				  city:city.val(),
				  country:country.val(),
				  province:province.val(),
				  postalcode:postalcode.val()},
			 storeName:storeName.val(),
			 number:storeNum.val(),
			 storeNumber:storeNum.val(),
			 chase_merchant_number:chase_merchant_number.val(),
			 chase_merchant_id:chase_merchant_id.val(),
			 chase_client_id:chase_client_id.val(),
			 chase_sic_code:chase_sic_code.val(),
			 chase_user_name:chase_user_name.val(),
			 chase_user_password:chase_user_password.val(),
			 tax_1_number:tax_1_number.val(),
			 tax_1_rate:tax_1_rate.val(),
			 tax_2_number:tax_2_number.val(),
			 tax_2_rate:tax_2_rate.val(),
			 tax_3_number:tax_3_number.val(),
			 tax_3_rate:tax_3_rate.val()
			};

		    var newStoreData_w_options = _.clone(newStoreData);

		    if(options.isCreate) {
			_.extend(newStoreData, {creationdate:new Date()});
			_.extend(newStoreData_w_options, {isCreate:options.isCreate});
		    }

		    var validationResults = options.validator(newStoreData_w_options);

		    var passedValidation;
		    (_.isEmpty(validationResults))?passedValidation=true:passedValidation=false;
		    allFields.removeClass(genericErrorClass);

		    if(passedValidation) {
			options.success(newStoreData);
			allFields.val("");
			d.dialog("close");
		    }
		    else{
			PostValidator(d,tips,validationResults);
		    }
		},
		Cancel: function() {
		    d.dialog("close");
		}
	    },
	    close: function() {
		if(options.clearOnExit) {
		    allFields.val("").removeClass(genericErrorClass);
		}
	    }
	});

    $("#"+attachTo).button().click(function() {
				       d.dialog("open");
				   });
};

//TODO : edit / add terminal dialog tmp is different (it has dropdown box)
function TerminalInputDialog (attachTo,options) {
    // a workaround for a flaw in the demo system (http://dev.jqueryui.com/ticket/4375), ignore!
    $( "#dialog:ui-dialog" ).dialog( "destroy" );
    var d = $("#dialog-form");
    var label = d.find("#terminal-id"),
    areaCode = d.find("#areaCode"),
    postalCode = d.find("#postalCode"),
    countryCode = d.find("#countryCode"),
    provinceCode = d.find("#provinceCode"),
    cityCode = d.find("#cityCode"),
    storeCode = d.find("#storeCode"),
    companyCode = d.find("#companyCode"),
    centrallycontrolmenus = d.find("#centrallycontrolmenus"),
    usingautomatedpayment = d.find("#usingautomatedpayment"),
    usingmobqredits = d.find("#usingmobqredits"),
    chase_serial_number = d.find("#chase_serial_number"),
    chase_terminal_id = d.find("#chase_terminal_id"),

    allFields = $([])
	.add(label)
	.add(areaCode)
	.add(postalCode)
	.add(countryCode)
	.add(provinceCode)
	.add(cityCode)
	.add(storeCode)
	.add(companyCode)
	.add(centrallycontrolmenus)
	.add(usingautomatedpayment)
	.add(usingmobqredits)
	.add(chase_serial_number)
	.add(chase_terminal_id);

    companyCode.attr('disabled',true);
    storeCode.attr('disabled',true);

    var tips = $(".validateTips");

    d.dialog(
	{autoOpen: false,
	 height: 600,
	 width: 500,
	 modal: true,
	 close: function() {
             if(options.clearOnExit) {
		 allFields.val("").removeClass(genericErrorClass);
		 allFields.filter("input:checked").attr("checked",false);
             }
	 },
	 buttons: {
             "Submit": function() {
		 var newTerminalData = {
		     terminal_label:label.val(),
		     areaCode:areaCode.val(),
		     postalCode:postalCode.val(),
		     countryCode:countryCode.val(),
		     provinceCode:provinceCode.val(),
		     cityCode:cityCode.val(),
		     storeCode:storeCode.val(),
		     companyCode:companyCode.val(),
		     usingautomatedpayment:usingautomatedpayment.is(":checked"),
		     usingmobqredits:usingmobqredits.is(":checked"),
		     centrallycontrolmenus:centrallycontrolmenus.is(":checked"),
		     usingautomatedpayment:usingautomatedpayment.is(":checked"),
		     chase_serial_number:chase_serial_number.val(),
		     chase_terminal_id:chase_terminal_id.val()
		 };

		 var newTerminalData_w_options = _.clone(newTerminalData);
		 if(options.isCreate) {
		     _.extend(newTerminalData, {creationdate:new Date(), installed:false});
		     _.extend(newTerminalData_w_options, {isCreate:options.isCreate});
		 }


		 var validationResults = options.validator(newTerminalData_w_options);

		 var passedValidation;
		 (_.isEmpty(validationResults))?passedValidation=true:passedValidation=false;
		 allFields.removeClass(genericErrorClass);

		 if(passedValidation) {
		     options.success(newTerminalData);
		     allFields.val("");
		     d.dialog("close");
		 }
		 else{
		     PostValidator(d,tips,validationResults);
		 }
             },
             Cancel: function() {
		 d.dialog("close");
             }
	 }
	});


    $("#"+attachTo).button().click(function() {
				       if(!options.isCreate) {
					   var unmodifiedTerminal = options.getUnmodifiedTerminal();
					   console.log(unmodifiedTerminal);
				       }
				       CompanyManagementRouter.view._reset(d, unmodifiedTerminal);
				       d.dialog("open");
				   });
};

function quickViewDialog (html,options) {
    var d = $("#dialog-quickView");
    d.html(html);
    d.find('input').attr('disabled',true);
    var dialogOptions = _.extend(
	{autoOpen: false,
	 height: 400,
	 width: 500,
	 modal: true,
	 buttons: {
	     Cancel: function() {
		 d.dialog('destroy');
	     }
	 },
	 close: function() {
	     d.dialog('destroy');
	 }
	},_.clone(options));
    d.dialog(dialogOptions);
    d.dialog("open");
};

/************************************************* rewards program dialog *************************************/
function companyModifyRewardsViewDialog (html,options) {
    //var stores = options.stores;
    var form = $(html).filter('#dialog-form-forRewards');
    var d = $("#dialog-hook-forRewards");
    d.html(form);

    var MobQredits = options.MobQredits;
    var rewardsdown = $("#rewardsdown");
    var optlist = $('option', rewardsdown);

    if(MobQredits.use_mobqredits) {
	optlist[1].selected=true;
    } else if(MobQredits.use_qriket) {
	optlist[2].selected=true;
    } else {
	optlist[0].selected=true;
    }


    var dialogOptions = _.extend(
	{autoOpen: false,
	 height: 450,
	 width: 424,
	 modal: true,
	 buttons: {
	     "Apply" : function() {
	     	 var mobqreditsconversion = form.find("#mobqredits_conversion").val();
	     	 var qriketconversion = form.find("#qriket_conversion").val();
	     	 var qriketpercentage = form.find("#qriket_percentage").val();

	     	 if(_.isEmpty(mobqreditsconversion)){
	     	     mobqreditsconversion = "0";
	     	 }

	     	 if(_.isEmpty(qriketconversion)){
	     	     qriketconversion = "0";
	     	 }

	     	 if(_.isEmpty(qriketpercentage)) {
	     	     qriketpercentage = "0";
	     	 }

		 options.saveRewardsProgram(Number(mobqreditsconversion), Number(qriketconversion), Number(qriketpercentage));
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