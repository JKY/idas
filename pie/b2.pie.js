/**
 * pie
 */
(function(){
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
		};
}).call(this);