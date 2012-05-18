$(document)
    .ready(function() {
	       //this is for IE7
	       if(_.isUndefined(window.console)){
		   console = {log:function(){/*do nothing*/}};
	       }
if (!window.location.origin){
 window.location.origin = window.location.protocol+"//"+window.location.host;
}
	       doc_setup();
	   });
