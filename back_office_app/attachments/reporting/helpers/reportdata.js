function we_are_fixing_this_page(message){
    alert(message);
    window.history.go(-1);
}
function we_are_fixing_this_feature(message){
    alert(message);
}
//obj is supposed to be from ReportData global
var extractStores =  _.memoize(
    function extractStores(obj){
	var stores = extractItems(obj,"stores");
	return _.map(stores,function(store){
			 return {type:'store',
				 id:store.store_id,
				 name:store.storeName,
				 number:store.number,
				 label : store.number + " : " + store.storeName};
		     });
    },
    reportDataHash
);
//obj is supposed to be from ReportData global
var extractGroups = _.memoize(
    function extractGroups(obj){
	var groups = extractItems(obj,"groups");
	return _.map(groups,function(group){
			 return {type:'group',
				 id:group.group_id,
				 name:group.groupName,
				 label:group.groupName};
		     });
    },
    reportDataHash
);
function extractItems(obj,field){
    var items = [];
    _.prewalk(function(o){
		  if(o && _.has(o,field)){
		      items.push(o[field]);
		  }
		  return o;
	      },obj);

    if(_.isEmpty(items) && obj[field]) {
	items = [obj[field]];
    }
    return _.flatten(items);
}
function topLevelEntity(reportData){
    if(ReportData.company && ReportData.company._id){return {id:ReportData.company._id,type:"company"};}
    else if(ReportData.group && ReportData.group.group_id){return {id:ReportData.group.group_id,type:"group"};}
    else if(ReportData.store && ReportData.store.store_id){return {id:ReportData.store.store_id,type:"store"};}
    else {return {id:undefined,type:undefined};}
};
function topLevelEntityInfo(reportData){
    return entity_type_from_id(reportData,topLevelEntity(reportData).id);
};
var getParentsInfo = _.memoize(
    function getParentsInfo(reportData){
	//makes an object that looks like {company:,group:}
	if(reportData.company){
	    var company = {
		id:reportData.company._id,
		label:reportData.company.companyName,
		type : "company"
	    };
	}
	else if(reportData.company_id){
	    var company = {
		id:reportData.company_id,
		label:reportData.companyName,
		type : "company"
	    };
	}
	if(reportData.group){
	    var group = {
		id:reportData.group.group_id,
		label:reportData.group.groupName,
		type : "group"
	    };
	}
	else if(reportData.group_id){
	    var group = {
		id:reportData.group_id,
		label:reportData.groupName,
		type : "group"
	    };
	}

	if(reportData.store){
	    var store = {
		id:reportData.store.store_id,
		label:reportData.store.number+":"+reportData.store.storeName,
		number:reportData.store.number,
		type:"store"
	    };
	}
	return _.removeEmptyKeys({company:company,group:group,store:store});
    },
    reportDataHash
);
//woo memoize, hash function is crap by whatever
var reportDataToArray = _.memoize(
    function(reportData){
	//todo: this may be the expand function that i wrote tests for in underscore_extended
	function combineWithSubpart(field){
	    return function(o){
		if (o[field]){
		    if(_.isObj(o[field])){
			var fields = o[field];
		    }
		    else{
			var fields = _.flatten(o[field]);
		    }
		    var o_without_field = _.removeKeys(o,field);
		    var expandedCombinedFields = _.mapCombine(fields,o_without_field);
		    return expandedCombinedFields;
		}
		return o;
	    };
	}
	return _.chain(reportData)
	    .selectKeys('company','group','store')
            .prewalk_r(function(o){
			  if (o.hierarchy){
			      var groups = o.hierarchy.groups;
			      var o_without_field = _.removeKeys(o,'hierarchy');
			      var expandedCombinedFields = _.mapCombine(groups,o_without_field);
			      return _.combine(o_without_field,{groups : expandedCombinedFields});
			  }
			  return o;
		      })
	    .prewalk_r(combineWithSubpart('terminals'))
            .prewalk_r(combineWithSubpart('stores'))
            .prewalk_r(combineWithSubpart('groups'))
            .prewalk_r(combineWithSubpart('company'))
	    .prewalk_r(combineWithSubpart('group'))
	    .prewalk_r(combineWithSubpart('store'))
	    .value();
    },
    reportDataHash
);
function entity_type_from_id(reportData,id){
    return _.chain(reportDataToArray(reportData))
	.find(function(entity){
		  return _.find(entity,function(val){return val === id})
	      })
	.filter$(function(val){
		     return val === id;
		 })
	.renameKeys('_id','company',
		    'company_id','company',
		    'store_id','store',
		    'group_id','group',
		    'terminal_id','terminal')
	.keys()
	.first()
	.value()
}
function _find_entity_from_id(reportData,id){
    return _.chain(reportDataToArray(reportData))
	.find(function(entity){
		  return _.find(entity,function(val){return val === id})
	      })
	.renameKeys('number','storeNumber')
	.value()
}
var extract_entity_info={
    company:function(entity_data){
	return _.selectKeys(entity_data,
		       'company_id',
		       'companyName')
    },
    group:function(entity_data){
	return _.combine(this.company(entity_data),
		    _.selectKeys(entity_data,
				 'group_id',
				 'groupName'))
    },
    store:function(entity_data){
	return _.combine(this.group(entity_data),
		    _.selectKeys(entity_data,
				 'store_id',
				 'storeName',
				 'storeNumber'))
    },
    terminal:function(entity_data){
	return _.combine(this.store(entity_data),
		    _.selectKeys(entity_data,
				 'terminal_id',
				 'terminal_label'))
    }
}
var entity_from_id = multimethod()
    .dispatch(function(reportData,id){
		  return entity_type_from_id(reportData,id)
	      })
    .when('company',function(reportData,id){
	      var entity_info = extract_entity_info.company(_find_entity_from_id(reportData,id))
	      return _.combine(entity_info,
			  {
			      id:entity_info.company_id,
			      name:entity_info.companyName,
			      type:'company'
			  });
	  })
    .when('group',function(reportData,id){
	      var entity_info = extract_entity_info.group(_find_entity_from_id(reportData,id))
	      return _.combine(entity_info,
			  {
			      id:entity_info.group_id,
			      name:entity_info.groupName,
			      type:'group'
			  });
	  })
    .when('store',function(reportData,id){
	      var entity_info = extract_entity_info.store(_find_entity_from_id(reportData,id))
	      return _.combine(entity_info,
			  {
			      id:entity_info.store_id,
			      name:entity_info.storeName+ "(" + entity_info.storeNumber +")",
			      type:'store'
			  });
	  })
    .when('terminal',function(reportData,id){
	      var entity_info = extract_entity_info.terminal(_find_entity_from_id(reportData,id))
	      return _.combine(entity_info,
			  {
			      id:entity_info.terminal_id,
			      name:entity_info.terminal_label,
			      type:'terminal'
			  });
	  })
