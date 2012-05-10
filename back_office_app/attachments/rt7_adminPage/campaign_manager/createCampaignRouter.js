var testData = {
    _id: "AllCanadaAllTerminal",
    _rev: "3-ed84300839289e02a0084409f1f6df06",
    name: "AllCanadaAllTerminal",
    time: {
	end: "2011-12-31T00:00:00.000-05:00",
	start: "2011-10-07T00:00:00.000-04:00"
    },
    description: "test description",
    advertiser: "test advertiser",
    salesperson: "test sales person",
    presentation_type: "captive",
    all_times: false,
    all_days: false,
    locations : [
	{country: 'Canada'} 
    ],
    days_and_hours: [
	{
            time: {
		end: "2011-10-07T17:02:00.000-04:00",
		start: "2011-10-07T16:10:00.000-04:00"
            },
            day: "FRI"
	},
	{
            time: {
		end: "2011-10-07T17:02:00.000-04:00",
		start: "2011-10-07T16:10:00.000-04:00"
            },
            day: "THU"
	},
	{
            time: {
		end: "2011-10-07T13:03:00.000-04:00",
		start: "2011-10-07T16:10:00.000-04:00"
            },
            day: "THU"
	}
    ],
    for_terminals_created_before: new Date(),

    images: [
	{
            file: "C:\\Users\\4\\Documents\\01\\CANADA.jpg"
	},
	{
            file: "C:\\Users\\4\\Documents\\02\\CANADA.jpg"
	}
    ],
    _attachments: {
	"C:\\Users\\4\\Documents\\02\\CANADA.jpg": {
            content_type: "image/jpeg",
            revpos: 3,
            digest: "md5-MesMX0p/a4Qa8Ltv7Dya7Q==",
            length: 105361,
            stub: true
	},
	"C:\\Users\\4\\Documents\\01\\CANADA.jpg": {
            content_type: "image/jpeg",
            revpos: 2,
            digest: "md5-UiP6U6RJISdaRc4N5Sfh1Q==",
            length: 125957,
            stub: true
	}
    }
};


var days_and_hours_table_view =
    Backbone.View.extend({
        render:function(list){
        var view = this;
        var for_TMP = _(list).chain()
                        .clone()
                        .map(function(item){
                            return {
                                _id:_.indexOf(list,item),
                                day:item.day,
                                startTime: (new Date(item.time.start)).toLocaleTimeString(),
                                endTime:(new Date(item.time.end)).toLocaleTimeString()
                            };
                        })
                        .value();
        template = view.options.template;
        el = view.$el;
        html = ich[template]({list:for_TMP});
        el.html(html);
        _.each(for_TMP,function(item){
            $("#del-"+item._id).button();
        });
        }
    });

var days_and_hours_dialog_view =
    Backbone.View.extend({
        events:{
            'click .checkAlldays':'processChkDays',
            'click .checkAlltimes':'processChkTimes'
        },
        initializeTimePicker:function(){
            var view = this;
            var el = view.$el;
            $(el).find(".startTime").first()
               .timepicker({
                   timeOnly: true,
                   showButtonPanel: false
               });
             $(el).find(".endTime").first()
               .timepicker({
                   timeOnly: true,
                   showButtonPanel: false
               });
             
             //$(el).find(".checkAlldays").click(); //TODO : event triggered first, and checked
             var times = $(el).find('.startTime, .endTime');
             times.filter('.startTime').val('00:00');
             times.filter('.endTime').val('23:59');
        },
        processChkDays:function(event){
            var view = this;
            var el = view.$el;
            var chk = $(event.currentTarget);
            $(el).find(".checkDay")
                   .each(function(){
                       $(this).attr('disabled',$(chk).prop('checked'));
                   });
        },
        processChkTimes:function(event){
            var view = this;
            var el = view.$el;
            var chk = $(event.currentTarget);
            
            if($(chk).prop('checked')){
                var times = $(el).find('.startTime, .endTime');
                times.filter('.startTime').val('00:00');
                times.filter('.endTime').val('23:59');
            }
            $(el).find('.startTime, .endTime')
              .each(function(){
                    $(this).attr('disabled',$(chk).prop('checked'));
                }); 
        }
    });
    
