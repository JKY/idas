B2.Graphics.Canvas = {};

function ping( id ) {
	var instance = window.B2.Graphics.Canvas.Fl.__LIST[id];
	instance.on_swf_ready();
};

function __export_image(data,name){
	var form = document.createElement("form");
	document.body.appendChild(form);
	form.innerHTML = '<input type="hidden" name="data" value="' + data + '"/><input type="hidden" name="img_name" value="' + name + '"/>';
	form.action = window.urls.export_image;
	form.method = 'POST';
	form.target = "_blank";
	form.submit();
	
	document.body.removeChild(form);
};

function getSwf(id) {
	 return (navigator.appName.indexOf("Microsoft") != -1) ? window[id] : document.getElementById(id);
};

/**
 * 
 * 
 * 
 */
B2.Graphics.Canvas.Fl = function(options,wrapper){
	this.id = options.container+'-fl'+ Math.floor(Math.random()*1000);
	this.swf = null;
	this.callstack = [];
    
	var swfUrl = options.canvas.param.url;
	 /**
	  *
	  */
	this.init = function( options,wrapper){
    	 var swfholder = document.createElement('div');
         $(swfholder).attr("id",this.id);
         $(wrapper).append(swfholder);
		 /**  init swf canvas **/
		 var flashvars = {
		     width:options.width,
		 	 height:options.height
		 };
         var params = {
            menu: "false",
            scale:"noscale",
            wmode:"transparent",
            allowScriptAccess:"always"
         };
         var attributes = {
            id: this.id,
            wmode:"transparent"
         };
		 swfobject.embedSWF( swfUrl +"?id="+ attributes.id,  attributes.id , options.width,  options.height, "10.0.0","expressInstall.swf", flashvars, params, attributes);
		 this.id = attributes.id;
		 window.B2.Graphics.Canvas.Fl.__LIST[attributes.id] = this;
	 };


	 this.on_swf_ready = function () {
		 this.swf = getSwf(this.id);
		 try{
			 this.swf.ping();
		 }catch(e){
			 this.swf = null;
			 return;
		 };
		 for( var i = 0 ; i < this.callstack.length; i++ ){
			 var cmd = this.callstack[i];
			 this.call(cmd.what,cmd.param);
		 };
		 this.callstack.length = 0;
	 };
	 
	 /**
	  *
	  */
	 this.call = function(what, param){
		 if(this.swf == null){
			 this.callstack.push({what:what,param:param});
			 return;
		 };
		 
		 try{
			 switch(what){
			 	case "line":
			 		this.swf.Line(param.fx, param.fy, param.tx, param.ty, param.color, param.style);
			 		break;
			 	case "rect":
			 		this.swf.Rect(param.x, param.y, param.w, param.h, param.color, param.style);
			 		break;
			 	case "circle":
			 		this.swf.Circle(param.ox, param.oy, param.r, param.color, param.style);
			 		break;
			 	case "polo":
			 		this.swf.Polo(param.pl, param.color, param.style);
			 		break;
			 	case "wedge":
			 		this.swf.Wedge(param.x, param.y, param.ir, param.or, param.aStart, param.aEnd, param.color, param.style);
			 		break;
			 	case "text":
			 		this.swf.Text(param.x, param.y, param.text, param.style, param.width);
			 		break;
			 	case "clear":
			 		this.swf.Clear();
			 		break;
			 	case "set_buff":
			 		this.swf.SetBuff(param.i);
			 		break;
			 	case "flush_buff":
			 		this.swf.FlushBuff(param.i);
			 		break;
			 	case "export_image":
			 		this.swf.export_image(param.type+".png");
			 		break;
			 	case "clip":
			 		this.swf.clip(param.x, param.y, param.w, param.h);
			 		break;
			 	case "measureText":
					return this.swf.measureText(param.text, param.fsize);
		 		break;
			 };
		 }catch(e){
			 return;
		 };
	 };
	 
	 this.init(options,wrapper);
 };
 
window.B2.Graphics.Canvas.Fl.__LIST = [];
 


 
window.B2.Graphics.Canvas.HTML5 = function(options,wrapper){
	
	this.init = function(options,wrapper){
		var opt = _.clone(options);
		this.html5 = new HTML5Canvas(opt, wrapper);
	};
	
	 this.call = function(what, param){
		 switch(what){
		 	case "line":
		 		this.html5.line(param.fx, param.fy, param.tx, param.ty, param.color, param.style);
		 		break;
		 	case "rect":
		 		this.html5.rect(param.x, param.y, param.w, param.h, param.color, param.style);
		 		break;
		 	case "circle":
		 		this.html5.circle(param.ox, param.oy, param.r, param.color, param.style);
		 		break;
		 	case "polo":
		 		this.html5.polo(param.pl, param.color, param.style);	
		 	case "wedge":
		 		this.html5.wedge(param.x, param.y, param.ir, param.or, param.aStart, param.aEnd, param.color, param.style);
		 		break;
		 	case "text":
		 		this.html5.text(param.x, param.y, param.text, param.style, param.width);
		 		break;
		 	case "set_buff":
		 		this.html5.setBuff(param.i);
		 		break;
		 	case "flush_buff":
		 		this.html5.flushBuff(param.i);
		 		break;
	 		case "export_image":
		 		this.html5.export_image(param.type+".png");
		 		break;
		 	case "clear":
		 		this.html5.clear();
		 		break;
			case "clip":
				this.html5.clip(param.x, param.y, param.w, param.h);
		 		break;
		 	case "measureText":
				return this.html5.measureText(param.text, param.fsize);
		 		break;
		 };
	 };
	 
	 this.init(options,wrapper);
 };