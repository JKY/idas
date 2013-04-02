/**
 * Bubble Chart
 */
 (function(){
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
        };
}).call(this);