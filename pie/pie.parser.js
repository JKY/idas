/**
 * pie parser
 */
(function(){
    window.idas.parser.Pie = window.idas.Parser.extend({
      
    	type : function(){ return "Pie"; },
        

        axesOptions:[
                    	{id:"pieAxisDropbox0",index:0,type:"M",def_label:"Value"},
                        {id:"pieAxisDropbox1",index:1,type:"D",def_label:"Entry"}
                    ],
        //default data
    	default_data:{
        				wedge:[ 
                           {value:10, label:"Group A", color:"27a5cf"},
                           {value:10, label:"Group B", color:"cf2b27"},
                           {value:10, label:"Group C", color:"3fcf27"}
                     	],
    				  	legend:[{label:"Group A",color:"27a5cf"},{label:"Group B",color:"cf2b27"},{label:"Group C",color:"3fcf27"}]
                      },
      
         /**
         * processing the return query array, 
         * format the data to bar
         * more detail ...
         */
        format:function(dataset) {
            if(dataset == null){
                    debug("Pie chart's dataset is null");
                    return false;
             };
            var queryAxes = dataset.axes;
            var data = {wedge:[],legend:[]}, ax_mem;
            if(!_.isNull(queryAxes[0])) {
             	ax_mem = ds_axis( queryAxes[0].name, dataset );
             };
             var Length = dataset.data.length;
             for(var i = 0; i < Length; i++) {
                 var r = {};
                 var val = Number(dataset.data[i]);
                 if(val <= 0){
                	 continue;
                 };
                 r.value = val;
                 if(typeof(ax_mem ) != "undefined"){
                 	r.label = String(ax_mem.members[i]);
                 	r.color = colors(i);
                 }else{
                	r.label = String(queryAxes[0].name);
                 	r.color = colors(1);
                 };
                 data.wedge.push(r);
             };
        	return data;
        }
    });
}).call(this);
