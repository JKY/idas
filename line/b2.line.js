/**
 * Line Chart
 */
 (function(){
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
}).call(this);
