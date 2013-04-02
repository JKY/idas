(function(){
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
    		var maxbars = barlen;//Math.ceil((this.width-this.ml-this.mr)/30);
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
                //g.line(this.ml,y,this.ml+width,y,'DDDDDD');
            	//g.text(0,y-8,label,this.opt.yaxis,this.ml);
            };
           	//g.line(this.ml,this.mt,this.ml,this.height-this.mb,this.opt.grid.color); //left border
            //g.line(this.width-this.mr,this.mt,this.width-this.mr,this.height-this.mb,this.opt.grid.color); //right border
            g.text(0,this.mt+height,data.yaxis.label,this.opt.yaxisLabel,height); //y-axis tag
            //g.text(this.ml,0,data.xaxis.label,this.opt.xaxisLabel,width); //x-axis tag
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
              	//g.text(this.ml+x, this.mt+height, group.label,this.opt.xaxis, w);  
            };
            if(tip_x && tip_y) {
            	draw_tooptip(g, tip_x, tip_y, tip_t, this.ml+width);
            };
            //draw y zore line
            var zy = this.mt+height;
            //g.line(this.ml, zy, this.ml+width, zy, "000000");
            g.end();     
    	};
    };
}).call(this);