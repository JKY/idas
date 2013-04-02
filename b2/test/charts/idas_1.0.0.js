/**********************************************************
 *
 * core.js
 *
 **********************************************************/
if(typeof($)=="undefined"){
	$ = jQuery;
};
window.visualization = {};
////// chart 
window.chart = {};
 // message broadcast
Broadcaster = function() {
    this.observers = [];
    this.regist = function( o ){
        if(typeof(o.onNotify) === 'function'){
            this.observers.push(o);
        };
    };
    this.deregist = function( o ){
        var i = this.observers.indexOf(o);
        this.observers.splice(i,1);
    };
    this.sendMessage = function(m,data){
        for(var i=0; i < this.observers.length; i++) {
            var o = this.observers[i];
            o.onNotify(m,data);
        };
    };
};


//// cube
window.Cube = function(name){
	this.uid = Math.random(),
    //console.log("window.Cube created:" + name + " " + this.uid);
	this.name = name;
	this.axex = {};
	this.binding_events = {};

    /**
     * bind a callback function to events, 
     * callback will be called when the event fired;
     * event: event names
     * callback: function 
     */
    this.bind = function(event,callback,context){
    	//console.log("window.Cube:" + this.uid + " bind event " + event);
    	if(typeof(this.binding_events[event]) === 'undefined'){
            this.binding_events[event] = [];
        };
        this.binding_events[event].push({func:callback,ctx:context});
    };
    
    this.unbind = function(event,context){
    	//console.log("window.Cube:" + this.uid + " unbind event " + event);
    	if(typeof(this.binding_events[event]) === 'undefined'){
            return;
        };
        for(var i = 0; i < this.binding_events[event].length; i++){
            var o = this.binding_events[event][i];
            if(o.ctx == context) {
            	this.binding_events[event].splice(i,1);
                break;
            };
        };
    };
    
    this.trigger = function (event,data) {
        if(typeof(this.binding_events[event]) === 'undefined'){
            return;
        };
        //console.log("window.Cube:" + this.uid + " trigger event " + this.binding_events[event].length);
        for(var i = 0; i < this.binding_events[event].length; i++){
            var o = this.binding_events[event][i];
            (o.func).apply(o.ctx||this,[data]);
        };
    };
    
    
    /**
     * load the cube axes info, including name and members,
     * trigger "onload" event after loaded.
     * axes_members example: {Customer:["Members"],City:["Members"]}
     */
    this.load = function() {
        if(typeof(this.name) === 'undefined' || this.name == ""){
            alert("cube name must be set");
            return;
        };
        var _data = JSON.stringify( { cube:this.name } );
        return $.ajax({ 
                      url: window.urls.cube+"/members", 
                      type:'POST', 
                      dataType:'json',
                      data:_data,
                      context:this,
                      success:this._on_load,
                      failed:function() {
                         alert("network error");
                      }
                      });
    };

    this._on_load = function( data ){
        //decode data
    	var dec_data = [];
    	for( var i = 0 ; i < data.length ; i++ ){
    		var item = {};
    		item.name = decode(data[i].name);
    		item.name = data[i].name;
    		item.members = [];
    		item.type = data[i].type;
            item.func = {};
    		for( var j = 0 ; j < data[i].members.length ; j++ ){
        		item.members[j] = decode(data[i].members[j]);
    			item.members[j] = data[i].members[j];
    		};
    		dec_data.push(item);
    	};
        this.axex = dec_data;
        this.trigger("onload",dec_data);
    };

    this.findAxis = function(name){
    	for(var i = 0; i< this.axex.length; i++){
    		if(name == this.axex[i].name){
    			return this.axex[i];
    		};
    	};
    	return null;
    };
    
	 /**
     * fetch cube data using the given axes_members,
     * trigger "ondata" event after loaded.
     * axes_members example: {Customer:["Members"],City:["Members"]}
     */
    this.query = function( axes_members ,method){
        if(typeof(this.name) === 'undefined' || this.name == ""){
            alert("cube name must be set");
            return;
        };
        if(typeof(axes_members) === 'undefined' || axes_members == null){
            alert("axes_members name must be set when querying");
            return;
        };
        var _data = JSON.stringify( {cube:this.name,axes:axes_members,method:method} );
        //console.log("window.cube(" + this.uid + ").query");
        return $.ajax({
                      url: window.urls.cube+"/data", 
                      type:'POST', 
                      dataType:'json',
                      data:_data,
                      context:this,
                      success:this._on_dataload,
                      failed:function() {
                         alert("network error");
                      }
                      });
    };
    
    this._on_dataload = function( data ){
        //console.log("window.cube(" + self.uid + ").data loaded");
        this.trigger("ondata",data);
    };
};

if(window.plugin == undefined){
   window.plugin = {};
 };
 
/**
 * chart model
 */
window.plugin.Editor = Backbone.Model.extend({

    cube:null,
    
    template:"undefined",
    // axes templates
    axesOptions:[],
    
    /**
     * @description: init plugin
     *
     */
    init:function(vis,w,h,type){
    	this.vis = vis;
        this.cube.bind("onload", 
                          function( data ){
                               data = data.sort( function(a,b){return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;});
                               window.cubeAxesView = new window.CubeAxesView({cubeName:this.cube.name});
                               window.cubeAxesView.render(data);
                           },
                          this
                      );
        this.bind("change:cdata",
                          function(){
                          		this.render(this.vis.chartWidth, this.vis.chartHeight);
                          },this);
    	this._init_v(w,h,type);
    },
    
    /**
     * init views
     */
    _init_v:function(w,h,type){
        var ref = [];
        var axesOptions = this.axesOptions;
	    for(var i = 0; i < axesOptions.length;i++){
            var dropAxisSetting = axesOptions[i];
            ref.push(new window.AxisDropBox({el:$('#' + dropAxisSetting.id), visualizer:this.vis,setting:dropAxisSetting}));
	    };
        var options = {
                           container:"chart-wrapper",
                           "type":type,
                           width: w,
                           height: h,
                           margin: this.custom.margin,
                           canvas:{ platform:"Fl", param:{url:"js/lib/b2/canvas/fl/B2Canvas.swf"} }
        			};
        this.chart = new B2(options);
        // restore axis setting
        var axs = this.get("axes");
        var is_fill = false;
        for(var i = 0; i < axs.length; i++){
          var axis = axs[i];
            if( axis != null) {
              var item = {};
                if(axis.name == "Measure"){
                  item.name = axis.members[0];
                    item.type = "M";
                    item.members = [];
                }else{
                    item=axis;
                };
                is_fill = true;
                ref[i].fill(item,false);
            };
        };
        this.axesDropbox = ref;
        if(typeof(this.initLegend) != "undefined"){
          this.initLegend(w,h);
        };
        if(is_fill === true) {
        	this.trigger("change:cdata");
        } else {
        	this.chart.render(this.default_data);
        };
    },

    remove:function(){
        $('#editor_legend').empty();
        for(var i = 0; i < this.axesDropbox.length;i++){
                this.axesDropbox[i].destroy();
        };
        this.axesDropbox.length = 0;
        this.cube.unbind("onload",this);
        this.off("change:cdata");
        this.release();
    },

    initLegend:function(w,h){
        var margin = this.custom.margin;
        var legend_height = h-40 -22;
        this.legend = new B2.component.Legend({
        	 width: 120,
        	 height: legend_height,
        	 left: 0,
        	 top: 0
        });
        $('#editor_legend').append(this.legend.el);
    },
    
    render: function() {
    	this.chart.render(this.get('cdata'));
    	this.legend.show(this.get("cdata").legend);
    },
    
    //default data
    default_data:{},
    
    //special chart options
    custom:{ 
            margin:[30,5,40,60]
    },
           
    url:function(){ return window.urls.charts + "/" + encode(this.get('id'));},
    
    /**
     * release, unbind all event binded to cube
     */
    release:function(){
    	if(this.cube){
        	 this.cube.unbind("ondata",this);
        };
        delete this;
    },
    
    setCube:function(cube){
        if(this.cube){
            this.cube.unbind("ondata", this);
        };
        delete this.cube;
        this.cube = cube;
        this.cube.bind("ondata",this.format,this);
    },

	/**
     * parse json
     */
 	parse:function( data ) {
    	//response or error , return
    	if(typeof(data.error) != 'undefined' && data.error != null){
        	return {error:data};
        };
        var aggr = "sum";
        if(typeof(data.aggr)!="undefined") aggr=data.aggr;
        var id = data.id;
        var matches = id.match(/^([\s\S]*)\.(.*)$/);
    	if( matches == null ){
    		debug("window.chart.Model.parse: illegal id");
    	};
    	var cdata = this.default_data;
    	if(typeof(data.cdata) != "undefined"){
    		cdata = data.cdata;
    	};
    	var pd = data.paint_d;
    	if(typeof(pd) == "undefined"){
    		pd = "";
    	};
        return {
        		id:id,
        		state:"init",
        		name:matches[1],
                cubeName:data.cubeName,
                axes:data.axes,
                error:null,
                aggr:aggr,
                paint_d:pd,
                cdata:cdata //chart data
               };
    },
    
    // axes: {name:axisName,sort:{type:"0",on:""},func:{name:'xx',args:[]},members:members }
    getAxis:function(slot) {
    	var axes = this.get('axes');
        if(slot == -1){
        	return axes;
        }
        if(axes[slot]==null || typeof(axes[slot]) == "undefined") {
        	return {
                      name:'',
                      sort:{type:"0",on:""},
                      members:[]
                    };
        }
        return axes[slot];
    },
   
    setAxis:function(slot,object){
    	var axes = this.get('axes');
        axes[slot] = object;
        return object;
    },
    
    indexOfAxis:function(name){
    	var i = -1;
    	var axes = this.get('axes');
        if(typeof(axes) != "undefined"){
        	for( var n = 0; n < axes.length;n++){
        		if( axes[n] != null && axes[n].name == name){
        			i = n;
        			break;
        		};
        	};
        };
        return i;
    },
    
    clearAxes:function(){
    	var axes = this.get('axes');
        if(typeof(axes) != "undefined"){
        	this.set({'axes':[]},{silent:true});
        };
    },
    
    /**
     * fill axis handler, 
     * called on axis fill
     */
    onSetAxis:function(index, axis_model){ 
    	/*this function should be override*/
    },
    
    paint:function(dname){
       this.set({"paint_d":dname});
       if(this.get("cdata")!=null){
    	  var temp = this.get("cdata");
          this.setColors(temp);
          this.trigger("change:cdata");
        };
    },

    format:function(dataset){ }
});

/********************************************
 * Drag & Drop
 ********************************************/
/**
 * AttachedObject
 */
window.AttachedObject = Backbone.View.extend({
     moffset:null,
     
     _initialize: function(){
         var template = _.template($('#axis-item-template').html());
         var html = "<div id='drag_icon'>" + template(this.model) + "</div>";
         $(html).insertAfter("#main-panel");
         var click_pos = this.options.click_pos;
         $("#drag_icon").find('.axis-container').addClass("axis-container").addClass("ac_normal");
         $("#drag_icon").css({"left":this.options.birthplace.x,"top":this.options.birthplace.y});
         var my_pos = $('#drag_icon').offset();
         this.moffset = {x:click_pos.x - my_pos.left, y:click_pos.y-my_pos.top};
      },
      
      move:function( e ){
            var xoff = 0, yoff = 0;
            if(typeof(this.moffset) != "undefined"){
                xoff = this.moffset.x;
                yoff = this.moffset.y;
            };
            $("#drag_icon").css({"left":e.clientX - xoff,"top":e.clientY - yoff});
      },
      
      mouse_pos: function(){
          var xoff = 0, yoff = 0;
          if(typeof(this.moffset) != "undefined"){
                xoff = this.moffset.x;
                yoff = this.moffset.y;
          };
          var p = $('#drag_icon').offset();
          return {x:p.left+xoff,y:p.top + yoff};
      },
      
      destroy: function() {
          $('#drag_icon').remove();
      }
});

window.dragAttached = null;

/**
 * DragDropManager
 */
window.DragDropManager = function(){
    this.observers = [];
                            
    this.regist = function( o ){
        this.observers.push(o);
    },
    
    this.deregist = function( o ){
        var i = this.observers.indexOf(o);
        this.observers.splice(i,1);
    },
    
    this.startDrag = function( v ,e ){
        if(typeof(v.model) == "undefined" || v.model == null ){
            debug("window.DragDropManager :Model not found.");
            return;
        };
        $(document).bind("mousemove", _.bind(this.__doc_mousemove, this));
        $(document).bind("mouseup", _.bind(this.__doc_mouseup, this));
        var v_pos = $(v.el).offset();
        window.dragAttached = new window.AttachedObject({model:v.model,birthplace:{x:v_pos.left, y:v_pos.top}, click_pos:{x:e.clientX,y:e.clientY}});
        //start drap event
        window.broadcaster.sendMessage(WM_ON_DRAG_DIM,{item:window.dragAttached});
    },
    
    this.__doc_mousemove = function( e ) {
        window.dragAttached.move(e);
        var observers = window.ddManager.observers;
        for(var i=0; i < observers.length; i++) {
            var o = observers[i];
            if(typeof(o.on_drag_move) == "function")
                o.on_drag_move(window.dragAttached);
        };
    },
   
    
    this.__doc_mouseup = function( e ) {
        if(window.dragAttached != null){
            var observers = window.ddManager.observers;
            for(var i=0; i < observers.length; i++) {
                var o = observers[i];
                if(typeof(o.accept) == "function"){
                    if(o.accept( window.dragAttached )){
                        break;
                    };
                };
            };
            window.dragAttached.destroy();
            //drop event
            window.broadcaster.sendMessage(WM_ON_DROP_DIM,{accepter:o,item:window.dragAttached});
        };
        $(document).unbind("mouseup");
        $(document).unbind("mousemove");
        window.dragAttached = null;
    }
};

window.ddManager = new window.DragDropManager;

/**
 * DragDropView
 */
window.DragDropView = Backbone.View.extend({
    enableDragDrop: function( bool ){
        if(bool) {
            $(this.el).find(".label").bind("mousedown", _.bind(this.__mousedown, this));
            window.ddManager.regist( this );
        }else{
            $(this.el).find(".label").unbind("mousedown");
            window.ddManager.deregist( this );
        };
    },

    hit: function ( o ){
        var self = $(this.el).offset();
        var sx = self.left;
        var sy = self.top;
        var tw = $(this.el).width();
        var th = $(this.el).height();
        var mp = o.mouse_pos();
        if((mp.x > sx && mp.x < sx + tw ) &&
             (mp.y > sy && mp.y < sy + th)){
            return true;;
        }else{
            return false;
        };
    },
    
    __mousedown:function( e ) {
        window.ddManager.startDrag(this,e);
    },

    on_drag_move:function( o ){
         // in area
         if(this.hit(o)){
             // ontop
             if(typeof(this.onDropEnter) == "function"){
                    this.onDropEnter( o );
             };
         }else{
            if(typeof(this.onDropOut) == "function"){
                this.onDropOut( o );
            };
         };
    },
    
    destroy: function() {
    	 window.ddManager.deregist( this );
    	 this.remove();
    }
});/**
 * Utils
 * @type 
 */
var ENCTAB = {
	' ' : 'ECH00',
	'!' : 'ECH01',
	'@' : 'ECH02',
	'#' : 'ECH03',
	'$' : 'ECH04',
	'%' : 'ECH05',
	'^' : 'ECH06',
	'&' : 'ECH07',
	'*' : 'ECH08',
	'(' : 'ECH09',
	')' : 'ECH10',
	//'-' : 'ECH11',
	'_' : 'ECH12',
	'+' : 'ECH13',
	'=' : 'ECH14',
	',' : 'ECH15',
	'<' : 'ECH16',
	'>' : 'ECH17',
	'.' : 'ECH18',
	'?' : 'ECH19',
	'/' : 'ECH20',
	':' : 'ECH21',
	';' : 'ECH22',
	'"' : 'ECH23',
	'\'' : 'ECH24',
	'[' : 'ECH25',
	']' : 'ECH26',
	'{' : 'ECH27',
	'}' : 'ECH28',
	'\\' : 'ECH29',
	'|' : 'ECH30',
	'~' : 'ECH31',
	'`' : 'ECH32',
	'\n' : 'ECH33'
};
var DECTAB = {
	'ECH00' : ' ',
	'ECH01' : '!',
	'ECH02' : '@',
	'ECH03' : '#',
	'ECH04' : '$',
	'ECH05' : '%',
	'ECH06' : '^',
	'ECH07' : '&',
	'ECH08' : '*',
	'ECH09' : '(',
	'ECH10' : ')',
	//'ECH11' : '-',
	'ECH12' : '_',
	'ECH13' : '+',
	'ECH14' : '=',
	'ECH15' : ',',
	'ECH16' : '<',
	'ECH17' : '>',
	'ECH18' : '.',
	'ECH19' : '?',
	'ECH20' : '/',
	'ECH21' : ':',
	'ECH22' : ';',
	'ECH23' : '"',
	'ECH24' : '\'',
	'ECH25' : '[',
	'ECH26' : ']',
	'ECH27' : '{',
	'ECH28' : '}',
	'ECH29' : '\\',
	'ECH30' : '|',
	'ECH31' : '~',
	'ECH32' : '`',
	'ECH33' : '\n'
};

function encode(str) {
	// str = $.trim(str);
	for (var c in ENCTAB) {
		// replace all
		while (str.indexOf(c) >= 0) {
			str = str.replace(c, this.ENCTAB[c]);
		};
	};
	return str;
};

function decode(str) {
	if (str == null) {
		return 'undefined';
	};
	// str = $.trim(str);
	for (var c in DECTAB) {
		str = str.replace(new RegExp(c, "gm"), this.DECTAB[c]);
	};
	return str;
};


function ds_val(args, dataset) {
	var num = 0;
	for (var i = 0; i < dataset.axes.length; i++) {
		var index = args[dataset.axes[i].name];
		var step = serialize_axes(dataset.axes, i + 1);
		num += step * index;
	};
	return dataset.data[num];
};

function serialize_axes(query_axes, start) {
	var n = 1;
	for (i = start; i < query_axes.length; i++) {
		n *= query_axes[i].members.length;
	};
	return n;
};


// encode axis name and memebers
function axis_enc(axis_name, members) {
	var enc_members = [];
	var enc_name = null;
	if (axis_name != null)
		enc_name = ch_enc(axis_name);
	if (members != null) {
		for (var i = 0; i < members.length; i++) {
			enc_members[i] = encode(members[i]);
		};
	};
	return {
		"name" : enc_name,
		"members" : enc_members
	};
};

function error(response) {
	if (response != null && typeof(response.error) != "undefined") {
		// this is a server response or error
		if (response.error == 0) {
			// this is a message
			// show the processing tip
			window.broadcaster.sendMessage(WM_POST_MESSAGE, {
						error : 0,
						message : response.message
					});
		} else {
			// a error
			window.broadcaster.sendMessage(WM_POST_MESSAGE, {
						error : 1,
						message : response.message
					});
		};
		return true;
	};
	// let others to handler this response
	return false;
};

function debug($s) {
	console.log($s);
};

/**
 * get user action depth
 */
function getUsageDepth() {
	var ur = get_cookie('__gp_');
	if (!is_empty(ur)) {
		return ur;
	};
	return 9999;
};

function setUsageDepth(step) {set_cookie("__gp_", step, 9999);};

function showtip(target,text,gravity,offset){
	if ($(target) != null) {
        $(target).attr("tip", text);
        $(target).tipsy({
                    trigger : 'manual',
                    gravity : gravity,
                    title : "tip",
                    offset : offset,
                    fade : true
                });
        $(target).tipsy("show");
    };
};

function cleartip(){
	$(".tipsy").css("display", "none");
};

String.prototype.trim = function() {
	return this.replace(/(^\s*)|(\s*$)/g, "");
};
// is str empty
function is_empty(str) {
	if (str == 'undefined' || str == 'null' || str == null || str.trim() == "") {
		return true;
	};
	return false;
};
// check browser
function is_browser_supported() {
	var ua = navigator.userAgent.toLowerCase(), isOpera = /opera/.test(ua), isChrome = /chrome/
			.test(ua), isSafari = !isChrome && /safari/.test(ua), isFirefox = /firefox/
			.test(ua), isIE = !isOpera && /msie/.test(ua), isIE9 = isIE
			&& /msie 9/.test(ua), isIE8 = isIE && /msie 8/.test(ua), isIE7 = isIE
			&& /msie 7/.test(ua),isIE10 = isIE && /msie 10/.test(ua);

	if (!isChrome && !isSafari && !isFirefox && !isIE9 && !isIE8 && !isIE7 && !isIE10) {
		return false;
	};
	return true;
};

function is_ie() {
	var ua = navigator.userAgent.toLowerCase(), isOpera = /opera/.test(ua), isIE = !isOpera
			&& /msie/.test(ua);

	return isIE;
};

function get_cookie(c_name) {
	if (document.cookie.length > 0) {
		var c_start = document.cookie.indexOf(c_name + "=");
		if (c_start != -1) {
			c_start = c_start + c_name.length + 1;
			c_end = document.cookie.indexOf(";", c_start);
			if (c_end == -1)
				c_end = document.cookie.length;
			return unescape(document.cookie.substring(c_start, c_end));
		};
	};
	return "";
};

function set_cookie(c_name, value, expire) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + expire);
	document.cookie = c_name + "=" + escape(value)
			+ ((expire == null) ? "" : ";expires=" + exdate.toGMTString())
			+ ";path=/";
};

function del_cookie(c_name, path, domain) {
	if (get_cookie(c_name))
		document.cookie = c_name + "=" + ((path) ? ";path=" + path : "")
				+ ((domain) ? ";domain=" + domain : "")
				+ ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
};

function ds_axis(name, dataset) {
	for (var i = 0; i < dataset.axes.length; i++) {
		if (dataset.axes[i].name == name) {
			return dataset.axes[i];
		};
	};
};
/**
 * show loading div
 * @param {} el : element, target element
 * @param {} text: string, loading text
 * @param {} mask: true or false, if mask the background
 * @param {} timeout int
 */
function loading_show(el, text, mask, timeout) {
	var background = document.createElement('div');
	var loadingEl = document.createElement('div');
	
	var offset = $(el).offset();
	var width = $(el).width();
	var height = $(el).height();
	if(!width || !height || width == 0 || height == 0) {
		throw new Error('width and height must be defined.');
	};
	
	// background style
	background.className = 'idas_loading_div';
	loadingEl.className = 'sprtldrtxt round shdw unselectable';
	$(el).append(background);
	$(background).append(loadingEl);
	$(loadingEl).html(text);
	
	var position = $(el).css('position');
	var left = offset.left;
	var top = offset.top;
	if(position && (position === 'relative')) {
		left = 0;
		top = 0;
	};
	
	$(background).css({
		width: width,
		height: height,
		left: left,
		top: top
	});
	
	var padding_top = 15, padding_left = 23;
	// center processbar
	var pwidth = $(loadingEl).width();
	var pheight = $(loadingEl).height(); 
	var pleft = (width-pwidth-padding_left)/2+left;
	var ptop = (height-pheight-padding_top)/2+top;
	$(loadingEl).css({
		left: pleft,
		top: ptop,
		padding: padding_top + 'px ' + padding_left +'px'
	});
	// if mask, set black for background
	if(mask) {
		$(background).css({
			background: 'black'
		});
	};
	// timeout
	if(timeout) {
		setTimeout(function() {
			loading_hide(el);
		}, timeout);
	};
};
/**
 * hide loading div
 * @param {} el
 * @param {} text
 */
function loading_hide(el, text) {
	var loading_el = $(el).find('.idas_loading_div');
	if(!loading_el || loading_el.length == 0) {
		return;
	};
	$(loading_el).remove();
};
/**
 * chart color array
 * @type 
 */
window.COLOR_ARRAY = ['27a5cf', 'cf2b27', '3fcf27', '8de894', '339999',
            'cfc527', '834e00', '6f6c6f', '669933', 'ff0000', 'ff9900',
            '9900cc', 'bbbbbb', '330033'];
function colors(i) {
	return COLOR_ARRAY[i%COLOR_ARRAY.length];
};

