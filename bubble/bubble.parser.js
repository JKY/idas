/**
 * bubble parser
 */
(function(){
    window.idas.parser.Bubble=window.idas.Parser.extend({
        type : function(){ return "Bubble"; },
        axesOptions : [
        			 	{id:"bubbleAxisDropbox0",index:0,type:"M",def_label:"X"},
        			 	{id:"bubbleAxisDropbox1",index:1,type:"M",def_label:"Y"},
                     	{id:"bubbleAxisDropbox2",index:2,type:"M",def_label:"Size"},
                     	{id:"bubbleAxisDropbox3",index:3,type:"D",def_label:"Color"}
                    ],
        //default data
    	default_data:{ bubbles:[
                                    {x:0,y:0,r:20,label:"A",color:"27a5cf"}
                                ],
                         xaxis:{label:"X",markers:[]},
                         yaxis:{label:"Y"},
                         raxis:{label:""},
                         caxis:{label:""},
                         legend:[]
                      },
         /**
         * processing the return query array, 
         * format the data to bar
         * more detail ...
         */
        format:function(dataset) {
        	if(dataset == null){
                debug("Bubble chart's dataset is null"); 
                return false;
            };
            var axes = dataset.axes;
            var mm_count = 0;
    		for(var i=0;i<3;i++){
    			if(typeof(axes[i])!="undefined" && axes[i]!=null){
    				mm_count++;
    			};
    		};
        	if( mm_count == 0 ){
        		debug("measure members is 0");
        		return false;
        	};
        	var meta_count = 0;
    		if( typeof(axes[3])!="undefined" && axes[3] != null ){
    			meta_count = 1;
    		};
        	var fds = {};
        	fds.xaxis = {label:"", markers:[]};
        	fds.yaxis = {label:""};
        	fds.raxis = {label:""};
        	fds.caxis = {label:""};

        	if( typeof(axes[0]) != "undefined" && axes[0] != null){
        		fds.xaxis.label = decode(axes[0].name);
        	};
        	if( typeof(axes[1]) != "undefined" && axes[1] != null){
        		fds.yaxis.label = decode(axes[1].name);
        	};
        	if( typeof(axes[2]) != "undefined" && axes[2] != null){
        		fds.raxis.label = decode(axes[2].name);
        	};
        	if( typeof(axes[3]) != "undefined" && axes[3] != null){
        		fds.caxis.label = decode(axes[3].name);
        	};
        	
        	fds.bubbles = [];
        	var data = dataset.data;
        	var row_count = data.length/(mm_count + meta_count);
        	var color_table = {};
        	var count = 0;
        	for( var i = 0; i < row_count ; i++ ){
        		var r = {x:0, y:0, r:5, label:'', color:''};
        		if( typeof(axes[0])!="undefined" && axes[0] != null ){
        			r.x = data[i*(mm_count+meta_count) + 0 ];
        		};
        		if( typeof(axes[1])!="undefined" && axes[1] != null ){
        			r.y = data[i*(mm_count+meta_count) + 1 ];
        		};
        		if( typeof(axes[2])!="undefined" && axes[2] != null ){
        			r.r = data[i*(mm_count+meta_count) + 2 ];
        		};
        		if( typeof(axes[3])!="undefined" && axes[3] != null ){
        			r.label = decode(data[i*(mm_count+meta_count) + mm_count ]);
        			if(typeof(color_table[r.label]) != "undefined"){
        				r.color = color_table[r.label];
        			}else{
        				color_table[r.label] = colors(count);
        				r.color = colors(count);
        				count++;
        			};
        		}
        		if(meta_count == 0){
        			r.label = '';
        			r.color = colors(0);
        		};
        		this.fds.bubbles.push(r);
        	};
    	    return { bubbles:fds.bubbles,
                          xaxis:fds.xaxis,
                          yaxis:fds.yaxis,
                          raxis:fds.raxis,
                          caxis:fds.caxis,
                        };
        }
    });
}).call(this);
