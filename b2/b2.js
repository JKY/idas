/**
 * 
 * @param {} options
 */
B2 = function(options) {
	this.options = null;
	this.canvas = null;
    this.masker = null;
    
	this.init = function(options) {
		if(this.validate(options)) {
			if(this.g) {
				this.g.clear();
			};
            var w = options.width;
            var h = options.height;
			this.el = document.createElement("div");
            $('#'+options.container).append(this.el);
            $('#'+options.container).css({
            	position: "relative",
            	width: w,
            	height: h
            });
            $(this.el).css({
            				position:"relative",
                            width:w,
                            height:h
                            });
        	//create canvas
            this.canvas = document.createElement('div');
		    $(this.el).append(this.canvas);
            $(this.canvas).css({
                position: 'absolute',
                width: w,
                height: h,
                left:0,
                top:0
            });
        
            this.masker = document.createElement('div');
            $(this.el).append(this.masker);
            $(this.masker).css({
            	position: 'absolute',
                width:w,
                height:h,
                left:0,
                top:0,
                'z-index':100,
                'background-color': '#fff',
                'filter':'alpha(opacity=0)',
                '-moz-opacity':0,
                opacity: 0
            });
            this.g = new B2.Graphics(options,this.canvas);
	    	this.e = new B2.Evt(this,this.masker);
			//init graphics
	        this.c = new B2.chart[options.type](this, options);
		}
	};
	
    this.size=function(w,h){
        $(this.el).css({width:w,height:h});
        $(this.canvas).css({width: w,height: h});
        $(this.masker).css({width:w,height:h});
        this.c.width = w;
        this.c.height = h;
    };
    
	this.trigger = function(e){
		this.c.handler(e);
	};
	
	this.render = function(d){
        this.c.setdata(this.g, d);
    };
    
    this.export_image = function(type){
    	this.g.dump(type);
    };
    
    this.validate = function(options){
    	this.options = options;
    	var type = options.type;
    	if(_.isUndefined(B2.chart[type])){
    		throw new Error('undefined chart type error');
        };
        return true;
    };
    this.init(options);
};

B2.chart = {};