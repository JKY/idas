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
};