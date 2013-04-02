/**
 * stack Chart
 */
(function(){
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
}).call(this);
