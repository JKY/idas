B2.chart = {};
/**
 * default options
 * @type 
 */
B2.chart.defaultOptions = {
    margin: [10,10,50,30],
    colors: ['27a5cf', 'cf2b27', '3fcf27', '8de894', '339999',
            'cfc527', '834e00', '6f6c6f', '669933', 'ff0000', 'ff9900',
            '9900cc', 'bbbbbb', '330033'],
            
    font: {
        color: '000000',
        size: 10,
        bold: false,
        type: 'Arial',
        align: 'left',
        textBaseline: 'hanging'
    },
    
    grid: {
        color: 'DDDDDD'
    },
    
    xaxisLabel: {
        bold: true,
        align: 'center'
    },
    
    yaxisLabel: {
    	bold: true,
        align: 'center',
        rotation: 270
    },
    
    xaxis: {
        showLabels: true,
        align: 'center'
    },
    
    yaxis: {
        showLabels: true,
        align: 'right'
//        textBaseline: 'middle'
    },
    
    tip: {
    	font: {
    		color: 'ffffff'
    	},
        background: {
            color: '000000',
            alpha:0.5,
            fill:true,
            thick:1
        }
    }
};

/**
 * draw tip
 */
function draw_tooptip(g, x, y, text, w) {
		var xoff = 0;
    var tw = g.measureText(text, 10);
    if(x + tw > w){
        xoff = tw-8;
    } else {
    		xoff = 8;
           };
	
    g.polo([
             {x:x-4,y:y+2},
             {x:x+4,y:y+2},
             {x:x,y:y+6},
             {x:x-4,y:y+2}
            ],
            '000000',
            {fill:true,alpha:1,thick:1}
            );
    g.text(x-xoff,y-13,text,{color:"ffffff",align:"left",size:10, background:{color:"000000"}});
};
/**
 * format val to thousand units
 * @param {} val
 * @return {}
 */
function format_num(val,precision){
	if(val > 1000) {
		return (val/1000).toFixed(1) + "k";
	} else {
        if(precision != undefined)
		  return val.toFixed(precision);
        else 
          return val;
	};
};
/**
 * ������ӷ�����
 * float add
 */
function FloatAdd(arg1,arg2){
	var r1,r2,m;
	try{r1=arg1.toString().split(".")[1].length;}catch(e){r1=0;};
	try{r2=arg2.toString().split(".")[1].length;}catch(e){r2=0;};
	m=Math.pow(10,Math.max(r1,r2));
	return (arg1*m+arg2*m)/m;
};
/**
 * merge the dest to srs
 * @param {} src
 * @param {} dest
 * @return {}
 */
function merge(src, dest) {
    var i, v, result = dest || {};
    for (i in src) {
        v = src[i];
        if (v && typeof(v) === 'object') {
            if (v.constructor === Array) {
                result[i] = _.clone(v);
            } else if (v.constructor !== RegExp && !_.isElement(v)) {
                result[i] = merge(v, (dest ? dest[i] : undefined));
            } else {
                result[i] = v;
            };
        } else {
            result[i] = v;
        };
    };

    return result;
};

/**
 * roundup the axis min, max values
 */
function roundup(min,max){
	if(min == 0 && max == 0){
		return {min:0,max:1,step:1};
	};
	var d = max - min;
    var n = Math.floor(Math.log(d)/Math.log(10));
    var upper = Math.pow(10, n+1);
    var precient = [0.2,0.5,1];
    var adj_max = 0;
    for( var i = 0; i < precient.length; i++ ){
    	var tmp = precient[i]*upper;
        if( d <= tmp ){
        	d = tmp;
            break;
        };
    };
    var step = d/10;
    var t = min/step;
    var k = (t-Math.floor(t)) < 0.000000001;
    if(min<0){
    	var m = Math.ceil(min/step);
    	var adj_min = k==true?min:step*(m-1);
    }else{
    	var m = Math.floor(min/step);
    	var adj_min = 0;
    	if(m > 0) {
    		adj_min = k==true?(min-step):step*(m-1);
    	};
    };
    var m = Math.floor(max/step);
    var t = max/step;
    var k = (t-Math.floor(t)) < 0.000000001;
    var adj_max = k==true?max:step*(m+1);
    return {min:adj_min,max:adj_max,step:step};
};