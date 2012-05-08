function breadCrumb(companyName,groupName,storeName,storeNumber,terminalName){
    return {companyName:companyName,groupName:groupName,storeName:storeName,storeNumber:storeNumber,terminalName:terminalName};
};
function smartBreadCrumb(ReportData){
    if(ReportData.store){
	return {breadCrumb:breadCrumb(ReportData.companyName,
	     			 ReportData.groupName,
	     			 ReportData.store.storeName,
	     			 ReportData.store.number)};
    }
    else if(ReportData.group){
	return {breadCrumb:breadCrumb(ReportData.companyName,
				 ReportData.group.groupName)};
    }
    else if(ReportData.company){
	return {breadCrumb:breadCrumb(ReportData.company.companyName)};
    }
    else{
	return {};
    }
}
function autoBreadCrumb(){
    return smartBreadCrumb(ReportData);
}
function dialogTitleMaker(options){
    var title = "Company: " + options.companyName;
    if(options.groupName) title = title.concat(" , Group: " + options.groupName);
    if(options.numberOfGroups) title = title.concat(" , Groups #: " + options.numberOfGroups);
    if(options.storeName) title = title.concat(" , Store: " + options.storeName);
    if(options.numberOfStores) title = title.concat(" , Stores #: " + options.numberOfStores);
    if(options.terminalName) title = title.concat(" , Terminal: " + options.terminalName);
    if(options.numberOfTerminals) title = title.concat(" , Terminals #: " + options.numberOfTerminals);
    title = title.concat(", Date: " + (new Date()).toString("yyyy/MM/dd"));
    return title;
}
function entity_blob_for_report_params(id){
    function count_sub_entities(reportData,parent_id,group_by_field){
	return _.chain(reportDataToArray(reportData)).filterContains(parent_id).pluck(group_by_field).compact().unique().size().value()
    }
    var entity_id = id || topLevelEntity(ReportData).id;
    var entity = entity_from_id(ReportData,entity_id);
    var numberOfGroups=count_sub_entities(ReportData,entity_id,'group_id');
    var numberOfStores=count_sub_entities(ReportData,entity_id,'store_id');
    var numberOfTerminals=count_sub_entities(ReportData,entity_id,'terminal_id');

    if(id){
	var entity_stats = {
	    numberOfGroups:numberOfGroups,
	    numberOfStores:numberOfStores,
	    numberOfTerminals:numberOfTerminals
	}
    }
    else if(topLevelEntity(ReportData).type === 'company'){
	var entity_stats = {
	    numberOfGroups:numberOfGroups,
	    numberOfStores:numberOfStores,
	    numberOfTerminals:numberOfTerminals
	}
    }
    else if(topLevelEntity(ReportData).type === 'group'){
	var entity_stats = {
	    numberOfStores:numberOfStores,
	    numberOfTerminals:numberOfTerminals
	}
    }
    else if(topLevelEntity(ReportData).type === 'store'){
	var entity_stats = {
	    numberOfTerminals:numberOfTerminals
	}
    }
    var entity_blob = _.combine(entity,
			      entity_stats,
			      {id:entity_id});
    return _.combine(entity_blob,{
		    quickViewArgs:{
			id:entity_blob.id,
			title:dialogTitleMaker(entity_blob)
		    }});
}
function getReportParam(){
    var entity_id = topLevelEntity(ReportData).id;
    var entity_blob = entity_blob_for_report_params();
    return _.combine(entity_blob,
		{list:[entity_from_id(ReportData,entity_id)]},
		autoBreadCrumb(),
		{title:_.str.capitalize(topLevelEntity(ReportData).type)+" Management"});
}
function getGroupsTableParam(id) {return getGeneralTableParam(id,'group_id')};
function getStoresTableParam(id) {return getGeneralTableParam(id,'store_id')};
function getTerminalsTableParam(id) {return getGeneralTableParam(id,'terminal_id')};
function getGeneralTableParam(id,key){
    var entities=_.chain(reportDataToArray(ReportData))
	.filterContains(id)
	.pluck(key)
	.compact()
	.unique()
	.map(entity_blob_for_report_params)
	.mapRenameKeys('terminal_label','terminalName')
	.value();
    return _.combine({
		    list:entities,
		},
		{breadCrumb:_.first(entities)})
}

//general
function extractSalesDataFromIds(items,idField,callback){
    transactionsSalesFetcher(_(items).pluck(idField),
			     function(err,totalSalesArr){
				 var transformedList =
				     _(items).chain()
				     .zip(totalSalesArr)
				     .map(function(item){
					      var Item = _.first(item);
					      var salesData = _.second(item);
					      var Item_w_salesReport = _.extend(_.clone(Item),salesData);
					      return Item_w_salesReport;
					  })
				     .value();
				 callback(transformedList);
			     });
};