var days_and_hours_view =
    Backbone.View.extend({
        initialize:function() {
            var view = this;
            view.day_time_table = new days_and_hours_table_view({template:'daySelectionTable_TMP'});
            view.list_days_hours = [];
        },
        events:{
        'click #btnAdd':'show_dialog',
        'click #chkalldaysandhours' : 'check_all_days_hours',
        'click .del' : 'delete_days_hours'
        },
        setup:function() {
            var view = this;
            view.list_days_hours = [];
            view.$el.find('input:button').button();
            view.day_time_table.setElement('#days_and_hours_table');
            view.day_time_table.render(view.list_days_hours);
        },
        show_dialog:function(){
            var view = this;
            var html = ich.daySelectionDialog_TMP({});
            var options = {html:html, title:"input day/hour"};
            inputDaysHoursInfoDialog(_.extend(options,view.addDays_Hours()));
            this.trigger("initialize_timepicker_in_dialog");
        },
        check_all_days_hours:function(event) {
            var view = this;
            var chk24_7 = $("#"+event.currentTarget.id);
            if(chk24_7.is(":checked")) {
                view.delete_all_list();
                $("#days_and_hours_table").hide();
                $("#btnAdd").attr("disabled",true);
            } else {
                $("#days_and_hours_table").show();
                $("#btnAdd").attr("disabled",false);
            }
        },
        addDays_Hours:function() {
            var view = this;
            function transformListData(formData){
                function getDateObjectFromTimeString(timeString){
                    var strTimeList = (timeString.trim()).split(":");
                    var currentDate = new Date();
                    return new Date(currentDate.getFullYear(), 
                                    currentDate.getMonth(), 
                                    currentDate.getDate(),
                                    Number(strTimeList[0]),
                                    Number(strTimeList[1]),
                                    0); 
                };
                var keys = _.keys(formData.days); //MON ~ SUN
                if(formData.all_days==true) {
                    _.each(keys,function(key){
                        formData.days[key] = true;
                    });
                }
                var startTimeJSON = getDateObjectFromTimeString(formData.time.start).toJSON();
                var endTime = getDateObjectFromTimeString(formData.time.end);
                endTime.setSeconds(59);
                var endTimeJSON = endTime.toJSON();
                return _(keys).chain()
                        .map(function(key){
                            if(formData.days[key]) {
                                return {
                                    day:key,
                                    time:{
                                        start:startTimeJSON,
                                        end:endTimeJSON
                                    }
                                };
                            } else {
                                return undefined;
                            }
                        })
                        .compact()
                        .value();
            };
            return {
                success:function(formData){
                    console.log(formData);
                    var convertedList = transformListData(formData);
                    console.log(convertedList);
                    view.list_days_hours = view.list_days_hours.concat(convertedList);
                    view.day_time_table.render(view.list_days_hours);
                },
                error:function() {
                    
                }
            };
        },
        delete_days_hours:function(event) {
            //alert("del clicked. id:" + event.currentTarget.id);
            var view = this;
            var indexId = (event.currentTarget.id).replace("del-","");
            view.list_days_hours = _.reject(view.list_days_hours,function(item){
                return item == view.list_days_hours[Number(indexId)];
            });
            view.day_time_table.render(view.list_days_hours);
        },
        delete_all_list:function() {
            var view = this;
            view.list_days_hours = [];
            view.day_time_table.render(view.list_days_hours);
        }
    });

