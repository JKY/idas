/**
 * line parser
 */
(function(){
    window.idas.parser.Line = window.idas.Parser.extend({
       
        type : function(){ return "Line"; },
        
    	axesOptions: [
                                {id:"lineAxisDropbox0",index:0,type:"M",def_label:"Y"},
                                {id:"lineAxisDropbox1",index:1,type:"D",def_label:"X"},
                                {id:"lineAxisDropbox2",index:2,type:"D",def_label:"Nested X"}
                            ],
        //default data
    	default_data: {lines:[{label:"",color:"0E51A7",data:[0,0,0]}],
    	      				 xaxis:{label:"X", markers:['A', 'B']},
    	      				 yaxis:{label:"Y"},
    	      				 legend:[]
    	},


       
         /**
         * processing the return query array, 
         * format the data to bar
         * more detail ...
         */
        format:function(dataset) {
            var query_demations = this.get('axes');
        	if(dataset == null){
                debug("Line chart's dataset is null"); 
                return false;
            };
        	var axes = dataset.axes;
            var fds = {};
        	fds.lines = [];
         	fds.xaxis = {label:"", markers:[]};
         	fds.yaxis = {label:""};
      
     		if( axes[0] != null && axes[1] != null){
     			//find axis from back date
     			var ds_fst_axis = ds_axis(decode(axes[0].name), dataset);
     			var ds_sec_axis = ds_axis(decode(axes[1].name), dataset);
     			//filled 2 D type axes
     			if(ds_fst_axis && ds_sec_axis) {
     				var max_i = ds_fst_axis.members.length;
    	    			var max_j = ds_sec_axis.members.length;
    	    			var fst_dn = axes[0].name;
    	    			var sec_dn = axes[1].name;
    	    			var fst_mem = ds_fst_axis.members;
    	    			var sec_mem = ds_sec_axis.members;
        		};
    			for( var i = 0 ; i < max_j ; i++ ){
    	    		var line = {label:"",color:colors(i),data:[]};
    	        	for( var j = 0 ; j < max_i ; j++ ){
    	        		var q = {};
    	        		q[decode(fst_dn)] = j ;
    	        		q[decode(sec_dn)] = i ;
    	        		q["Measure"] = 0;
    	        		var value = ds_val( q, dataset );
    	        		// line data
    	        		if(value != "nil"){
    	        			line.data.push(Number(value));
    	        		}else{
    	        			line.data.push(0);
    	        		};
    	        	};
    	        	// set group label
    	        	line.label = fst_mem[i];
    	        	//set group
    	        	fds.lines.push(line);
    	        };     
        	    for( var i = 0 ; i < max_i ; i++ ){
        			//x-axis labels
    	        	fds.xaxis.markers.push(fst_mem[i]);
    	        };
     		}else{
     			// dropped any 1 of the last two D type axes
     			var _axis = axes[0];
     			var line = {label:"",color:colors(0),data:[]};
         		for( var i = 0 ; i < dataset.data.length ; i++ ){
         			var label = "";
     				if(_axis.members.length >1){
     					label =  decode(_axis.members[i]);
     				}else{
     					// drop M in a D axis,there is no members,get members from dataset
     					label = ds_axis(decode(_axis.name),dataset ).members[i];
     				};
     				line.data.push(dataset.data[i]);
     				// set group label
     				line.label = decode(_axis.name);
     				//x-axis labels
    	        	fds.xaxis.markers.push(label);
         		};
         		fds.lines.push(line);
         		fds.xaxis.label = decode(_axis.name);
     		};
        	return { lines:fds.lines,
         				  xaxis:fds.xaxis,
         				  yaxis:fds.yaxis
                         };
        }
    });
}).call(this);
