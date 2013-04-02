    
if(typeof(window.idas) == "undefined"){
    window.idas = {};
};
if(typeof(window.idas.parser) == "undefined"){
     window.idas.parser = {};
};

if(typeof(window.idas.chart) == "undefined"){
     window.idas.chart = {};
};


/**
 * format return chart data
 */
window.idas.Parser = Backbone.Model.extend({
    axesOptions:[],
    cube:null,

    /**
     * @description: init plugin
     *
     */
    setCube:function(cube){
        if(this.cube){
           this.cube.unbind("onload",this);
           this.cube.unbind("ondata",this);
        };
        this.cube = cube;
        this.cube.bind("onload", 
                          function( data ){
                               
                          },
                          this
                      );
        this.cube.bind("ondata",
                          function( data ){
                              if((result= this.format(data)) !== null){
                                   this.set('data',result);
                              }
                          },this);
    },
    
    /**
     * release, unbind all event binded to cube
     */
    release:function(){
        this.off("change:cdata");
        if(this.cube){
           this.cube.unbind("onload",this);
           this.cube.unbind("ondata",this);
        };
        delete this;
    },

    format:function(dataset){ }
});


window.idas.chart.Render = function(options){
    this.view = null;
    this.model = null;
   
    this.init = function(options,query){
        this.options = options;                
        var type = options.type;
        var wrapper = this.options.id;
        var margin = [0,0,0,0];
        if(options.margin != undefined){
            margin = options.margin;
        };
        var options = {
                        container:wrapper,
                        "type":type,
                        width: options.width,
                        height: options.height, 
                        margin: margin,
                        canvas:{ platform:"Fl", param:{url:this.options.swfPath}} 
                      };

        this.view = new B2(options);
    };

    this.getView = function(){
        return this.view.el;
    };

    this.resize = function(w,h){
        if(this.view != undefined){
          this.view.size(w,h);
        }
    };

    this.setModel = function(m){
        if(this.model != null){
            this.model.off("change:data",this.render,this);
        }
        this.model = m;
        this.model.on("change:data",this.render,this);
    }
    
    this.render = function(){
        var d = this.model.get('data');
        if(d != undefined){
            this.view.render(d);
        }
    };
    
    this.init(options,options.query);
};

/////
var quikCharts = [];

function QCRegist(option){
    quikCharts.push(option);
};

window.onload = function(){
    for(var i=0;i < quikCharts.length;i++){
        new window.idas.quik.Render(quikCharts[i]);
    };
 };