var locations_view =
    Backbone.View.extend({
        initialize:function(){
            var view = this;
            view.selected_locations = [];
        },
        events:{
        'click a':'processSelectedLocactions'
        },
        renderTree:function(tree){
            var view = this;
            var el = view.$el;
            var template = view.options.template;
            var html = ich[template]({country:tree});
            $(el).html(html);
            $(el).jstree({
                "ui" :{
                    "select_multiple_modifier":"ctrl",
                    "select_range_modifier" : false
                }
            });
        },
        get_name_loc_pair:function(anchor){
            var current_li = $(anchor).parent();
            var location_type = current_li.attr("location_type");
            var name = current_li.attr("name");
            return {name:name,location_type:location_type};
        },
        get_name_loc_origins:function(anchor){
            var location_objets = [{country:"default"},{province:"default"},{city:"default"},{areaCode:"defalut"},{postalCode:"default"}];
            var current_li = $(anchor).parent();
            var location_type = current_li.attr("location_type");
            var name = current_li.attr("name");
            var name_loc = {name:name,location_type:location_type};
            
            if(name_loc.location_type!="top") {
                var str_ids = (current_li.attr("id")).split(".");
                var origins = _.reduce(str_ids, function(origins, item){
                    var obj = location_objets[_.indexOf(str_ids,item)];
                    var key = _(obj).chain().keys().first().value();
                    obj[key] = item;
                    _.extend(origins,obj);
                    return origins;
                },{});
                
                
                return _.extend(name_loc,{origins:origins});
            } else {
                return name_loc;
            }
            
        },
        processSelectedLocactions:function(event){
            var view = this;
            var el = view.$el;
            var new_anchor = [$(event.currentTarget)];
            var current_anchors = $(el).find(".jstree-clicked");
            var new_loc = _.map(new_anchor,view.get_name_loc_origins);
            var current_locs = _.map(current_anchors,view.get_name_loc_origins);
            var all_locs = new_loc.concat(current_locs);
            if(event.ctrlKey) {
                var selected_locs = all_locs;
            } else if(event.shiftKey) {
                var selected_locs = _(all_locs).chain()
                                        .pluck("location_type")
                                        .uniq()
                                        .size()
                                        .value()==1?all_locs:new_loc;
            } else {
                var selected_locs = new_loc;
            }

            view.selected_locations = _(selected_locs).compact();
            this.trigger("update_company_in_company_view");
        }
    });

var companies_view =
    Backbone.View.extend({
        render:function(companyObjs){
            var view = this;
            var el = view.$el;
            var template = view.options.template;
            var html = ich[template]({companies:companyObjs});
            $(el).html(html);
            $(el).find("#companies").multiselect();
        }
    });

