var templated_view =
    Backbone.View.extend(
	{
	    initialize:function(options){
		var view = this;
		view.auto_el = options.auto_el;
		view.template = options.template;
		view.vent = options.vent;
		return view;
	    },
	    setup:function(){
		var view = this;
		if(view.auto_el){
		    view.setElement(view.auto_el);
		}
		return view;
	    },
	    _render:function(data){
		var view = this;
		if(view.template){
		    var html = ich[view.template](data);
		    view.$el.html(html);
		}
		return view;
	    },
	    render:function(data){
		var view = this.setup();
		return view._render(data);
	    }
	})

var company_tree_navigation_view =
    templated_view.extend(
	{
	    initialize:function(options){
		var view = templated_view.prototype.initialize.call(this,options);
		view.vent.on('render:navigation',view.render,view);
		return view;
	    },
	    events:{
		"click a":"view_entity"
	    },
	    view_entity:function(event){
		var view = this;
		var entity = $(event.currentTarget).parent();
		var entity_id = entity.attr('id');
		var entity_name = entity.attr('name');
		console.log('entity selected: '+ entity_name);
		view.vent.trigger('change:selected-entity',entity_id,entity_name);
	    },
	    _render:function(data){
		var view = templated_view.prototype._render.call(this,data);
		view.$el.jstree({
		    "ui":{
		        "select_multiple_modifier":false
		    }
		});
	    }
	});

var date_picker_view =
    templated_view.extend(
	{
	    events:{
		'change':'date_change'
	    },
	    initialize:function(options){
		var view = templated_view.prototype.initialize.call(this,options);
		view.default_date = options.date;
		return view;
	    },
	    date_change:function(e,event_name){
		var view = this;
		var date = new Date($(e.currentTarget).val());
		if(event_name){
		    var event = event_name;
		}
		else{
		    var event = 'date-change';
		}
		view.vent.trigger(event,date);
	    },
	    setup:function(options){
		var view = templated_view.prototype.setup.call(this,options);
		view.$el.datepicker();
		if(view.default_date){
		    view.$el.datepicker("setDate",view.default_date);
		}
		return view;
	    },
	    render:function(date){
		var view = templated_view.prototype.render.call(this,date);
		view.$el.datepicker("setDate",date);
		return view;
	    }
	});

var start_date_picker_view =
    date_picker_view.extend(
	{
	    initialize:function(options){
		var view = templated_view.prototype.initialize.call(this,options);
		view.vent.on('render:start-date',view.render,view);
		return view;
	    },
	    date_change:function(e){
		return date_picker_view.prototype.date_change.call(this,e,'change:start-date');
	    }
	});
var end_date_picker_view =
    date_picker_view.extend(
	{
	    initialize:function(options){
		var view = templated_view.prototype.initialize.call(this,options);
		view.vent.on('render:end-date',view.render,view);
		return view;
	    },
	    date_change:function(e){
		return date_picker_view.prototype.date_change.call(this,e,'change:end-date');
	    }
	});
var general_report_table_view =
    templated_view.extend(
	{
	    initialize:function(options){
		var view = templated_view.prototype.initialize.call(this,options);
		view.vent.on('render:report',view.render,view);
		return view;
	    }
	});

var general_layout_view =
    templated_view.extend(
	{
	    initialize:function(options){
		var view = this;
		view.auto_el = '#main';
		view.template = options.template;
		view.vent = options.vent;
		view.report =
		    new general_report_view(_.extend({},
						     {auto_el:'#report'},
						     _.removeKeys(options,'template')));
		view.vent.on('render:layout',view.render,view);
		return view
	    }
	});

