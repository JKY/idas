/**
*	Radar Chart
*/
(function(){
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
	};
}).call(this);