var location_and_company_view =
    Backbone.View.extend({
        events:{
            'click #chkallterminals': 'checkAllTerminals'
        },
        initialize:function() {
            var view = this;
            view.listLocationsCompany = [];
            view.locationsTree=[];
            view.locations_view = new locations_view({template:'locations_tree_TMP'});
            view.companies_view = new companies_view({template:'companySelection_TMP'});
            
            view.locations_view.on('update_company_in_company_view',view.render_company_list,view);
        },
        setup:function() {
            var view = this;
            view.listLocationsCompany = [];
            view.locationsTree=[];
            $.couch.db("terminals_rt7").view("app/country_prov_city_area_postal_code_company", {
                success:function(resp) {
                    function transformListToTree(listLocCom) {
                       function appendTree(tree,item) {
                            function getEmptyObj(propertyName){
                                switch(propertyName){
                                    case "country":
                                        return {id:"default",name:"default",province:[]};
                                    case "province":
                                        return {id:"default",name:"default",city:[]};
                                    case "city":
                                        return {id:"defautl",name:"default",areaCode:[]};
                                    case "areaCode":
                                        return {id:"default",name:"default",postalCode:[]};
                                    case "postalCode":
                                        return {id:"default",name:"default"};
                                };
                            };
                            var foundCountry = _.find(tree,function(treeItem){ 
                                return treeItem.name==item.country;
                            });
                            
                            if(_.isEmpty(foundCountry)) {
                                foundCountry = getEmptyObj("country");
                                foundCountry.id=item.country;
                                foundCountry.name=item.country;
                                tree = tree.concat(foundCountry);
                            }
                             
                            var foundProvince = _.find(foundCountry.province, function(treeItem){
                                return treeItem.name==item.province;
                            });
                            
                            if(_.isEmpty(foundProvince)) {
                                foundProvince = getEmptyObj("province");
                                
                                foundProvince.id = (foundCountry.id).concat(".").concat(item.province);
                                foundProvince.name = item.province;
                                
                                foundCountry.province = foundCountry.province.concat(foundProvince);
                            } 
                            
                            var foundCity = _.find(foundProvince.city, function(treeItem){
                                return treeItem.name==item.city;
                            });
                            
                            if(_.isEmpty(foundCity)) {
                                foundCity = getEmptyObj("city");
                                
                                foundCity.id = (foundProvince.id).concat(".").concat(item.city);
                                foundCity.name = item.city;
                                
                                foundProvince.city = foundProvince.city.concat(foundCity);
                            } 
                            
                            var foundArea = _.find(foundCity.areaCode, function(treeItem){
                                return treeItem.name==item.areaCode;
                            });
                            
                            if(_.isEmpty(foundArea)) {
                                foundArea = getEmptyObj("areaCode");
                                
                                foundArea.id = (foundCity.id).concat(".").concat(item.areaCode);
                                foundArea.name = item.areaCode;

                                foundCity.areaCode = foundCity.areaCode.concat(foundArea);
                            } 
                            
                            var foundPostal = _.find(foundArea.postalCode, function(treeItem){
                                return treeItem.name==item.postalCode;
                            });
                            
                            if(_.isEmpty(foundPostal)) {
                                foundPostal = getEmptyObj("postalCode");
                                
                                foundPostal.id = (foundArea.id).concat(".").concat(item.postalCode);
                                foundPostal.name = item.postalCode;
                            
                                foundArea.postalCode = foundArea.postalCode.concat(foundPostal);
                            } 
                            
                            return tree;    
                        };
                       
                       var tree = _.reduce(listLocCom, appendTree, []);
                       return tree;
                    };
                    
                   
                    var keys = _.pluck(resp.rows,"key");
                    var values = _.pluck(resp.rows,"value");
                    var zippedList = _.zip(keys,values);
                    view.listLocationsCompany = _.map(zippedList,function(listLocCom){
                        listLocCom = _.flatten(listLocCom);
                        return {
                            country:listLocCom[0],
                            province:listLocCom[1],
                            city:listLocCom[2],
                            areaCode:listLocCom[3],
                            postalCode:listLocCom[4],
                            companyObj:{name:listLocCom[5],id:listLocCom[6]}
                        };
                    });
                    
                    view.locationsTree = transformListToTree(view.listLocationsCompany);
                    view.locations_view.setElement("#locationstree").renderTree(view.locationsTree);
                    view.companies_view.setElement("#companylist");                    
                },
                error:function() {
                    alert("Error occured. please, try again");
                },
                reduce:false
            });
        },
        checkAllTerminals:function(event){
            var chk = $(event.currentTarget);
            if(chk.is(":checked")){
                $("#locationstree").hide();
                $("#companylist").hide();
            } else {
                $("#locationstree").show();
                $("#companylist").show();
            }
        },
        render_company_list:function(){
            function extractCompany(loc_with_origin){
                if(loc_with_origin.location_type=="top"){
                    return _(view.listLocationsCompany).chain()
                            .map(function(item){return item.companyObj;})
                            .value();
                } else {
                    var locations = _.values(loc_with_origin.origins);
                    return _(view.listLocationsCompany).chain()
                            .filter(function(item){
                                return _(item).chain()
                                        .values()
                                        .difference(locations)
                                        .size()
                                        .value() == (6-locations.length);
                            })
                            .map(function(item){return item.companyObj;})
                            .value();
                }
            }
            
            var view = this;
            var selected_location_with_origins = view.locations_view.selected_locations;
            // origins : null / origins : {country:"..", province:".."}
                        
            var companies = _(selected_location_with_origins).chain()
                            .map(extractCompany)
                            .flatten()
                            .map(function(item){
                            return JSON.stringify(item);
                            })
                            .uniq()
                            .map(function(str){
                            return JSON.parse(str);
                            })
                            .value();
            
            view.companies_view.render(companies);
        }
    });

var add_images_view =
    Backbone.View.extend({
        initialize:function() {
            
        },
        events:{
            'click #btnaddimage' : 'show_add_image_dialog',
            'click #btnprev' : 'render_prev_page',
            'click #btncomplete' : 'complete_campaign',
            'click .del' : 'delete_image'
        },
        show_add_image_dialog:function(){
            this.trigger('show_add_image_dialog');
        },
        setup:function() {
            var view = this;
            $("#btnaddimage").button();
            $("#btnprev").button();
            $("#btncomplete").button();
            $("#btncancel").button();
            view.render_table();
        },
        render_table:function(images){
            var view = this;
            var for_TMP = _.map(images,function(item){
                return _.extend({_id:item.file},item);
            });
            var html = ich.imagesTable_TMP({list:for_TMP});
            $("#images_table").html(html);
            
            $(view.$el).find('.del').button();
            
        },
        render_prev_page:function() {
            this.trigger('render_prev_page');
        },
        complete_campaign:function(){
            this.trigger('complete_campaign');
        },
        delete_image:function(event){
            var file = (event.currentTarget.id).replace("del-","");
            this.trigger('delete_image',file);
        }
    });

