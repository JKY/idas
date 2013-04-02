/**
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
