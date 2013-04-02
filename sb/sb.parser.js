/**
 *Stack Bar
 */
(function(){
    window.idas.parser.Stackbar= window.idas.Parser.extend({
        type : function(){ return "Stackbar"; }, 
        axesOptions:[
                        {id:"barAxisDropbox0",index:0,type:"M",def_label:"Y"},
                        {id:"barAxisDropbox1",index:1,type:"D",def_label:"X"},
                        {id:"barAxisDropbox2",index:2,type:"D",def_label:"Nested X"}
                    ],
        //default data
    	default_data : {groups:[{label:"",bars:[{value:0,label:"A",color:"0E51A7"},
    	     						                       {value:0,label:"B",color:"0E51A7"},
    	     						                       {value:0,label:"C",color:"0E51A7"}]}],
    	      				 xaxis:{label:"X", markers:[]},
    	      				 yaxis:{label:"Y"},
    	      				 legend:[]
    	},

         /**
         * processing the return query array, 
         * format the data to bar
         * more detail ...
         */
        format:function(dataset) {
        	if(dataset == null){
                debug("Stack Bar chart's dataset is null"); 
                return false;
            };
            var axes = dataset.axes;
            var fds = {};
        	fds.groups = [];
        	fds.xaxis = {label:"", markers:[]};
        	fds.yaxis = {label:""};
        	
    		if( axes[0] != null && axes[1] != null){
    			//there is no order in return data,so using dropped ordered axes to find axis from return date
    			var ds_fst_axis = ds_axis(decode(axes[0].name), dataset);
    			var ds_sec_axis = ds_axis(decode(axes[1].name), dataset);
    			//drop both 2 D axes
    			if(ds_fst_axis && ds_sec_axis) {
    				var max_i = ds_fst_axis.members.length;
        			var max_j = ds_sec_axis.members.length;
        			var fst_dn = axes[0].name;
        			var sec_dn = axes[1].name;
        			var fst_mem = ds_fst_axis.members;
        			var sec_mem = ds_sec_axis.members;
        			for( var i = 0 ; i < max_i ; i++ ){
        	    		var group = {label:"", bars:[]};
        	        	for( var j = 0 ; j < max_j ; j++ ){
        	        		var q = {};
        	        		q[decode(fst_dn)] = i ;
        	        		q[decode(sec_dn)] = j ;
        	        		q["Measure"] = 0;
        	        		var value = ds_val( q, dataset );
        	        		if(value< 0) {
    	        				value = 0;
    	        			};
        	        		group.bars.push({value:Number(value), label:sec_mem[j], color:colors(j)});
        	        	};
        	        	// set group label
        	        	group.label = fst_mem[i];
        	        	//set group
        	        	fds.groups.push(group);
        	        };
        	        //save cols info for sorting
        			for( var i = 0 ; i < max_j ; i++ ){
        				//x-axis labels
        	        	fds.xaxis.markers.push(sec_mem[i]);
    	        	};
    	        	fds.xaxis.label = decode(fst_dn)+" / "+decode(sec_dn);
    			}
    		}else{
    			var _axis = axes[0];
        		for( var i = 0 ; i < dataset.data.length ; i++ ){
        			if(dataset.data[i] < 0) {
        				dataset.data[i] = 0;
        			};
        			var group = {label:"", bars:[]};
        			var label = "";
    				if(_axis.members.length >1){
    					label =  decode(_axis.members[i]);
    				}else{
    					// drop M in a D axis,there is no members,get members from dataset
    					label = ds_axis(decode(_axis.name),dataset ).members[i];
    				};
    				group.bars.push({value:dataset.data[i], label:label, color:colors(0)});
    				// set group label
    	        	group.label = label;
        			fds.groups.push(group);
        			//x-axis labels
    	        	fds.xaxis.markers.push(label);
        		};
        		fds.col[decode(_axis.members[0])]= 0;
        		fds.xaxis.label = decode(_axis.name);
    		};
        	return fds;
        }
    });
}).call(this);
