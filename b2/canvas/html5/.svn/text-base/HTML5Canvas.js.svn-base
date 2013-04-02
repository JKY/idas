/**
 * HTML5 Canvas
 */
(function() {

	HTML5Canvas = function(options,wrapper) {
		this.options = options;
		this.el = wrapper;
		this._initCanvas();
		this.ctx = this.bic;
	};

	HTML5Canvas.prototype = {
		setBuff: function() {
			this.clear();
			this.ctx = this.bic;
		},
		
		flushBuff: function() {
			this.rc.drawImage(this.buffInnerCanvas, 0, 0);
			this.rc.drawImage(this.buffOuterCanvas, 0, 0);
		},
		
		line : function(fx, fy, tx, ty, color, style) {
			this.ctx.save();
			this.ctx.lineWidth = style.thick;
			this.ctx.globalAlpha = style.alpha;
			this.ctx.strokeStyle = this._fc(color);
			if(fy !== ty && fx !== tx) {
				this.ctx.beginPath();
				this.ctx.moveTo(fx, fy);
				this.ctx.lineTo(tx, ty);
			} else {
				this.ctx.translate(Math.floor(fx), Math.floor(fy));
				this.ctx.beginPath();
				if(fy === ty) {
					this.ctx.moveTo(0, -0.5);
					this.ctx.lineTo(Math.floor(tx-fx)+0.5, -0.5);
				} else if(fx === tx) {
					this.ctx.moveTo(-0.5, 0);
					this.ctx.lineTo(-0.5, Math.floor(ty-fy)+0.5);
				};
			};
			
			this.ctx.stroke();
			this.ctx.closePath();
			this.ctx.restore();
		},
		
		rect : function(fx, fy, width, height, color, style) {
			this.ctx.save();
			this.ctx.fillStyle = this._fc(color);
			this.ctx.globalAlpha = style.alpha;
			if(style.fill === true) {
				this.ctx.fillRect(fx, fy, width, height);
			};
			if(style.thick > 0) {
				this.ctx.lineWidth = style.thick;
				this.ctx.strokeStyle = this._fc(color);
				this.ctx.strokeRect(fx, fy, width, height);
			};
			this.ctx.restore();
		},
		
		circle : function(fx, fy, radius, color, style) {
			this.ctx.save();
			this.ctx.fillStyle = this._fc(color);
			this.ctx.strokeStyle = this._fc(color);
			this.ctx.lineWidth = style.thick;
			this.ctx.beginPath();
			this.ctx.arc(fx, fy, radius, 0, Math.PI*2, true);
			this.ctx.globalAlpha = style.alpha;
			this.ctx.closePath();
			this.ctx.fill();
			this.ctx.restore();
		},
		
		wedge : function(x, y, ir, or, aStart, aEnd, color, style) {
			this.ctx.save();
			this.ctx.globalAlpha = style.alpha;
			this.ctx.lineWidth = style.thick;
			this.ctx.beginPath();
			
			var step = 1;
			// More efficient to work in radians
			var degreesPerRadian = Math.PI / 180;
			aStart *= degreesPerRadian;
			aEnd *= degreesPerRadian;
			step *= degreesPerRadian;
			
			// Draw the segment
			this.ctx.moveTo( x + ir * Math.cos(aStart), y + ir * Math.sin(aStart) );
			for ( var theta = aStart; theta < aEnd; theta += Math.min(step, aEnd - theta) ) {
				this.ctx.lineTo( x + or * Math.cos(theta), y + or * Math.sin(theta) );
			}
			this.ctx.lineTo( x + or * Math.cos(aEnd), y + or * Math.sin(aEnd) );
			this.ctx.lineTo( x + ir * Math.cos(aEnd), y + ir * Math.sin(aEnd) );
			for ( theta = aEnd; theta > aStart; theta -= Math.min(step, theta - aStart) ) {
				this.ctx.lineTo( x + ir * Math.cos(theta), y + ir * Math.sin(theta) );
			}
			
			this.ctx.closePath();
			if(style.fill === true) {
				this.ctx.fillStyle = this._fc(color);
				this.ctx.fill();
			};
			this.ctx.restore();
		},
		
		polo : function(array, color, style) {
			this.ctx.save();
			this.ctx.lineWidth = style.thick;
			this.ctx.fillStyle = this._fc(color);
			this.ctx.globalAlpha = style.alpha;
			this.ctx.beginPath();
			this.ctx.moveTo(array[0].x, array[0].y);
			for(var i=1; i<array.length; i++) {
				this.ctx.lineTo(array[i].x, array[i].y);
			};
			this.ctx.lineTo(array[0].x, array[0].y);
			if(style.fill === true) {
				this.ctx.fill();
			};
			if(style.thick > 0) {
				this.ctx.strokeStyle = this._fc(color);
				this.ctx.stroke();
			};
			this.ctx.closePath();
			this.ctx.restore();
		},
		
		text: function(x, y, text, style, maxWidth) {
			this.ctx.save();
			this.ctx.fillStyle = this._fc(style.color);
		    this.ctx.font = (style.bold ? "bold " : "") + (style.size) + "px " + style.type;
		    this.ctx.textAlign = style.align;
		    if(style.textBaseline) {
		    	this.ctx.textBaseline = style.textBaseline;
		    };
		    
		    var xoffset = 0, xx = 0, yy = 0, back_xx = 0;
		    if(maxWidth == undefined) {
		    	maxWidth = 0;
		    };
		    if(this.ctx.textAlign === 'right') {
		    	xoffset = maxWidth;
		    } else if(this.ctx.textAlign === 'center') {
		    	xoffset = maxWidth/2;
		    };
		    
		    // if has rotation, then rotate it
		    if(style.rotation && style.rotation != 0) {
		    	this.ctx.translate(x, y);
    			this.ctx.rotate(style.rotation* Math.PI/180);
    			xx = xoffset;
    			yy = 0;
		    } else {
		    	xx = x+xoffset;
		    	yy = y;
		    }
		    
		    // set background rect x
		    var twidth = this.ctx.measureText(text).width;
		    if(this.ctx.textAlign === 'left') {
		    	back_xx = xx;
		    } else if(this.ctx.textAlign === 'center') {
		    	back_xx = xx+twidth/2-twidth;
		    } else if(this.ctx.textAlign === 'right') {
		    	back_xx = xx-twidth;
		    };
		    
		     // if has background style, draw background
		    var background = style.background;
		    if(background) {
		    	if(background.color) {
		    		this.rect(back_xx-2, yy, twidth+4, 16, background.color, {fill: true, thick:1, alpha:0.8});
		    	};
		    };
		    // draw text
		    if(maxWidth == 0) {
		    	this.ctx.fillText(text, xx, yy);
	    	} else {
	    		this.ctx.fillText(text, xx, yy, maxWidth);
	    	};
		   
		   	this.ctx.restore();
		},
		
		export_image: function(name) {
			var mime = 'image/png',
			    data = this.realCanvas.toDataURL(mime),
			    hh = "data:image/png;base64,",
				data = data.substring(hh.length);
			    
			__export_image(data, name);    
		},
		
		clear: function() {
			this.rc.clearRect(0, 0, this.realCanvas.width, this.realCanvas.height);
			this.boc.clearRect(0, 0, this.buffOuterCanvas.width, this.buffOuterCanvas.height);
			this.bic.clearRect(0, 0, this.buffInnerCanvas.width, this.buffInnerCanvas.height);
		},
		
		clip: function(x, y, w, h) {
			this.boc.rect(x, y, w, h);
			this.boc.clip();
			this.ctx = this.boc;
		},
		
		measureText: function(text, fsize) {
			this.ctx.font = fsize + "px Arial";
			var o = this.ctx.measureText(text);
			return o.width;
		},
        
		/**
		 * format color
		 */
		_fc: function(color) {
			return "#" + color;
		},

		_initCanvas : function() {
			var el = this.el, o = this.options;
			this.realCanvas = getCanvas(this.realCanvas, 'canvas');
			this.buffInnerCanvas = getCanvas(this.buffInnerCanvas, 'canvas');
			this.buffOuterCanvas = getCanvas(this.buffOuterCanvas, 'canvas');
			
			this.rc = getContext(this.realCanvas);
			this.bic = getContext(this.buffInnerCanvas);
			this.boc = getContext(this.buffOuterCanvas);
			
			this.clear();
			/**
			 * get Canvas
			 */
			function getCanvas(canvas, name) {
				if (!canvas) {
					canvas = document.createElement('canvas');
					el.appendChild(canvas);
				};
				canvas.setAttribute('width', o.width);
				canvas.setAttribute('height', o.height);
				canvas.style.cssText = 'position:absolute;left:0px;top:0px;';
				return canvas;
			};
			/**
			 * get Context
			 */
			function getContext(canvas) {
//				if (window.G_vmlCanvasManager)
//					window.G_vmlCanvasManager.initElement(canvas);
				var context = canvas.getContext('2d');
//				if (!window.G_vmlCanvasManager)
//					context.scale(1, 1);
				return context;
			};
		}
	};

})();