var general_report_view =
    templated_view.extend(
	{
	    _views_init:function(options){
		var report_table_template = options.report_table_template;
		var report_table_view = options.report_table_view;
		var vent = options.vent;

		var views =
		    {
			start_date_picker : new start_date_picker_view(
			    {vent:vent,auto_el:"#dateFrom"}),
			end_date_picker : new end_date_picker_view(
			    {vent:vent,auto_el:"#dateTo"}),
			navigation : new company_tree_navigation_view(
			    {vent:vent,
			     auto_el:'#company-navigation',
			     template:"hierarchy_list_TMP"})
		    };

		if(report_table_template && _.isString(report_table_template)){
		    _.extend(views,
			     {
				 report_table : new general_report_table_view(
				     {
					 vent:vent,
					 auto_el:'#report_table',
					 template:report_table_template
				     }
				 )
			     });
		}
		else if(report_table_view){
		    _.extend(views,
			     {
				 report_table : new report_table_view(
				     {
					 vent:vent,
					 auto_el:'#report_table'
				     }
				 )
			     });
		}

		return views;
	    },
	    initialize:function(options){
		var view = templated_view.prototype.initialize.call(this,options);
		var vent = view.vent;

		view.views = view._views_init(options);

		view.vent.on('fetched:report',
			     function(report){
				 this.$('#export').show();
				 this.vent.trigger('render:report',report)},
			     view);

		view.vent.on('render:general-report',
			     function(options){
				 view.vent.trigger('render:layout',options.navigation_meta);
				 view.vent.trigger('render:start-date',options.start_date);
				 view.vent.trigger('render:end-date',options.end_date);
				 view.vent.trigger('render:navigation',options.company_navigation);
				 view.render(options);
			     });
		return view;
	    },
	    events:{
		'click #generate_report':function(){this.vent.trigger('generate_report')},
		'click #export':function(){this.vent.trigger('export')}
	    },
	    _render:function(data){
		var view = templated_view.prototype._render.call(this,data);
		view.$('button').button();
		view.$('#export').hide();
		return view;
	    }
	})

var general_report_router =
    Backbone.Router.extend(
    {
	initialize:function(options){
	    var router = this;

	    var vent = options.vent || new Backbone.Marionette.EventAggregator();
	    var layout = options.layout || new general_layout_view(_.extend({},options,{vent:vent}));
	    _.defaults(options,{
			   layout:layout,
			   vent:vent
		       });

	    router.layout = options.layout;
	    router.title = options.title;

	    router.el = options.el;
	    router.route(options.route,'setup');
	    router.vent = options.vent;
	    //rendering report data
	    router.vent.on('generate_report',function(){
			       router.fetch_inventory_report(
				   _.bind(router._finished_fetching_report,router))
			   },router);

	     //exporting
	    router.vent.on('export',function(){
			       router.export_csv(
				   _.bind(router._export_csv,router))
			   }
			   ,router);

	     //date changes
	    router.vent.on('change:start-date',router.update_start_date,router);
	    router.vent.on('change:end-date',router.update_end_date,router);

	     //entity selection changes
	    router.vent.on('change:selected-entity',function(id){this.selected_entity = id},router);
	},
	setup:function(){
	    var router = this;
	    router.startDate = (new Date());
	    router.endDate = (new Date()).addDays(1);
	    router.selected_entity = topLevelEntity(ReportData).id;
	    var user_navigation_meta = _.extend({title:router.title},
				       autoBreadCrumb());
	    router.vent.trigger('render:general-report',
				{
				    navigation_meta:user_navigation_meta,
				    start_date:router.startDate,
				    end_date:router.endDate,
				    company_navigation:ReportData
				});
	},
	update_start_date:function(date){this.startDate = date},
	update_end_date:function(date){this.endDate = date},

	_finished_fetching_report:function(report){
	    var router = this;
	    router.current_view_data = report;
	    router.vent.trigger('fetched:report',report);
	},
	fetch_inventory_report:function(){},
	_export_csv:function(convert_to_array,file_name){
	    var export_db = 'export_requests_rt7';
	    var router = this;
	    var handler = {
		success:function(resp){
		    var href = window.location.origin + '/'+ export_db +'/_design/app/_show/csv/' + resp.id
		    window.location.href = href
		},
		error:function(){
		    alert('there was an error exporting your data')
		}
	    }
	    if(_.isUndefined(router.current_view_data)){
		alert("there is no data to save")
		return
	    }
	    var doc = {
		_id:$.couch.newUUID(),
		file_name:file_name,
		file_ext:'csv',
		date:(new Date()).toJSON(),
		content:convert_to_array(router.current_view_data)
	    };
	    $.couch.db(export_db).saveDoc(doc,handler);
	},
	export_csv:function(){}
    })