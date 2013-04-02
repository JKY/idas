/**
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
