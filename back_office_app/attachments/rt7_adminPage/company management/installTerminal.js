function installTerminal(companyID,groupID,storeID,terminalID){
    //all of the IDs have to exist for the terminal to be installed. we'll trust that they are correct for now
    if(_.isEmpty(companyID)||_.isEmpty(groupID)||_.isEmpty(storeID)||_.isEmpty(terminalID)){
	alert("could not install the terminal");
	return;
    }
    var company = Companies.getModelById(companyID);
    var group = company.getGroup(groupID);
    var store = company.getStore(groupID,storeID);
    var terminal = company.getTerminal(groupID,storeID,terminalID);
    //last check to make sure we have all of the data we need.
    if(!company || !group || !store || !terminal){
	alert("The terminal could not be installed");
	return;
    }
    function get_terminal_install_properties(company,group,store,terminal,sample_terminal){
	return function(callback){
	    $.couch.session(
		{
		    success:function(user){
			var terminal_data=
			    {
				terminal_id:terminal.terminal_id,
				terminal_label:terminal.terminal_label,
				store_id:store.store_id,
				store_label:store.storeName,
				group_id:group.group_id,
				group_label:group.groupName,
				company_id:company.get('_id'),
				company_label:company.get('companyName'),
				location:_.selectKeys(terminal,["postalCode","areaCode","storeCode","companyCode","cityCode","countryCode","provinceCode"]),
				creationDate:terminal.creationdate,
				receipt_id:terminal.receipt_id,

				printers:sample_terminal.printers,
				departments:sample_terminal.departments,
				menuButtonHeaders:sample_terminal.menuButtonHeaders,
				menuButtons:sample_terminal.menuButtons,
				scales:sample_terminal.scales,
				showMobQRedits:terminal.usingmobqredits,
				locally_modifiable:false, //!terminal.centrallycontrolmenus,
				automatedPayment:terminal.usingautomatedpayment,

				creditPayment:sample_terminal.creditPayment,
				debitPayment:sample_terminal.debitPayment,
				mobilePayment:sample_terminal.mobilePayment,
				paymentGateway:sample_terminal.paymentGateway,

				receiptHeaders:sample_terminal.receiptHeaders,
				cardserver:sample_terminal.cardserver,
				cardserverport:sample_terminal.cardserverport,
				cardterminalid:sample_terminal.cardterminalid,
				connectiontimeout:sample_terminal.connectiontimeout,
				store_address:{
				    country:store.address.country,
				    state_prov:store.address.province,
				    city:store.address.city,
				    zip_postal:store.address.postalcode,
				    street:[store.address.street0,store.address.street1],
				    phones:[store.contact.phone],
				    emails:[store.contact.email]
				},
				store_number:store.number,
				creation_user:user.userCtx.name
			    };
			callback(terminal_data);
		    },
		    error:function(){
			alert("please log in to install terminals");
		    }
		});
	};
    }


    if(terminal.installed){
	alert("The terminal has been installed already");
	return;
    }

    var urlBase = window.location.protocol + "//" + window.location.hostname + ":" +window.location.port + "/";
    var db_menus = "menus_corp";
    var Menu = couchDoc.extend({urlRoot:urlBase + db_menus});
    var terminal_menu = new Menu({_id:companyID});
    terminal_menu.fetch(
	{success:function(model){
	     //use the menu set up by the company for this terminal installation.
	     var sample_terminal_with_menus = _.extend({},sample_terminal,_.selectKeys(model.toJSON(),['menuButtons','menuButtonHeaders']));
	     get_terminal_install_properties(company,group,store,terminal,sample_terminal_with_menus)
	     (installRT7_and_CORP_terminals);
	 },
	 error:function(){
	     //install the terminal with the default sample terminal menu (possibly empty)
	     get_terminal_install_properties(company,group,store,terminal,sample_terminal)
	     (installRT7_and_CORP_terminals);
	 }});

    //FIXME: use async.js waterfall
    function installRT7_and_CORP_terminals(terminal_properties){
	var db_corp = "terminals_corp";
	var db_rt7 = "terminals_rt7";
	var Terminal_rt7 = couchDoc.extend({urlRoot:urlBase + db_rt7});
	var Terminal_corp = couchDoc.extend({urlRoot:urlBase + db_corp});
	var terminalToInstall_rt7 = new Terminal_rt7(terminal_properties);
	var terminalToInstall_corp = new Terminal_corp(terminal_properties);
	terminalToInstall_rt7.save({},
				   {success:function(model,resp){
					terminalToInstall_corp.set({_id:model.id});
					terminalToInstall_corp.save(
					    {},{success:function(){
						    alert("The terminal is now ready to be Installed");
						    terminal.installed = true;
						    company.save();
						}});}});
    }
}