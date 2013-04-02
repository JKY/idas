/**
 *
 */
(function(){
    window.idas.parser.Stack = window.idas.Parser.extend({
        type : function(){ return "Stack"; },
    	axesOptions : [
                                {id:"stackAxisDropbox0",index:0,type:"M",def_label:"Y"},
                                {id:"stackAxisDropbox1",index:1,type:"D",def_label:"X"},
                                {id:"stackAxisDropbox2",index:2,type:"D",def_label:"Group"}
                            ],
        //default data
    	default_data : {serials:[{label:"",color:"0E51A7",data:[0,0,0]}],
    	      				 xaxis:{label:"X", markers:['A','B','C']},
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
                debug("Line chart's dataset is null"); 
                return false;
            };
            var query_demations = dataset.axes;
        	var fds = {};
            fds.serials = [];
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
        			var plused_data = [];
        			for( var i = 0 ; i < max_j ; i++ ){
        	    		var serials = {label:"",color:colors(i),data:[]};
        	        	for( var j = 0 ; j < max_i ; j++ ){
        	        		var q = {};
        	        		q[decode(fst_dn)] = j ;
        	        		q[decode(sec_dn)] = i ;
        	        		q["Measure"] = 0;
        	        		var value = ds_val( q, dataset );
        	        		// stack data
        	        		if(value != "nil"){
        	        			value = Number(value);
        	        		}else{
        	        			value = 0;
        	        		};
        	        		if(typeof(plused_data[j]) != "undefined"){
        	        			plused_data[j] += value;
        	        		}else{
        	        			plused_data[j] = value;
        	        		};
        	        		serials.data.push(plused_data[j]);
        	        	};
        	        	// set group label
        	        	serials.label = fst_mem[i];
        	        	//set group
        	        	fds.serials.push(serials);
        	        };
        			for( var i = 0 ; i < max_i ; i++ ){
        				//x-axis labels
    	        	    fds.xaxis.markers.push(fst_mem[i]);
    	        	    //save cols info for sorting
    	        		fds.col[fst_mem[i]]= i;
    	        	}
     		}else{
     			var _axis = axes[0];
     			// clear X-axis's chart legend
     			var serials = {label:"",color:colors(0),data:[]};
         		for( var i = 0 ; i < dataset.data.length ; i++ ){
         			var label = "";
     				if(_axis.members.length >1){
     					label =  decode(_axis.members[i]);
     				}else{
     					// drop M in a D axis,there is no members,get members from dataset
     					label = ds_axis(decode(_axis.name),dataset ).members[i];
     				};
     				serials.data.push(dataset.data[i]);
     				// set group label
     				serials.label = decode(_axis.name);
     				//x-axis labels
    	        	fds.xaxis.markers.push(label);
         		};
         		fds.serials.push(serials);
         		fds.col[decode(_axis.members[0])]= 0;
         		fds.xaxis.label = decode(_axis.name);
     		}
         	return { 
                     serials:this.fds.serials,
         			 xaxis:this.fds.xaxis,
         			 yaxis:this.fds.yaxis
                   };
        }
    });
}).call(this);
