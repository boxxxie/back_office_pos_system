
function inputDaysHoursInfoDialog(options) {
    var d = $("#dialog-hook");
    d.html(options.html);

    var dialogOptions = _.extend(
    {autoOpen: false,
     height: 390,
     width: 350,
     modal: true,
     buttons: {
             "Submit": function() {
         var f = d.find("form");
         var dayhourInfo = varFormGrabber(f);
         options.success(dayhourInfo);
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

function showUploadImageDialog(options) {
    var d = $("#dialog-form");
    var campaignDoc = options.campaignDoc;
    
    d.html(options.html);

    var dialogOptions = _.extend(
    {autoOpen: false,
     height: 390,
     width: 350,
     modal: true,
     buttons: {
             "Submit": function() {
                 var data = {};

                $.each($("form :input", d).serializeArray(), function(i, field) {
                    data[field.name] = field.value;
                }); 
                $("form :file", d).each(function() {
                    data[this.name] = this.value; // file inputs need special handling
                });

                var form = $("#upload_image");
                var db_campaigns = cdb.db("campaigns");
                var docID = campaignDoc._id;
                var dbName = "campaigns";
                
                if(_.isEmpty(data._attachments)){
                    alert("no file selected");
                    return undefined;
                }
                
                form.ajaxSubmit({
                  url: db_campaigns.uri + $.couch.encodeDocId(docID),
                  success: function(resp) {
                    console.log(JSON.parse(resp));
                    options.success(_.extend({file:data._attachments},{response:JSON.parse(resp)}));
                    d.dialog("close");
                  },
                  error:function(){
                      //console.log(arguments);
                      alert("Error : " + arguments[2] + "\n" + "Close the dialog and Please, try again");
                  }
                });
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
