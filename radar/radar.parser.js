/**
 * radar parser
 */
(function(){
    window.idas.parser.Radar = window.idas.Parser.extend({
    	type : function(){ return "Radar"; },
        axesOptions:[
                    	{id:"radarAxisDropbox0",index:0,type:"D",def_label:"Area"}
                    ],
        //default data
    	default_data:{ axes:[
    							{name:"Axis0",serials:[100]},
    							{name:"Axis1",serials:[100]},
    							{name:"Axis2",serials:[100]},
    							{name:"Axis3",serials:[100]},
    							{name:"Axis4",serials:[100]}
                          ],
        			 legend:[{label:"Area1",color:"27a5cf"}]
                   },
          
        format:function(dataset) {
    		if(dataset == null){
    		        debug("Radar chart's dataset is null");
    		        this.set({'state':'loaded'});
    		        return false;
    		};
            var queryAxes = dataset.axes;
    		var data = { axes:[],legend:[]};
    		var axisD = null;
        	var axisM = [];
        	var m_count = 0;
            var axes_names = [];
        	for(var i=0; i<queryAxes.length; i++){
        		if(queryAxes[i] == null){
        			continue;
        		};
        		if(queryAxes[i].type == "D"){
        			axisD = queryAxes[i];
        		}else{
        			axisM.push(queryAxes[i]);
        			m_count++;
        			axes_names.push(queryAxes[i].name);
        		};
        	};
    		if(axisD != null){
    			axisD = ds_axis( axisD.name, dataset );
    		}else{
        		return null;
    		};
    		// Area axis only give a default measure axis
    		if(m_count == 0){
    			this.set({"cdata":this.default_data,'state':'loaded'});
    			return null;
    		};
            for(var n=0; n<axisD.members.length; n++){
            	for(var i=0; i<m_count; i++){
            		if(n==0){
            			data.axes[i] = {name:axes_names[i], serials:[]};
            		};
            	var d = dataset.data[i+n*m_count];
            	d = d<0?0:d;
            	data.axes[i].serials.push(d);
                };
            };
            return data;
        }
    });
}).call(this);