function reportDataHash(reportData){
    return topLevelEntity(reportData).id;
}
function groupFromStoreID(reportData,storeID){
    var foundGroup =  _(reportDataToArray(reportData)).chain()
	.find(function(item){
		  return item.store_id === storeID;
	      })
	.value();

    if(foundGroup){
	return foundGroup.group_id;
    }
    return undefined;
}
//this function will return a group obj if the stores list includes all of the stores that belong to the group
function groupsFromStoreSets(stores,groups,reportData){
    function groupID_stores_count_string(stores,groupID){
	return groupID+"?"+_.size(stores);
    }
    var groups_and_matched_store_size =
	_.chain(stores)
	.pluck('id')
	.matchTo(reportDataToArray(reportData),'store_id')
	.groupBy('group_id')
	.map(groupID_stores_count_string)
	.value();

    var groups_and_store_size =
	_.chain(reportDataToArray(reportData))
	.unique(false,function(item){return item.store_id;})
	.groupBy('group_id')
	.map(groupID_stores_count_string)
	.value();

    var groupsToSave =
	_.chain(groups_and_store_size)
	.intersection(groups_and_matched_store_size)
	.map(function(group_size_str){
		 return group_size_str.split("?")[0];
	     })
	.matchTo(groups,'id')
	.value();

    return groupsToSave;
}
// report page store drop downbox helper funtion
//FIXME: we are getting ride of the drop down, remove this
function updateStoreDropdown(isNotShowAll) {
    var groups = ReportData.company.hierarchy.groups;
    var dropdownGroup = $("#groupsdown");
    var dropdownStore = $("#storesdown");
    $('option', dropdownStore).remove();

    if(!isNotShowAll) { dropdownStore.append('<option value="ALL">ALL</option>'); }

    if(dropdownGroup.val()=="ALL") {
	var stores = _(groups).chain().map(function(group) {
					       return group.stores;
					   }).flatten().value();

	_.each(stores, function(store) {
		   dropdownStore.append('<option value=' + store.store_id + '>' + store.storeName
                                        + "(" + store.number + ")" + '</option>');
               });
    } else {
	var group = _.filter(groups, function(group){ return group.group_id==dropdownGroup.val();});
	var stores = group[0].stores;
	_.each(stores, function(store) {
		   dropdownStore.append('<option value=' + store.store_id + '>' + store.storeName
                                        + "(" + store.number + ")" + '</option>');
               });
    }
};
// report page terminal drop downbox helper funtion
function updateTerminalDropdown(isNotShowAll) {
    var dropdownStore = $("#storesdown");
    var dropdownTerminal = $("#terminalsdown");

    $('option', dropdownTerminal).remove();
    if(!isNotShowAll) {
	dropdownTerminal.append('<option value="ALL">ALL</option>');
    }

    if(dropdownStore.val()=="ALL") {
	var ids =
	    _($('option', dropdownStore))
	    .chain()
            .pluck('value')//map(function(option){return option.value})
            .reject(function(item){return item=="ALL";})
            .value();
    } else {
	var ids = [dropdownStore.val()];
    }

    if(!_.isEmpty(ReportData.company)) {
	var groups = ReportData.company.hierarchy.groups;
	var allStores =
	    _(groups)
	    .chain()
	    .pluck('stores')//.map(function(group) { return group.stores; })
	    .flatten()
	    .value();

    } else if(!_.isEmpty(ReportData.group)) {
	var allStores = ReportData.group.stores;
    } else if(!_.isEmpty(ReportData.store)) {
	var allStores = [ReportData.store];
    }

    var stores =
	_(ids)
	.chain()
	.map(function(id){
		 return _.filter(allStores, function(store){ return store.store_id==id;}); //this looks like a groupBy...
             })
	.flatten()
	.value();
    var terminals =
	_(stores)
	.chain()
	.pluck('terminals')//.map(function(store) {	 return store.terminals?store.terminals:[]; /*this looks like a pluck...*/     })
	.compact()
	.flatten()
	.value();

    if(_.size(terminals)) {
	_.each(terminals, function(terminal) {
		   dropdownTerminal.append('<option name='+terminal.terminal_label+' value=' + terminal.terminal_id + '>' + terminal.terminal_label + '</option>');
               });
    } else {
	$('option', dropdownTerminal).remove();
        dropdownTerminal.append('<option value="NOTHING">NO TERMINALS</option>');
    }
};
function simple_user_format(user){
    var user_roles_obj = _.chain(user.roles)
	.filter(_.isObj)
	.merge()
	.value();

    return _.chain(user)
	.removeKeys('roles')
	.combine(user_roles_obj)
	.value();
}
// report page datepicker reset helper function
function resetDatePicker() {
    var selectedDates = $( "#dateFrom, #dateTo" )
        .datepicker({
			defaultDate: "+1w",
			changeMonth: true,
			numberOfMonths: 2,
			minDate:"-1y",
			maxDate:new Date(),
			onSelect: function( selectedDate ) {
			    var option = this.id == "dateFrom" ? "minDate" : "maxDate",
			    instance = $( this ).data( "datepicker" ),
			    date = $.datepicker.parseDate(
				instance.settings.dateFormat ||
				    $.datepicker._defaults.dateFormat,
				selectedDate, instance.settings );
			    selectedDates.not( this ).datepicker( "option", option, date );
			}
                    });

    $("#dateFrom").datepicker("setDate", new Date().addDays(-1));
    $("#dateTo").datepicker("setDate", new Date());
}
//reset group / store / terminal dropdown box
function resetDropdownBox(reportData, isDisplayTerminal, isDisplayAll) {
    var dropdownGroup = $("#groupsdown");
    var dropdownStore = $("#storesdown");
    var dropdownTerminal = $("#terminalsdown");

    if(reportData.company) {
        if(!isDisplayAll) {
            $('option', dropdownGroup).remove();
            $('option', dropdownStore).remove();
        }
        _.each(reportData.company.hierarchy.groups, function(group) {
                   dropdownGroup.append('<option value=' + group.group_id + '>' + group.groupName + '</option>');
               });

        var stores = _(reportData.company.hierarchy.groups).chain().map(function(group) {
									    return group.stores;
									}).flatten().value();

        _.each(stores, function(store) {
                   dropdownStore.append('<option value=' + store.store_id + '>' + store.storeName
                                        + "(" + store.number + ")" + '</option>');
               });
        if(isDisplayTerminal) {
            var terminals = _(stores).chain().map(function(store) {
						      return store.terminals?store.terminals:[];
						  }).flatten().value();
            if(terminals.length>0) {
                _.each(terminals, function(terminal) {
                           dropdownTerminal.append('<option name='+terminal.terminal_label+' value=' + terminal.terminal_id + '>' + terminal.terminal_label + '</option>');
                       });
            } else {
                $('option', dropdownTerminal).remove();
                dropdownTerminal.append('<option value="NOTHING">NO TERMINALS</option>');
            }
        }

        $("#groupsdown")
            .change(function(){
			updateStoreDropdown(!isDisplayAll);
			if(isDisplayTerminal) {
			    updateTerminalDropdown(!isDisplayAll);
			}
		    });
        if(isDisplayTerminal) {
            $("#storesdown")
                .change(function(){
			    updateTerminalDropdown(!isDisplayAll);
			});
        }
    } else if(reportData.group) {
        if(!isDisplayAll) {
            $('option', dropdownStore).remove();
        }
        $('option', dropdownGroup).remove();
        dropdownGroup.append('<option value ='+reportData.group.group_id+'>'+reportData.group.groupName+ '</option>');
        dropdownGroup.attr('disabled','disabled');

        _.each(reportData.group.stores, function(store) {
                   dropdownStore.append('<option value=' + store.store_id + '>' + store.storeName
                                        + "(" + store.number + ")" + '</option>');
               });

        if(isDisplayTerminal) {
            var terminals = _(reportData.group.stores).chain().map(function(store) {
								       return store.terminals?store.terminals:[];
								   }).flatten().value();
            if(terminals.length>0) {
                _.each(terminals, function(terminal) {
                           dropdownTerminal.append('<option name='+terminal.terminal_label+' value=' + terminal.terminal_id + '>' + terminal.terminal_label + '</option>');
                       });
            } else {
                $('option', dropdownTerminal).remove();
                dropdownTerminal.append('<option value="NOTHING">NO TERMINALS</option>');
            }

            $("#storesdown")
		.change(function(){
			    updateTerminalDropdown(!isDisplayAll);
			});
        }
    } else if(reportData.store) {
        $('option', dropdownGroup).remove();
        $('option', dropdownStore).remove();

        dropdownGroup.append('<option value=="">'+reportData.groupName+ '</option>');
        dropdownGroup.attr('disabled','disabled');
        dropdownStore.append('<option value='+reportData.store.store_id+'>'+reportData.store.storeName
                             + "(" + reportData.store.number + ")" + '</option>');
        dropdownStore.attr('disabled','disabled');

        if(isDisplayTerminal) {
            var terminals =  reportData.store.terminals?reportData.store.terminals:[];

            if(terminals.length>0) {
                _.each(terminals, function(terminal) {
                           dropdownTerminal.append('<option name='+terminal.terminal_label+' value=' + terminal.terminal_id + '>' + terminal.terminal_label + '</option>');
                       });
            } else {
                $('option', dropdownTerminal).remove();
                dropdownTerminal.append('<option value="NOTHING">NO TERMINALS</option>');
            }
        }
    } else {
        alert("You are not authorized to access this page.");
    }
}
// process for transaction receipt TMP
function processTransactionsTMP(listTrans) {
    var data_TMP = _.extend({},listTrans);
    data_TMP = appendGroupStoreInfoFromStoreID(data_TMP);
    data_TMP = applyReceiptInfo(data_TMP);

    data_TMP =
	_.applyToValues(data_TMP, function(obj){
			    if(obj && obj.discount==0){
				obj.discount=null;
			    }
			    if(obj && obj.quantity){
				obj.orderamount = toFixed(2)(obj.price * obj.quantity);
				obj.quantity+="";
				if(obj.discount) {
				    obj.discountamount = toFixed(2)(obj.discount * obj.quantity);
				}
			    }
			    return toFixed(2)(obj);
			}, true);

    data_TMP = _.map(data_TMP, function(item){
			 if(item.payments) {
			     item.payments = _.map(item.payments, function(payment){
						       // apply card payment data
						       if(_.isEmpty(payment.paymentdetail)) {
							   payment = _.removeKeys(payment,"paymentdetail");
						       }

						       if(payment.paymentdetail) {
							   payment.paymentdetail.crt = payment.type;
						       }
						       if(payment.paymentdetail && payment.paymentdetail.errmsg) {
							   payment.paymentdetail.errmsg = (payment.paymentdetail.errmsg).replace(/<br>/g," ");
						       }
						       return payment;
						   });
			 }
			 return item;
		     });


    data_TMP =
        _.applyToValues(data_TMP, function(obj){
			    var strObj = obj+"";
			    if(strObj.indexOf(".")>=0 && strObj.indexOf("$")<0 && strObj.indexOf(":")<0) {
				obj = currency_format(Number(obj));
			    }
			    return obj;
			}, true);

    return data_TMP;
}
function entityIDs_from_id(reportData,id,entity_type){
    //get a list of stores from the parent id
    return _.chain(reportDataToArray(reportData))
	.filter(function(entity){
		    return _.find(entity,function(val){return val === id})
		})
	.pluck(entity_type+'_id')
	.compact()
	.unique()
	.value()
}
function storeIDs_from_id(reportData,id){
    return entityIDs_from_id(reportData,id,'store');
}
function entities_info_from_id(reportData,id,entity_type){
    return _.map(entityIDs_from_id(reportData,id,entity_type),
	    function(id){ return entity_from_id(ReportData,id)});
}
function stores_info_from_id(reportData,id){
    return entities_info_from_id(reportData,id,'store');
}

function child_type_of(parent_type){
    var company_hierarchy={
	company:'group',
	group:'store',
	store:'terminal'
    }
    return company_hierarchy[parent_type];
}

function get_id_from_name(reportData,name){
    //given a name (store/company/group), do a lookup for the id that is associated with that name
    return function(callback){
	function containsVal(obj, val) {
	    return _.find(obj, function (val) {
			 return val === name;
		     })
	}
	_.prewalk(function (obj) {
		      if (!_.isArray(obj) && _.isObject(obj) && containsVal(obj, name)) {
			  callback(_.find(obj, function (val, key) {
					      return /id$/.test(key);
					  }));
			  return null;
		      }
		      return obj;
		  }, reportData)
    }
}