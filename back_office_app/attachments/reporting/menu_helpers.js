//FIXME: the callback should use a backbone model, instead of data.
function fetch_company_menu(companyID){
    var terminal_menu = new Menu({_id:companyID});
    return function(callback){
	terminal_menu.fetch(
	    {success:function(model){
		 //return use the menu set up by the company.		     
		 callback(false, model);
	     },
	     error:function(){
		 //return an empty menu
		 terminal_menu.set_empty_menu();
		 callback(true, terminal_menu);
	     }});
    };
};