var createCampaignRouter =
    new (Backbone.Router.extend(
             {routes: {
              "createcampaigns":"_setup"
              },
              initialize:function() {
                var router = this;
                router.startDate = (new Date());
                router.endDate = (new Date()).addDays(1);
                
                router.views = {
                    // campaign page part views
                    start_date_picker : new date_picker_view({date:router.startDate}),
                    end_date_picker : new date_picker_view({date:router.endDate}),
                    days_and_hours : new days_and_hours_view(),
                    days_and_hours_dialog : new days_and_hours_dialog_view(), 
                    location_and_company : new location_and_company_view(),
                    
                    // add image page part view
                    add_images_view : new add_images_view()
                };
                
                // campaign page part bind 
                router.views.start_date_picker.on('date-change',router.update_start_date,router);
                router.views.end_date_picker.on('date-change',router.update_end_date,router);
                router.views.days_and_hours.on('initialize_timepicker_in_dialog',router.initialize_timepicker_in_dialog,router);
                
                // add image page part bind
                router.views.add_images_view.on('show_add_image_dialog',router.show_add_image_dialog,router);
                router.views.add_images_view.on('render_prev_page',router.render_prev_page,router);
                router.views.add_images_view.on('complete_campaign',router.complete_campaign,router);
                router.views.add_images_view.on('delete_image',router.delete_image,router);
              },
              _setup:function(){
                //alert("we are working on this menu");
                //window.history.go(-1);
                
                console.log("campaign manager");
                var router = this;
                //router.currentCampaignDoc ={};
                router.currentCampaignModel = new (couchDoc.extend({db:"campaigns"}))();
                $("#main").html(ich.createCampaign_TMP({}));
                
                // campaign page part set element and setup
                router.views.start_date_picker.setElement("#dateFrom").setup();
                router.views.end_date_picker.setElement("#dateTo").setup();
                router.views.days_and_hours.setElement("#days_and_hours").setup();
                router.views.days_and_hours_dialog.setElement("#dialog-hook");
                router.views.location_and_company.setElement("#location_and_company").setup();
                
                // add image page part set element and setup
                router.views.add_images_view.setElement("#next_page_in_tmp").setup();
                
                $("#next_page_in_tmp").hide();
                $("#btnnext").button().click(function(){
                    router.createCampaign();
                });
                $("#btncancel").button().click(function(){
                    router.cancel_campaign();
                });
                $("#btnmainmenu").button().click(function(){
                    router.cancel_campaign();
                    window.location.href ='#mainMenus';
                });
              },
              createCampaign:function(){
                  var router = this;
                  var formData = varFormGrabber($("#campaignForm"));
                  var isAllday_time =$("#chkalldaysandhours").is(":checked");
                  var isAllTerminals =$("#chkallterminals").is(":checked");
                  var days_and_hours = router.views.days_and_hours.list_days_hours;
                  
                  if(_.isEmpty(formData._id)){
                      alert("Campaign ID is empty");
                      return undefined;
                  }                  
                  _.extend(formData,{
                                        presentation_type:$(".presentation_type:checked").val(),
                                        name : formData._id,
                                        days_and_hours:days_and_hours,
                                        all_times:isAllday_time,
                                        all_days:isAllday_time,
                                        images : []
                                    });
                  
                  _.extend(formData,{
                      time:{
                          start:(new Date(formData.time.start)).toJSON(),
                          end:(new Date(formData.time.end)).toJSON()
                      }
                  });
                  
                  if(!isAllday_time){
                      if(_.size(days_and_hours)==0){
                        alert("at least one day/time!");
                        return undefined;    
                      }
                      
                      var isAllDays = _(days_and_hours).chain().pluck("day").uniq().size()==7;
                      _.extend(formData,{all_days:isAllDays});          
                  } 
                  
                  if(isAllTerminals){
                      _.extend(formData,{locations:[{all_terminals:true}]});
                  } else {
                      var locations_with_origins = router.views.location_and_company.locations_view.selected_locations;
                      var companies = $("#companies").val();
                      if(_.isEmpty(companies)){
                          alert("at least one company");
                          return undefined;
                      } 
                      
                      var locations = _.map(locations_with_origins,function(item){
                          if(item.location_type=="top") { // select all
                              return _.map(companies, function(com){
                                  return {company:com};
                              });
                          } else {
                              return _.map(companies, function(com){
                                  return _.extend({company:com},item.origins);
                              });
                          }
                      });
                      
                      _.extend(formData,{locations:_.flatten(locations)});                      
                  }
                  
                  console.log(formData);
                  var db_campaigns = $.couch.db("campaigns");
                  if($("#_id").attr("disabled")){
                      // update
                      router.currentCampaignModel.save(formData,{
                          success:function(model){
                              router.renderAddImagePage();
                          },
                          error:function(){}
                      });
                  } else {
                     // create doc
                     db_campaigns.openDoc(formData._id,{
                          success:function(doc){
                              alert("there's same campaign id exists!");
                          },
                          error:function(){
                             router.currentCampaignModel.save(formData,{
                                 success:function(model){
                                     console.log(arguments);
                                     router.renderAddImagePage();
                                 },
                                 error:function(){}
                             });
                          }
                      }); 
                     
                  }
              },
              show_add_image_dialog:function(){
                  var router = this;
                  var currentCampaignJSON = router.currentCampaignModel.toJSON();
                  var html = ich.upload_dialog_TMP({_rev:currentCampaignJSON._rev});
                  var options = _.extend({html:html},{title:"upload",
                                                      campaignDoc:currentCampaignJSON,
                                                      success:function(resp){
                                                          console.log("success functions");
                                                          console.log(resp);
                                                          router.add_image_to_campaign(resp, router);
                                                      }});
                  showUploadImageDialog(options);
              },
              renderAddImagePage:function(){
                  $("#first_page_in_tmp").hide();
                  $("#next_page_in_tmp").show();
              },
              render_prev_page:function(){
                  $("#first_page_in_tmp").show();
                  $("#_id").attr("disabled",true);
                  $("#next_page_in_tmp").hide();
              },
              add_image_to_campaign:function(resp, router){
                  router.currentCampaignModel.fetch({
                      success:function(model){
                          var file = resp.file;
                          if(model.get("images")==undefined) {
                              model.set("images",[]);
                          }
                          
                          var newImages = (model.get("images")).concat({file:file});
                          model.set("images",newImages);
                          model.save({},{
                              success:function(model){
                                  router.render_images_table(model.get("images"),router);
                              }
                          });
                      },
                      error:function(){}
                  });
              },
              render_images_table:function(images,router){
                  router.views.add_images_view.render_table(images);
              },
              complete_campaign:function(){
                  var router = this;
                  router._setup();
              },
              cancel_campaign:function(){
                  var router = this;
                  //delete(remove) doc / model and reset
                  if(_.isNotEmpty(router.currentCampaignModel.get('_id'))) {
                      router.currentCampaignModel.destroy({
                          success:function(){
                              router._setup();
                          }
                      });
                  } else {
                      router._setup();
                  }
              },
              delete_image:function(filename){
                  //console.log(arguments);
                  var router = this;
                  var campModel = router.currentCampaignModel;
                  var newImages = _.reject(campModel.get('images'),function(item){
                      return item.file == filename;
                  });
                  
                  var newAttach = _.selectKeys(campModel.get('_attachments'),_.pluck(newImages,'file'));
                  
                  campModel.set("images",newImages);
                  campModel.set("_attachments",newAttach);
                  
                  campModel.save({},{
                      success:function(model){
                          router.render_images_table(model.get("images"),router);
                      }
                  });                  
              },
              update_start_date:function(date) {
                  this.startDate = date;    
              },
              update_end_date:function(date) {
                  this.endDate = date;
              },
              initialize_timepicker_in_dialog:function(){
                  this.views.days_and_hours_dialog.initializeTimePicker();    
              }
              }));
