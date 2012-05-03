/********************************* menu Administration *****************************************/
function quickInputUserInfoDialog(options) {
    var d = $("#dialog-quickView");
    d.html(options.html);

    var dialogOptions = _.extend(
	{autoOpen: false,
	 height: 540,
	 width: 380,
	 modal: true,
	 buttons: {
             "Submit": function() {
		 var f = d.find("#form");
		 var userInfo = varFormGrabber(f);
		 options.on_submit(userInfo);
		 d.dialog('close');
             },
             "Close": function() {
		 d.dialog('close');
             }
	 },
	 title:options.title
	},
	_.clone(options));

    d.dialog(dialogOptions);
    d.dialog("open");
};
