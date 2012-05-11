
var importVoucherRouter =
    new (Backbone.Router.extend(
             {routes: {
              "importvouchers":"_setup"
              },
              _setup:function(){
                
                  if(isTerritoryUser(currentSession)) {
                    window.history.go(-1);
                }
                
          console.log("importvouchers");
          var html = ich.importVouchers_TMP({});
          $("#main").html(html);
          
          var dropdownCompany = $("#companiesdown");
         
         _.each(Companies.toJSON(), function(company) {
            dropdownCompany.append('<option value=' + company._id + '>' + company.companyName + '</option>');
            });
          
          var csvData="";
          
          $("#formFileChooser input:file")
          .change(function(event){
            csvData="";
            if(_.isNotEmpty(this.files) && FileReader){ // firefox, chrome, 
                var file = this.files[0];
                
                var reader = new FileReader();
                reader.onload = function(event){
                    //var data = event.target.result.replace(/\n/g,'<br />');
                    csvData = event.target.result;
                    console.log(csvData);
                    $("#csvtextarea").val(csvData);
                    $("#csvtextarea").attr("readonly",true);
                    
                    /*
                    //TODO : this is used for bulkSave area code csv file to locations_rt7
                    console.log("temparate data process for area code");
                    var linedCSV = csvData.split("\n");
                    var mappedCSV = _.map(linedCSV, function(item){
                        var linedItem = item.split(",");
                        if(linedItem[3].indexOf("\"")>=0) {
                            var citiesWithoutQ = linedItem[3].replace(/"/g,"");
                            var listCity = citiesWithoutQ.split(",");
                            return _.map(listCity,function(city){
                                return {
                                    country_code:(linedItem[1].toString()).trim(),
                                    province_code:(linedItem[2].toString()).trim(),
                                    city_code:(city).trim(),
                                    area_code:(linedItem[0].toString()).trim()
                                    };
                            });
                        } else {
                            return {
                                country_code:(linedItem[1].toString()).trim(),
                                province_code:(linedItem[2].toString()).trim(),
                                city_code:(linedItem[3]).trim(),
                                area_code:(linedItem[0].toString()).trim()
                                };
                        }                    
                    });
                    var processedData = _.flatten(mappedCSV);
                    console.log(processedData);
                    console.log("json stringify data...");
                    console.log(JSON.stringify(processedData));
                    var db_locations = cdb.db("locations2_rt7");
                    db_locations.bulkSave({docs : processedData}, {
                            success:function(){
                                console.log("yay");
                            },
                            error:function() {
                            }
                    });
                    */
                };
                reader.onerror = function(err){
                    var errMsg = err.getMessage();
                    console.log(errMsg);
                    $("#csvtextarea").attr("readonly",false);
                };
                reader.readAsText(file); 
            } else if(ActiveXObject) { // TODO : IE
                try {
                    var files = event.target.files;
                    console.log(files); // this is undefined
                    
                    var fullpath = document.getElementById('selectedFile').value;
                    console.log(fullpath);
                    
                    //TODO : needs for web security settings to be changed.
                    var fso = new ActiveXObject("Scripting.FileSystemObject");
                    var file = fso.OpenTextFile(fullpath, 1);
                    csvData = file.ReadAll();
                    file.Close();
                    
                    console.log(csvData);
                    $("#csvtextarea").val(csvData);
                    $("#csvtextarea").attr("readonly",true);
                } catch (e) {
                    console.log(e);
                    alert("Sorry, error occured because of security problem.\n"
                            + "In order to use this feature, \n"
                            + "you need to change security options.\n"
                            + "\n"
                            + "Tools -> Internet Option -> Security -> Custom Level \n"
                            + "Enable the following settings: \n"
                            + "Run ActiveX controls and plug-ins \n"
                            + "Initialize and script ActiveX control not marked as safe \n"
                            + "\n" 
                            + "Otherwise, you can simply copy and paste the csv text file to text area"
                    );
                    $("#csvtextarea").attr("readonly",false);
                }
            } else {
                alert("Sorry, The File APIs are not fully supported in this browser.\n"
                        + "you can simply copy and paste the csv text file to text area"
                );
                $("#csvtextarea").attr("readonly",false);
            }  
          });
          
          $("#importButton").button()
            .click(function(){
               if(_.isEmpty(csvData)) {
                   alert("No CSV file!");
               } else {
                   //alert(csvData);
                   var company_id = $("#companiesdown :selected").val();
                   try {
                       var csvArray = toCSVarray(csvData,','); // [["12-25","10.00","Tom","30-Jul-12"],[...]]
                       var newVoucherDocList = _.map(csvArray,function(itemArray){
                           function convertDateObjfromString(strDate) {
                               // strData format "01-Jul-12"
                               var MONTH = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
                               var arrayDate = strDate.split("-");
                               return _.isEmpty(strDate)?null:new Date(Number("20".concat(arrayDate[2])), _.indexOf(MONTH,arrayDate[1].toUpperCase()), Number(arrayDate[0]));
                           };
                           var voucher_id = itemArray[0];
                           var voucher_amount = itemArray[1];
                           var voucher_name = itemArray[2];
                           var voucher_expiry_date = convertDateObjfromString(itemArray[3]).toJSON();
                           var voucher_expiry_amount = itemArray[4];
                           var voucher_type = itemArray[5];
                           var creationdate = (new Date()).toJSON();
                           return _.extend({},{_id:company_id.concat("-").concat(voucher_id),
                                                voucher_id:voucher_id,
                                                voucher_amount:voucher_amount,
                                                voucher_balance:voucher_amount,
                                                voucher_name:voucher_name,
                                                voucher_expiry_date:voucher_expiry_date,
                                                voucher_expiry_amount:voucher_expiry_amount,
                                                voucher_type:voucher_type,
                                                creationdate:creationdate,
                                                company_id:company_id
                                                });
                       });
                   } catch(e) {
                       alert("Invalid CSV file format, please check csv file again.");
                       var err = true;
                   }
                   
                   if(!err) {
                       console.log("go");
                       //console.log(newVoucherDocList);
                       var db_voucher = cdb.db("vouchers_rt7");
                       
                       voucherFetcher_f(company_id)
                       (function(err,resp){
                           var voucherDocIdList = _.pluck(resp.rows, "value");
                           console.log(voucherDocIdList);
                           
                           var tobeUpdatedVouchers = _(newVoucherDocList).reject(function(item){
                               return _(voucherDocIdList).contains(item._id);
                           });
                           console.log(tobeUpdatedVouchers);
                           
                           db_voucher.bulkSave(
                               {
                                   docs : tobeUpdatedVouchers,
                                   all_or_nothing:true                               
                               },
                               {
                                   success:function() {
                                       alert("Import Success!");
                                       $("#selectedFile").val("");
                                       $("#csvtextarea").val("");
                                   },
                                   error:function() {
                                       alert("Error Occured!");
                                   }
                               }
                           );
                       });
                   }
               }
            });
          
          //this.view = new importVoucherView();
          
              }}));

