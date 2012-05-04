var ReportData;

Date.prototype.toArray = function(){
    return [this.getFullYear(),
	    (this.getMonth()+1),
	    this.getDate(),
	    this.getHours(),
	    this.getMinutes(),
	    this.getSeconds()];
};

function doc_setup() {
	updateDate();
    var urlBase = window.location.protocol + "//" + window.location.hostname + ":" +window.location.port + "/";
    var db_install = 'install';
    var Company = couchDoc.extend({urlRoot:urlBase+db_install});

    var LoginDisplay = new reportLoginView();
   
    var MenuReportsDisplay = new menuReportsView();
    var CompanyHowAreWeDisplay = new HowAreWeTodayView();
    var GroupHowAreWeDisplay = new groupReportHowAreWeTodayView();
    var StroeHowAreWeDisplay = new storeReportHowAreWeTodayView();
    var MenuReportsHourlyActivityDisplay = new menuReportsHourlyActivityView();
    var MenuReportsTaxCollcetedDisplay = new menuReportsTaxCollectedView();
    var MenuReportsElectronicPaymentsDisplay = new menuReportsElectronicPaymentsView();
    var MenuReportsCashOutsDisplay = new menuReportsCashOutsView();
    var MenuReportsTransactionsDetailDisplay = new menuReportsTransactionsDetailView();
    var MenuReportsCancelledDisplay = new menuReportsCancelledTransactionsView();
    var MenuReportsRefundsDisplay = new menuReportsRefundsView();
    var MenuReportsDiscountsDisplay = new menuReportsDiscountsView();
    var MenuSetMenusDisplay = new menuSetMenusView();
    var MenuInventoryDisplay = new menuInventoryView();
    var MenuInventoryScanPriceChangeDisplay = new menuInventoryscanPriceChangeView();
    var MenuInventoryScanTaxChangeDisplay = new menuInventoryscanTaxChangeView();

    Backbone.history.start();

	$("#layeredloginpassword").keyup(function(event){
  		if(event.keyCode == 13){
	    login();
	  }
	});
};

function updateDate() {
      var ts = $("#timespace");
      $(document).everyTime("1s", function(){
      var date = new Date();
      ts.empty();
      ts.append(date.toDateString() + " / " + date.toLocaleTimeString());
      }, 0);
};
