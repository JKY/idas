/**
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
};