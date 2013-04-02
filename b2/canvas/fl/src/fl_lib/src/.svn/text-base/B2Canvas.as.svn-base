package
{	
	import com.adobe.images.JPGEncoder;
	import com.adobe.images.PNGEncoder;
	
	import flash.display.BitmapData;
	import flash.display.Graphics;
	import flash.display.Shape;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.TimerEvent;
	import flash.external.ExternalInterface;
	import flash.net.FileFilter;
	import flash.net.FileReference;
	import flash.text.TextField;
	import flash.text.TextFieldAutoSize;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	import flash.utils.ByteArray;
	import flash.utils.Timer;
	
    [SWF(width="1000", height="800", frameRate="12")]

	public class B2Canvas extends Sprite {
		private var _timer:Timer;
		private var _rdy:Boolean = false;
		private var _buffer:Array = [];
		private var _i:int = 0;
		private var _currbuf:B2Buffer;
		private var _width:Number = 0;
		private var _height:Number = 0;
		private var _text:TextField = new TextField();
		
		public function B2Canvas() {
			_width = Number(this.root.loaderInfo.parameters.width);
			_height = Number(this.root.loaderInfo.parameters.height);
			this.x = (1000 - _width)/2;
			this.y = (800 - _height)/2;
			
			_buffer[0] = new B2Buffer(_width,_height);
			_buffer[1] = new B2Buffer(_width,_height);
		
			this.addChild(_buffer[0]);
			this.addChild(_buffer[1]);

			ExternalInterface.addCallback("Line",Line);
			ExternalInterface.addCallback("Circle",Circle);
			ExternalInterface.addCallback("Rect",Rect);
			ExternalInterface.addCallback("Polo",Polo);
			ExternalInterface.addCallback("Wedge",Wedge);
			ExternalInterface.addCallback("Text",Text);
			ExternalInterface.addCallback("Clear",Clear);
			ExternalInterface.addCallback("FlushBuff",FlushBuff);
			ExternalInterface.addCallback("SetBuff",SetBuff);
			ExternalInterface.addCallback("ping",ping);
			ExternalInterface.addCallback("export_image",export_image);
			ExternalInterface.addCallback("clip",clip);
			ExternalInterface.addCallback("measureText",measureText);
			_currbuf = _buffer[0];
			_timer = new Timer(100);
			_timer.addEventListener(TimerEvent.TIMER,onTimer);
			_timer.start();
		}
		
		
		public function measureText(text:String, fontSize:Number):Number{
			var myFormat:TextFormat = new TextFormat();
			myFormat.font = "arial";
			myFormat.size = fontSize;
			_text.defaultTextFormat = myFormat;
			_text.text = text;
			_text.autoSize = TextFieldAutoSize.LEFT;
			return _text.width;
		};
		
		public function export_image(name:String):void{
			//var jpgEncoder:JPGEncoder = new JPGEncoder(85);
			var pngEncoder:PNGEncoder = new PNGEncoder();
			var bmpd:BitmapData = new BitmapData(_width, _height);
			bmpd.draw(_currbuf);
			//var ba:ByteArray=jpgEncoder.encode(bmpd);//编码成JPG图片
			var ba:ByteArray = pngEncoder.encode(bmpd);
			//var ref:FileReference = new FileReference();
			//ref.save(rr,"aa.png");
			var encoded:String = Base64.encode(ba); 
			ExternalInterface.call("__export_image",encoded,name);
		}
		
		public function get id():String {
			var paramater:Object = this.root.loaderInfo.parameters;
			if(paramater.hasOwnProperty("id")){
				return paramater["id"];
			}else{
				return "undefined";
			}
		}
		
		private function ping():void{
			_rdy = true;
		}
		
		private function onTimer(e:Event) : void
		{
			if(_rdy){
				_timer.stop();
			}
			ExternalInterface.call("ping",this.id);
		}
		
		public function FlushBuff(i:int):void{
			_buffer[i].visible = true;
			_buffer[(i+1)%2].visible = false;
			
		}
		
		public function SetBuff(i:int):void{
			_currbuf = _buffer[i];
			this.Clear();
		}
		
		public function Clear():void{
			_currbuf.clear();
		}
		
		public function clip(xx:Number, yy:Number, width:Number, height:Number):void{
			_buffer[0].clip(xx,yy,width,height);
			_buffer[1].clip(xx,yy,width,height);
		}
		
		public function Line( fx:Number, fy:Number, tx:Number, ty:Number, c:String, style:Object ):void{
			var color:uint = 0x000000;
			if(c != null){
				color =uint("0x"+c);
			};
			var thick:Number = 1;
			if(style.thick != null){
				thick =style.thick;
			};
			var alpha:Number = 1;
			if(style.alpha != null){
				alpha =style.alpha;
			};
			_currbuf.Line(fx,fy,tx,ty,color,alpha,thick);
		}
		
		public function Rect( x:Number, y:Number, w:Number, h:Number, c:String, style:Object ):void{
			var color:uint = 0x000000;
			if(c != null){
				color =uint("0x"+c);
			};
			var thick:Number = 1;
			if(style.thick != null){
				thick =style.thick;
			};
			var alpha:Number = 1;
			if(style.alpha != null){
				alpha =style.alpha;
			};
			var fill:Boolean = true;
			if(style.fill != null){
				fill =style.fill;
			};
			_currbuf.Rect(x,y,w,h,color,fill,alpha,thick);
		}
		
		public function Circle( ox:Number, oy:Number, r:Number, c:String, style:Object ):void{
			var color:uint = 0x000000;
			if(c != null){
				color =uint("0x"+c);
			};
			var thick:Number = 1;
			if(style.thick != null){
				thick =style.thick;
			};
			var alpha:Number = 1;
			if(style.alpha != null){
				alpha =style.alpha;
			};
			var fill:Boolean = true;
			if(style.fill != null){
				fill =style.fill;
			};
			_currbuf.Circle(ox, oy, r, color, fill, alpha, thick);
		}
		
		public function Polo( pl:Array, c:String, style:Object ):void{
			var color:uint = 0x000000;
			if(c != null){
				color =uint("0x"+c);
			};
			var thick:Number = 1;
			if(style.thick != null){
				thick =style.thick;
			};
			var alpha:Number = 1;
			if(style.alpha != null){
				alpha =style.alpha;
			};
			var fill:Boolean = true;
			if(style.fill != null){
				fill =style.fill;
			};
			_currbuf.Polo( pl, color, fill, alpha, thick );
		}
		
		public function Wedge( x:Number, y:Number, ir:Number, or:Number, aStart:Number, aEnd:Number, c:String, style:Object, step:Number = 1 ):void{
			var color:uint = 0x000000;
			if(c != null){
				color =uint("0x"+c);
			};
			var thick:Number = 1;
			if(style.thick != null){
				thick =style.thick;
			};
			var alpha:Number = 1;
			if(style.alpha != null){
				alpha =style.alpha;
			};
			var fill:Boolean = true;
			if(style.fill != null){
				fill =style.fill;
			};
			_currbuf.Wedge( x, y, ir, or, aStart, aEnd, color, fill, alpha, thick, step);
		}
		
		/****************************
		 *  textfield locate in ('x','y'),
		 *  front-size is fs, text is 'text', c is its color , 
		 *  'position' is its align, 'style' include its style.
		 */
		public function Text( x:Number, y:Number, text:String, style:Object, width:Number = 0 ):void{
			var color:uint = 0x000000;
			if(style.color != null){
				color =uint("0x"+style.color);
			};
			var fontSize:Number = 12;
			if(style.size != null){
				fontSize =style.size;
			};
			var bold:Boolean = false;
			if(style.bold != null){
				bold =style.bold;
			};
			var align:String = "left";
			if(style.align != null){
				align =style.align;
			};
			var rotation:Number = 0;
			if(style.rotation != null){
				rotation =style.rotation;
			};
			var max_width:Number = 0;
			if(width != 0){
				max_width = width;
			};
			var background:Object = null;
			if(typeof(style.background) != "undefined"){
				background = style.background;
			}
			_currbuf.Text( x, y, text,color, align, fontSize, bold, background, rotation, max_width);
		}
		
	
	}
	
}