/**
*	validate file name
**/
function validate_fn(name){
	var reg = /^[^*/\\?:|<>\"]+$/g;
	return reg.test(name);
};

/**
*	validate function
**/
function validate_func(str){
	var reg = /([\s\S]*)\(([\s\S]*)\)/;
	return reg.test(str);
};/**
 * rpt.js 0.0.1 
 * Jacky Yang
 * 
 */
window.report = {};

window.report.LayoutConfig = Backbone.Model.extend({ 

    parse:function( data ) {
    	//create container model
        var containers = [];
    	for(var i = 0; i < data.containers.length; i++){
        	var m = new Backbone.Model(data.containers[i]);
        	containers.push(m);
        };
        // copy attributes
    	this.set({
                  id:      data.id,
                  tile:	   data.tile,
                  cols:	   data.cols,
                  rows:	   data.rows,
                  state:   data.state,
                  containers:containers,
                  title:   data.title,
                  desc:	   data.desc
        		 });
    }
});


/** layout **/
window.report.Layout = Backbone.View.extend({
    width:800,
    height:800,
    tileSize:64,
    containers:[],
 
    _initialize: function( ){
    	$('#' + this.options.wrapper).append($(this.el));
        this.model.on("change",this.render,this);
    },
    
    render: function(){
        this.width = $('#layout').width();
        this.height = 2000;
        this.cols = this.model.get('cols');
        this.rows = this.model.get('rows');
        this.tileSize = Math.floor(this.width/this.model.get('tile'));
        
    	$(this.el).width(this.width);
        $(this.el).height(this.height);
    	$('title').text(this.model.get("title"));
        $('#t').text(this.model.get("title"));
        $('#d').text(this.model.get("desc"));
        var cms = this.model.get('containers');
        for(var i = 0; i < cms.length; i++){
           this.place(cms[i]);
        };
    	return this;
    },
    
    //model:container model
    place:function( block ) {
        var c = new window.report.Container({ model:block,layout:this});
        this.containers.push(c.render());
    }
});




//////// container
window.report.Container = Backbone.View.extend({
     cm:null,
     content:null,
     layout:null,

     _initialize: function(){
       //init a chart model
       this.layout = this.options.layout;
       if(this.layout == "undefined"){
       		alert("report.js line 106: container layout must be set");
       };
       // set block position
       var left = this.model.get("x") * this.layout.tileSize;
       var top =  this.model.get("y") * this.layout.tileSize;
       var width = this.model.get("width") * this.layout.tileSize;
       var height = this.model.get("height") * this.layout.tileSize;
       $(this.el).css("position","absolute");
       $(this.el).css("display","block");
       $(this.el).css("left",left);
       $(this.el).css("top",top);
       $(this.el).css("width",width);
       $(this.el).css("height",height);
       $(this.layout.el).append($(this.el));
    },
    
    /** 
     * display the chartView after chartModel loaded
     */
    render: function(){
    	var w = $(this.el).width();
        var h = $(this.el).height();
        //load chart 
        var id = this.model.get('id');
        this.content = new window.report.Chart({
        												id:id,
                                                        url:this.model.get('url'),
                                                        type: this.model.get('type'),
                                                        width: w,
                                                        height: h
                                                    });
        $(this.el).append('<span class="title">' +this.model.get('name') + '</span>');
        $(this.el).append($(this.content.el));
        this.content.render();
        return this;
    }
});


window.report.Chart = Backbone.View.extend({
	tag:"div",
    view:{},
    handle:null, //process query data
    
    _initialize:function(){
        $(this.el).attr("id",this.options.id);
        this.url = this.options.url;
        this.model = new window.plugin[this.options.type]();
    },
    
    /** 
     * data proxy
     * read data from local
     */
    proxy:function(){
    	return window.rpt_data.charts[this.url];
    },
    
    render:function(){
        var options = {
	    	container:this.options.id,
		  	"type":this.options.type,
		  	width: this.options.width,
	        height: this.options.height, 
		  	margin: this.model.custom.margin,
		  	canvas:{ platform:"HTML5"}
	    };
	    var chart = new B2(options);
	    chart.render(this.proxy().config.cdata);
        
        return this;
    }
});
/**
 * 
 * @param {} options
 */
B2 = function(options) {
	this.options = null;
	this.canvas = null;
    this.masker = null;
    
	this.init = function(options) {
		if(this.validate(options)) {
			if(this.g) {
				this.g.clear();
			};
            var w = options.width;
            var h = options.height;
			this.el = document.createElement("div");
            $('#'+options.container).append(this.el);
            $('#'+options.container).css({
            	position: "relative",
            	width: w,
            	height: h
            });
            $(this.el).css({
            				position:"relative",
                            width:w,
                            height:h
                            });
        	//create canvas
            this.canvas = document.createElement('div');
		    $(this.el).append(this.canvas);
            $(this.canvas).css({
                position: 'absolute',
                width: w,
                height: h,
                left:0,
                top:0
            });
        
            this.masker = document.createElement('div');
            $(this.el).append(this.masker);
            $(this.masker).css({
            	position: 'absolute',
                width:w,
                height:h,
                left:0,
                top:0,
                'z-index':100,
                'background-color': '#fff',
                'filter':'alpha(opacity=0)',
                '-moz-opacity':0,
                opacity: 0
            });
            this.g = new B2.Graphics(options,this.canvas);
	    	this.e = new B2.Evt(this,this.masker);
			//init graphics
	        this.c = new B2.chart[options.type](this, options);
		}
	};
	
    this.size=function(w,h){
        $(this.el).css({width:w,height:h});
        $(this.canvas).css({width: w,height: h});
        $(this.masker).css({width:w,height:h});
        this.c.width = w;
        this.c.height = h;
    };
    
	this.trigger = function(e){
		this.c.handler(e);
	};
	
	this.render = function(d){
        this.c.setdata(this.g, d);
    };
    
    this.export_image = function(type){
    	this.g.dump(type);
    };
    
    this.validate = function(options){
    	this.options = options;
    	var type = options.type;
    	if(_.isUndefined(B2.chart[type])){
    		throw new Error('undefined chart type error');
        };
        return true;
    };
    
    this.init(options);
};/**
 * 
 *
 */
B2.Graphics = function(options,wrapper){

	this.canvas = null;
	this.i = 0;//graphics buffer index
	this.options = null;
	/**
     * init graphics
     */
	this.init = function( options,wrapper ){
		this.options = options;
		var p =  options.canvas.platform;
		if(typeof(window.B2.Graphics.Canvas[p]) == "undefined"){
			alert("not implement canvas:" + p);
		};
		this.canvas = new window.B2.Graphics.Canvas[p](options,wrapper);
    };
    
    this.basic_style = function (style){
    	// default style
    	if(_.isUndefined(style)) {
    		style = {};
    	};
    	if(_.isUndefined(style.thick)) {
			style.thick = 1;
		};
		if(_.isUndefined(style.alpha)) {
			style.alpha = 1.0;
		};
		if(_.isUndefined(style.fill)) {
			style.fill = false;
		};
    	return style;
    };
    
    this.text_style = function(style) {
    	if(_.isUndefined(style)) {
    		style = {};
    	};
    	var font = B2.chart.defaultOptions.font;
    	if(_.isUndefined(style.bold)) {
			style.bold = font.bold;
		};
		if(_.isUndefined(style.size)) {
			style.size = font.size;
		};
		if(_.isUndefined(style.type)) {
			style.type = font.type;
		};
		if(_.isUndefined(style.align)) {
			style.align = font.align;
		};
		if(_.isUndefined(style.textBaseline)) {
			style.textBaseline = font.textBaseline;
		};
		if(_.isUndefined(style.color)) {
			style.color = font.color;
		};
		return style;
    };
    
    /**
     * draw line
     */
    this.line = function(fx, fy, tx, ty, color, style){
    	var s = this.basic_style(style);
    	this.canvas.call("line", {fx:fx, fy:fy, tx:tx, ty:ty, color:color, style:s}); 
    };
    
    
    /**
     * draw rect 
     */
    this.rect = function(x, y, w, h, color, style){
    	var s = this.basic_style(style);
    	this.canvas.call("rect", {x:x, y:y, w:w, h:h, color:color, style:s}); 
    };
    
    /**
     * draw circle 
     */
    this.circle = function(ox, oy, r, color, style){
    	var s = this.basic_style(style);
    	this.canvas.call("circle", {ox:ox, oy:oy, r:r, color:color, style:s}); 
    };
    
    this.polo = function(pl, color, style){
    	var s = this.basic_style(style);
    	this.canvas.call("polo", {pl:pl, color:color, style:s});
    };
    
    this.wedge = function(x, y, ir, or, aStart, aEnd, color, style){
    	var s = this.basic_style(style);
    	this.canvas.call("wedge", {x:x, y:y, ir:ir, or:or, aStart:aStart, aEnd:aEnd, color:color, style:s}); 
    };
    
    this.text = function(x, y, text, style, width){
    	var s = this.text_style(style);
    	if(_.isUndefined(width)) { width = 0; };
    	this.canvas.call("text", {x:x, y:y, text:text, style:s, width:width}); 
    };
    
    this.clear = function(){
    	this.canvas.call("clear", {}); 
    };
    
    this.begin = function(){
    	this.canvas.call("set_buff", {i:++this.i%2}); 
    };
    
    this.end = function(){
    	if( this.i != 1){
    		this.canvas.call("flush_buff", {i:this.i%2}); 
    	};
    };
    
    this.dump = function(type){
    	this.canvas.call("export_image",{type:type});
    };
    
    /**
     *  set the display clip area, not include text
     */
    this.clip = function(x,y,w,h){
    	this.canvas.call("clip", {x:x,y:y,w:w,h:h});
    };
    
    this.measureText = function(text, fsize) {
    	return this.canvas.call("measureText", {text: text, fsize: fsize});
    };
    
    this.init(options,wrapper);
};
B2.Evt = function(b2,masker){
	// b ->B2
	this.b2 = b2;
    /** 
     * pre mouse position, use to caculate the distance  
     * mouse moved, so we can avoid too many mouse move events
     */
    this.pre_mouse = {x:-999,y:-999};
    this.delay = 0;
    
	this.init = function(masker){
        this.el = masker;
        $(this.el).bind('mousemove', _.bind(this.mousemove, this));
        $(this.el).bind('mouseup',  _.bind(this.mouseup, this));
        $(this.el).bind('mousedown',  _.bind(this.mousedown, this));
	};
	
	
	this.setTimer = function() {
		this.delay++;
		if(this.delay > 4) {
			if(Math.pow(this.coordX-this.pre_mouse.x,2) + Math.pow(this.coordY-this.pre_mouse.y,2) > 4){
	    		this.b2.trigger( {name:"mousemove", param:{x:this.coordX, y:this.coordY} });
	        };
			this.stopTimer();
		};
	};
	
	this.startTimer = function() {
		this.timer = setInterval(_.bind(this.setTimer, this), 50);
	};
	
	this.stopTimer = function() {
		clearInterval(this.timer);
		this.delay = 0;
	};
	
	this.startTimer();
	
	this.mousemove = function(e){
		this.stopTimer();
		this.startTimer();
		
		var e = e||window.event;
        var offset = $(this.el).offset();
        var top = document.documentElement.scrollTop;
        if(top == 0) {
        	top = document.body.scrollTop;
        };
		this.coordX = e.clientX+document.body.scrollLeft-offset.left;
		this.coordY = e.clientY+top-offset.top;
	};
	
	this.mouseup = function(e){
		var e = e||window.event,
		coordX = e.pageX||e.clientX+document.body.scrollLeft,
		coordY = e.pageY||e.clientY+document.body.scrollTop;
//		this.b.ehandler( {name:"mousemove", param:{x:coordX, y:coordY} });
	};
	
	this.mousedown = function(e){
		var e = e||window.event,
		coordX = e.pageX||e.clientX+document.body.scrollLeft,
		coordY = e.pageY||e.clientY+document.body.scrollTop;
//		this.b.ehandler( {name:"mousemove", param:{x:coordX, y:coordY} });
	};
	
	this.init(masker);
};B2.Graphics.Canvas = {};

function ping( id ) {
	var instance = window.B2.Graphics.Canvas.Fl.__LIST[id];
	instance.on_swf_ready();
};

function __export_image(data,name){
	var form = document.createElement("form");
	document.body.appendChild(form);
	form.innerHTML = '<input type="hidden" name="data" value="' + data + '"/><input type="hidden" name="img_name" value="' + name + '"/>';
	form.action = window.urls.export_image;
	form.method = 'POST';
	form.target = "_blank";
	form.submit();
	
	document.body.removeChild(form);
};

function getSwf(id) {
	 return (navigator.appName.indexOf("Microsoft") != -1) ? window[id] : document.getElementById(id);
};

/**
 * 
 * 
 * 
 */
B2.Graphics.Canvas.Fl = function(options,wrapper){
	this.id = options.container+'-fl'+ Math.floor(Math.random()*1000);
	this.swf = null;
	this.callstack = [];
    
	var swfUrl = options.canvas.param.url;
	 /**
	  *
	  */
	this.init = function( options,wrapper){
    	 var swfholder = document.createElement('div');
         $(swfholder).attr("id",this.id);
         $(wrapper).append(swfholder);
		 /**  init swf canvas **/
		 var flashvars = {
		     width:options.width,
		 	 height:options.height
		 };
         var params = {
            menu: "false",
            scale:"noscale",
            wmode:"transparent",
            allowScriptAccess:"always"
         };
         var attributes = {
            id: this.id,
            wmode:"transparent"
         };
		 swfobject.embedSWF( swfUrl +"?id="+ attributes.id,  attributes.id , options.width,  options.height, "10.0.0","expressInstall.swf", flashvars, params, attributes);
		 this.id = attributes.id;
		 window.B2.Graphics.Canvas.Fl.__LIST[attributes.id] = this;
	 };


	 this.on_swf_ready = function () {
		 this.swf = getSwf(this.id);
		 try{
			 this.swf.ping();
		 }catch(e){
			 this.swf = null;
			 return;
		 };
		 for( var i = 0 ; i < this.callstack.length; i++ ){
			 var cmd = this.callstack[i];
			 this.call(cmd.what,cmd.param);
		 };
		 this.callstack.length = 0;
	 };
	 
	 /**
	  *
	  */
	 this.call = function(what, param){
		 if(this.swf == null){
			 this.callstack.push({what:what,param:param});
			 return;
		 };
		 
		 try{
			 switch(what){
			 	case "line":
			 		this.swf.Line(param.fx, param.fy, param.tx, param.ty, param.color, param.style);
			 		break;
			 	case "rect":
			 		this.swf.Rect(param.x, param.y, param.w, param.h, param.color, param.style);
			 		break;
			 	case "circle":
			 		this.swf.Circle(param.ox, param.oy, param.r, param.color, param.style);
			 		break;
			 	case "polo":
			 		this.swf.Polo(param.pl, param.color, param.style);
			 		break;
			 	case "wedge":
			 		this.swf.Wedge(param.x, param.y, param.ir, param.or, param.aStart, param.aEnd, param.color, param.style);
			 		break;
			 	case "text":
			 		this.swf.Text(param.x, param.y, param.text, param.style, param.width);
			 		break;
			 	case "clear":
			 		this.swf.Clear();
			 		break;
			 	case "set_buff":
			 		this.swf.SetBuff(param.i);
			 		break;
			 	case "flush_buff":
			 		this.swf.FlushBuff(param.i);
			 		break;
			 	case "export_image":
			 		this.swf.export_image(param.type+".png");
			 		break;
			 	case "clip":
			 		this.swf.clip(param.x, param.y, param.w, param.h);
			 		break;
			 	case "measureText":
					return this.swf.measureText(param.text, param.fsize);
		 		break;
			 };
		 }catch(e){
			 return;
		 };
	 };
	 
	 this.init(options,wrapper);
 };
 
window.B2.Graphics.Canvas.Fl.__LIST = [];
 


 
window.B2.Graphics.Canvas.HTML5 = function(options,wrapper){
	
	this.init = function(options,wrapper){
		var opt = _.clone(options);
		this.html5 = new HTML5Canvas(opt, wrapper);
	};
	
	 this.call = function(what, param){
		 switch(what){
		 	case "line":
		 		this.html5.line(param.fx, param.fy, param.tx, param.ty, param.color, param.style);
		 		break;
		 	case "rect":
		 		this.html5.rect(param.x, param.y, param.w, param.h, param.color, param.style);
		 		break;
		 	case "circle":
		 		this.html5.circle(param.ox, param.oy, param.r, param.color, param.style);
		 		break;
		 	case "polo":
		 		this.html5.polo(param.pl, param.color, param.style);	
		 	case "wedge":
		 		this.html5.wedge(param.x, param.y, param.ir, param.or, param.aStart, param.aEnd, param.color, param.style);
		 		break;
		 	case "text":
		 		this.html5.text(param.x, param.y, param.text, param.style, param.width);
		 		break;
		 	case "set_buff":
		 		this.html5.setBuff(param.i);
		 		break;
		 	case "flush_buff":
		 		this.html5.flushBuff(param.i);
		 		break;
	 		case "export_image":
		 		this.html5.export_image(param.type+".png");
		 		break;
		 	case "clear":
		 		this.html5.clear();
		 		break;
			case "clip":
				this.html5.clip(param.x, param.y, param.w, param.h);
		 		break;
		 	case "measureText":
				return this.html5.measureText(param.text, param.fsize);
		 		break;
		 };
	 };
	 
	 this.init(options,wrapper);
 };/**
 * HTML5 Canvas
 */
(function() {

	HTML5Canvas = function(options,wrapper) {
		this.options = options;
		this.el = wrapper;
		this._initCanvas();
		this.ctx = this.bic;
	};

	HTML5Canvas.prototype = {
		setBuff: function() {
			this.clear();
			this.ctx = this.bic;
		},
		
		flushBuff: function() {
			this.rc.drawImage(this.buffInnerCanvas, 0, 0);
			this.rc.drawImage(this.buffOuterCanvas, 0, 0);
		},
		
		line : function(fx, fy, tx, ty, color, style) {
			this.ctx.save();
			this.ctx.lineWidth = style.thick;
			this.ctx.globalAlpha = style.alpha;
			this.ctx.strokeStyle = this._fc(color);
			if(fy !== ty && fx !== tx) {
				this.ctx.beginPath();
				this.ctx.moveTo(fx, fy);
				this.ctx.lineTo(tx, ty);
			} else {
				this.ctx.translate(Math.floor(fx), Math.floor(fy));
				this.ctx.beginPath();
				if(fy === ty) {
					this.ctx.moveTo(0, -0.5);
					this.ctx.lineTo(Math.floor(tx-fx)+0.5, -0.5);
				} else if(fx === tx) {
					this.ctx.moveTo(-0.5, 0);
					this.ctx.lineTo(-0.5, Math.floor(ty-fy)+0.5);
				};
			};
			
			this.ctx.stroke();
			this.ctx.closePath();
			this.ctx.restore();
		},
		
		rect : function(fx, fy, width, height, color, style) {
			this.ctx.save();
			this.ctx.fillStyle = this._fc(color);
			this.ctx.globalAlpha = style.alpha;
			if(style.fill === true) {
				this.ctx.fillRect(fx, fy, width, height);
			};
			if(style.thick > 0) {
				this.ctx.lineWidth = style.thick;
				this.ctx.strokeStyle = this._fc(color);
				this.ctx.strokeRect(fx, fy, width, height);
			};
			this.ctx.restore();
		},
		
		circle : function(fx, fy, radius, color, style) {
			this.ctx.save();
			this.ctx.fillStyle = this._fc(color);
			this.ctx.strokeStyle = this._fc(color);
			this.ctx.lineWidth = style.thick;
			this.ctx.beginPath();
			this.ctx.arc(fx, fy, radius, 0, Math.PI*2, true);
			this.ctx.globalAlpha = style.alpha;
			this.ctx.closePath();
			this.ctx.fill();
			this.ctx.restore();
		},
		
		wedge : function(x, y, ir, or, aStart, aEnd, color, style) {
			this.ctx.save();
			this.ctx.globalAlpha = style.alpha;
			this.ctx.lineWidth = style.thick;
			this.ctx.beginPath();
			
			var step = 1;
			// More efficient to work in radians
			var degreesPerRadian = Math.PI / 180;
			aStart *= degreesPerRadian;
			aEnd *= degreesPerRadian;
			step *= degreesPerRadian;
			
			// Draw the segment
			this.ctx.moveTo( x + ir * Math.cos(aStart), y + ir * Math.sin(aStart) );
			for ( var theta = aStart; theta < aEnd; theta += Math.min(step, aEnd - theta) ) {
				this.ctx.lineTo( x + or * Math.cos(theta), y + or * Math.sin(theta) );
			}
			this.ctx.lineTo( x + or * Math.cos(aEnd), y + or * Math.sin(aEnd) );
			this.ctx.lineTo( x + ir * Math.cos(aEnd), y + ir * Math.sin(aEnd) );
			for ( theta = aEnd; theta > aStart; theta -= Math.min(step, theta - aStart) ) {
				this.ctx.lineTo( x + ir * Math.cos(theta), y + ir * Math.sin(theta) );
			}
			
			this.ctx.closePath();
			if(style.fill === true) {
				this.ctx.fillStyle = this._fc(color);
				this.ctx.fill();
			};
			this.ctx.restore();
		},
		
		polo : function(array, color, style) {
			this.ctx.save();
			this.ctx.lineWidth = style.thick;
			this.ctx.fillStyle = this._fc(color);
			this.ctx.globalAlpha = style.alpha;
			this.ctx.beginPath();
			this.ctx.moveTo(array[0].x, array[0].y);
			for(var i=1; i<array.length; i++) {
				this.ctx.lineTo(array[i].x, array[i].y);
			};
			this.ctx.lineTo(array[0].x, array[0].y);
			if(style.fill === true) {
				this.ctx.fill();
			};
			if(style.thick > 0) {
				this.ctx.strokeStyle = this._fc(color);
				this.ctx.stroke();
			};
			this.ctx.closePath();
			this.ctx.restore();
		},
		
		text: function(x, y, text, style, maxWidth) {
			this.ctx.save();
			this.ctx.fillStyle = this._fc(style.color);
		    this.ctx.font = (style.bold ? "bold " : "") + (style.size) + "px " + style.type;
		    this.ctx.textAlign = style.align;
		    if(style.textBaseline) {
		    	this.ctx.textBaseline = style.textBaseline;
		    };
		    
		    var xoffset = 0, xx = 0, yy = 0, back_xx = 0;
		    if(maxWidth == undefined) {
		    	maxWidth = 0;
		    };
		    if(this.ctx.textAlign === 'right') {
		    	xoffset = maxWidth;
		    } else if(this.ctx.textAlign === 'center') {
		    	xoffset = maxWidth/2;
		    };
		    
		    // if has rotation, then rotate it
		    if(style.rotation && style.rotation != 0) {
		    	this.ctx.translate(x, y);
    			this.ctx.rotate(style.rotation* Math.PI/180);
    			xx = xoffset;
    			yy = 0;
		    } else {
		    	xx = x+xoffset;
		    	yy = y;
		    }
		    
		    // set background rect x
		    var twidth = this.ctx.measureText(text).width;
		    if(this.ctx.textAlign === 'left') {
		    	back_xx = xx;
		    } else if(this.ctx.textAlign === 'center') {
		    	back_xx = xx+twidth/2-twidth;
		    } else if(this.ctx.textAlign === 'right') {
		    	back_xx = xx-twidth;
		    };
		    
		     // if has background style, draw background
		    var background = style.background;
		    if(background) {
		    	if(background.color) {
		    		this.rect(back_xx-2, yy, twidth+4, 16, background.color, {fill: true, thick:1, alpha:0.8});
		    	};
		    };
		    // draw text
		    if(maxWidth == 0) {
		    	this.ctx.fillText(text, xx, yy);
	    	} else {
	    		this.ctx.fillText(text, xx, yy, maxWidth);
	    	};
		   
		   	this.ctx.restore();
		},
		
		export_image: function(name) {
			var mime = 'image/png',
			    data = this.realCanvas.toDataURL(mime),
			    hh = "data:image/png;base64,",
				data = data.substring(hh.length);
			    
			__export_image(data, name);    
		},
		
		clear: function() {
			this.rc.clearRect(0, 0, this.realCanvas.width, this.realCanvas.height);
			this.boc.clearRect(0, 0, this.buffOuterCanvas.width, this.buffOuterCanvas.height);
			this.bic.clearRect(0, 0, this.buffInnerCanvas.width, this.buffInnerCanvas.height);
		},
		
		clip: function(x, y, w, h) {
			this.boc.rect(x, y, w, h);
			this.boc.clip();
			this.ctx = this.boc;
		},
		
		measureText: function(text, fsize) {
			this.ctx.font = fsize + "px Arial";
			var o = this.ctx.measureText(text);
			return o.width;
		},
        
		/**
		 * format color
		 */
		_fc: function(color) {
			return "#" + color;
		},

		_initCanvas : function() {
			var el = this.el, o = this.options;
			this.realCanvas = getCanvas(this.realCanvas, 'canvas');
			this.buffInnerCanvas = getCanvas(this.buffInnerCanvas, 'canvas');
			this.buffOuterCanvas = getCanvas(this.buffOuterCanvas, 'canvas');
			
			this.rc = getContext(this.realCanvas);
			this.bic = getContext(this.buffInnerCanvas);
			this.boc = getContext(this.buffOuterCanvas);
			
			this.clear();
			/**
			 * get Canvas
			 */
			function getCanvas(canvas, name) {
				if (!canvas) {
					canvas = document.createElement('canvas');
					el.appendChild(canvas);
				};
				canvas.setAttribute('width', o.width);
				canvas.setAttribute('height', o.height);
				canvas.style.cssText = 'position:absolute;left:0px;top:0px;';
				return canvas;
			};
			/**
			 * get Context
			 */
			function getContext(canvas) {
//				if (window.G_vmlCanvasManager)
//					window.G_vmlCanvasManager.initElement(canvas);
				var context = canvas.getContext('2d');
//				if (!window.G_vmlCanvasManager)
//					context.scale(1, 1);
				return context;
			};
		}
	};

})();B2.chart = {};
/**
 * default options
 * @type 
 */
B2.chart.defaultOptions = {
    margin: [10,10,50,30],
    colors: ['27a5cf', 'cf2b27', '3fcf27', '8de894', '339999',
            'cfc527', '834e00', '6f6c6f', '669933', 'ff0000', 'ff9900',
            '9900cc', 'bbbbbb', '330033'],
            
    font: {
        color: '000000',
        size: 10,
        bold: false,
        type: 'Arial',
        align: 'left',
        textBaseline: 'hanging'
    },
    
    grid: {
        color: 'DDDDDD'
    },
    
    xaxisLabel: {
        bold: true,
        align: 'center'
    },
    
    yaxisLabel: {
    	bold: true,
        align: 'center',
        rotation: 270
    },
    
    xaxis: {
        showLabels: true,
        align: 'center'
    },
    
    yaxis: {
        showLabels: true,
        align: 'right'
//        textBaseline: 'middle'
    },
    
    tip: {
    	font: {
    		color: 'ffffff'
    	},
        background: {
            color: '000000',
            alpha:0.5,
            fill:true,
            thick:1
        }
    }
};

/**
 * draw tip
 */
function draw_tooptip(g, x, y, text, w) {
		var xoff = 0;
    var tw = g.measureText(text, 10);
    if(x + tw > w){
        xoff = tw-8;
    } else {
    		xoff = 8;
           };
	
    g.polo([
             {x:x-4,y:y+2},
             {x:x+4,y:y+2},
             {x:x,y:y+6},
             {x:x-4,y:y+2}
            ],
            '000000',
            {fill:true,alpha:1,thick:1}
            );
    g.text(x-xoff,y-13,text,{color:"ffffff",align:"left",size:10, background:{color:"000000"}});
};
/**
 * format val to thousand units
 * @param {} val
 * @return {}
 */
function format_num(val,precision){
	if(val > 1000) {
		return (val/1000).toFixed(1) + "k";
	} else {
        if(precision != undefined)
		  return val.toFixed(precision);
        else 
          return val;
	};
};
/**
 * ������ӷ�����
 * float add
 */
function FloatAdd(arg1,arg2){
	var r1,r2,m;
	try{r1=arg1.toString().split(".")[1].length;}catch(e){r1=0;};
	try{r2=arg2.toString().split(".")[1].length;}catch(e){r2=0;};
	m=Math.pow(10,Math.max(r1,r2));
	return (arg1*m+arg2*m)/m;
};
/**
 * merge the dest to srs
 * @param {} src
 * @param {} dest
 * @return {}
 */
function merge(src, dest) {
    var i, v, result = dest || {};
    for (i in src) {
        v = src[i];
        if (v && typeof(v) === 'object') {
            if (v.constructor === Array) {
                result[i] = _.clone(v);
            } else if (v.constructor !== RegExp && !_.isElement(v)) {
                result[i] = merge(v, (dest ? dest[i] : undefined));
            } else {
                result[i] = v;
            };
        } else {
            result[i] = v;
        };
    };

    return result;
};

/**
 * roundup the axis min, max values
 */
function roundup(min,max){
	if(min == 0 && max == 0){
		return {min:0,max:1,step:1};
	};
	var d = max - min;
    var n = Math.floor(Math.log(d)/Math.log(10));
    var upper = Math.pow(10, n+1);
    var precient = [0.2,0.5,1];
    var adj_max = 0;
    for( var i = 0; i < precient.length; i++ ){
    	var tmp = precient[i]*upper;
        if( d <= tmp ){
        	d = tmp;
            break;
        };
    };
    var step = d/10;
    var t = min/step;
    var k = (t-Math.floor(t)) < 0.000000001;
    if(min<0){
    	var m = Math.ceil(min/step);
    	var adj_min = k==true?min:step*(m-1);
    }else{
    	var m = Math.floor(min/step);
    	var adj_min = 0;
    	if(m > 0) {
    		adj_min = k==true?(min-step):step*(m-1);
    	};
    };
    var m = Math.floor(max/step);
    var t = max/step;
    var k = (t-Math.floor(t)) < 0.000000001;
    var adj_max = k==true?max:step*(m+1);
    return {min:adj_min,max:adj_max,step:step};
};/**
 * legend component
 */
if(_.isUndefined(B2.component)) {
	B2.component = {};
};

B2.component.Legend = function( opt) {
	this.opt = opt;
	// el
	var el = document.createElement("div");
	//el.className = container + '-legend';
    this.el = $(el);
	this.el.css({
		width: opt.width,
		height: opt.height,
		position:'relative',
		'overflow-x':'hidden',
		'overflow-y': 'visible',
		display: 'none',
		'filter':'alpha(opacity=0.8)',
        '-moz-opacity':0.8,
        opacity: 0.8
	});
	
	this.height =  this.el.height();
	this.width =  this.el.width();
};

B2.component.Legend.prototype = {
	hide: function() {
		this.el.css('display', 'none');
	},
	
	show: function(legends) {
		this.el.css('display', 'block');
		this.el.html('');
        // render
        this.render(legends);
	},
	/**
	 * render legend
	 * @return {Boolean}
	 */
	render: function(legends) {
        var labels = [], colors = [];
		if(!_.isUndefined(legends) && _.isArray(legends)) {
			for(var i=0; i<legends.length; i++) {
				var legend = legends[i];
				labels.push(legend.label);
				colors.push(legend.color);
			};
		};
		if(labels.length == 0 || colors.length == 0) {
			this.hide();
			return false;
		};
		
		// caculate rows and cols
		var tmp = 0;
		for(var i = 0; i < labels.length; i++){
			tmp += labels[i].length;
		};
		var str_avg_len = tmp/labels.length*10;
		
		var len = str_avg_len + 16;
		var col = 1;
		while( (col + 1)*len + 10 < this.width ){
			col++;
		};
		var row = Math.ceil(labels.length/col);
		// set height
//		$(this.el).css("height", row*15 + 10);
		var xstart = 1;
		var ystart = 1;
		var xoff = 0;
		var yoff = 0;
		for( var i = 0; i < labels.length; i++ ){
			var label = labels[i];
			if( i == 0 ){
				yoff = 0;
				xoff = 0;
			}else if(xoff + len > this.width){
				xoff = 0;
				yoff += 15;
			};
			var y = ystart + yoff;
			var x = xstart + xoff;
			// draw SingleLegend
			this.drawMarker(x, y, colors[i], label);
			xoff += len;
		};
	},
	/**
	 * render single legend
	 */
	drawMarker: function(x, y, color, label) {
		// draw rect
		var rect = document.createElement('div');
		this.el.append(rect);
		$(rect).css({
			position:'absolute',
			'background-color':'#'+color,
			left: x,
			top: y,
			width: 10,
			height: 10
		});
		// draw text
		var text = document.createElement('div');
		this.el.append(text);
		$(text).css({
			color: '#333333',
			position:'absolute',
			'white-space': 'nowrap',
			'text-overflow': 'ellipsis',
			'font-size': '12px',
			left: x + 12,
			top: y - 4
		});
		$(text).html(label);
	}
};/**
 * Interactive Slider Component
 * @param {} b2
 * @param {} container
 */
if(_.isUndefined(B2.component)) {
	B2.component = {};
};

B2.component.Slider = function(chart, opt) {
	this.opt = opt;
	this.chart = chart;
	this.b2 = this.chart.b2;
    var el = document.createElement("div");
    el.className = this.b2.options.container + '-slider';
    $('#' + this.b2.options.container).append(el);   
    this.el = $(el);
	this.el.css({
		width: opt.width,
		height: opt.height,
		display: 'none',
		'margin-left':opt.left
	});
	this.height =  this.el.height();
	this.width =  this.el.width();
	this.dragerWidth = 4;
	this.labelHeight = 20;
	this.handlerHeight = this.height - this.labelHeight;
	this.dragerTop = this.handlerHeight/2-6;
	//////// overlay
	var overlayDiv = document.createElement('div');
    overlayDiv.className = 'slider-overlay';
    this.overlayEl = $(overlayDiv);
    this.overlayEl.css({
		'z-index':100,
        position:'relative',
        width: '100%',
        height: this.height
    });
    $(this.el).append(this.overlayEl);
     /////// labels
	var labelsDiv = document.createElement('div');
    labelsDiv.className = 'slider-labels';
    this.labelsEl = $(labelsDiv);
    this.overlayEl.append(this.labelsEl);
    
    this.labelsEl.css({
        width: '100%',
        height: this.labelHeight
    });
    /////// handlers
    var selectionEl = document.createElement('div');
    var handlersEl = document.createElement('div');
    handlersEl.className = 'slider-handlers';
    selectionEl.className = 'slider-selection';
    this.handlersEl = $(handlersEl);
    this.selectionEl = $(selectionEl);
    // append
    this.handlersEl.append('<hr style="width:100%;height:1px;background:#27a5cf;position:absolute;margin-top:' + (this.handlerHeight/2) + 'px;"/>');
    this.handlersEl.append(selectionEl);
    this.handlersEl.append(
        '<div class="slider-drag-left"></div>' +
        '<div class="slider-drag-right"></div>'
    );
    this.overlayEl.append(handlersEl);
    // style
    this.leftDrager = this.handlersEl.find('.slider-drag-left');
    this.rightDrager = this.handlersEl.find('.slider-drag-right');
    var dragerStyle = {
        'background-color': '#27a5cf',
        border: '1px solid #fff',
        position: 'absolute',
        height: 12,
        width: 6,
        cursor: 'pointer'
    };
    // set css
    this.leftDrager.css(dragerStyle);
    this.rightDrager.css(dragerStyle);
    this.handlersEl.css({
        position: 'relative',
        border: 1,
        'background': '#fff',
        height: this.handlerHeight,
        width: '100%'
    });
    
    ///// bind events
	this.overlayEl.bind('mousedown', _.bind(this.mousedown, this));
    this.overlayEl.bind('mouseup', _.bind(this.mouseup, this));
    this.overlayEl.bind('mousemove', _.bind(this.mouseover, this));
    
    this.selectionEl.bind('mousedown', _.bind(this.mousedown, this));
    this.selectionEl.bind('mouseup', _.bind(this.mouseup, this));
    this.selectionEl.bind('mousemove', _.bind(this.mouseover, this));
    
    this.leftDrager.bind('mousedown', _.bind(this.mousedown, this));
    this.leftDrager.bind('mouseup', _.bind(this.mouseup, this));
    
    this.rightDrager.bind('mousedown', _.bind(this.mousedown, this));
    this.rightDrager.bind('mouseup', _.bind(this.mouseup, this));
};

B2.component.Slider.prototype = {
	
	slide: function(start, end) {
		this.start = start;
		this.end = end;
		// slide
		this._slide(this._d2p(start), this._d2p(end));
	},
	
	hide: function() {
		this.el.css('display', 'none');
         //resize b2 for display slider
        this.b2.size(this.chart.width, this.b2.options.height);
	},
	
	show: function(labels) {
		this.width = this.chart.width-this.chart.ml-this.chart.mr;
		this.len = labels.length;
		this.scale = this.width / (this.len-1);
		
		var indexArray = [];
		var step = Math.ceil(this.len/10);
		for(var i=0; i<this.len;) {
			indexArray.push(i);
			i = i + step;
		};
		// labels
		this._drawLabels(labels, indexArray);
		this.el.css('display', 'block');
		this.el.css('width', this.width);
        //resize b2 for display slider
        this.b2.size(this.chart.width, this.b2.options.height-this.opt.height);
	},
	
	_d2p: function(d) {
		return this.scale * d;
	},
	
	_p2d: function(p) {
		return Math.floor(p/this.scale);
	},
	
	_slide: function(leftX, rightX) {
		// measure px
		this.startX = Math.min(leftX, rightX);
		this.endX = Math.max(leftX, rightX);
		this.start = this._p2d(this.startX);
		this.end = this._p2d(this.endX);
		this.selectionWidth = Math.abs(this.endX - this.startX);
		// change style
		this.leftDrager.css({ left: leftX, top: this.dragerTop });
		this.rightDrager.css({ left: rightX, top: this.dragerTop });
		this.selectionEl.css({
			left: this.startX,
			width: this.selectionWidth,
			height:8,
			position: 'absolute',
			top: (this.handlerHeight/2)-2,
			'background-color': '#27a5cf',
			'filter':'alpha(opacity=1)',
			'-moz-opacity':1,
			'opacity': 1
		});
	},
	
	_trigger: function(e) {
		this.b2.trigger( {name:"sliderchange", params:{start: this.start, end: this.end}});
	},
	
	_drawLabels: function(labels, indexArray) {
		if(!_.isUndefined(labels) && _.isArray(labels)) {
			var html = '';
			this.labelsEl.html('');
			for(var i=0; i<indexArray.length; i++) {
				var index = indexArray[i];
				var left = this._d2p(index);
				html += '<div class="slider-label" style="position:absolute;left:' + 
							this._d2p(index) + 
							'px;font-size: 8px;">' + 
							labels[index] +
				 		'</div>';
			};
			this.labelsEl.append(html);
		};
	},
	
	_move: function(target, movePos) {
		if(target) {
			if(Math.abs(movePos-this.startPos) <= 1) {
				return false;
			};
			var leftOffset = this.leftDrager.offset(),
				rightOffset = this.rightDrager.offset(),
				leftX = leftOffset.left - this.el.offset().left,
				rightX = rightOffset.left - this.el.offset().left,
				className = target.className;
			
			if(className.indexOf('slider-drag-left') >= 0) {
				leftX = movePos;
			} else if(className.indexOf('slider-drag-right') >= 0) {
				rightX = movePos;
			} else if(className.indexOf('slider-selection') >= 0) {
				leftX =  Math.min(leftX, rightX);
				leftX = leftX + (movePos - this.startPos);
				rightX = leftX + this.selectionWidth;
				this.startPos = movePos;
			};
			
			if(leftX < 0) {
				leftX = 0;
			};
			if(rightX < 0) {
				 rightX = 0;
			}
			if(rightX > this.width) {
				rightX =  this.width;
			};
			if(leftX > this.width) {
				leftX =  this.width;
			};
			this._slide(leftX, rightX);
			this.moved = true;
		};
	},
	
	_getLeftPosition: function(e) {
		var e = e||window.event;
		var left = e.pageX||e.clientX+document.body.scrollLeft;
		coordX = left -  this.el.offset().left;
		return coordX;
	},
	/**
	 * events
	 */
	mousedown: function(e) {
		this.enableMoving = true;
		this.startPos = this._getLeftPosition(e);
		this.target = e.target;
	},
	
	mouseup: function(e) {
		if(this.enableMoving === true && this.moved === true) {
			this._trigger(e);
		};
		this.target = null;
		this.startPos = 0;
		this.enableMoving = false;
		this.moved = false;
	},
	
	mouseover: function(e) {
		var movePos = this._getLeftPosition(e);
		if(this.enableMoving === true) {
			this._move(this.target, movePos);
		}
	}
};
/** 
 *  Bar Chart
 */
B2.chart.Bar = function(b2, opt){
	this.b2 = b2;
	this.opt = merge(opt, _.clone(B2.chart.defaultOptions));
	
    var margin = opt.margin;
	if(_.isUndefined(margin)) {
		margin = [0,0,0,0];
	};
	this.width = opt.width;
	this.height = opt.height;
	this.ml = margin[3];
	this.mr = margin[1];
	this.mt = margin[0];
	this.mb = margin[2];
	
	this.xaxis_window = {start:0,end:0};
	
    /**
     * upon mousemove b2 masker,
     * the mouse will be set to with the mouse x,y position which relative to masker.
     * masker use the same coorderation with this render.
     */
	this.mouse = {x:0,y:0};
	this.data = null;
    if(B2.component != undefined && B2.component.Slider != undefined){
        // add slider
        this.slider = new B2.component.Slider(this, {
    		width:this.width - this.ml - this.mr,
    		height:30,
    		left: this.ml
    	});
	}; 
    /**slider event handler*/
    this.sliderHandler = function(e) {
        this.xaxis_window.start = e.params.start;
        this.xaxis_window.end = e.params.end;
        this.render(this.g,this.data);
	};
   	
	/**
	 * event handers
	 */
	this.handler = function(e){
		if( e.name == "mousemove" ){
			this.mousemoveHandler(e);
		} else if( e.name == "sliderchange" && this.slider != undefined){
			this.sliderHandler(e);
		};
	};
	/**
	 * when data changed, call this method
	 */
	this.setdata = function(g,data){
    	this.g = g;
        this.data = data;
       
    	/************* slider *************************/
       	var groups = data.groups;
		var slider_labels = [];
		var barlen = 0;
		for(var i=0;i<groups.length;i++){
        	var group = groups[i];
        	barlen += group.bars.length;
            slider_labels.push(group.label);
        };
        // max bars when unit bar width is 30px
		var maxbars = Math.ceil((this.width-this.ml-this.mr)/30);
		// if data's bar len > maxbars, then show slider
		if(barlen > maxbars) {
			var slider_step = barlen/groups.length,
				end = Math.floor(maxbars/slider_step);
			
			if(end < groups.length-1) {
				this.xaxis_window = {start:0,end:end};
				this.slider.show(slider_labels, this.width);
				this.slider.slide(this.xaxis_window.start, this.xaxis_window.end);
			} else {
				this.xaxis_window = {start:0,end:groups.length-1};
				this.slider.hide();
			};
		} else {
			// hide slider and change axis window
			this.xaxis_window = {start:0,end:groups.length-1};
            if(this.slider != undefined)
			             this.slider.hide();
		};
        // render
    	this.render(g,this.data);
    };
    
    
	/**
	 * mouseover event handler
	 */
	this.mousemoveHandler = function(e) {
    	this.mouse.x = e.param.x;
        this.mouse.y = e.param.y;
        if(this.data!=null){
        	 this.render(this.g, this.data);
        };
	};
    
    /**
     * test if the given x,y in the rect{x:xx,y:yy,width:ww,height:hh}
     */
	this.hit = function(x,y,xx,yy,ww,hh){
    	var ymin = Math.min(yy,yy+hh);
        var ymax = Math.max(yy,yy+hh); 
        var xmin = Math.min(xx,xx+ww);
        var xmax = Math.max(xx,xx+ww);
    	return ((x>xmin) && (x<xmax)&&(y>ymin) &&(y<ymax));
    };
    /**
     * mapg data and render
     */
	this.render = function(g, data) {
        var ymax = -Number.MAX_VALUE, ymin=Number.MAX_VALUE;
        var has_split = false;
        var bars = [], groups = [];
        //caculate ymax & ymin
        var _start = this.xaxis_window.start, 
        	_end = this.xaxis_window.end;
        
        for(var i=_start;i<=_end;i++){
        	var group = data.groups[i];
        	groups.push(group);
            if(group.bars.length>1){
            	has_split = true;
            };
        	for(var n=0;n<group.bars.length;n++){
            	bars.push(group.bars[n]);
            	var tmp = group.bars[n].value;
        		if(tmp > ymax) ymax = tmp;
            	if(tmp < ymin) ymin = tmp;
            };
        };
        if(groups.length == 0) {
        	return;
        };
        //no bars? return false
        if(bars.length == 0)
        	return false;
        //default, no data
        if(ymin == ymax) {
        	ymin = 0;
        };
        if(ymin==0 && ymax==0){
        	ymin = 0; ymax = 100;
        };
        //adjust ymin, ymax
        var o = roundup(ymin,ymax);
        ymin = o.min;
        ymax = o.max;
        ystep = o.step;
        var precision = 0;
        var tmp = ystep.toString().split(".");
        if(tmp.length > 1){
            precision = tmp[1].length;
        };
        var width = this.width-this.ml-this.mr;
        var height = this.height-this.mt-this.mb;
        var base = 0, ymin_r = ymin;
        if(ymin < 0) {
        	ymin_r = 0;
        } else {
        	if((ymax - ymin)/ymax >= 0.2){
	            ymin = ymin_r = 0;
	        };
        };
        
        var yscale =height/(ymax-ymin);
        if(ymin < 0) base = ymin*yscale;
        var zy = this.mt+height+base;
        // begin to draw	
        g.begin();
        // draw yaxis and y labels
       for(var t=ymin; t<=ymax; t= FloatAdd(t,ystep)){
        	var label = "";
        	if(t === ymin) {
        		label = format_num(t,precision);
        	} else {
        		if(ymin > 0 && (ymax - ymin)/ymax < 0.2) {
    				label = "+"+format_num(t-ymin_r,precision);
    			} else {
    				label = format_num(t-ymin_r,precision);
    			}
        	};
            var y = this.mt + height-((t-ymin_r)*yscale-base);
            g.line(this.ml,y,this.ml+width,y,'DDDDDD');
            if(y == zy) {
            	g.text(0,y-8,'B:'+label,this.opt.yaxis,this.ml);
            } else {
            	g.text(0,y-8,label,this.opt.yaxis,this.ml);
            };
        };
       	g.line(this.ml,this.mt,this.ml,this.height-this.mb,this.opt.grid.color); //left border
        g.line(this.width-this.mr,this.mt,this.width-this.mr,this.height-this.mb,this.opt.grid.color); //right border
        g.text(0,this.mt+height,data.yaxis.label,this.opt.yaxisLabel,height); //y-axis tag
        g.text(this.ml,0,data.xaxis.label,this.opt.xaxisLabel,width); //x-axis tag
        
        //each bar width
        var bar_w = width/bars.length;
		//draw bars
        var tip_x, tip_y, tip_t;
        for(var i=0;i<bars.length;i++){
        	var x = i*bar_w;
            var w = bar_w;
            //keep one bar width blank between two bars
            if(!has_split)
            	w /= 2;	
            var h = yscale*(bars[i].value-ymin_r);
            //flip y 
            var y = height - (h-base);
            // draw bars
            var c = bars[i].color;
            if(bars[i].value < 0){
                c = "FF0000";
            };
            g.rect(this.ml+x, this.mt+y, w-1, h, c, { alpha:1, fill:true, thick:0});
            //check mouse
            if(this.hit(this.mouse.x,this.mouse.y,this.ml+x,this.mt+y,w-1,h)){
            	//show tooltip
            	tip_x = this.mouse.x;
            	tip_y = this.mouse.y-8;
            	tip_t = bars[i].label + ":" + bars[i].value;
            };
            //draw x labels
          	g.text(this.ml+x, this.mt+height, bars[i].label,this.opt.xaxis, w);  
        };
        if(tip_x && tip_y) {
        	draw_tooptip(g, tip_x, tip_y, tip_t,this.ml + width);
        };
        //draw splits
        if(has_split){
        	var offset = this.ml;
        	for(var i=0;i<groups.length;i++){
                var group = groups[i];
                var gw = group.bars.length*bar_w;
                offset += gw;
                g.line(offset, this.mt, offset, this.mt+height, this.opt.grid.color);
                g.text(offset-gw,  this.mt,  group.label, {align:"center",size:10},  gw);
            };
        };
        
        //draw y zore line
        g.line(this.ml, zy, this.ml+width, zy, "000000");
        g.end();
	};
};/**
 *
 */
window.plugin.Bar= window.plugin.Editor.extend({
	
    type : function(){ return "Bar"; },
    
	template : "bar-chart-template",
	fds : {},
    axesOptions:[
                    {id:"barAxisDropbox0",index:0,type:"M",def_label:"Y"},
                    {id:"barAxisDropbox1",index:1,type:"D",def_label:"X"},
                    {id:"barAxisDropbox2",index:2,type:"D",def_label:"Nested X"}
                ],
    //default data
	default_data : {groups:[{label:"",bars:[{value:0,label:"A",color:"0E51A7"},
	     						                       {value:0,label:"B",color:"0E51A7"},
	     						                       {value:0,label:"C",color:"0E51A7"}]}],
	      				 xaxis:{label:"X", markers:[]},
	      				 yaxis:{label:"Y"},
	      				 legend:[]
	},
	
	/**
     * init views
     */
    _init_v:function(w,h,type){
        var ref = [];
        var axesOptions = this.axesOptions;
	    for(var i = 0; i < axesOptions.length;i++){
            var dropAxisSetting = axesOptions[i];
            ref.push(new window.AxisDropBox({el:$('#' + dropAxisSetting.id), visualizer:this.vis,setting:dropAxisSetting}));
	    };
        var options = {
                           container:"chart-wrapper",
                           "type":type,
                           width: w,
                           height: h,
                           margin: this.custom.margin,
                           canvas:{ platform:"Fl", param:{url:"js/lib/b2/canvas/fl/B2Canvas.swf"} }
        			};
        this.chart = new B2(options);
        this.chart.render(this.default_data);
        // restore axis setting
        var axs = this.get("axes");
        var is_fill = false;
        for(var i = 0; i < axs.length; i++){
          var axis = axs[i];
            if( axis != null) {
              var item = {};
                if(axis.name == "Measure"){
                  item.name = axis.members[0];
                    item.type = "M";
                    item.members = [];
                }else{
                    item=axis;
                };
                is_fill = true;
                ref[i].fill(item,false);
            };
        };
        this.axesDropbox = ref;
        if(typeof(this.painter) !="undefined"){
        	this.painter.remove();
        };
        this.painter = new window.visualization.ColorPainter({model:this.vis.plugin});
        $('#editor_legend').append(this.painter.el);
        $("#pd_select").html(this.get("paint_d"));
        
        if(typeof(this.initLegend) != "undefined"){
          this.initLegend(w,h);
        };
        if(is_fill === true) {
        	this.trigger("change:cdata");
        } else {
        	this.chart.render(this.default_data);
        };
    },
    /**
     * fill axis handler, 
     * called on axis fill
     */
    onSetAxis:function(index, axis_model, query){
    	var axes = this.get("axes");
        axes[index] = axis_model;
        this.set("axes",axes);
        this.current = index;
        if(!query){
        	return {state:0,msg:""};
        }else{
        	return this.query();
        };
    },
    
    render:function(w,h){
    	if(this.legend != undefined){
    		
        	var pd = this.get('paint_d');
   			 	var cw = w-10;
   			 	if(pd == "" ){
		   			 $('#editor_legend').css("display","none");
		   			 this.legend.hide();
   			 	}else{
		   			 this.legend.show(this.get("cdata").legend);
		   			 $('#editor_legend').css("display","block");
		   			 $('#editor_legend').width(120);
		   			 cw -= 112;
		   			 $('#editor_canvas').width(cw);
	   			};
	   			this.chart.size(cw,h - 20);
        	};
           this.chart.render(this.get('cdata'));
    },
    
    query:function(use_filter){
    	if(typeof(use_filter) == "undefined"){
    		use_filter = false;
    	};
    	// query 
        var ret=0,msg="";
        var axes_slots = this.get('axes');
        var empty = true;
        for(var i=0;i<3;i++){
        	if(typeof(axes_slots[i])!="undefined" && axes_slots[i]!=null){
            	empty = false;
                break;
            };
        };
        //clear
        if(empty){
            this.set({"cdata":this.default_data,'state':'loaded'});
        }else{
        	 var send = false,lastQuery = [];
            //y
            var y=axes_slots[0];
            if(typeof(y)!="undefined" && y!=null){
                if(y.type != "M"){
                	if(this.current == 0){
                    	ret = 1;
                    	msg = "WARNING: "+decode(y.name)+"'s type is \"D\" (Category), it is used as \"M\" (Numeric) here, the caculation changed to \"Count\"";
                    };
                    lastQuery.push({name:"Measure", members:["uniq_metas(" + encode(y.name) + ")"]});
                }else{
                    lastQuery.push({name:"Measure", members:[encode(y.name)]});
                };
                send=true;
            };
            //x
            var x=axes_slots[1];
            if(typeof(x)!="undefined" && x!=null){
                if(x.type != "D"){
                	if(this.current == 1){
                    	ret = 1;
                    	msg = "WARNING: "+ decode(x.name) +" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    };
                    lastQuery.push({name:encode(x.name), members:["flip(M,D)"]});
                }else{
                	if(use_filter){
                		for(var i=0; i<x.members.length; i++){
                            x.members[i] = encode(x.members[i]);
                        };
                        lastQuery.push({name:encode(x.name), members:x.members});
                	}else{
                		var axis = this.cube.findAxis(x.name);
                		for(var i=0; i<axis.members.length; i++){
                			x.members[i] = encode(axis.members[i]);
                		};
                		lastQuery.push({name:encode(x.name), members:["members(all)"]});
                	};
                };
                send=true;
            };
            //xx
            var xx=axes_slots[2];
            if(typeof(xx)!="undefined" && xx!=null){
                if(xx.type != "D"){
                	if(this.current == 2){
                    	ret = 1;
                    	msg = "WARNING: "+decode(xx.name)+" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    };
                    lastQuery.push({name:encode(xx.name), members:["flip(M,D)"]});
                }else{
                	if(use_filter){
                        for(var i=0; i<xx.members.length; i++){
                            xx.members[i] = encode(xx.members[i]);
                        };
                        lastQuery.push({name:encode(xx.name), members:xx.members});
                	}else{
                		var axis = this.cube.findAxis(xx.name);
                		for(var i=0; i<axis.members.length; i++){
                			xx.members[i] = encode(axis.members[i]);
                		};
                		lastQuery.push({name:encode(xx.name), members:["members(all)"]});
                	};
                };
                send=true;
            };
            // send query
            if(send){
                //loading start ,change state to loading
                this.set('state','loading');
                this.cube.query(lastQuery,this.get('aggr'));
            };
        };
        return {state:ret,msg:msg};
    },
      
     /**
     * processing the return query array, 
     * format the data to bar
     * more detail ...
     */
    format:function(dataset) {
    	if(dataset == null){
            debug("Bar chart's dataset is null"); 
            return false;
        };
        this.cache = dataset;
        var tmp = this.get('axes');
        var axes = [null,null,null];
        for(var i=0;i<tmp.length;i++){
        	if(typeof(tmp[i])!="undefined" && tmp[i]!=null){
            	axes[i] = tmp[i];
            };
        };
    	this.fds.groups = [];
    	this.fds.col = [{},{}];//cols info for sorting
    	this.fds.xaxis = {label:"", markers:[]};
    	this.fds.yaxis = {label:""};
    	if( axes[1] == null && axes[2] == null ){//	drop a measure only
    		this.set({"paint_d":""});
    		if(axes[0]) {
    			var label = axes[0].name;
	    		this.fds.groups = [{label: decode(label), bars:[{value: dataset.data[0],label: decode(label), color:colors(0)}]}];//bars data
	    		this.fds.xaxis = {label:decode(label), markers:[decode(label)]};//axis xlabels
	    		// validate method count or aggr
	    		var axes0_1st_mem = dataset.axes[0].members[0];
	    		if(validate_func(axes0_1st_mem)){
	    			this.fds.yaxis = {label:"count(" +decode(label)+")"};//axis ylabels
	    		}else{
	    			this.fds.yaxis = {label:this.get("aggr")+"(" +decode(label)+")"};//axis ylabels
	    		};
    		};
    		//saveing cols info for sorting
     		//this.fds.col[decode(label)]= 0;
    	}else{
    		if( axes[1] != null && axes[2] != null){
    			//there is no order in return data,so using dropped ordered axes to find axis from return date
    			var ds_fst_axis = ds_axis(decode(axes[1].name), dataset);
    			var ds_sec_axis = ds_axis(decode(axes[2].name), dataset);
    			//drop both 2 D axes
    			if(ds_fst_axis && ds_sec_axis) {
    				var max_i = ds_fst_axis.members.length;
	    			var max_j = ds_sec_axis.members.length;
	    			var fst_dn = axes[1].name;
	    			var sec_dn = axes[2].name;
	    			var fst_mem = ds_fst_axis.members;
	    			var sec_mem = ds_sec_axis.members;
	    			if(this.get("paint_d") == ""){
	    				this.set({"paint_d":fst_dn},{silent:true});
	    				$("#pd_select").html(this.get("paint_d"));
	    			};
	    			for( var i = 0 ; i < max_i ; i++ ){
	    	    		var group = {label:"", bars:[]};
	    	        	for( var j = 0 ; j < max_j ; j++ ){
	    	        		var q = {};
	    	        		q[decode(fst_dn)] = i ;
	    	        		q[decode(sec_dn)] = j ;
	    	        		q["Measure"] = 0;
	    	        		var value = ds_val( q, dataset );
	    	        		group.bars.push({value:Number(value), label:sec_mem[j], color:colors(0)});
	    	        	};
	    	        	// set group label
	    	        	group.label = fst_mem[i];
	    	        	//set group
	    	        	this.fds.groups.push(group);
	    	        };
	    	        //save cols info for sorting
	    			for( var i = 0 ; i < max_j ; i++ ){
	    				//x-axis labels
	    	        	this.fds.xaxis.markers.push(sec_mem[i]);
		        		this.fds.col[0][sec_mem[i]]= i;
		        	};
		        	this.fds.col[1][sec_dn]= 0;
		        	this.fds.xaxis.label = decode(fst_dn)+" / "+decode(sec_dn);
	    			if( axes[0] == null ){
	    				this.fds.yaxis.label = this.get("aggr")+"(default)";
	        		}else{
	        			var axes0_1st_mem = dataset.axes[0].members[0];
			    		var y_method = this.get("aggr");
			    		if(validate_func(axes0_1st_mem)){
			    			y_method = "count";
			    		};
	        			this.fds.yaxis.label = y_method+ "(" +decode(axes[0].name)+ ")";
	        		};
    			}
    		}else{
    			// dropped any 1 of the last two axes
    			this.set({"paint_d":""});
    			var _axis = axes[1]==null?axes[2]:axes[1];
    			this.fds.col[0][decode(_axis.name)]= 0;
        		for( var i = 0 ; i < dataset.data.length ; i++ ){
        			var group = {label:"", bars:[]};
        			var label = "";
    				if(_axis.members.length >1){
    					label =  decode(_axis.members[i]);
    				}else{
    					// drop M in a D axis,there is no members,get members from dataset
    					label = ds_axis(decode(_axis.name),dataset ).members[i];
    				};
    				group.bars.push({value:dataset.data[i], label:label, color:colors(0)});
    				// set group label
    	        	group.label = label;
        			this.fds.groups.push(group);
        			//x-axis labels
 	        		this.fds.xaxis.markers.push(label);
        		};
        		//this.fds.col[decode(_axis.members[0])]= 0;
        		this.fds.xaxis.label = decode(_axis.name);
        		if( axes[0] == null ){
        			this.fds.yaxis.label = this.get("aggr")+"(default)";
        		}else{
        			var axes0_1st_mem = dataset.axes[0].members[0];
    	    		var y_method = this.get("aggr");
    	    		if(validate_func(axes0_1st_mem)){
    	    			y_method = "count";
    	    		};
        			this.fds.yaxis.label = y_method+ "(" +decode(axes[0].name)+ ")";
        		};
    		};
    	};
    	//sort data
    	var cdata = this.sortData(this.fds.groups,axes,this.fds.col,this.fds.xaxis,this.fds.yaxis);
    	
    	//sort color
    	this.setColors(cdata);
    },
    
    sortData:function(groups,axes,col,xaxis,yaxis){
    	//sort
    	var data = groups;
    	if( typeof(axes[1])!="undefined" && axes[1]!= null && typeof( axes[1].sort)!="undefined"){
    		var name = axes[1].name;
            var st = axes[1].sort.type;
            if( typeof(st) != "undefined" && st != 0 && st != null ){
                var target = col[0][axes[1].sort.on];
                var use_total = (axes[1].sort.on=="Total");
                var sorted_data = _.sortBy(
                						   data, 
                                           //sort func
                                           function(el) {
                                                if (use_total) {
                                                    var n = 0;
                                                    for (var i = 0; i < el.bars.length; i++) {
                                                        var val = el.bars[i].value;
                                                        if (_.isNumber(val) && isFinite(val))
                                                            n += val;
                                                    };
                                                    return n;
                                                };
                                                var v = el.bars[target].value;
                                                return v=="nil"?Number.MIN_VALUE:v;
                                            });
                if( st == window.axis.OptionsDialog.Sort.DESC ){
                    sorted_data = sorted_data.reverse();
                };
                data = sorted_data;
            };
        };
        //sort members
        if(typeof(axes[2])!="undefined" && axes[2]!= null && typeof(axes[2].sort)!="undefined"){
        	var name = axes[2].name;
            var st = axes[2].sort.type;
            if( typeof(st) != "undefined" && st != 0 && st != null ){
            	var use_total = (axes[2].sort.on=="Total");
            	if(use_total){
                	for(var i=0; i<data.length; i++){
                		var sort_data = _.sortBy(data[i].bars,
                				function(e){
                					var val = e.value;
                					if (_.isNumber(val) && isFinite(val)){
                						return val;
                					}else{
                						return Number.MIN_VALUE;
                					};
                		});
                		if( st == window.axis.OptionsDialog.Sort.DESC ){
                			sort_data = sort_data.reverse();
                        };
                        data[i].bars = sort_data;
                	};
            	};
            };
        };
        
	    //filter the nil values
		for(var i=0;i<data.length;i++){
			var c = 0;
			for(var j=0;j-c<data[i].bars.length;j++){
				if(data[i].bars[j-c].value=="nil" || _.isNaN(data[i].bars[j-c].value)){
					data[i].bars.splice((j-c),1);
			        c++;
			    };
			};
		};
		return {
	        		groups:data,
	        		xaxis:xaxis,
	        		yaxis:yaxis,
	        		col:col,
	        		legend:null
	    		};
    },
    
    setColors:function(cdata){
    	var label_colors = {};
    	var paint_axis = this.get("paint_d");
    	var axes = this.get("axes"); 
    	if(typeof(axes[1]) != "undefined" && axes[1] != null && paint_axis == axes[1].name){
    		// mei ge group shang se
    		for(var i=0; i<cdata.groups.length; i++){
    			var g = cdata.groups[i];
    			if(typeof(label_colors[g.label]) == "undefined"){
    				label_colors[g.label] = colors(i);
    			};
    			for(var j=0; j<g.bars.length; j++){
    				g.bars[j].color = label_colors[g.label];
    			};
    		};
    	}else if(typeof(axes[2]) != "undefined" && axes[2] != null && paint_axis == axes[2].name){
    		// mei ge  label shang se
    		var cc = 0;
    		for(var i=0; i<cdata.groups.length; i++){
    			var g = cdata.groups[i];
    			for(var j=0; j<g.bars.length; j++){
    				var k = g.bars[j].label;
    				if(typeof(label_colors[k]) == "undefined"){
        				label_colors[k] = colors(cc++);
        			};
    				g.bars[j].color = label_colors[k];
    			};
    		};
    	};
    	
    	cdata.legend = [];
    	for(var p in label_colors){
    		cdata.legend.push({label:decode(p),color:label_colors[p]});
    	};
    	this.set({"cdata":cdata,'state':'loaded'});
//    	this.trigger("change:cdata");
    },
    
    //sort 
    sort:function(index,target,method){
    	 var maxis = this.getAxis(index);
         maxis.sort = {type:method,on:target};
         // save the config
         this.setAxis(
         			  index,
         			  maxis
                     );
         var cdata = this.get("cdata");
         if(this.get("cdata") != null){
        	 var tmp = this.get('axes');
             var axes = [null,null,null];
             for(var i=0;i<tmp.length;i++){
             	if(typeof(tmp[i])!="undefined" && tmp[i]!=null){
                 	axes[i] = tmp[i];
                 };
             };
        	//sort data
         	var data = this.sortData(cdata.groups,axes,cdata.col,cdata.xaxis,cdata.yaxis);
         	//sort color
         	this.setColors(data);
         };
    }
});

/**
 * Line Chart
 */
B2.chart.Line = function(b2, opt) {
	this.b2 = b2;
	this.opt = merge(opt, _.clone(B2.chart.defaultOptions));
	
	var margin = opt.margin;
	if(_.isUndefined(margin)) {
		margin = [0,0,0,0];
	};
	this.width = opt.width;
	this.height = opt.height;
	this.ml = margin[3];
	this.mr = margin[1];
	this.mt = margin[0];
	this.mb = margin[2];
	
	this.xaxis_window = {start:0,end:0};
	/**
     * upon mousemove b2 masker,
     * the mouse will be set to with the mouse x,y position which relative to masker.
     * masker use the same coorderation with this render.
     */
	this.mouse = {x:0,y:0};
	this.data = null;
	
	// add slider
    if(B2.component != undefined && B2.component.Slider != undefined){
        this.slider = new B2.component.Slider(this, {
                                        width:this.width - this.ml - this.mr,
                                        height:30,
                                        left: this.ml
                                    });
    };
    
    
	/**
	 * event handers
	 */
	this.handler = function(e){
		if( e.name == "mousemove" ){
			this.mousemoveHandler(e);
		} else if( e.name == "sliderchange" && this.slider != undefined){
			this.sliderHandler(e);
		};
	};
    
	/**
	 * mouseover event handler
	 */
	this.mousemoveHandler = function(e) {
    	this.mouse.x = e.param.x;
        this.mouse.y = e.param.y;
        if(this.data!=null){
        	 this.render(this.g, this.data);
        };
	};
	
	this.sliderHandler = function(e) {
        this.xaxis_window.start = e.params.start;
        this.xaxis_window.end = e.params.end;
        this.render(this.g,this.data);
	};
	
	this.setdata = function(g,data){
    	this.g = g;
        this.data = data;
    	 // draw slider
         if(this.slider != undefined){
            if(data.xaxis.markers.length > 50) {
                this.slider.show(data.xaxis.markers);
                this.slider.slide(0,data.xaxis.markers.length-1);
            } else {
                this.slider.hide();
            };
         };
        this.xaxis_window = {start:0,end:data.xaxis.markers.length-1};
    	this.render(g,this.data);
    };
	
	/**
     * test if the mouse-x, mouse-y in circle{x:x,y:y,r:r}
     */
	this.hit = function(mouse_x, mouse_y, circle_x, circle_y, r){
		var x_hit = Math.abs(circle_x - mouse_x) < r;
		var y_hit = Math.abs(circle_y - mouse_y) < r;
    	return (x_hit && y_hit);
    };
	
	this.render = function(g, data) {
		var ymax = -Number.MAX_VALUE, ymin=Number.MAX_VALUE, xmax=0; 
        //caculate ymax & ymin
        var lines = data.lines;
        for(var i=0;i<lines.length;i++){
        	var s = lines[i];
            //window
        	var _start = this.xaxis_window.start;
        	var _end = Math.min(this.xaxis_window.end,s.data.length-1);
            var _len = 0;
        	for(var n=_start;n<=_end;n++){
            	_len++;
            	var tmp = s.data[n];
        		if(tmp > ymax) ymax = tmp;
            	if(tmp < ymin) ymin = tmp;
            };
            if(_len > xmax)	
            	xmax = _len;
        };
        if(ymin == ymax) {
        	ymin = 0;
        };
        if(ymin==0 && ymax==0){
        	ymin=0;
            ymax=100;
        };
        //adjust ymin, ymax
        var o = roundup(ymin,ymax);
        ymin = o.min;
        ymax = o.max;
        ystep = o.step;
        var width = this.width-this.ml-this.mr;
        var height = this.height-this.mt-this.mb;
        var yscale =height/(ymax-ymin);
//        var base = 0;
//        if(ymin < 0)
//        	base = ymin*yscale;
        
        g.begin();
        //yaxis
        for(var t=ymin; t<=ymax; t= FloatAdd(t,ystep)){
        	var label = format_num(t);
            var y = this.mt + height-((t-ymin)*yscale);//-base
            g.line(this.ml,y,this.ml+width,y,'DDDDDD');
        	g.text(0,y-8,label,this.opt.yaxis,this.ml); 
        };
        g.line(this.ml,this.mt,this.ml,this.height-this.mb,this.opt.grid.color); //left border
        g.line(this.width-this.mr,this.mt,this.width-this.mr,this.height-this.mb,this.opt.grid.color); //right border
        g.text(0,this.mt+height,data.yaxis.label,this.opt.yaxisLabel,height); //y-axis tag
        g.text(this.ml,0,data.xaxis.label,this.opt.xaxisLabel,width); //x-axis tag
        //x markers
        var ii = 1;
        var _start = this.xaxis_window.start;
        var _end = Math.min(this.xaxis_window.end,
        				    data.xaxis.markers.length-1);
        var marker_count = _end-_start;
        var marker_step = width/marker_count;
        if(marker_step<50){
        	ii = Math.floor(marker_count/(width/50));
        };
        for(var i=1;i<=marker_count-1;i+=ii){
        	var marker= data.xaxis.markers[_start+i];
        	g.text(this.ml+marker_step*i -25,this.mt+height,marker,this.opt.xaxis,50); 
        };
        //1st xlabel
		g.text(this.ml,this.mt+height,data.xaxis.markers[_start],{showLabels: true, align: 'left'},50); 
        //last xlabel
		if(marker_count != 0){
			g.text(this.ml+marker_step*marker_count -50,this.mt+height,data.xaxis.markers[_start+marker_count],{showLabels: true, align: 'right'},50); 
		};
        
        //draw lines
        var xstep = width/(xmax-1);
        var tip_x, tip_y, tip_t;
        for(var i=0;i<lines.length;i++){
        	var line = lines[i];
        	var _start = this.xaxis_window.start;
            var _end = Math.min(this.xaxis_window.end,
        				    data.xaxis.markers.length-1);
            for(var n=0;n<_end-_start;n++){
            	var fx = this.ml + n*xstep;
                var fy = this.mt + height - ((line.data[_start+n]-ymin)*yscale);// - base
                var tx = this.ml + (n+1)*xstep;
                var ty = this.mt + height - ((line.data[_start+n+1]-ymin)*yscale);// - base
            	g.line(fx,fy,tx,ty,line.color,{thick:2});
                g.circle(fx,fy,2,line.color,{fill:true});
                g.circle(fx,fy,1,"ffffff",{fill:true});
                //check mouse
                if(this.hit(this.mouse.x,this.mouse.y,fx,fy,2)){
                	//show tooltip
                	tip_x = this.mouse.x;
	            	tip_y = this.mouse.y-8;
	            	tip_t = data.xaxis.markers[_start+n] + ":" + line.data[_start+n];
                };
            };
        };
        if(tip_x && tip_y) {
        	draw_tooptip(g, tip_x, tip_y, tip_t, this.ml+width);
        };
        //draw y zero line
        var base = ymin*yscale<0?ymin*yscale:0;
        var zy = this.mt+height + base;
        g.line(this.ml,
               zy,
               this.ml+width,
               zy,
               "000000");
        g.end();
    };
};
/**
 *
 */
window.plugin.Line=window.plugin.Editor.extend({
   
   type : function(){ return "Line"; },
    
	template: "line-chart-template",
    
	fds: {},
    
	axesOptions: [
                            {id:"lineAxisDropbox0",index:0,type:"M",def_label:"Y"},
                            {id:"lineAxisDropbox1",index:1,type:"D",def_label:"X"},
                            {id:"lineAxisDropbox2",index:2,type:"D",def_label:"Nested X"}
                        ],
    //default data
	default_data: {lines:[{label:"",color:"0E51A7",data:[0,0,0]}],
	      				 xaxis:{label:"X", markers:['A', 'B']},
	      				 yaxis:{label:"Y"},
	      				 legend:[]
	},

    
    /**
     * fill axis handler, 
     * called on axis fill
     */
    onSetAxis:function(index, axis_model,query){
    	var axes = this.get("axes");
        axes[index] = axis_model;
        this.set("axes",axes);
        if(!query){
        	return {state:0,msg:""};
        }else{
        	return this.query(false,index);
        };
    },
    
    render:function(w,h){
    	if(this.legend != undefined){
    		
        	var pd = this.get('paint_d');
   			 	var cw = w-10;
   			 	if(pd == "" ){
		   			 $('#editor_legend').css("display","none");
		   			 this.legend.hide();
   			 	}else{
		   			 this.legend.show(this.get("cdata").legend);
		   			 $('#editor_legend').css("display","block");
		   			 $('#editor_legend').width(120);
		   			 cw -= 112;
		   			 $('#editor_canvas').width(cw);
	   			};
	   			this.chart.size(cw,h - 20);
        	};
           this.chart.render(this.get('cdata'));
    },
    
    query:function(use_filter,index){
    	if(typeof(use_filter) == "undefined"){
    		use_filter = false;
    	};
    	// query 
        var ret=0,msg="";
        var axes_slots = this.get('axes');
        var empty = true;
        for(var i=0;i<3;i++){
        	if(typeof(axes_slots[i])!="undefined" && axes_slots[i]!=null){
            	empty = false;
                break;
            };
        };
        //clear 
        if(empty){
            this.set({"cdata":this.default_data,'state':'loaded'});
        }else{
            var send=false,lastQuery=[];
       		//y
            var y=axes_slots[0];
            if(typeof(y)!="undefined" && y!=null){
                if(y.type != "M"){
                    ret = 1;
                    if(index ==0)
                    	msg = "WARNING: "+decode(y.name)+"'s type is \"D\" (Category), it is used as \"M\" (Numeric) here, the caculation changed to \"Count\"";
                    lastQuery.push({name:"Measure", members:["uniq_metas(" + encode(y.name) + ")"]});
                }else{
                    lastQuery.push({name:"Measure", members:[encode(y.name)]});
                };
                send=true;
            };
            //x
            var x=axes_slots[1];
            if(typeof(x)!="undefined" && x!=null){
                if(x.type != "D"){
                    ret = 1;
                    if(index ==1)
                    	msg = "WARNING: "+ decode(x.name) +" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    lastQuery.push({name:encode(x.name), members:["flip(M,D)"]});
                }else{
                	if(use_filter){
                        for(var i=0; i<x.members.length; i++){
                            x.members[i] = encode(x.members[i]);
                        };
                        lastQuery.push({name:encode(x.name), members:x.members});
                	}else{
                		var axis = this.cube.findAxis(x.name);
                		for(var i=0; i<axis.members.length; i++){
                			x.members[i] = encode(axis.members[i]);
                		};
                		lastQuery.push({name:encode(x.name), members:["members(all)"]});
                	};
                };
                send=true;
            };
            //xx
            var xx=axes_slots[2];
            if(typeof(xx)!="undefined" && xx!=null){
                if(xx.type != "D"){
                    ret = 1;
                    if(index ==2)
                    	msg = "WARNING: "+decode(xx.name)+" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    lastQuery.push({name:encode(xx.name), members:["flip(M,D)"]});
                }else{
                	if(use_filter){
                        for(var i=0; i<xx.members.length; i++){
                            xx.members[i] = encode(xx.members[i]);
                        };
                        lastQuery.push({name:encode(xx.name), members:xx.members});
                	}else{
                		var axis = this.cube.findAxis(xx.name);
                		for(var i=0; i<axis.members.length; i++){
                			xx.members[i] = encode(axis.members[i]);
                		};
                		lastQuery.push({name:encode(xx.name), members:["members(all)"]});
                	};
                };
                send=true;
            };
            // send query
            if(send){
                //loading start ,change state to loading
                this.set('state','loading');
                this.cube.query(lastQuery,this.get('aggr'));
            };
        };
        return {state:ret,msg:msg};
    },
      
     /**
     * processing the return query array, 
     * format the data to bar
     * more detail ...
     */
    format:function(dataset) {
        this.cache = dataset;
        var query_demations = this.get('axes');
    	if(dataset == null){
            debug("Line chart's dataset is null"); 
            return false;
        };
    	var tmp = this.get('axes');
        var axes = [null,null,null];
        for(var i=0;i<tmp.length;i++){
        	if(typeof(tmp[i])!="undefined" && tmp[i]!=null){
            	axes[i] = tmp[i];
            };
        };
    	
    	this.fds.lines = [];
     	this.fds.col = [];
     	this.fds.xaxis = {label:"", markers:[]};
     	this.fds.yaxis = {label:""};
     	this.fds.legends = [];
     	
    	if( axes[1] == null && axes[2] == null ){
     		//	dropped in first axis only
    		this.set({"paint_d":""});
     		var label = axes[0].name;
     		//line data
     		this.fds.lines = [{ label: decode(label), color:colors(0), data:[dataset.data[0]] }];
     		this.fds.xaxis = {label:decode(label), markers:[decode(label)]};
     		// validate method count or aggr
    		var axes0_1st_mem = dataset.axes[0].members[0];
    		if(validate_func(axes0_1st_mem)){
    			this.fds.yaxis = {label:"count(" +decode(label)+")"};//axis ylabels
    		}else{
    			this.fds.yaxis = {label:this.get("aggr")+"(" +decode(label)+")"};//axis ylabels
    		};
      		this.fds.legends = [];
     		//saveing cols info for sorting
      		this.fds.col[decode(label)]= 0;
     	}else{
     		if( axes[1] != null && axes[2] != null){
     			//find axis from back date
     			var ds_fst_axis = ds_axis(decode(axes[1].name), dataset);
     			var ds_sec_axis = ds_axis(decode(axes[2].name), dataset);
     			//filled 2 D type axes
     			if(ds_fst_axis && ds_sec_axis) {
     				var max_i = ds_fst_axis.members.length;
 	    			var max_j = ds_sec_axis.members.length;
 	    			var fst_dn = axes[1].name;
 	    			var sec_dn = axes[2].name;
 	    			var fst_mem = ds_fst_axis.members;
 	    			var sec_mem = ds_sec_axis.members;
 	    			if(this.get("paint_d") == ""){
	    				this.set({"paint_d":fst_dn},{silent:true});
	    			};
 	    			for( var i = 0 ; i < max_j ; i++ ){
 	    	    		var line = {label:"",color:colors(i),data:[]};
 	    	        	for( var j = 0 ; j < max_i ; j++ ){
 	    	        		var q = {};
 	    	        		q[decode(fst_dn)] = j ;
 	    	        		q[decode(sec_dn)] = i ;
 	    	        		q["Measure"] = 0;
 	    	        		var value = ds_val( q, dataset );
 	    	        		// line data
 	    	        		if(value != "nil"){
 	    	        			line.data.push(Number(value));
 	    	        		}else{
 	    	        			line.data.push(0);
 	    	        		};
 	    	        	};
 	    	        	// set group label
 	    	        	line.label = fst_mem[i];
 	    	        	//set group
 	    	        	this.fds.lines.push(line);
 	    	        };
 	    	        for(var i = 0 ; i < max_j ; i++){
	    	        	//set legend data
	    	        	this.fds.legends.push({label:sec_mem[i], color:colors(i)});
	    	        };
 	    	        
 	    			for( var i = 0 ; i < max_i ; i++ ){
 	    				//x-axis labels
	    	        	this.fds.xaxis.markers.push(fst_mem[i]);
	    	        	//save cols info for sorting
 		        		this.fds.col[fst_mem[i]]= i;
 		        	};
 		        	this.fds.xaxis.label = decode(fst_dn)+" / "+decode(sec_dn);
 	    			if( axes[0] == null ){
 	    				this.fds.yaxis.label = this.get("aggr")+"(default)";
 	        		}else{
 	        			var axes0_1st_mem = dataset.axes[0].members[0];
			    		var y_method = this.get("aggr");
			    		if(validate_func(axes0_1st_mem)){
			    			y_method = "count";
			    		};
	        			this.fds.yaxis.label = y_method+ "(" +decode(axes[0].name)+ ")";
 	        		};
     			}
     		}else{
     			// dropped any 1 of the last two D type axes
     			this.set({"paint_d":""});
     			var _axis = axes[1] == null?axes[2]:axes[1];
     			// clear X-axis's chart legend
     			this.fds.legends = [];
     			this.fds.col[decode(_axis.name)]= 0;
     			var line = {label:"",color:colors(0),data:[]};
         		for( var i = 0 ; i < dataset.data.length ; i++ ){
         			var label = "";
     				if(_axis.members.length >1){
     					label =  decode(_axis.members[i]);
     				}else{
     					// drop M in a D axis,there is no members,get members from dataset
     					label = ds_axis(decode(_axis.name),dataset ).members[i];
     				};
     				line.data.push(dataset.data[i]);
     				// set group label
     				line.label = decode(_axis.name);
     				//x-axis labels
 	        		this.fds.xaxis.markers.push(label);
         		};
         		this.fds.lines.push(line);
         		this.fds.col[decode(_axis.members[0])]= 0;
         		this.fds.xaxis.label = decode(_axis.name);
         		if( axes[0] == null ){
         			this.fds.yaxis.label = this.get("aggr")+"(default)";
         		}else{
         			var axes0_1st_mem = dataset.axes[0].members[0];
    	    		var y_method = this.get("aggr");
    	    		if(validate_func(axes0_1st_mem)){
    	    			y_method = "count";
    	    		};
        			this.fds.yaxis.label = y_method+ "(" +decode(axes[0].name)+ ")";
         		};
     		};
     	};
    	var cdata = { lines:this.fds.lines,
     				  xaxis:this.fds.xaxis,
     				  yaxis:this.fds.yaxis,
         			  legend:this.fds.legends
                     };
    	this.set({"cdata":cdata,'state':'loaded'});
    }
});

/**
 * Line Chart
 */
B2.chart.Stack = function(b2, opt) {
	this.b2 = b2;
	this.opt = merge(opt, _.clone(B2.chart.defaultOptions));
	
	var margin = opt.margin;
	if(_.isUndefined(margin)) {
		margin = [0,0,0,0];
	};
	this.width = opt.width;
	this.height = opt.height;
	this.ml = margin[3];
	this.mr = margin[1];
	this.mt = margin[0];
	this.mb = margin[2];
	
    this.xaxis_window = {start:0,end:0};
    
	/**
     * upon mousemove b2 masker,
     * the mouse will be set to with the mouse x,y position which relative to masker.
     * masker use the same coorderation with this render.
     */
	this.mouse = {x:0,y:0};
	this.data = null;
	if(B2.component != undefined && B2.component.Slider != undefined){
    	// add slider
        this.slider = new B2.component.Slider(this, {
    		width:this.width - this.ml - this.mr,
    		height:30,
    		left: this.ml
    	});
     }; 
    /**
	 * event handers
	 */
	this.handler = function(e){
		if( e.name == "mousemove" ){
			this.mousemoveHandler(e);
		} else if( e.name == "sliderchange"  && this.slider != undefined){
			this.sliderHandler(e);
		};
	};
    
	/**
	 * mouseover event handler
	 */
	this.mousemoveHandler = function(e) {
    	this.mouse.x = e.param.x;
        this.mouse.y = e.param.y;
        if(this.data!=null){
        	 this.render(this.g, this.data);
        };
	};
	
	this.sliderHandler = function(e) {
        this.xaxis_window.start = e.params.start;
        this.xaxis_window.end = e.params.end;
        this.render(this.g,this.data);
	};
    
    this.inpolo = function(points,x,y){
    	var sum = 2*Math.PI;
        var pre = null;
    	for(var i=0;i<points.length;i++){
        	var p = points[i];
            var dx = p.x-x;
            var dy = p.y-y;
            var ang = 0;
            if(dx==0){
            	if(dy>0)
                	ang = Math.PI/2;
                else
                    ang = -Math.PI/2;
            }else{
            	if(dx>0){
            		ang = Math.atan(dy/dx);
                    if(ang<0)
                    	ang+=Math.PI*2;
                }else{
                	ang = Math.PI+Math.atan(dy/dx);
                };
            };
            if(pre!=null){
            	var sub = Math.abs(ang-pre);
                if(sub > Math.PI)
                	sub = Math.abs(2*Math.PI-sub);
            	sum -= sub;
            };
            pre = ang;
        };
    	return (sum<Math.PI/180);
    };
    
    
    this.setdata = function(g,data){
    	this.g = g;
        this.data = data;
    	 // draw slider
        if(this.slider != undefined){
            if(data.xaxis.markers.length > 50) {
                this.slider.show(data.xaxis.markers);
                this.slider.slide(0,data.xaxis.markers.length-1);
            } else {
                this.slider.hide();
            };
        };
        this.xaxis_window = {start:0,end:data.xaxis.markers.length-1};
    	this.render(g,this.data);
    };
    

	this.render = function(g, data) {
		var ymax = -Number.MAX_VALUE, ymin=Number.MAX_VALUE, ystep=1; xmax=0; 
        //caculate ymax & ymin
        var serials = data.serials;
        for(var i=0;i<serials.length;i++){
        	var s = serials[i];
            //window
        	var _start = this.xaxis_window.start;
        	var _end = Math.min(this.xaxis_window.end,s.data.length-1);
            var _len = 0;
        	for(var n=_start;n<=_end;n++){
            	_len++;
            	var tmp = s.data[n];
        		if(tmp > ymax) ymax = tmp;
            	if(tmp < ymin) ymin = tmp;
            };
            if(_len > xmax)	
            	xmax = _len;
        };
        if(ymin == ymax) {
        	ymin = 0;
        };
        if(ymin == 0 && ymax == 0) {
        	ymin = 0;
        	ymax = 100;
        };
        //adjust ymin, ymax
        var o = roundup(ymin,ymax);
        ymin = o.min;
        ymax = o.max;
        ystep = o.step;
        var width = this.width-this.ml-this.mr;
        var height = this.height-this.mt-this.mb;
        var yscale =height/(ymax-ymin);
//        var base = 0;
//        if(ymin < 0)
//        	base = ymin*yscale;
            
        g.begin();
        //yaxis
        for(var t=ymin; t<=ymax; t= FloatAdd(t,ystep)){
        	var label = format_num(t);
            var y = this.mt + height-((t-ymin)*yscale);//-base
            g.line(this.ml,y,this.ml+width,y,"DDDDDD");
        	g.text(0,y-8,label,{align:"right"},this.ml); 
        };
        g.line(this.ml,this.mt,this.ml,this.height-this.mb,"DDDDDD"); //left border
        g.line(this.width-this.mr,this.mt,this.width-this.mr,this.height-this.mb,"DDDDDD"); //right border
        
        g.text(0,this.mt+height,data.yaxis.label,{align:"center",rotation:270},height); //y-axis tag
        g.text(this.ml,0,data.xaxis.label,{align:"center"},width);//x-axis tag
        
        //x markers
        var ii = 1;
        var _start = this.xaxis_window.start;
        var _end = Math.min(this.xaxis_window.end,
        				    data.xaxis.markers.length-1);
        var marker_count = _end-_start;
        if(marker_count == 0) {
        	marker_count = 1;
        };
        var marker_step = width/marker_count;
        if(marker_step<50){
        	ii = Math.floor(marker_count/(width/50));
        };
        for(var i=1;i<=marker_count-1;i+=ii){
        	var marker= data.xaxis.markers[_start+i];
        	g.text(this.ml+marker_step*i -25,this.mt+height,marker,this.opt.xaxis,50); 
        };
        //1st xlabel
		g.text(this.ml,this.mt+height,data.xaxis.markers[_start],{showLabels: true, align: 'left'},50); 
        //last xlabel
        if(marker_count != 1){
        	g.text(this.ml+marker_step*marker_count -50,this.mt+height,data.xaxis.markers[_start+marker_count],{showLabels: true, align: 'right'},50); 
        };
		
        //draw stacks
        var tooltip = null;
        var bx=0,by=0;
        var xscale = width/(xmax-1);
        var tmp = [];
        var satisfy_tooltips = [];
        for(var i=0;i<serials.length;i++){
        	var s = serials[i];
        	if(s.data.length < 2) {continue;};
            var points = [{x:this.ml,y:this.height-this.mb}];
            var _start = this.xaxis_window.start;
            var _end = Math.min(this.xaxis_window.end,
        				    data.xaxis.markers.length-1);
            var last_x = 0;
            // tooltip
            for(var n=0;n <=_end-_start;n++){
            	var xx = this.ml + n*xscale;
                var yy = this.mt + height - ((s.data[_start+n]-ymin)*yscale);// - base
                last_x = xx;
                if(Math.abs(this.mouse.x-xx)<2 && this.mouse.y>yy){
                    by = yy;
                    bx = xx;
                	tooltip = data.xaxis.label + " " + data.xaxis.markers[_start+n]+ " " + data.yaxis.label+ " " + s.data[_start+n];
                	satisfy_tooltips.push({x: bx, y: by, text: tooltip});
                };
                points.push({x:xx,y:yy});
            };
            if(i ==0){
            	g.polo(points.concat([{x:last_x,y:this.height-this.mb},{x:this.ml,y:this.height-this.mb}]),s.color,{fill:true,alpha:1});
            }else{
            	g.polo(points.concat(tmp.reverse()),s.color,{fill:true,alpha:1});
            };
            tmp = points;
        };
        //show tooltip
        var tipobj;
        if(tooltip != null && satisfy_tooltips.length > 0){
        	for(var i=0; i<satisfy_tooltips.length; i++) {
        		var tmp = satisfy_tooltips[i];
        		if(tipobj) {
        			if(tmp.y > tipobj.y) {
        				tipobj = tmp;
        			};
        		} else {
        			tipobj = tmp;
        		};
        	};
        	draw_tooptip(g,this.mouse.x,tipobj.y-6, tipobj.text, this.ml+width);
            g.line(tipobj.x,this.mt,tipobj.x,this.mt+height,"000000",{alpha:0.2});
            g.circle(tipobj.x,tipobj.y,2,"0086cd",{fill:true});
        };
        //draw y zero line
        var base = ymin*yscale<0?ymin*yscale:0;
        var zy = this.mt+height+base;
        g.line(this.ml,
               zy,
               this.ml+width,
               zy,
               "000000");
        g.end();
    };
};
/**
 *
 */
window.plugin.Stack=window.plugin.Editor.extend({
    
    type : function(){ return "Stack"; },
    
	template : "stack-chart-template",
	fds : {},	//formated dataset 
	axesOptions : [
                            {id:"stackAxisDropbox0",index:0,type:"M",def_label:"Y"},
                            {id:"stackAxisDropbox1",index:1,type:"D",def_label:"X"},
                            {id:"stackAxisDropbox2",index:2,type:"D",def_label:"Group"}
                        ],
    //default data
	default_data : {serials:[{label:"",color:"0E51A7",data:[0,0,0]}],
	      				 xaxis:{label:"X", markers:['A','B','C']},
	      				 yaxis:{label:"Y"},
	      				 legend:[]
	},

    /**
     * fill axis handler, 
     * called on axis fill
     */
    onSetAxis:function(index, axis_model,query){
    	var axes = this.get("axes");
        axes[index] = axis_model;
        this.set("axes",axes);
        if(!query){
        	return {state:0,msg:""};
        }else{
        	return this.query(false,index);
        };
    },
    
    render:function(w,h){
    	if(this.legend != undefined){
    		
        	var pd = this.get('paint_d');
   			 	var cw = w-10;
   			 	if(pd == "" ){
		   			 $('#editor_legend').css("display","none");
		   			 this.legend.hide();
   			 	}else{
		   			 this.legend.show(this.get("cdata").legend);
		   			 $('#editor_legend').css("display","block");
		   			 $('#editor_legend').width(120);
		   			 cw -= 112;
		   			 $('#editor_canvas').width(cw);
	   			};
	   			this.chart.size(cw,h - 20);
        	};
           this.chart.render(this.get('cdata'));
    },
    
    query:function(use_filter,index){
    	if(typeof(use_filter) == "undefined"){
    		use_filter = false;
    	};
    	// query 
        var ret = 0,msg="";
        var axes_slots = this.get('axes');
        var empty = true;
        for(var i=0;i<3;i++){
        	if(typeof(axes_slots[i])!="undefined" && axes_slots[i]!=null){
            	empty = false;
                break;
            };
        };
        //clear 
        if(empty){
            this.set({"cdata":this.default_data,'state':'loaded'});
        }else{
        	var send = false,lastQuery = [];
            //y
            var y=axes_slots[0];
            if(typeof(y)!="undefined" && y!=null){
                if(y.type != "M"){
                    ret = 1;
                    if(index ==0)
                    	msg = "WARNING: "+decode(y.name)+"'s type is \"D\" (Category), it is used as \"M\" (Numeric) here, the caculation changed to \"Count\"";
                    lastQuery.push({name:"Measure", members:["uniq_metas(" + encode(y.name) + ")"]});
                }else{
                    lastQuery.push({name:"Measure", members:[encode(y.name)]});
                };
                send=true;
            };
            //x
            var x=axes_slots[1];
            if(typeof(x)!="undefined" && x!=null){
                if(x.type != "D"){
                    ret = 1;
                    if(index ==1)
                    msg = "WARNING: "+ decode(x.name) +" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    lastQuery.push({name:encode(x.name), members:["flip(M,D)"]});
                }else{
                	if(use_filter){
                        for(var i=0; i<x.members.length; i++){
                            x.members[i] = encode(x.members[i]);
                        };
                        lastQuery.push({name:encode(x.name), members:x.members});
                	}else{
                		var axis = this.cube.findAxis(x.name);
                		for(var i=0; i<axis.members.length; i++){
                			x.members[i] = encode(axis.members[i]);
                		};
                		lastQuery.push({name:encode(x.name), members:["members(all)"]});
                	};
                };
                send=true;
            };
            //xx
            var xx=axes_slots[2];
            if(typeof(xx)!="undefined" && xx!=null){
                if(xx.type != "D"){
                    ret = 1;
                    if(index ==2)
                    	msg = "WARNING: "+decode(xx.name)+" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    lastQuery.push({name:encode(xx.name), members:["flip(M,D)"]});
                }else{
                	if(use_filter){
                        for(var i=0; i<xx.members.length; i++){
                            xx.members[i] = encode(xx.members[i]);
                        };
                        lastQuery.push({name:encode(xx.name), members:xx.members});
                	}else{
                		var axis = this.cube.findAxis(xx.name);
                		for(var i=0; i<axis.members.length; i++){
                			xx.members[i] = encode(axis.members[i]);
                		};
                		lastQuery.push({name:encode(xx.name), members:["members(all)"]});
                	};
                };
                send=true;
            };
            // send query
            if(send){
                //loading start ,change state to loading
                this.set('state','loading');
                this.cube.query(lastQuery,this.get('aggr'));
            };
        };
        return {state:ret,msg:msg};
    },

     /**
     * processing the return query array, 
     * format the data to bar
     * more detail ...
     */
    format:function(dataset) {
    	if(dataset == null){
            debug("Line chart's dataset is null"); 
            return false;
        };
        this.cache = dataset;
        var query_demations = this.get('axes');
        var tmp = this.get('axes');
        var axes = [null,null,null];
        for(var i=0;i<tmp.length;i++){
        	if(typeof(tmp[i])!="undefined" && tmp[i]!=null){
            	axes[i] = tmp[i];
            };
        };
    	this.fds.serials = [];
     	this.fds.col = [];
     	this.fds.xaxis = {label:"", markers:[]};
     	this.fds.yaxis = {label:""};
     	this.fds.legends = [];
     	if( axes[1] == null && axes[2] == null ){
     		//	dropped in first axis only
     		this.set({"paint_d":""});
     		var label = axes[0].name;
     		//stack data
     		this.fds.serials = [{ label: decode(label), color:colors(0), data:[dataset.data[0]] }];
     		this.fds.xaxis = {label:decode(label), markers:[decode(label)]};
     		// validate method count or aggr
    		var axes0_1st_mem = dataset.axes[0].members[0];
    		if(validate_func(axes0_1st_mem)){
    			this.fds.yaxis = {label:"count(" +decode(label)+")"};//axis ylabels
    		}else{
    			this.fds.yaxis = {label:this.get("aggr")+"(" +decode(label)+")"};//axis ylabels
    		};
      		this.fds.legends = [];
     		//saveing cols info for sorting
      		this.fds.col[decode(label)]= 0;
     	}else{
     		if( axes[1] != null && axes[2] != null){
     			//find axis from back date
     			var ds_fst_axis = ds_axis(decode(axes[1].name), dataset);
     			var ds_sec_axis = ds_axis(decode(axes[2].name), dataset);
     			//filled 2 D type axes
     			if(ds_fst_axis && ds_sec_axis) {
     				var max_i = ds_fst_axis.members.length;
 	    			var max_j = ds_sec_axis.members.length;
 	    			var fst_dn = axes[1].name;
 	    			var sec_dn = axes[2].name;
 	    			var fst_mem = ds_fst_axis.members;
 	    			var sec_mem = ds_sec_axis.members;
 	    			if(this.get("paint_d") == ""){
	    				this.set({"paint_d":fst_dn},{silent:true});
	    			};
 	    			var plused_data = [];
 	    			for( var i = 0 ; i < max_j ; i++ ){
 	    	    		var serials = {label:"",color:colors(i),data:[]};
 	    	        	for( var j = 0 ; j < max_i ; j++ ){
 	    	        		var q = {};
 	    	        		q[decode(fst_dn)] = j ;
 	    	        		q[decode(sec_dn)] = i ;
 	    	        		q["Measure"] = 0;
 	    	        		var value = ds_val( q, dataset );
 	    	        		// stack data
 	    	        		if(value != "nil"){
 	    	        			value = Number(value);
 	    	        		}else{
 	    	        			value = 0;
 	    	        		};
 	    	        		if(typeof(plused_data[j]) != "undefined"){
 	    	        			plused_data[j] += value;
 	    	        		}else{
 	    	        			plused_data[j] = value;
 	    	        		};
 	    	        		serials.data.push(plused_data[j]);
 	    	        	};
 	    	        	// set group label
 	    	        	serials.label = fst_mem[i];
 	    	        	//set group
 	    	        	this.fds.serials.push(serials);
 	    	        };
 	    	        
 	    	        for(var i = 0 ; i < max_j ; i++){
 	    	        	//set legend data
 	    	        	this.fds.legends.push({label:sec_mem[i], color:colors(i)});
 	    	        };
 	    	        
 	    			for( var i = 0 ; i < max_i ; i++ ){
 	    				//x-axis labels
	    	        	this.fds.xaxis.markers.push(fst_mem[i]);
	    	        	//save cols info for sorting
 		        		this.fds.col[fst_mem[i]]= i;
 		        	};
 		        	this.fds.xaxis.label = decode(fst_dn)+" / "+decode(sec_dn);
 	    			if( axes[0] == null ){
 	    				this.fds.yaxis.label = this.get("aggr")+"(default)";
 	        		}else{
 	        			var axes0_1st_mem = dataset.axes[0].members[0];
			    		var y_method = this.get("aggr");
			    		if(validate_func(axes0_1st_mem)){
			    			y_method = "count";
			    		};
	        			this.fds.yaxis.label = y_method+ "(" +decode(axes[0].name)+ ")";
 	        		};
     			}
     		}else{
     			// dropped any 1 of the last two D type axes
     			this.set({"paint_d":""});
     			var _axis = axes[1]==null?axes[2]:axes[1];
     			// clear X-axis's chart legend
     			this.fds.legends = [];
     			this.fds.col[decode(_axis.name)]= 0;
     			var serials = {label:"",color:colors(0),data:[]};
         		for( var i = 0 ; i < dataset.data.length ; i++ ){
         			var label = "";
     				if(_axis.members.length >1){
     					label =  decode(_axis.members[i]);
     				}else{
     					// drop M in a D axis,there is no members,get members from dataset
     					label = ds_axis(decode(_axis.name),dataset ).members[i];
     				};
     				serials.data.push(dataset.data[i]);
     				// set group label
     				serials.label = decode(_axis.name);
     				//x-axis labels
 	        		this.fds.xaxis.markers.push(label);
         		};
         		this.fds.serials.push(serials);
         		this.fds.col[decode(_axis.members[0])]= 0;
         		this.fds.xaxis.label = decode(_axis.name);
         		if( axes[0] == null ){
         			this.fds.yaxis.label = this.get("aggr")+"(Measure)";
         		}else{
         			var axes0_1st_mem = dataset.axes[0].members[0];
    	    		var y_method = this.get("aggr");
    	    		if(validate_func(axes0_1st_mem)){
    	    			y_method = "count";
    	    		};
        			this.fds.yaxis.label = y_method+ "(" +decode(axes[0].name)+ ")";
         		};
     		};
     	};
     	var cdata = { serials:this.fds.serials,
     				  xaxis:this.fds.xaxis,
     				  yaxis:this.fds.yaxis,
         			  legend:this.fds.legends
                     };
     	this.set({"cdata":cdata,'state':'loaded'});
    }
});

B2.chart.Pie = function(b2, opt) {
	this.b2 = b2;
	this.opt = merge(opt, _.clone(B2.chart.defaultOptions));

	this.width = opt.width;
	this.height = opt.height;
    var margin = opt.margin;
	if(_.isUndefined(margin)) {
		margin = [0,0,0,0];
	};
	this.ml = margin[3];
	this.mr = margin[1];
	this.mt = margin[0];
	this.mb = margin[2];
    
	this.mouse = {x:0,y:0};
	this.data = null;
	   
	this.handler = function(e){
		if( e.name == "mousemove" ){
			this.mousemoveHandler(e);
		} else if( e.name == "sliderchange" ){
			this.sliderHandler(e);
		};
	};
    
	this.mousemoveHandler = function(e) {
    	this.mouse.x = e.param.x;
        this.mouse.y = e.param.y;
        if(this.data!=null){
        	 this.render(this.g, this.data);
        };
	};
    
	this.hit = function(mouse_x, mouse_y, center, ir, or, aStart, aEnd){
		var dx = center.x - mouse_x;
		var dy = center.y - mouse_y;
		var xl = Math.sqrt(dx * dx + dy * dy);
		var angle = Math.atan2(dy, dx) * 180/Math.PI;
		if(angle < 0) {
			angle = Math.abs(angle);
			angle = 180-angle;
		} else {
			angle = angle + 180;
		};
		if (xl < or && xl > ir && angle > aStart && angle < aEnd) {
			return true;
		}else{
			return false;
		};
    };
    // caculate pie labels x,y
    this._getTextPoint = function(or, aStart, aEnd, x, y) {
		var tx = 0;
		var ty = 0;
		//percents
		var a = (aEnd - aStart)/2 + aStart;
		a = Math.PI*a/180;
		var tr = 80*or/100;
		if( a >= 0 && a <= Math.PI ){
			tx = x + Math.cos(a)*tr;
			ty = y + Math.sin(a)*tr - 6;
		}else{
			tx = x + Math.cos(a)*tr;
			ty = y + Math.sin(a)*tr - 6;
		};
		return {tx:tx, ty: ty};
	};

    this.setdata = function(g,data){
    	this.render(g,data);
    };

	this.render = function(g, data) {
		this.g = g;
		this.data = data;
		var sum = 0;// total values
		for( var i = 0; i<data.wedge.length; i++ ){
			sum += data.wedge[i].value;
		};
		var label_style = {size:12, align:"center", bold:true, color:"ffffff"};
		var pie_style = {fill:true, alpha:0.8, thick:1};
        var width = this.width - this.ml - this.mr;
        var height = this.height -this.mt - this.mb;
        
		var center = {x:this.ml+width/2, y:this.mt+height/2},
						aStart = 0,
						aEnd = 0,
						or = Math.min(center.x-this.ml, center.y-this.mt),
						ir = or/2;
		//start draw 
        g.begin();
        var tip_x, tip_y, tip_t;var tip_x, tip_y, tip_t;
        var tmp_percent = 0;
		for( var i = 0; i<data.wedge.length-1; i++ ){
			var d = data.wedge[i].value;
			aStart = aEnd;
			aEnd += d*360/sum;
			g.wedge( center.x, center.y, ir, or, aStart, aEnd, data.wedge[i].color, pie_style);//draw pie
			var tp = this._getTextPoint(or, aStart, aEnd, center.x, center.y);
			var label = (data.wedge[i].value*100/sum).toFixed(2) + "%";
			tmp_percent += Number((data.wedge[i].value*100/sum).toFixed(2));
			g.text(tp.tx -25, tp.ty, label, label_style, 50);//draw labels
			//mouse check
			if(this.hit(this.mouse.x,this.mouse.y, center, ir, or, aStart, aEnd)){
				tip_x = this.mouse.x;
            	tip_y = this.mouse.y-8;
            	tip_t = data.wedge[i].label + ":" + d;
			};
		};
		//pie last part
		g.wedge( center.x, center.y, ir, or, aEnd, 360, data.wedge[data.wedge.length-1].color, pie_style);
		var tp = this._getTextPoint(or, aEnd, 360, center.x, center.y);
		var label = (100 - tmp_percent).toFixed(2) + "%";
		g.text(tp.tx -25, tp.ty, label, label_style, 50);
		if(this.hit(this.mouse.x,this.mouse.y, center, ir, or, aEnd, 360)){
			tip_x = this.mouse.x;
        	tip_y = this.mouse.y-8;
        	tip_t = data.wedge[data.wedge.length-1].label + ":" + data.wedge[data.wedge.length-1].value;
		};
		
		// draw pie center label
		var sum_label_style = {size:12, align:"center", bold:true, color:"000000"};
		g.text(center.x-or, center.y-8, "total:"+sum, sum_label_style,2*or);
		
		if(tip_x && tip_y) {
        	draw_tooptip(g, tip_x, tip_y, tip_t, this.ml+width);
        };
		//end draw
		g.end();
    };
};/**
 *
 */
window.plugin.Pie=window.plugin.Editor.extend({
  
	type : function(){ return "Pie"; },
    
	template : "pie-chart-template",
	
    fds : {},
    
    axesOptions:[
                	{id:"pieAxisDropbox0",index:0,type:"M",def_label:"Value"},
                    {id:"pieAxisDropbox1",index:1,type:"D",def_label:"Entry"}
                ],
    //default data
	default_data:{
    				wedge:[ 
                       {value:10, label:"Group A", color:"27a5cf"},
                       {value:10, label:"Group B", color:"cf2b27"},
                       {value:10, label:"Group C", color:"3fcf27"}
                 	],
				  	legend:[{label:"Group A",color:"27a5cf"},{label:"Group B",color:"cf2b27"},{label:"Group C",color:"3fcf27"}]
                  },
      
    /**
     * fill axis handler, 
     * called on axis fill
     */
    onSetAxis:function(index, axis_model,query){
    	var axes = this.get("axes");
        axes[index] = axis_model;
        this.set("axes",axes);
        if(!query){
        	return {state:0,msg:""};
        }else{
        	return this.query(false,index);
        };
    },
    
    initLegend:function(w,h){
    	// init legend
        var margin = this.custom.margin;
        var legend_height = h -margin[0];
        this.legend = new B2.component.Legend({
        	 width: 120,
        	 height: legend_height,
        	 left: 0,
        	 top: 0
        });
        //show legend
        this.legend.show(this.get("cdata").legend);
        
        //
        $('#pie_legend').append(this.legend.el);
        $('#pie_legend').width(120);
        $('#pie_legend').height(legend_height);
        $('#pie_legend').css("top",0);
        $('#pie_legend').css("left",w -120);
        $('#pie_legend').css("z-index",999);
    },
    
    query:function(use_filter,index){
    	if(typeof(use_filter) == "undefined"){
    		use_filter = false;
    	};
    	var ret=0,msg="";
    	// query 
        var axes_slots = this.get('axes');
        var empty = true;
        for(var i=0;i<3;i++){
        	if(typeof(axes_slots[i])!="undefined" && axes_slots[i]!=null){
            	empty = false;
                break;
            };
        };
        //clear 
        if(empty){
            this.set({"cdata":this.default_data,'state':'loaded'});
        }else{
        	var send=false,lastQuery=[];
        	//value
            var value=axes_slots[0];
            if(typeof(value)!="undefined" && value!=null){
                if(value.type != "M"){
                    ret = 1;
                    if(index == 0)
                    	msg = "WARNING: "+decode(value.name)+"'s type is \"D\" (Category), it is used as \"M\" (Numeric) here, the caculation changed to \"Count\"";
                    lastQuery.push({name:"Measure", members:["uniq_metas(" + encode(value.name) + ")"]});
                }else{
                    lastQuery.push({name:"Measure", members:[encode(value.name)]});
                };
                send=true;
            };
            //group
            var group=axes_slots[1];
            if(typeof(group)!="undefined" && group!=null){
                if(group.type != "D"){
                    ret = 1;
                    if(index == 1)
                    	msg = "WARNING: "+ decode(group.name) +" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    lastQuery.push({name:encode(group.name),members:["flip(M,D)"]});
                }else{
                	if(use_filter){
                    	for(var i=0; i<group.members.length; i++){
                    		group.members[i] = encode(group.members[i]);
                        };
                        lastQuery.push({name:encode(group.name),members:group.members});
                	}else{
                		var axis = this.cube.findAxis(group.name);
                		for(var i=0; i<axis.members.length; i++){
                			group.members[i] = encode(axis.members[i]);
                		};
                		lastQuery.push({name:encode(group.name),members:["members(all)"]});
                	};

                };
                send=true;
            };
            // send query
            if(send){
                //loading start ,change state to loading
                this.set('state','loading');
                this.cube.query(lastQuery,this.get('aggr'));
            };
        };
        return {state:ret,msg:msg};
    },
      
     /**
     * processing the return query array, 
     * format the data to bar
     * more detail ...
     */
    format:function(dataset) {
        this.cache = dataset;
        var queryAxes = this.get("axes");
        if(dataset == null){
                debug("Pie chart's dataset is null");
                return false;
         };
         var data = {wedge:[],legend:[]}, ax_mem;
         if(!_.isNull(queryAxes[1]) && !_.isUndefined(queryAxes[1])) {
         	ax_mem = ds_axis( queryAxes[1].name, dataset );
         };
         var Length = dataset.data.length;
         for(var i = 0; i < Length; i++) {
             var r = {};
             var val = Number(dataset.data[i]);
             if(val <= 0){
            	 continue;
             };
             r.value = val;
             if(typeof(ax_mem ) != "undefined"){
             	r.label = String(ax_mem.members[i]);
             	r.color = colors(i);
                data.legend.push({label:r.label,color:r.color});
                this.set({"paint_d":ax_mem.name},{silent:true});
             }else{
            	r.label = String(queryAxes[0].name);
             	r.color = colors(1);
             	this.set({"paint_d":""});
             };
             data.wedge.push(r);
         };
    	this.set({"cdata":data,'state':'loaded'});
    }
});

/**
 * Bubble Chart
 */
B2.chart.Bubble = function(b2, opt) {
	this.b2 = b2;
	this.opt = merge(opt, _.clone(B2.chart.defaultOptions));
	
	var margin = opt.margin;
	if(_.isUndefined(margin)) {
		margin = [0,0,0,0];
	};
	this.width = opt.width;
	this.height = opt.height;
	this.ml = margin[3];
	this.mr = margin[1];
	this.mt = margin[0];
	this.mb = margin[2];

	/**
     * upon mousemove b2 masker,
     * the mouse will be set to with the mouse x,y position which relative to masker.
     * masker use the same coorderation with this render.
     */
	this.mouse = {x:0,y:0};
	this.data = null;
	   
	/**
	 * event handers
	 */
	this.handler = function(e){
		if( e.name == "mousemove" ){
			this.mousemoveHandler(e);
		} else if( e.name == "sliderchange" ){
			this.sliderHandler(e);
		};
	};
    
    
	/**
	 * mouseover event handler
	 */
	this.mousemoveHandler = function(e) {
    	this.mouse.x = e.param.x;
        this.mouse.y = e.param.y;
        if(this.data!=null){
        	 this.render(this.g, this.data);
        };
	};
    
    /**
     * test if the given x,y in the circle{x:xx,y:yy,r:R}
     */
	this.hit = function(x,y,ox,oy,r){
    	return Math.pow(x-ox,2) + Math.pow(y-oy,2) < Math.pow(r,2);
    };
    
    this.setdata = function(g,data){
    	this.render(g,data);
    };
    
    /**
	 * render
	 */
	this.render = function(g, data) {
		this.g = g;
        this.data = data;
        var width = this.width-this.ml-this.mr;
        var height = this.height-this.mt-this.mb;
        var ymin=0,ymax=0,yscale=1,xmin=0,xmax=0,xscale=1;
        //caculate ymax & ymin
        var bubbles = data.bubbles;
	    for(var i=0;i<bubbles.length;i++){
	    	var bubble = bubbles[i];
	        if(Number(bubble.y)> ymax) 
	        	ymax = Number(bubble.y);
	        if(Number(bubble.y) < ymin)
	        	 ymin = Number(bubble.y);
	        if(Number(bubble.x) > xmax)
	        	 xmax = Number(bubble.x);
	        if(Number(bubble.x) < xmin)
	        	 xmin = Number(bubble.x);
	    };
        if(ymin==0&&ymax==0){
        	ymin = 0;
            ymax = 100;
        };
        //adjust ymin, ymax
        var o = roundup(ymin,ymax);
        ymin = o.min;
        ymax = o.max;
        ystep = o.step;
        yscale = height/(ymax-ymin);
        o = roundup(xmin,xmax);
        xmin = o.min;
        xmax = o.max;
        xstep = o.step;
        if(xmin%xstep!=0){
            if(xmin<0){
                var k = xmin%xstep;
                var m = Math.ceil(xmin/xstep);
                var xmin = k==0?xmin:xstep*(m-1);
            }else{
                var k = xmin%xstep;
                var m = Math.floor(xmin/xstep);
                var xmin = k==0?xmin:xstep*(m-1);
            };
        };
        //var xscale =yscale;//width/(xmax-xmin);
        var xscale = width/(xmax-xmin);
        var ybase = 0,xbase=0;
        if(ymin < 0)
        	ybase = ymin*yscale;
        if(xmin < 0)
        	xbase = xmin*xscale;
        g.begin();
        //yaxis
        g.text(0,this.mt+height,data.yaxis.label,{align:"center",rotation:270},height); //y-axis tag
        for(var t=ymin; t<ymax+ystep; t= FloatAdd(t,ystep)){
        	var label = format_num(t);
            var y = this.mt + height - (t*yscale-ybase);
            g.line(this.ml,y,this.ml+width,y,'DDDDDD');
        	g.text(0,y-8,label,this.opt.yaxis,this.ml);
        };
        //xaxis
        g.text(this.ml,0,data.xaxis.label,{align:"center"},width); //x-axis tag
        for(var t=xmin; t< xmax+xstep; t= FloatAdd(t,xstep)){
        	var label = format_num(t);
            var x = this.ml + t*xscale-xbase;
            if(x>this.ml+width)
            	break;
            g.line(x,this.mt,x,this.mt+height,"DDDDDD");
        	g.text(x,this.mt+height,label,{align:"left",size:10},xstep*xscale); 
        };
		//draw bubbles
        var tip_x, tip_y, tip_t, max_r = -Number.MAX_VALUE, min_r = Number.MAX_VALUE;
        for(var i=0;i<bubbles.length;i++){
        	var r = Math.abs(parseFloat(bubbles[i].r));
        	max_r = Math.max(r, max_r);
        	min_r = Math.min(r, min_r);
        };
        var P_MAX = 50;
        var P_MIN = 5;
        var sscale = 1;
        if(max_r != min_r) {
        	sscale = P_MAX/max_r;
        };
        g.clip(this.ml,this.mt,width+1,height+1);
        for(var i=0;i<bubbles.length;i++){
        	var bubble=bubbles[i];
        	var x = this.ml + bubble.x*xscale-xbase;
            var y = this.mt + height - (bubble.y*yscale-ybase);
            var R = P_MIN + Math.abs(parseFloat(bubble.r)*sscale);
            g.circle(x, y, R, bubble.color, {fill:true,alpha:0.8});
            //check mouse
            if(this.hit(this.mouse.x,this.mouse.y,x,y,R)){
            	//show tooltip
            	tip_x = this.mouse.x;
            	tip_y = this.mouse.y-8;
            	tip_t = data.xaxis.label+":"+bubble.x + " " + data.yaxis.label + ":" +bubble.y;
            	if(data.raxis.label != null && data.raxis.label != ""){
            		tip_t = tip_t + " " + data.raxis.label + ":" + bubble.r;
            	};
            	if(data.caxis.label != null && data.caxis.label != ""){
            		tip_t = tip_t + " " + data.caxis.label + ":" + bubble.label;
            	};
            };
        };
        if(tip_x && tip_y) {
        	draw_tooptip(g, tip_x, tip_y, tip_t,this.ml+width);
        };
        g.line(this.ml,this.mt,this.ml,this.height-this.mb,"DDDDDD"); //left border
        //draw zore lines
        var zy = this.mt+height+ybase;
        g.line(this.ml,
               zy,
               this.ml+width,
               zy,
               "0086cd");
        var zx = this.ml-xbase;
        g.line(zx,
               this.mt,
               zx,
               this.mt+height,
               "0086cd");
        
        g.end();
    };
};/**
 *
 */
window.plugin.Bubble=window.plugin.Editor.extend({
    
    type : function(){ return "Bubble"; },

	template : "bubble-chart-template",
	fds : {},
    axesOptions : [
    			 	{id:"bubbleAxisDropbox0",index:0,type:"M",def_label:"X"},
    			 	{id:"bubbleAxisDropbox1",index:1,type:"M",def_label:"Y"},
                 	{id:"bubbleAxisDropbox2",index:2,type:"M",def_label:"Size"},
                 	{id:"bubbleAxisDropbox3",index:3,type:"D",def_label:"Color"}
                ],
    //default data
	default_data:{ bubbles:[
                            {x:0,y:0,r:20,label:"A",color:"27a5cf"}
                            ],
                     xaxis:{label:"X",markers:[]},
                     yaxis:{label:"Y"},
                     raxis:{label:""},
                     caxis:{label:""},
                     legend:[]
                  },
  
    /**
     * fill axis handler, 
     * called on axis fill
     */
    onSetAxis:function(index, axis_model,query){
    	var axes = this.get("axes");
        axes[index] = axis_model;
    	if(axis_model == null){
			axes[index] = null;//remove
		}else{
			if(index != 3 && axis_model.type == "D"){
				return {state:2,msg:"ERROR: You need to drop a field which type is 'M' here."};
			}else if( index == 3 && axis_model.type == "M"){
				return {state:2,msg:"ERROR: You need to drop a field which type is 'D' here."};
			};
			axes[index] = axis_model;
		};
        this.set("axes",axes);
        if(!query){
        	return {state:0,msg:""};
        }else{
        	return this.query();
        };
    },
    
    render:function(w,h){
    	if(this.legend != undefined){
    		
        	var pd = this.get('paint_d');
   			 	var cw = w-10;
   			 	if(pd == "" ){
		   			 $('#editor_legend').css("display","none");
		   			 this.legend.hide();
   			 	}else{
		   			 this.legend.show(this.get("cdata").legend);
		   			 $('#editor_legend').css("display","block");
		   			 $('#editor_legend').width(120);
		   			 cw -= 112;
		   			 $('#editor_canvas').width(cw);
	   			};
	   			this.chart.size(cw,h - 20);
        	};
           this.chart.render(this.get('cdata'));
    },
    
    query:function(){
    	var ret=0,msg="";
	    var axes = this.get("axes");
        //perform query
		var count = 0;
		for(var i=0;i<3;i++){
			if(typeof(axes[i])!="undefined" && axes[i]!=null){
				count++;
			};
		};
		if(count<2){
        	//reset to init view
			this.set('paint_d', '');
            this.set({"cdata":this.default_data,'state':'loaded'});
		}else{
        	var args = "";
            for(var i=0;i<4;i++){
                var a = axes[i];
                if(typeof(a)!="undefined" && a!=null){
                    if(i<3){
                        args += encode(a.name) + ",";
                    }else{
                        args += "meta("+ encode(a.name) + "),";
                    };
                };
            };
            if(args.length>0){
                args = args.substring(0,args.length-1);
            };
            this.set('state','loading');
            this.cube.query([{name:"Measure",members:['every('+args+')']}],this.get('aggr'));
        };
        
        return {state:ret,msg:msg};
    },
      
     /**
     * processing the return query array, 
     * format the data to bar
     * more detail ...
     */
    format:function(dataset) {
        this.cache = dataset;
        var axes = this.get("axes");
    	if(dataset == null){
            debug("Bubble chart's dataset is null"); 
            return false;
        };
        var mm_count = 0;
		for(var i=0;i<3;i++){
			if(typeof(axes[i])!="undefined" && axes[i]!=null){
				mm_count++;
			};
		};
    	if( mm_count == 0 ){
    		debug("measure members is 0");
    		return false;
    	};
    	var meta_count = 0;
		if( typeof(axes[3])!="undefined" && axes[3] != null ){
			meta_count = 1;
		};
    	
    	this.fds.xaxis = {label:"", markers:[]};
    	this.fds.yaxis = {label:""};
    	this.fds.raxis = {label:""};
    	this.fds.caxis = {label:""};
    	if( typeof(axes[0]) != "undefined" && axes[0] != null){
    		this.fds.xaxis.label = decode(axes[0].name);
    	};
    	if( typeof(axes[1]) != "undefined" && axes[1] != null){
    		this.fds.yaxis.label = decode(axes[1].name);
    	};
    	if( typeof(axes[2]) != "undefined" && axes[2] != null){
    		this.fds.raxis.label = decode(axes[2].name);
    	};
    	if( typeof(axes[3]) != "undefined" && axes[3] != null){
    		this.fds.caxis.label = decode(axes[3].name);
    	};
    	
    	this.fds.bubbles = [];
    	var data = dataset.data;
    	var row_count = data.length/(mm_count + meta_count);
    	var color_table = {};
    	this.fds.legend = [];
    	var count = 0;
    	for( var i = 0; i < row_count ; i++ ){
    		var r = {x:0, y:0, r:5, label:'', color:''};
    		if( typeof(axes[0])!="undefined" && axes[0] != null ){
    			r.x = data[i*(mm_count+meta_count) + 0 ];
    		};
    		if( typeof(axes[1])!="undefined" && axes[1] != null ){
    			r.y = data[i*(mm_count+meta_count) + 1 ];
    		};
    		if( typeof(axes[2])!="undefined" && axes[2] != null ){
    			r.r = data[i*(mm_count+meta_count) + 2 ];
    		};
    		if( typeof(axes[3])!="undefined" && axes[3] != null ){
    			r.label = decode(data[i*(mm_count+meta_count) + mm_count ]);
    			if(typeof(color_table[r.label]) != "undefined"){
    				r.color = color_table[r.label];
    			}else{
    				color_table[r.label] = colors(count);
    				r.color = colors(count);
    				this.fds.legend.push({label:r.label, color:r.color});
    				count++;
    			};
    			this.set({"paint_d":axes[3].name},{silent:true});
    		} else {
    			this.set('paint_d', '');
    		};
    		if(meta_count == 0){
    			r.label = '';
    			r.color = colors(0);
    		};
    		this.fds.bubbles.push(r);
    	};
	    var cdata = { bubbles:this.fds.bubbles,
                      xaxis:this.fds.xaxis,
                      yaxis:this.fds.yaxis,
                      raxis:this.fds.raxis,
                      caxis:this.fds.caxis,
         			  legend:this.fds.legend
                    };
    	this.set({"cdata":cdata,'state':'loaded'});
    }
});

B2.chart.Coxcomb = function(b2, opt) {
	this.b2 = b2;
	this.opt = merge(opt, _.clone(B2.chart.defaultOptions));

	this.width = opt.width;
	this.height = opt.height;
    var margin = opt.margin;
	if(_.isUndefined(margin)) {
		margin = [0,0,0,0];
	};
	this.ml = margin[3];
	this.mr = margin[1];
	this.mt = margin[0];
	this.mb = margin[2];
    
	this.mouse = {x:0,y:0};
	this.data = null;
	   
	this.handler = function(e){
		if( e.name == "mousemove" ){
			this.mousemoveHandler(e);
		} 
	};
    
	this.mousemoveHandler = function(e) {
    		this.mouse.x = e.param.x;
        	this.mouse.y = e.param.y;
       		if(this.data!=null){
        	 	this.render(this.g, this.data);
       		 };
	};
    
	this.hit = function(mouse_x, mouse_y, ox,oy, ir, or, start_angle, end_angle){
		var dx = ox - mouse_x;
		var dy = oy - mouse_y;
		var xl = Math.sqrt(dx * dx + dy * dy);
		var angle = Math.atan2(dy, dx) * 180/Math.PI;
		if(angle < 0) {
			angle = Math.abs(angle);
			angle = 180-angle;
		} else {
			angle = angle + 180;
		};
		if (xl < or && xl > ir && angle > start_angle && angle < end_angle) {
			return true;
		}else{
			return false;
		};
   	 };

    // caculate pie labels x,y
    this._getTextPoint = function(or, aStart, aEnd, x, y) {
		var tx = 0;
		var ty = 0;
		//percents
		var a = (aEnd - aStart)/2 + aStart;
		a = Math.PI*a/180;
		var tr = 80*or/100;
		if( a >= 0 && a <= Math.PI ){
			tx = x + Math.cos(a)*tr;
			ty = y + Math.sin(a)*tr - 6;
		}else{
			tx = x + Math.cos(a)*tr;
			ty = y + Math.sin(a)*tr - 6;
		};
		return {tx:tx, ty: ty};
	};

    	this.setdata = function(g,data){
    		this.render(g,data);
    	};

	this.render = function(g, data) {
		this.g = g;
		this.data = data;
		var ow = this.width - this.ml - this.mr;
		var oh = this.height - this.mt - this.mb;
		var ox = ow/2;
		var oy = oh/2;
		var hole_size = 10;
		var r = Math.min(ow,oh)/2;
		var max_r = 0;
		for(var i = 0; i < data.wedge.length; i++) {
		   var stack = data.wedge[i];
		   var tmp = 0;
		   for (var n = 0; n < stack.length; n++){
			tmp += stack[n].value;
		   };
		   if(tmp > max_r)
			max_r = tmp;
		};
		var scale = (r - hole_size)/max_r;
		var pAngle = 360/data.wedge.length;
		var angle = 0;
		var tip_x = -100, tip_y, tip_t;
		g.begin();
		for(var i = 0; i < data.wedge.length; i++) {
		   var stack = data.wedge[i];
		   var ir = hole_size;
		   for (var n = 0; n < stack.length; n++){
			var label = stack[n].label ;
			var val = stack[n].value * scale;
			var color = stack[n].color;
			g.wedge( ox, oy, ir +1, ir + val, angle, angle+pAngle, color, {fill:true,alpha:0.8, thick:1});
			if(this.hit(this.mouse.x,this.mouse.y, ox,oy, ir, ir + val, angle, angle+pAngle)){
				tip_x = this.mouse.x;
				tip_y = this.mouse.y - 10;
				tip_t = data.group[i].label + label + ":" + stack[n].value;
			};
			ir += val;
		   };
		   angle += pAngle;
		};
		if(tip_x > 0) {
        	   draw_tooptip(g, tip_x, tip_y, tip_t, this.ml+ow);
        	};
        	
		g.end();
    };
};/**
 *
 */
window.plugin.Coxcomb= window.plugin.Editor.extend({
	
    type : function(){ return "Coxcomb"; },
    
	template : "coxcomb-chart-template",
	fds : {},
    axesOptions:[
                    {id:"barAxisDropbox0",index:0,type:"M",def_label:"R"},
                    {id:"barAxisDropbox1",index:1,type:"D",def_label:"Wedge"},
                    {id:"barAxisDropbox2",index:2,type:"D",def_label:"Stack"}
                ],
    //default data
	default_data : {wedge:[
                           [{value:80, label:"A", color:"27a5cf"},{value:150, label:"B", color:"cf2b27"},{value:610, label:"C", color:"3fcf27"}],
                           [{value:90, label:"A", color:"27a5cf"},{value:150, label:"B", color:"cf2b27"},{value:150, label:"C", color:"3fcf27"}],
                           [{value:100, label:"A", color:"27a5cf"},{value:150, label:"B", color:"cf2b27"},{value:780, label:"C", color:"3fcf27"}],
                           [{value:110, label:"A", color:"27a5cf"},{value:150, label:"B", color:"cf2b27"},{value:100, label:"C", color:"3fcf27"}],
                           [{value:120, label:"A", color:"27a5cf"},{value:150, label:"B", color:"cf2b27"},{value:250, label:"C", color:"3fcf27"}]
                         ],
                         group:[{label:"G1 "}, {label:"G2 "}, {label:"G3 "}, {label:"G4 "}, {label:"G5 "}],
                         legend:[{label:"A",color:"27a5cf"},{label:"B",color:"cf2b27"},{label:"C",color:"3fcf27"}]
                   },

    /**
     * fill axis handler, 
     * called on axis fill
     */
    onSetAxis:function(index, axis_model,query){
    	var axes = this.get("axes");
        axes[index] = axis_model;
        this.set("axes",axes);
        this.current = index;
        if(!query){
        	return {state:0,msg:""};
        }else{
        	return this.query();
        };
    },
    
    initLegend:function(w,h){
    	// init legend
        var margin = this.custom.margin;
        var legend_height = h -margin[0];
        this.legend = new B2.component.Legend({
        	 width: 120,
        	 height: legend_height,
        	 left: 0,
        	 top: 0
        });
        //show legend
        this.legend.show(this.default_data.legend);
        //
        $('#coxcomb_legend').append(this.legend.el);
        $('#coxcomb_legend').width(120);
        $('#coxcomb_legend').height(legend_height);
        $('#coxcomb_legend').css("top",0);
        $('#coxcomb_legend').css("left",w -120);
        $('#coxcomb_legend').css("z-index",999);
    },
    
    query:function(use_filter){
    	// query 
        var ret=0,msg="";
        var axes_slots = this.get('axes');
        var empty = true;
        for(var i=0;i<3;i++){
        	if(typeof(axes_slots[i])!="undefined" && axes_slots[i]!=null){
            	empty = false;
                break;
            };
        };
        // 
        if(empty){
            this.set({"cdata":this.default_data,'state':'loaded'});
        }else{
        	 var send = false,lastQuery = [];
            // len
            var y=axes_slots[0];
            if(typeof(y)!="undefined" && y!=null){
                if(y.type != "M"){
                	if(this.current == 0){
                    	ret = 1;
                    	msg = "WARNING: "+decode(y.name)+"'s type is \"D\" (Category), it is used as \"M\" (Numeric) here, the caculation changed to \"Count\"";
                    };
                    lastQuery.push({name:"Measure", members:["uniq_metas(" + encode(y.name) + ")"]});
                }else{
                    lastQuery.push({name:"Measure", members:[encode(y.name)]});
                };
                send=true;
            };
            // wedge
            var x=axes_slots[1];
            if(typeof(x)!="undefined" && x!=null){
                if(x.type != "D"){
                	if(this.current == 1){
                    	ret = 1;
                    	msg = "WARNING: "+ decode(x.name) +" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    };
                    lastQuery.push({name:encode(x.name), members:["flip(M,D)"]});
                }else{
                	lastQuery.push({name:encode(x.name), members:["members(all)"]});
                };
                send=true;
            };
            // stack
            var xx=axes_slots[2];
            if(typeof(xx)!="undefined" && xx!=null){
                if(xx.type != "D"){
                	if(this.current == 2){
                    	ret = 1;
                    	msg = "WARNING: "+decode(xx.name)+" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    };
                    lastQuery.push({name:encode(xx.name), members:["flip(M,D)"]});
                }else{
                	lastQuery.push({name:encode(xx.name), members:["members(all)"]});
                };
                send=true;
            };
            // send query
            if(send){
                //loading start ,change state to loading
                this.set('state','loading');
                this.cube.query(lastQuery,this.get('aggr'));
            };
        };
        return {state:ret,msg:msg};
    },
      
     /**
     * processing the return query array, 
     * format the data to bar
     * more detail ...
     */
    format:function(dataset) {
    	if(dataset == null){
            debug("Bar chart's dataset is null"); 
            return false;
        };
        this.cache = dataset;
        var tmp = this.get('axes');
        var axes = [null,null,null];
        for(var i=0;i<tmp.length;i++){
        	if(typeof(tmp[i])!="undefined" && tmp[i]!=null){
            	axes[i] = tmp[i];
            };
        };
    	this.fds.wedge = [];
    	this.fds.legends = [];
    	this.fds.group = [];
    	if( axes[1] == null && axes[2] == null ){//	drop a measure only
    		this.set({"paint_d":""});
    		var label = axes[0].name;
    		this.fds.wedge = [
                                [{value: dataset.data[0],label: decode(label), color:colors(0)}]
                              ];
     		this.fds.legends = [];//legend data
     		this.fds.group = [{label:""}];//group data
    	}else{
    		if( axes[1] != null && axes[2] != null){
    			//there is no order in return data,so using dropped ordered axes to find axis from return date
    			var ds_fst_axis = ds_axis(decode(axes[1].name), dataset);
    			var ds_sec_axis = ds_axis(decode(axes[2].name), dataset);
    			//drop both 2 D axes
    			if(ds_fst_axis && ds_sec_axis) {
    				var max_i = ds_fst_axis.members.length;
	    			var max_j = ds_sec_axis.members.length;
	    			var fst_dn = axes[1].name;
	    			var sec_dn = axes[2].name;
	    			var fst_mem = ds_fst_axis.members;
	    			var sec_mem = ds_sec_axis.members;
	    			if(this.get("paint_d") == ""){
	    				this.set({"paint_d":fst_dn},{silent:true});
	    			};
	    			for( var i = 0 ; i < max_i ; i++ ){
	    	    		var group = [];
	    	        	for( var j = 0 ; j < max_j ; j++ ){
	    	        		var q = {};
	    	        		q[decode(fst_dn)] = i ;
	    	        		q[decode(sec_dn)] = j ;
	    	        		q["Measure"] = 0;
	    	        		var value = ds_val( q, dataset );
	    	        		group.push({value:Number(value), label:sec_mem[j], color:colors(j)});
	    	        	};
	    	        	//set group
	    	        	this.fds.wedge.push(group);
	    	        };
	        		//fill legend's data
	        		for(var i=0; i<sec_mem.length; i++){
	        			this.fds.legends.push({label:sec_mem[i], color:colors(i)});
	        		};
	        		//fill group's data
	        		for(var i=0; i<max_i; i++){
	        			this.fds.group.push({label:fst_mem[i]+" "});
	        		};
    			}
    		}else{
    			// dropped any 1 of the last two axes
    			this.set({"paint_d":""});
    			var _axis = axes[1]==null?axes[2]:axes[1];
    			// clear X-axis's chart legend
    			this.fds.legends = [];
        		for( var i = 0 ; i < dataset.data.length ; i++ ){
        			var group = [];
        			var label = "";
    				if(_axis.members.length >1){
    					label =  decode(_axis.members[i]);
    				}else{
    					// drop M in a D axis,there is no members,get members from dataset
    					label = ds_axis(decode(_axis.name),dataset ).members[i];
    				};
    				group.push({value:dataset.data[i], label:label, color:colors(0)});
    				this.fds.group.push({label:""});
        			this.fds.wedge.push(group);
        		};
    		};
    	};
        var data = this.fds.wedge;
        //filter the nil values
        for(var i=0;i<data.length;i++){
        	var c = 0;
            for(var j=0;j-c<data[i].length;j++){
            	if(data[i][j-c].value=="nil" || _.isNaN(data[i][j-c].value)){
                	data[i].splice((j-c),1);
                	c++;
                };
            };
        };
    	var cdata = { 
                      wedge:data,
                      group:this.fds.group,
                      legend:this.fds.legends
                    };
    	this.set({"cdata":cdata,'state':'loaded'});
    }
});

/** 
 *  Stackbar Chart
 */
B2.chart.Stackbar = function(b2, opt){
	this.b2 = b2;
	this.opt = merge(opt, _.clone(B2.chart.defaultOptions));
	
    var margin = opt.margin;
	if(_.isUndefined(margin)) {
		margin = [0,0,0,0];
	};
	this.width = opt.width;
	this.height = opt.height;
	this.ml = margin[3];
	this.mr = margin[1];
	this.mt = margin[0];
	this.mb = margin[2];
	
	this.xaxis_window = {start:0,end:0};
	
    /**
     * upon mousemove b2 masker,
     * the mouse will be set to with the mouse x,y position which relative to masker.
     * masker use the same coorderation with this render.
     */
	this.mouse = {x:0,y:0};
	this.data = null;
    if(B2.component != undefined && B2.component.Slider != undefined){
        // add slider
        this.slider = new B2.component.Slider(this, {
    		width:this.width - this.ml - this.mr,
    		height:30,
    		left: this.ml
    	});
	};

    /**slider event handler*/
    this.sliderHandler = function(e) {
        this.xaxis_window.start = e.params.start;
        this.xaxis_window.end = e.params.end;
        this.render(this.g,this.data);
	};
   	
	/**
	 * event handers
	 */
	this.handler = function(e){
		if( e.name == "mousemove" ){
			this.mousemoveHandler(e);
		} else if( e.name == "sliderchange" && this.slider != undefined ){
			this.sliderHandler(e);
		};
	};
	/**
	 * when data changed, call this method
	 */
	this.setdata = function(g,data){
    	this.g = g;
        this.data = data;
        
    	// slider
       	var groups = data.groups;
		var slider_labels = [];
		for(var i=0; i<groups.length; i++) {
			slider_labels.push(groups[i].label);
		};
		var barlen = groups.length;
        // max bars when unit bar width is 30px
		var maxbars = Math.ceil((this.width-this.ml-this.mr)/30);
		// if data's bar len > maxbars, then show slider
		if(barlen > maxbars) {
			var end = maxbars-1;
			if(end < groups.length-1) {
				this.xaxis_window = {start:0,end:end};
				this.slider.show(slider_labels);
				this.slider.slide(this.xaxis_window.start, this.xaxis_window.end);
			} else {
				this.xaxis_window = {start:0,end:groups.length-1};
				this.slider.hide();
			};
		} else {
			// hide slider and change axis window
			this.xaxis_window = {start:0,end:groups.length-1};
			this.slider.hide();
		};
		// render
    	this.render(g,this.data);
    };
    
    
	/**
	 * mouseover event handler
	 */
	this.mousemoveHandler = function(e) {
    	this.mouse.x = e.param.x;
        this.mouse.y = e.param.y;
        if(this.data!=null){
        	 this.render(this.g, this.data);
        };
	};
    
    /**
     * test if the given x,y in the rect{x:xx,y:yy,width:ww,height:hh}
     */
	this.hit = function(x,y,xx,yy,ww,hh){
    	var ymin = Math.min(yy,yy+hh);
        var ymax = Math.max(yy,yy+hh); 
        var xmin = Math.min(xx,xx+ww);
        var xmax = Math.max(xx,xx+ww);
    	return ((x>xmin) && (x<xmax)&&(y>ymin) &&(y<ymax));
    };
    /**
     * mapg data and render
     */
	this.render = function(g, data) {
        var ymax = -Number.MAX_VALUE, ymin=0;
        var groups = [];
        //caculate ymax & ymin
        var _start = this.xaxis_window.start, 
        	_end = this.xaxis_window.end;
        
        for(var i=_start;i<=_end;i++){
        	var group = data.groups[i];
        	groups.push(group);
        	if(group.bars.length == 1) {
        		var v = group.bars[0].value;
        		ymax = Math.max(v, ymax);
        	} else {
        		var value = 0;
        		for(var n=0;n<group.bars.length;n++){
	        		var v = group.bars[n].value;
	        		value += v;
	            };
            	ymax = Math.max(value, ymax);
        	};
        };

        if(groups.length == 0) {
        	return;
        };
        //default, no data
        if(ymin==0 && ymax==0){
        	ymin = 0; ymax = 100;
        };
        //adjust ymin, ymax
        var o = roundup(ymin,ymax);
        ymin = o.min;
        ymax = o.max;
        ystep = o.step;
        var width = this.width-this.ml-this.mr;
        var height = this.height-this.mt-this.mb;
        var yscale =height/(ymax-ymin);
        
        // begin to draw
        g.begin();
        
        // draw yaxis and y labels
        for(var t=ymin; t<=ymax; t= FloatAdd(t,ystep)){
        	var label = format_num(t);
            var y = this.mt + height-(t*yscale);
            g.line(this.ml,y,this.ml+width,y,'DDDDDD');
        	g.text(0,y-8,label,this.opt.yaxis,this.ml);
        };
       	g.line(this.ml,this.mt,this.ml,this.height-this.mb,this.opt.grid.color); //left border
        g.line(this.width-this.mr,this.mt,this.width-this.mr,this.height-this.mb,this.opt.grid.color); //right border
        g.text(0,this.mt+height,data.yaxis.label,this.opt.yaxisLabel,height); //y-axis tag
        g.text(this.ml,0,data.xaxis.label,this.opt.xaxisLabel,width); //x-axis tag
        //each bar width
        var bar_w = width/(groups.length)*0.9;
		//draw bars
        var tip_x, tip_y, tip_t;
        for(var i=0;i<groups.length;i++){
        	var group = groups[i], 
        		yval = 0,
        		w = bar_w,
        		x = i*bar_w*1.1,
        		pre_h = 0;
        	for(var j=0; j<group.bars.length; j++) {
        		var bars = group.bars;
        		var yval = bars[j].value;
        		var h = yscale*yval;
        		var y = 0;
        		if(h < 1) {
        			continue;
        		};
        		if((pre_h >= 0 && yval >= 0) || (pre_h <= 0 && yval <= 0)) {
        			y = height - (h+pre_h);
        			pre_h = h+pre_h;
        		} else {
        			y = height - (h);
        			pre_h = h;
        		};
        		// draw bars
	            g.rect(this.ml+x, this.mt+y, w-1, h, bars[j].color, { alpha:1, fill:true, thick:1});
	            //check mouse
	            if(this.hit(this.mouse.x,this.mouse.y,this.ml+x,this.mt+y,w-1,h)){
	            	//show tooltip
	            	tip_x = this.mouse.x;
	            	tip_y = this.mouse.y-8;
	            	tip_t = bars[j].label + ":" + bars[j].value;
	            };
        	};
            //draw x labels
          	g.text(this.ml+x, this.mt+height, group.label,this.opt.xaxis, w);  
        };
        if(tip_x && tip_y) {
        	draw_tooptip(g, tip_x, tip_y, tip_t, this.ml+width);
        };
        //draw y zore line
        var zy = this.mt+height;
        g.line(this.ml, zy, this.ml+width, zy, "000000");
        g.end();     
	};
};/**
 *Stack Bar
 */
window.plugin.Stackbar= window.plugin.Editor.extend({
	
    type : function(){ return "Stackbar"; },
    
	template : "sb-chart-template",
	fds : {},
    axesOptions:[
                    {id:"barAxisDropbox0",index:0,type:"M",def_label:"Y"},
                    {id:"barAxisDropbox1",index:1,type:"D",def_label:"X"},
                    {id:"barAxisDropbox2",index:2,type:"D",def_label:"Nested X"}
                ],
    //default data
	default_data : {groups:[{label:"",bars:[{value:0,label:"A",color:"0E51A7"},
	     						                       {value:0,label:"B",color:"0E51A7"},
	     						                       {value:0,label:"C",color:"0E51A7"}]}],
	      				 xaxis:{label:"X", markers:[]},
	      				 yaxis:{label:"Y"},
	      				 legend:[]
	},
	
    /**
     * fill axis handler,
     * called on axis fill
     */
    onSetAxis:function(index, axis_model, query){
    	var axes = this.get("axes");
        axes[index] = axis_model;
        this.set("axes",axes);
        this.current = index;
        if(!query){
        	return {state:0,msg:""};
        }else{
        	return this.query();
        };
    },
    
    render:function(w,h){
    	if(this.legend != undefined){
    		
        	var pd = this.get('paint_d');
   			 	var cw = w-10;
   			 	if(pd == "" ){
		   			 $('#editor_legend').css("display","none");
		   			 this.legend.hide();
   			 	}else{
		   			 this.legend.show(this.get("cdata").legend);
		   			 $('#editor_legend').css("display","block");
		   			 $('#editor_legend').width(120);
		   			 cw -= 112;
		   			 $('#editor_canvas').width(cw);
	   			};
	   			this.chart.size(cw,h - 20);
        	};
           this.chart.render(this.get('cdata'));
    },
    
    query:function(use_filter){
    	if(typeof(use_filter) == "undefined"){
    		use_filter = false;
    	};
    	// query 
        var ret=0,msg="";
        var axes_slots = this.get('axes');
        var empty = true;
        for(var i=0;i<3;i++){
        	if(typeof(axes_slots[i])!="undefined" && axes_slots[i]!=null){
            	empty = false;
                break;
            };
        };
        //clear 
        if(empty){
            this.set({"cdata":this.default_data,'state':'loaded'});
        }else{
        	 var send = false,lastQuery = [];
            //y
            var y=axes_slots[0];
            if(typeof(y)!="undefined" && y!=null){
                if(y.type != "M"){
                	if(this.current == 0){
                    	ret = 1;
                    	msg = "WARNING: "+decode(y.name)+"'s type is \"D\" (Category), it is used as \"M\" (Numeric) here, the caculation changed to \"Count\"";
                    };
                    lastQuery.push({name:"Measure", members:["uniq_metas(" + encode(y.name) + ")"]});
                }else{
                    lastQuery.push({name:"Measure", members:[encode(y.name)]});
                };
                send=true;
            };
            //x
            var x=axes_slots[1];
            if(typeof(x)!="undefined" && x!=null){
                if(x.type != "D"){
                	if(this.current == 1){
                    	ret = 1;
                    	msg = "WARNING: "+ decode(x.name) +" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    };
                    lastQuery.push({name:encode(x.name), members:["flip(M,D)"]});
                }else{
                	if(use_filter){
                		for(var i=0; i<x.members.length; i++){
                            x.members[i] = encode(x.members[i]);
                        };
                        lastQuery.push({name:encode(x.name), members:x.members});
                	}else{
                		var axis = this.cube.findAxis(x.name);
                		for(var i=0; i<axis.members.length; i++){
                			x.members[i] = encode(axis.members[i]);
                		};
                		lastQuery.push({name:encode(x.name), members:["members(all)"]});
                	};
                };
                send=true;
            };
            //xx
            var xx=axes_slots[2];
            if(typeof(xx)!="undefined" && xx!=null){
                if(xx.type != "D"){
                	if(this.current == 2){
                    	ret = 1;
                    	msg = "WARNING: "+decode(xx.name)+" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    };
                    lastQuery.push({name:encode(xx.name), members:["flip(M,D)"]});
                }else{
                	if(use_filter){
                        for(var i=0; i<xx.members.length; i++){
                            xx.members[i] = encode(xx.members[i]);
                        };
                        lastQuery.push({name:encode(xx.name), members:xx.members});
                	}else{
                		var axis = this.cube.findAxis(xx.name);
                		for(var i=0; i<axis.members.length; i++){
                			xx.members[i] = encode(axis.members[i]);
                		};
                		lastQuery.push({name:encode(xx.name), members:["members(all)"]});
                	};
                };
                send=true;
            };
            // send query
            if(send){
                //loading start ,change state to loading
                this.set('state','loading');
                this.cube.query(lastQuery,this.get('aggr'));
            };
        };
        return {state:ret,msg:msg};
    },
      
     /**
     * processing the return query array, 
     * format the data to bar
     * more detail ...
     */
    format:function(dataset) {
    	if(dataset == null){
            debug("Stack Bar chart's dataset is null"); 
            return false;
        };
        this.cache = dataset;
        var tmp = this.get('axes');
        var axes = [null,null,null];
        for(var i=0;i<tmp.length;i++){
        	if(typeof(tmp[i])!="undefined" && tmp[i]!=null){
            	axes[i] = tmp[i];
            };
        };
    	this.fds.groups = [];
    	this.fds.col = [{},{}];//cols info for sorting
    	this.fds.xaxis = {label:"", markers:[]};
    	this.fds.yaxis = {label:""};
    	if( axes[1] == null && axes[2] == null ){//	drop a measure only
    		this.set({"paint_d":""});
    		var label = axes[0].name;
    		this.fds.groups = [{label: decode(label), bars:[{value: dataset.data[0],label: decode(label), color:colors(0)}]}];//bars data
    		this.fds.xaxis = {label:decode(label), markers:[decode(label)]};//axis xlabels
    		// validate method count or aggr
     		var axes0_1st_mem = dataset.axes[0].members[0];
    		if(validate_func(axes0_1st_mem)){
    			this.fds.yaxis = {label:"count(" +decode(label)+")"};//axis ylabels
    		}else{
    			this.fds.yaxis = {label:this.get("aggr")+"(" +decode(label)+")"};//axis ylabels
    		};
    		//saveing cols info for sorting
     		//this.fds.col[decode(label)]= 0;
    	}else{
    		if( axes[1] != null && axes[2] != null){
    			//there is no order in return data,so using dropped ordered axes to find axis from return date
    			var ds_fst_axis = ds_axis(decode(axes[1].name), dataset);
    			var ds_sec_axis = ds_axis(decode(axes[2].name), dataset);
    			//drop both 2 D axes
    			if(ds_fst_axis && ds_sec_axis) {
    				var max_i = ds_fst_axis.members.length;
	    			var max_j = ds_sec_axis.members.length;
	    			var fst_dn = axes[1].name;
	    			var sec_dn = axes[2].name;
	    			var fst_mem = ds_fst_axis.members;
	    			var sec_mem = ds_sec_axis.members;
	    			if(this.get("paint_d") == ""){
	    				this.set({"paint_d":fst_dn},{silent:true});
	    				$("#pd_select").html(this.get("paint_d"));
	    			};
	    			for( var i = 0 ; i < max_i ; i++ ){
	    	    		var group = {label:"", bars:[]};
	    	        	for( var j = 0 ; j < max_j ; j++ ){
	    	        		var q = {};
	    	        		q[decode(fst_dn)] = i ;
	    	        		q[decode(sec_dn)] = j ;
	    	        		q["Measure"] = 0;
	    	        		var value = ds_val( q, dataset );
	    	        		if(value< 0) {
		        				value = 0;
		        			};
	    	        		group.bars.push({value:Number(value), label:sec_mem[j], color:colors(0)});
	    	        	};
	    	        	// set group label
	    	        	group.label = fst_mem[i];
	    	        	//set group
	    	        	this.fds.groups.push(group);
	    	        };
	    	        //save cols info for sorting
	    			for( var i = 0 ; i < max_j ; i++ ){
	    				//x-axis labels
	    	        	this.fds.xaxis.markers.push(sec_mem[i]);
		        		this.fds.col[0][sec_mem[i]]= i;
		        	};
		        	this.fds.col[1][sec_dn]= 0;
		        	
		        	this.fds.xaxis.label = decode(fst_dn)+" / "+decode(sec_dn);
	    			if( axes[0] == null ){
	    				this.fds.yaxis.label = this.get("aggr")+"(default)";
	        		}else{
	        			var axes0_1st_mem = dataset.axes[0].members[0];
			    		var y_method = this.get("aggr");
			    		if(validate_func(axes0_1st_mem)){
			    			y_method = "count";
			    		};
	        			this.fds.yaxis.label = y_method+ "(" +decode(axes[0].name)+ ")";
	        		};
    			}
    		}else{
    			// dropped any 1 of the last two axes
    			this.set({"paint_d":""});
    			var _axis = axes[1]==null?axes[2]:axes[1];
    			// clear X-axis's chart legend
    			this.fds.col[0][decode(_axis.name)]= 0;
        		for( var i = 0 ; i < dataset.data.length ; i++ ){
        			if(dataset.data[i] < 0) {
        				dataset.data[i] = 0;
        			};
        			var group = {label:"", bars:[]};
        			var label = "";
    				if(_axis.members.length >1){
    					label =  decode(_axis.members[i]);
    				}else{
    					// drop M in a D axis,there is no members,get members from dataset
    					label = ds_axis(decode(_axis.name),dataset ).members[i];
    				};
    				group.bars.push({value:dataset.data[i], label:label, color:colors(0)});
    				// set group label
    	        	group.label = label;
        			this.fds.groups.push(group);
        			//x-axis labels
 	        		this.fds.xaxis.markers.push(label);
        		};
        		this.fds.col[decode(_axis.members[0])]= 0;
        		this.fds.xaxis.label = decode(_axis.name);
        		if( axes[0] == null ){
        			this.fds.yaxis.label = this.get("aggr")+"(default)";
        		}else{
        			var axes0_1st_mem = dataset.axes[0].members[0];
    	    		var y_method = this.get("aggr");
    	    		if(validate_func(axes0_1st_mem)){
    	    			y_method = "count";
    	    		};
        			this.fds.yaxis.label = y_method+ "(" +decode(axes[0].name)+ ")";
        		};
    		};
    	};
    	
    	//sort data
    	var cdata = this.sortData(this.fds.groups,axes,this.fds.col,this.fds.xaxis,this.fds.yaxis);
    	
    	//sort color
    	this.setColors(cdata);
    },
    
    sortData:function(groups,axes,col,xaxis,yaxis){
    	//sort
    	var data = groups;
    	if( typeof(axes[1])!="undefined" && axes[1]!= null && typeof( axes[1].sort)!="undefined"){
    		var name = axes[1].name;
            var st = axes[1].sort.type;
            if( typeof(st) != "undefined" && st != 0 && st != null ){
                var target = col[0][axes[1].sort.on];
                var use_total = (axes[1].sort.on=="Total");
                var sorted_data = _.sortBy(
                						   data, 
                                           //sort func
                                           function(el) {
                                                if (use_total) {
                                                    var n = 0;
                                                    for (var i = 0; i < el.bars.length; i++) {
                                                        var val = el.bars[i].value;
                                                        if (_.isNumber(val) && isFinite(val))
                                                            n += val;
                                                    };
                                                    return n;
                                                };
                                                var v = el.bars[target].value;
                                                return v=="nil"?Number.MIN_VALUE:v;
                                            });
                if( st == window.axis.OptionsDialog.Sort.DESC ){
                    sorted_data = sorted_data.reverse();
                };
                data = sorted_data;
            };
        };
        //sort members
        if(typeof(axes[2])!="undefined" && axes[2]!= null && typeof(axes[2].sort)!="undefined"){
        	var name = axes[2].name;
            var st = axes[2].sort.type;
            if( typeof(st) != "undefined" && st != 0 && st != null ){
            	var use_total = (axes[2].sort.on=="Total");
            	if(use_total){
                	for(var i=0; i<data.length; i++){
                		var sort_data = _.sortBy(data[i].bars,
                				function(e){
                					var val = e.value;
                					if (_.isNumber(val) && isFinite(val)){
                						return val;
                					}else{
                						return Number.MIN_VALUE;
                					};
                		});
                		if( st == window.axis.OptionsDialog.Sort.DESC ){
                			sort_data = sort_data.reverse();
                        };
                        data[i].bars = sort_data;
                	};
            	};
            };
        };
        
	    //filter the nil values
		for(var i=0;i<data.length;i++){
			var c = 0;
			for(var j=0;j-c<data[i].bars.length;j++){
				if(data[i].bars[j-c].value=="nil" || _.isNaN(data[i].bars[j-c].value)){
					data[i].bars.splice((j-c),1);
			        c++;
			    };
			};
		};
		return {
	        		groups:data,
	        		xaxis:xaxis,
	        		yaxis:yaxis,
	        		col:col,
	        		legend:null
	    		};
    },
    
    setColors:function(cdata){
    	var label_colors = {};
    	var axes = this.get("axes"); 
    	cdata.legend = [];
    	if(typeof(axes[2]) != "undefined" && axes[2] != null){
    		// mei ge  label shang se
    		var cc = 0;
    		for(var i=0; i<cdata.groups.length; i++){
    			var g = cdata.groups[i];
    			for(var j=0; j<g.bars.length; j++){
    				var k = g.bars[j].label;
    				if(typeof(label_colors[k]) == "undefined"){
        				label_colors[k] = colors(cc++);
        			};
    				g.bars[j].color = label_colors[k];
    			};
    		};
    	for(var p in label_colors){
    			cdata.legend.push({label:decode(p),color:label_colors[p]});
    		};
    	};
    	
    	this.set({"cdata":cdata,'state':'loaded'});
    	this.trigger("change:cdata");
    },
    
    //sort 
    sort:function(index,target,method){
    	 var maxis = this.getAxis(index);
         maxis.sort = {type:method,on:target};
         // save the config
         this.setAxis(
         			  index,
         			  maxis
                     );
         var cdata = this.get("cdata");
         if(this.get("cdata") != null){
        	 var tmp = this.get('axes');
             var axes = [null,null,null];
             for(var i=0;i<tmp.length;i++){
             	if(typeof(tmp[i])!="undefined" && tmp[i]!=null){
                 	axes[i] = tmp[i];
                 };
             };
        	//sort data
         	var data = this.sortData(cdata.groups,axes,cdata.col,cdata.xaxis,cdata.yaxis);
         	//sort color
         	this.setColors(data);
         };
    }
});

/**
*	Radar Chart
*/
B2.chart.Radar = function(b2, opt){
	this.b2 = b2;
	this.opt = merge(opt, _.clone(B2.chart.defaultOptions));

	this.width = opt.width;
	this.height = opt.height;
    var margin = opt.margin;
	if(_.isUndefined(margin)) {
		margin = [0,0,0,0];
	};
	this.ml = margin[3];
	this.mr = margin[1];
	this.mt = margin[0];
	this.mb = margin[2];
    
	this.mouse = {x:0,y:0};
	this.data = null;
	   
	this.handler = function(e){
		if( e.name == "mousemove" ){
			this.mousemoveHandler(e);
		} else if( e.name == "sliderchange" ){
			this.sliderHandler(e);
		};
	};
    
	this.mousemoveHandler = function(e) {
    	this.mouse.x = e.param.x;
        this.mouse.y = e.param.y;
        if(this.data!=null){
        	 this.render(this.g, this.data);
        };
	};
	
	this.hit = function(mouse_x, mouse_y, x, y, r){
		var x_hit = Math.abs(x - mouse_x) < r;
		var y_hit = Math.abs(y - mouse_y) < r;
    	return (x_hit && y_hit);
	};
	
	this.setdata = function(g,data){
    	this.render(g,data);
    };

	this.render = function(g, data) {
		if(data.axes.length < 1){
			return;
		};
		this.g = g;
		this.data = data;
		var col_length = data.axes[0].serials.length;
		var axis_length = data.axes.length;
		var width = this.width-this.ml-this.mr;
        var height = this.height-this.mt-this.mb;
		//axis range
        var max_array = [];
        var axis_min = 0;
        for(var i = 0; i<data.axes.length; i++){
        	var d = data.axes[i];
        	var axis_max = 0;
        	for(var j = 0; j<d.serials.length; j++){
        		axis_max = axis_max>=Number(d.serials[j])?axis_max:Number(d.serials[j]);
        	};
        	max_array.push(roundup(axis_min,axis_max).max);
        };
		//angle step
		var astep = 360/axis_length;
		//center (x,y);
		var ox = this.ml + width/2;
		var oy = this.mt + height/2;
		//ruler length
		var ruler_length = width > height?height/2:width/2;
		//ruler scale
		var rscale_array = [];
		for(var i = 0; i<data.axes.length; i++){
			var rscale = ruler_length/(max_array[i] - axis_min);
			rscale_array.push(rscale);
		};
		//ruler step
		var rstep = ruler_length/5;
		// begin to draw	
        g.begin();
		//draw rulers
        var astyle = {size:12, color:"666666", bold:true, align:"left"};
		for( var i = 0 ; i < axis_length; i++ ){
			//grid's data
			for(var k = 1; k < 6; k++){
				var grow = [];
				for(var j = 0; j < axis_length; j++){
					var a = Math.PI*((j*astep-90)/180);
					var gx = ox + Math.cos(a)*k*rstep;
					var gy = oy + Math.sin(a)*k*rstep;
					grow.push({x:gx, y:gy});
				};
				g.polo(grow,"e1e1e1",{fill:false,alpha:0.8});
			};
			var _angle = Math.PI*((i*astep-90)/180);
			g.line(ox, oy, ox + Math.cos(_angle)*ruler_length, oy + Math.sin(_angle)*ruler_length, "666666", {alpha:1, fill:true, thick:1});
			var tx = ox + Math.cos(_angle)*ruler_length;
			var ty = oy + Math.sin(_angle)*ruler_length;
			if(tx > ox){
				astyle.align = "left";
				
			}else{
				astyle.align = "right";
				tx = tx - 100;
			};
			if(ty < oy){
				ty = ty -15;
			};
			g.text(tx, ty,data.axes[i].name,astyle,100);
		};
		
		//draw radars
		for( var i = 0 ; i < col_length ; i++ ){
			var row = [];
			for(var j = 0; j<axis_length; j++){
				var a = Math.PI*((j*astep-90)/180);
				var x = ox + Math.cos(a)*data.axes[j].serials[i]*rscale_array[j];
				var y = oy + Math.sin(a)*data.axes[j].serials[i]*rscale_array[j];
				g.circle( x, y, 2, data.legend[i].color, {alpha:1, fill:true, thick:1});
				if(this.hit(this.mouse.x, this.mouse.y, x, y,2)){
					draw_tooptip(g, x, y-8, data.axes[j].name + ":"+data.axes[j].serials[i], this.ml+width);
				};
				row.push({x:x, y:y});
			};
			g.polo(row, data.legend[i].color, {alpha:1, fill:false, thick:2});
		};
		g.end();
	};
};/**
 * radar model
 */

/***************************************************************************
 * axis bar
 **************************************************************************/
window.AxisDropBar = window.DragDropView.extend({
	
	selected_axis: null,
	
	axes_bar:[],
	
	axis_len:180,
	
	select:function(v){
		this.selected_axis = v;
		this.model = v.model;
	},
	
	visualizer : null,
	
	_initialize: function(){
		this.axes_bar = [];
		this.visualizer = this.options.visualizer;
		//this.enableDragDrop(true);
		window.ddManager.regist( this );
	},
	
	
	
	accept:function (o){
        // in area
        if(this.hit(o)){
            return this.onDrop(o);
        }else{
            return false;
        };
   },
   
   onDropOut: function( o ) {
	//drop out
	   var r = false;
	   var index = -1;
		for(var i=0; i<this.axes_bar.length; i++){
			var axis = this.axes_bar[i].model;
			if(axis.name == o.model.name){
			   r = true;
			   index = i;
			   break;
			};
		};
	if(!r){
		return;
	};

   var r = this.visualizer.plugin.onSetAxis(-1,o.model);
   if(r.state != -1){
	   for(var i=0; i<this.axes_bar.length;i++){
		   if(o.model.name == this.axes_bar[i].model.name){
			   $(this.axes_bar[i].el).unbind("mousedown");
			   $(this.axes_bar[i].el).remove();
			   this.selected_axis = null;
			   this.axes_bar.splice(i, 1);
			   this.model = null;
			   this.resize_axes();
			   break;
		   };
	   };
   }
   },
   
   onDrop:function( o ) {
	   var r = false;
	   var index = -1;
		for(var i=0; i<this.axes_bar.length; i++){
			var axis = this.axes_bar[i];
			if(axis.model.name == o.model.name){
			   r = true;
			   index = i;
			   break;
			};
		};
		if(r){
			return;
		};
		if(this.axes_bar.length +1 > Math.floor($('#radarAxisWrapper').width()/80)){
			return;
		};
	    var r = this.visualizer.plugin.onSetAxis(1,o.model);
	    if(r.state != -1){
	    	this.fill(o.model);
	    }
   },
   
   fill:function(model){
	   var axis = new window.AxisDropBar.Axis({axis_bar:this,model:model});
	   $('#radarDAxes').append(axis.el);
	   $(axis.el).bind("mousedown", _.bind(this.__mousedown, axis));
	   this.axes_bar.push(axis);
	   this.resize_axes();
   },
   
   resize_axes:function(){
	   var w = $('#radarAxisWrapper').width();
	   var count = this.axes_bar.length;
	   if(count*this.axis_len > w){
		   this.axis_len = w/count;
	   }else{
		   var ww = w/count;
		   if(ww >180){
			   this.axis_len =180;
		   }else{
			   this.axis_len = ww;
		   };
	   };
	   $('.radar-axis-left .label').css("maxWidth",this.axis_len - 30);
	   $('.radar-axis-left').width(this.axis_len);
   }
   
});

/***************************************************************************
 * axes container
 **************************************************************************/
window.AxisDropBar.Axis = Backbone.View.extend({
    axis:null,
    visualizer:null,
    adb_index:null,
    container:null,
   
    _initialize : function(){
    	this.container = this.options.axis_bar;
        this.template = _.template($('#bar-axis').html());
        this.el=$(this.template(this.model));
    }
});

    
window.plugin.Radar=window.plugin.Editor.extend({
  
	type : function(){ return "Radar"; },
    
	template : "radar-chart-template",
	
    fds : {},
    
    axesOptions:[
                	{id:"radarAxisDropbox0",index:0,type:"D",def_label:"Area"}
                ],
    //default data
	default_data:{ axes:[
							{name:"Axis0",serials:[100]},
							{name:"Axis1",serials:[100]},
							{name:"Axis2",serials:[100]},
							{name:"Axis3",serials:[100]},
							{name:"Axis4",serials:[100]}
                      ],
    			 legend:[{label:"Area1",color:"27a5cf"}]
               },
    
    _init_v:function(w,h,type){
        var ref = [];
        var axesOptions = this.axesOptions;
        ref.push(new window.AxisDropBox({el:$('#' + axesOptions[0].id), visualizer:this.vis,setting:axesOptions[0]}));
        ref.push(new window.AxisDropBar({el:$('#radarAxisWrapper'),visualizer:this.vis}));
        $('#radar-dropbox-wrapper').width(w - 40);
        $('#radarAxisWrapper').width(w - 250);
        var options = {
                           container:"chart-wrapper",
                           "type":type,
                           width: w,
                           height: h,
                           legend:{
                                    canvas:{ platform:"Fl", param:{url:"js/lib/b2/canvas/fl/B2Canvas.swf"} },
                                    width:200,
                                    height:400
                                },
                               margin: this.custom.margin,
                               canvas:{ platform:"Fl", param:{url:"js/lib/b2/canvas/fl/B2Canvas.swf"} }
        };
        this.chart = new B2(options);
        this.chart.render(this.default_data);
        // restore axis setting
        var axs = this.vis.plugin.get("axes");
        var is_fill = false;
        for(var i = 0; i < axs.length; i++){
        	var axis = axs[i];
            if( axis != null) {
            	if(axis.type == "D"){
            		ref[0].fill(axis,false);
            	}else{
            		ref[1].fill(axis);
            	};
            	is_fill = true;
            };
        };
        this.axesDropbox = ref;
        if(typeof(this.initLegend) != "undefined"){
        	this.initLegend(w,h);
        };
        if(is_fill === true) {
        	this.trigger("change:cdata");
        } else {
        	this.chart.render(this.default_data);
        };
    },
    
    initLegend:function(w,h){
    	// init legend
        var margin = this.custom.margin;
        var legend_height = h -margin[0];
        this.legend = new B2.component.Legend({
        	 width: 120,
        	 height: legend_height,
        	 left: 0,
        	 top: 0
        });
        //show legend
        this.legend.show(this.get("cdata").legend);
        //
        $('#radar_legend').append(this.legend.el);
        $('#radar_legend').width(120);
        $('#radar_legend').height(legend_height);
        $('#radar_legend').css("top",0);
        $('#radar_legend').css("left",w -120);
        $('#radar_legend').css("z-index",999);
    },

    onSetAxis:function(index, axis_model){
		var axes = this.get("axes");
		if(index >=0){
			//drop in
			if(axis_model ==null){
				axes[index] = null;
			}else{
				for(var i=0; i<axes.length; i++){
				   var axis = axes[i];
				   if(axis != null && axis_model.name == axis.name){
					   return {state:0,msg:""};
				   };
				};
				if(axis_model.type =="D" && index == 0){
					axes[0] = axis_model;
				}else{
					if(axes[0] == null){
						for(var i = 0; i < this.cube.axex.length; i++){
		        			if(this.cube.axex[i].type == "D"){
		        				axes[0] = this.cube.axex[i];
		        				break;
		        			};
		        		};
					};
					axes.push(axis_model);
				};
			};
			this.set("axes",axes);
			return this.query();
    	}else{
    		//drop out
    		for(var i=0; i<axes.length; i++){
    			var axis = axes[i];
    			if(axis == null){
    				continue;
    			};
				if(axis_model.name == axis.name){
					axes.splice(i,1);
					this.set("axes",axes);
					return  this.query();
				};
    		};
    	};
        return {state:-1,msg:""};
    },

    
    query:function(){
    	var ret=0,msg="";
    	var empty = true;
    	var send=false;
    	var axes_slots = this.get('axes');
        for(var i=0;i<axes_slots.length;i++){
        	if(typeof(axes_slots[i])!="undefined" && axes_slots[i]!=null){
            	empty = false;
                break;
            };
        };
        if(empty){
            this.set({"cdata":this.default_data,'state':'loaded'});
        }else{
        	send = true;
        	var lastQuery=[];
        	var axisD = null;
        	var axisM = [];
        	for(var i=0; i<axes_slots.length; i++){
        		if(axes_slots[i] == null){
        			continue;
        		};
        		if(axes_slots[i].type == "D"){
        			axisD = axes_slots[i];
        		}else{
        			axisM.push(axes_slots[i]);
        		};
        	};
        	//axisD
        	if(axisD == null){
        		for(var i = 0; i < this.cube.axex.length; i++){
        			if(this.cube.axex[i].type == "D"){
        				var default_d = this.cube.axex[i];
        				break;
        			};
        		};
        		var tmp_mm = [];
            	for(var i=0; i<default_d.members.length; i++){
            		tmp_mm.push(encode(default_d.members[i]));
                };
                
            	lastQuery.push({name:encode(default_d.name),members:tmp_mm});
        	}else{
                if(axisD.type != "D"){
                	ret = 1;
                    lastQuery.push({name:encode(axisD.name),members:["flip(M,D)"]});
                }else{
                	var tmp_mm = [];
                	for(var i=0; i<axisD.members.length; i++){
                		tmp_mm[i] = encode(axisD.members[i]);
                    };
                    lastQuery.push({name:encode(axisD.name),members:tmp_mm});
                };
        	};
        	//axisM
            for(var i=0; i <axisM.length; i++){
            	var value = axisM[i];
                    if(value.type != "M"){
                    	ret = 1;
                        lastQuery.push({name:"Measure", members:["uniq_metas(" + encode(value.name) + ")"]});
                    }else{
                        lastQuery.push({name:"Measure", members:[encode(value.name)]});
                    };
                    send=true;
            };
        };
        
        if(send){
        //loading start ,change state to loading
        	this.set('state','loading');
            this.cube.query(lastQuery,this.get('aggr'));
        };
        return {state:ret,msg:msg};
    },
      
    format:function(dataset) {
        var queryAxes = this.get("axes");
		if(dataset == null){
		        debug("Radar chart's dataset is null");
		        this.set({'state':'loaded'});
		        return false;
		};
 
		this.cache = dataset;
		var data = { axes:[],legend:[]};
		 
		var axisD = null;
    	var axisM = [];
    	var m_count = 0;
        var axes_names = [];
    	for(var i=0; i<queryAxes.length; i++){
    		if(queryAxes[i] == null){
    			continue;
    		};
    		if(queryAxes[i].type == "D"){
    			axisD = queryAxes[i];
    		}else{
    			axisM.push(queryAxes[i]);
    			m_count++;
    			axes_names.push(queryAxes[i].name);
    		};
    	};
		if(axisD != null){
			axisD = ds_axis( axisD.name, dataset );
		}else{
    		for(var i = 0; i < this.cube.axex.length; i++){
    			if(this.cube.axex[i].type == "D"){
    				axisD = this.cube.axex[i];
    				break;
    			};
    		};
		};
		if(typeof(axisD) == "undefined"){
			return false;
		};
		
		// Area axis only give a default measure axis
		if(m_count == 0){
			this.set({"cdata":this.default_data,'state':'loaded'});
			return;
		};
		this.set({"paint_d":axisD.name},{silent:true});
        for(var n=0; n<axisD.members.length; n++){
        	for(var i=0; i<m_count; i++){
        		if(n==0){
        			data.axes[i] = {name:axes_names[i], serials:[]};
        		};
        	var d = dataset.data[i+n*m_count];
        	d = d<0?0:d;
        	data.axes[i].serials.push(d);
            };
        };
        for(var i=0; i<axisD.members.length; i++){
        	data.legend.push({label:axisD.members[i],color:colors(i)});
        };
        this.set({"cdata":data,'state':'loaded'});
    }
});/**
 * Sankey chart
 * @param {} b2
 * @param {} opt
 */
B2.chart.Sankey = function(b2, opt) {
	this.b2 = b2;
	this.opt = merge(opt, _.clone(B2.chart.defaultOptions));

	this.width = opt.width;
	this.height = opt.height;
    var margin = opt.margin;
	if(_.isUndefined(margin)) {
		margin = [0,0,0,0];
	};
	this.ml = margin[3];
	this.mr = margin[1];
	this.mt = margin[0];
	this.mb = margin[2];
    
	this.mouse = {x:0,y:0};
	this.data = null;
	
	this.handler = function(e){
		if( e.name == "mousemove" ){
			this.mousemoveHandler(e);
		}
	};
    /**
     * mouse move event handler
     */
	this.mousemoveHandler = function(e) {
    	this.mouse.x = e.param.x;
        this.mouse.y = e.param.y;
        if(this.data!=null){
        	 this.render(this.g, this.data);
        };
	};
    /**
     * check if mouse event hit or not
     */
	this.hit = function(x,y,xx,yy,ww,hh){
    	var ymin = Math.min(yy,yy+hh);
        var ymax = Math.max(yy,yy+hh); 
        var xmin = Math.min(xx,xx+ww);
        var xmax = Math.max(xx,xx+ww);
    	return ((x>xmin) && (x<xmax)&&(y>ymin) &&(y<ymax));
    };
	/**
	 * set data
	 */
    this.setdata = function(g,data){
    	this.render(g,data);
    };
	/**
	 * render the chart
	 */
	this.render = function(g, data) {
		this.g = g;
		this.data = data;
		
        var segments = data.segments, 
        	segments_len = segments.length;
        var width = this.width-this.ml-this.mr,
        	height = this.height-this.mt-this.mb;
        	
        var label_w = 50,
        	val = 0,
        	scale = 0,
        	w = width,
        	interval_y = 30,
        	interval_x = (w-label_w)/segments_len,
        	h = (w-label_w*(segments_len+1))/(3*segments_len);
        
        if(h > height) {
        	h = height;
        	//w = h*(3*segments_len)+label_w*(segments_len+1);
        };
        var h1 = this.mt+h;
        //start draw 
        g.begin();
        // segments
        var scale = 0;
        var tip_x, tip_y, tip_t, tip_rect, tip_polo;
        for(var i=0; i<segments_len; i++) {
        	var segment = segments[i];
        	var froms = segment.froms;
        	var flows = segment.flows;
        	var tos = [];
        	// scale
        	if(scale === 0) {
        		var from_total = 0;
	    		for(var n=0; n<froms.length; n++) {
	    			from_total += froms[n].value;
	    		};
	    		scale = (h-interval_y)/from_total;
        	};
        	// froms(x, y, h)
    		var offset_y = 0, tmp = 0;
    		if(froms.length > 1) {
    			offset_y = Math.round(interval_y/(froms.length-1));
    		};
    		for(var n=0; n<froms.length; n++) {
    			froms[n].h = Math.round(froms[n].value * scale);
    			froms[n].x = interval_x*i + this.ml;
    			froms[n].y = this.mt+tmp;
    			// draw it
    			g.text(froms[n].x,  froms[n].y+froms[n].h/2-14,  froms[n].name + ' (' + froms[n].value + ')', {color:'ffffff',align:"center",size:10},  label_w);
    			g.rect(froms[n].x, froms[n].y, label_w, froms[n].h, '5B5B5B', { alpha:0.8, fill:true, thick:0});
    			
    			tmp += froms[n].h + offset_y;
    		};
        	// tos
        	for(var j=0; j<flows.length; j++) {
        		var flow = flows[j];
    			var is_here = false;
    			for(var m=0; m<tos.length; m++) {
    				if(flow.name === tos[m].name) {
    					tos[m].value += flow.value;
    					is_here = true;
    					break;
    				};
    			};
    			if(!is_here) {
    				tos.push({name: flow.name, value: flow.value});
    			};
        	};
        	// tos(x, y, h)
    		var offset_y = 0, tmp1 = 0;
    		if(tos.length > 1) {
    			offset_y = interval_y/(tos.length-1);
    		};
    		for(var n=0; n<tos.length; n++) {
    			tos[n].h = Math.round(tos[n].value * scale);
    			tos[n].x = this.ml+interval_x*(i+1);
    			tos[n].y = this.mt+tmp1;
    			g.text(tos[n].x,  tos[n].y+tos[n].h/2-14,  tos[n].name, {color:'ffffff',align:"center",size:10},  label_w);
    			g.rect(tos[n].x, tos[n].y, label_w, tos[n].h, '5B5B5B', { alpha:0.8, fill:true, thick:0});
    			tmp1 += tos[n].h + offset_y;
    			
    			var tmp2 = 0;
    			for(var q=0; q<flows.length; q++) {
    				var flow = flows[q];
    				if(tos[n].name === flow.name) {
							flow.x = tos[n].x;
							flow.h = Math.round(flow.value * scale);
							if(tmp2 === 0) {
								flow.y = tos[n].y;
							} else {
								flow.y = tmp2;
							};
							tmp2 = flow.y + flow.h;
	    			};
	    		};
    		};
    		
    		// draw flows
    		var tip_w = 20;
			for(var k=0; k<froms.length; k++) {
    			var from = froms[k];
    			var offset = 0;
    			
    			for(var p=0; p<flows.length; p++) {
    				var flow = flows[p];
    				if(flow.value === 0) {
    					continue;
    				};
    				
    				if(from.name === flow.from) {
    					var border_h = flow.h;
    					if(from.y+offset+flow.h == from.y+from.h) {
    						border_h = flow.h-1;
    					};
    					g.rect(from.x+label_w, from.y+offset, tip_w, border_h, '5B5B5B', { alpha:0.8, fill:true, thick:1});
    					if((from.y+offset).toFixed(2) == (flow.y).toFixed(2)) {
    						g.rect(from.x+label_w+tip_w, flow.y, flow.x-2*tip_w-(from.x+label_w), flow.h, from.color, { alpha:0.8, fill:true, thick:0});
    						// mouse
    						if(this.hit(this.mouse.x,this.mouse.y,from.x+label_w,from.y+offset,tip_w,flow.h)
    					   		|| this.hit(this.mouse.x,this.mouse.y,flow.x-tip_w,flow.y,tip_w,flow.h)){
			            		if(i === segments.length-1) {
			            			tip_x = this.mouse.x;
				            		tip_y = this.mouse.y-8;
				            		tip_t = from.name + '-->' + flow.name + ':' + flow.value;
				            		tip_rect = [from.x+label_w+tip_w, flow.y, flow.x-2*tip_w-(from.x+label_w), flow.h];
			            		};
			            	};
    					} else {
    						// polo
    						var points = [];
    						// eight points
    						if(flow.y > from.y+offset) {
    							//  ------
    							//         \
    							//			\
    							//			 ----------
	    						points.push({x: flow.x-tip_w, y: flow.y});
	    						points.push({x: flow.x-tip_w-flow.y, y: flow.y});
	    						var x = flow.x-tip_w-flow.y-(flow.y-from.y-offset);
	    						points.push({x: x, y: from.y+offset});
	    						points.push({x: from.x+label_w+tip_w, y: from.y+offset});
	    						points.push({x: from.x+label_w+tip_w, y: from.y+offset+flow.h});
	    						var x = flow.x-tip_w-flow.y-flow.h-(flow.y-from.y-offset);
	    						points.push({x: x, y: from.y+offset+flow.h});
	    						points.push({x: flow.x-tip_w-flow.y-flow.h, y: flow.y+flow.h});
	    						points.push({x: flow.x-tip_w, y: flow.y+flow.h});
    						} else {
    							//			   ----------
    							//			  /
    							//			 /
    							//	---------
	    						points.push({x: flow.x-tip_w, y: flow.y});
	    						points.push({x: flow.x-tip_w-(h1-flow.y), y: flow.y});
	    						var x = flow.x-tip_w-(h1-flow.y) - (from.y+offset-flow.y);
	    						points.push({x: x, y: from.y+offset});
	    						points.push({x: from.x+label_w+tip_w, y: from.y+offset});
	    						points.push({x: from.x+label_w+tip_w, y: from.y+offset+flow.h});
	    						var x = flow.x-tip_w-(h1-flow.y-flow.h)-(from.y+offset-flow.y);
	    						points.push({x: x, y: from.y+offset+flow.h});
	    						points.push({x: flow.x-tip_w-(h1-flow.y-flow.h), y: flow.y+flow.h});
	    						points.push({x: flow.x-tip_w, y: flow.y+flow.h});
    						};
    						g.polo(points, from.color,{fill:true,alpha:0.8, thick:0});
    						
    						if(this.hit(this.mouse.x,this.mouse.y,from.x+label_w,from.y+offset,tip_w,flow.h)
    					   		|| this.hit(this.mouse.x,this.mouse.y,flow.x-tip_w,flow.y,tip_w,flow.h)){
			            		if(i === segments.length-1) {
			            			tip_x = this.mouse.x;
				            		tip_y = this.mouse.y-8;
				            		tip_t = from.name + '-->' + flow.name + ':' + flow.value;
				            		tip_polo = points;
			            		};
    					   	};
    					};
    					var border_h = flow.h;
    					for(var u=0; u<tos.length; u++) {
    						if(flow.y+flow.h == tos[u].y+tos[u].h) {
    							border_h = flow.h-1;
    							break;
    						};
    					};
    					g.rect(flow.x-tip_w, flow.y, tip_w, border_h, '5B5B5B', { alpha:0.8, fill:true, thick:1});
    					
    					offset += flow.h;
    				};
    			};
    		};
        };
        // tooltip
        if(tip_x && tip_y) {
        	if(tip_rect) {
        		g.rect(tip_rect[0], tip_rect[1], tip_rect[2], tip_rect[3], 'ff0000', { alpha:1, fill:true, thick:1});
        	};
        	if(tip_polo) {
        		g.polo(tip_polo, 'ff0000',{fill:true,alpha:1, thick:0});
        	};
        	draw_tooptip(g, tip_x, tip_y, tip_t, this.ml+width);
        };
		//end draw
		g.end();
    };
};/**
 *
 */
window.plugin.Sankey= window.plugin.Editor.extend({
	
    type : function(){ return "Sankey"; },
    
	template : "sankey-chart-template",
	fds : {},
    axesOptions:[
                    {id:"barAxisDropbox0",index:0,type:"M",def_label:"Value"},
                    {id:"barAxisDropbox1",index:1,type:"D",def_label:"From"},
                    {id:"barAxisDropbox2",index:2,type:"D",def_label:"To"}
                ],
    //default data
	default_data : {
		segments: [{
            				froms: [{
            					name: 'a0',
            					value: 150,
            					color: colors(0)
            				}, {
            					name: 'a1',
            					value: 150,
            					color: colors(1)
            				}],
            			 	flows: [{
            			 		from: 'a0',
            			 		name: 'b0',
            			 		value: 40
            			 	}, {
            			 		from: 'a0',
            			 		name: 'b1',
            			 		value: 60
            			 	}, {
            			 		from: 'a0',
            			 		name: 'b2',
            			 		value: 50
            			 	}, {
            			 		from: 'a1',
            			 		name: 'b0',
            			 		value: 30
            			 	}, {
            			 		from: 'a1',
            			 		name: 'b1',
            			 		value: 70
            			 	}, {
            			 		from: 'a1',
            			 		name: 'b2',
            			 		value: 50
            			 	}]
            			 }],
            			 legend:[{label:"AA",color:"ff0000"},{label:"BB",color:"0000ff"}]
	},

    /**
     * fill axis handler, 
     * called on axis fill
     */
    onSetAxis:function(index, axis_model, query){
    	var axes = this.get("axes");
        axes[index] = axis_model;
        this.set("axes",axes);
        this.current = index;
        if(!query){
        	return {state:0,msg:""};
        }else{
        	return this.query();
        };
    },
    
    
    query:function(use_filter){
    	if(typeof(use_filter) == "undefined"){
    		use_filter = false;
    	};
    	// query 
        var ret=0,msg="";
        var axes_slots = this.get('axes');
        var empty = true;
        for(var i=0;i<3;i++){
        	if(typeof(axes_slots[i])!="undefined" && axes_slots[i]!=null){
            	empty = false;
                break;
            };
        };
        //clear 
        if(empty){
            this.set({"cdata":this.default_data,'state':'loaded'});
        }else{
        	 var send = false,lastQuery = [];
            //y
            var y=axes_slots[0];
            if(typeof(y)!="undefined" && y!=null){
                if(y.type != "M"){
                	if(this.current == 0){
                    	ret = 1;
                    	msg = "WARNING: "+decode(y.name)+"'s type is \"D\" (Category), it is used as \"M\" (Numeric) here, the caculation changed to \"Count\"";
                    };
                    lastQuery.push({name:"Measure", members:["uniq_metas(" + encode(y.name) + ")"]});
                }else{
                    lastQuery.push({name:"Measure", members:[encode(y.name)]});
                };
                send=true;
            };
            //x
            var x=axes_slots[1];
            if(typeof(x)!="undefined" && x!=null){
                if(x.type != "D"){
                	if(this.current == 1){
                    	ret = 1;
                    	msg = "WARNING: "+ decode(x.name) +" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    };
                    lastQuery.push({name:encode(x.name), members:["flip(M,D)"]});
                }else{
                	if(use_filter){
                        for(var i=0; i<x.members.length; i++){
                            x.members[i] = encode(x.members[i]);
                        };
                        lastQuery.push({name:encode(x.name), members:x.members});
                	}else{
                		var axis = this.cube.findAxis(x.name);
                		for(var i=0; i<axis.members.length; i++){
                			x.members[i] = encode(axis.members[i]);
                		};
                		lastQuery.push({name:encode(x.name), members:["members(all)"]});
                	};
                };
                send=true;
            };
            //xx
            var xx=axes_slots[2];
            if(typeof(xx)!="undefined" && xx!=null){
                if(xx.type != "D"){
                	if(this.current == 2){
                    	ret = 1;
                    	msg = "WARNING: "+decode(xx.name)+" (Numericis) is converted to \"D\" (Category) temporary, to change it to \"D\" permanently, click it's type-icon on the \"Fields\" panel ";
                    };
                    lastQuery.push({name:encode(xx.name), members:["flip(M,D)"]});
                }else{
                	if(use_filter){
                        for(var i=0; i<xx.members.length; i++){
                            xx.members[i] = encode(xx.members[i]);
                        };
                        lastQuery.push({name:encode(xx.name), members:xx.members});
                	}else{
                		var axis = this.cube.findAxis(xx.name);
                		for(var i=0; i<axis.members.length; i++){
                			xx.members[i] = encode(axis.members[i]);
                		};
                		lastQuery.push({name:encode(xx.name), members:["members(all)"]});
                	};
                };
                send=true;
            };
            // send query
            if(send){
                //loading start ,change state to loading
                this.set('state','loading');
                this.cube.query(lastQuery,this.get('aggr'));
            };
        };
        return {state:ret,msg:msg};
    },
    
     /**
     * processing the return query array, 
     * format the data to bar
     * more detail ...
     */
    format:function(dataset) {
    	if(dataset == null){
            debug("Bar chart's dataset is null"); 
            return false;
        };
        this.cache = dataset;
        var tmp = this.get('axes');
        var axes = [null,null,null];
        for(var i=0;i<tmp.length;i++){
        	if(typeof(tmp[i])!="undefined" && tmp[i]!=null){
            	axes[i] = tmp[i];
            };
        };
        
    	this.fds.segments = [];
    	this.fds.legends = [];
    	
    	if( axes[1] == null && axes[2] == null ){//	drop a measure only
    		this.set({"paint_d":""});
    	} else {
    		if( axes[1] != null && axes[2] != null){
    			//there is no order in return data,so using dropped ordered axes to find axis from return date
    			var ds_fst_axis = ds_axis(decode(axes[1].name), dataset);
    			var ds_sec_axis = ds_axis(decode(axes[2].name), dataset);
    			//drop both 2 D axes
    			if(ds_fst_axis && ds_sec_axis) {
    				var max_i = ds_fst_axis.members.length;
	    			var max_j = ds_sec_axis.members.length;
	    			var fst_dn = axes[1].name;
	    			var sec_dn = axes[2].name;
	    			var fst_mem = ds_fst_axis.members;
	    			var sec_mem = ds_sec_axis.members;
	    			var froms = [];
	    			var flows = [];
	    			if(this.get("paint_d") == ""){
	    				this.set({"paint_d":fst_dn},{silent:true});
	    			};
	    			for( var i = 0 ; i < max_i ; i++ ){
	    	    		var total = 0;
	    	        	for( var j = 0 ; j < max_j ; j++ ){
	    	        		var q = {};
	    	        		q[decode(fst_dn)] = i ;
	    	        		q[decode(sec_dn)] = j ;
	    	        		q["Measure"] = 0;
	    	        		var value = ds_val( q, dataset );
	    	        		value = Number(value);
	    	        		if(isNaN(value)) {
	    	        			value = 0;
	    	        		};
	    	        		flows.push({
	    	        			from: fst_mem[i],
	    	        			name: sec_mem[j],
	    	        			value: value
	    	        		});
	    	        		total += value;
	    	        	};
	    	        	
	    	        	froms.push({
	    	        		name: fst_mem[i],
	    	        		value: total,
	    	        		color: colors(i)
	    	        	});
	    	        };
	    	        this.fds.segments.push({
	    	        	froms: froms,
	    	        	flows: flows
	    	        });
	    	        
	    	        for(var i=0; i<fst_mem.length; i++){
	        			this.fds.legends.push({label:fst_mem[i], color:colors(i)});
	        		};
    			};
    		} else {
    			// dropped any 1 of the last two axes
    			this.set({"paint_d":""});
    			var _axis = axes[1]==null?axes[2]:axes[1];
    			var ds_fst_axis = ds_axis(decode(_axis.name), dataset);
    			var members = ds_fst_axis.members;
    			var data = dataset.data;
    			var froms = [];
        		for( var i = 0 ; i < data.length ; i++ ){
        			froms.push({
        				name: members[i],
        				value: data[i],
        				color:colors(i)
        			});
        		};
        		this.fds.segments.push({
        			froms: froms,
        			flows: []
        		});
    		}
    	};
    	var cdata = {
                      segments:this.fds.segments,
                      legend:this.fds.legends
                    };

    	this.set({"cdata":cdata,'state':'loaded'});
    }
});