/*
var importVoucherView = Backbone.View.extend(
    {initialize:function(){
     var view = this;
     function IE7_fix(){
             //this is for IE7
             if(_.isUndefined(window.console)){
               console = {log:function(){}};
             }
         }
         function renderCurrentTime(){
             var now = new Date();
             var dateString = now.toDateString() + " / " + now.toLocaleTimeString();
             $("#timespace").html(dateString);
         }
         function updateTimeEverySecond(){
             $(document).everyTime("1s",renderCurrentTime, 0);
         }
         function onPressEnter(fn){
             $(document).off('keyup');
             $(document).keyup(
         function(event){
             if(event.keyCode == 13){
             fn();
             }
         });
         }
         function setupLoginButton(fn){
             $("#btnLogin").off('click');
             $("#btnLogin").click(fn);
         }
         function enableLoginButton(){
             setupLoginButton(_.once(login));
         }
         function enableLoginViaEnter(){
             onPressEnter(_.once(login));
         }
         function enableLogin(){
             enableLoginViaEnter();
             enableLoginButton();
         }
         function disableLogin(){
             disableLoginViaEnter();
             disableLoginButton();
         }
         function login() {
             var id = $('#userID').val();
             var pw = $('#password').val();
             //try to login to couchdb
             $.couch.login({name:id,password:pw,
                success:function(response){
                console.log("successful user login");
                console.log(response);
                if(_.contains(response.roles,"rt7")) {
                    window.location.href = "#mainMenus";    
                } else if(_.contains(response.roles,"territory")) {
                    alert("you are territory guy");
                }
                
                },
                error:function(response){
                console.log("error logging in");
                alert("logging in failed, please enter a correct admin user-name and password");
                enableLogin();
                }
               });
         };
         IE7_fix();
         updateTimeEverySecond();
         enableLogin();
         $("#userID").focus();
     }
    });
*/