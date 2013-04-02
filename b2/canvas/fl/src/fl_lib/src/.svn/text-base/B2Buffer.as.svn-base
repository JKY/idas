package
{
	import flash.display.Graphics;
	import flash.display.Shape;
	import flash.display.Sprite;
	import flash.text.TextField;
	import flash.text.TextFieldAutoSize;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	
	public class B2Buffer extends Sprite
	{
		private var _text_layer:Sprite;
		private var _shape_layer:Sprite;
		private var _shape_layer_mask:Shape;
		
		private var _tfs:Array = [];
		
		public function B2Buffer(w:Number,h:Number)
		{
			super();
			_text_layer = new Sprite();
			_shape_layer = new Sprite();
			_shape_layer_mask = new Shape();
			_shape_layer_mask.graphics.beginFill(0x000000);
			_shape_layer_mask.graphics.drawRect(0,0,w,h);
			_shape_layer_mask.graphics.endFill();
			this.addChild(_shape_layer);
			_shape_layer.mask = _shape_layer_mask;
			this.addChild(_shape_layer_mask);
			this.addChild(_text_layer);
		}
		
		public function clear():void {
			//clear graphics
			_shape_layer.graphics.clear();
			//clear text
			for(var i:int =0; i < this._tfs.length; i++){
				var tmp:TextField = this._tfs[i];
				tmp.text = "";
				_text_layer.removeChild(tmp);
			};
			this._tfs.length = 0;
		}
		
		public function clip(xx:Number,yy:Number,w:Number,h:Number):void{
			this._shape_layer_mask.x = xx;
			this._shape_layer_mask.y = yy;
			this._shape_layer_mask.width = w;
			this._shape_layer_mask.height = h;
		}
		
		
		public function Line( fx:Number, fy:Number, tx:Number, ty:Number, color:uint, alpha:Number, thick:Number ):void{
			_shape_layer.graphics.lineStyle( thick, color, alpha );
			_shape_layer.graphics.moveTo( fx, fy );
			_shape_layer.graphics.lineTo( tx, ty );
		}
		
		public function Rect( x:Number, y:Number, w:Number, h:Number, color:uint, fill:Boolean, alpha:Number, thick:Number ):void{
			if(fill)
				_shape_layer.graphics.beginFill( color, alpha );
				_shape_layer.graphics.lineStyle( thick, color, thick==0?0:alpha );
			_shape_layer.graphics.drawRect( x, y, w, h );
			if(fill)
				_shape_layer.graphics.endFill();
		}
		
		public function Circle( ox:Number, oy:Number, r:Number, color:uint, fill:Boolean, alpha:Number, thick:Number ):void{
			if(fill)
				_shape_layer.graphics.beginFill( color, alpha );
				_shape_layer.graphics.lineStyle( thick, color, alpha );
			_shape_layer.graphics.drawCircle( ox, oy, r );
			if(fill)
				_shape_layer.graphics.endFill();
		}
		
		public function Polo( pl:Array, color:uint, fill:Boolean, alpha:Number, thick:Number ):void{
			if(fill)
				_shape_layer.graphics.beginFill( color, alpha );
				_shape_layer.graphics.lineStyle( thick, color, thick==0?0:alpha );
			_shape_layer.graphics.moveTo( pl[0].x, pl[0].y );
			for( var i:int = 1 ; i < pl.length ; i++ ){
				_shape_layer.graphics.lineTo( pl[i].x, pl[i].y );
			}
			_shape_layer.graphics.lineTo( pl[0].x, pl[0].y );
			if(fill)
				_shape_layer.graphics.endFill();
		}
		
		public function Wedge( x:Number, y:Number, ir:Number, or:Number, aStart:Number, aEnd:Number, color:uint, fill:Boolean, alpha:Number, thick:Number, step:Number = 1 ):void{
			if(fill)
				_shape_layer.graphics.beginFill( color, alpha );
				_shape_layer.graphics.lineStyle( thick, color, alpha );
			// More efficient to work in radians
			var degreesPerRadian:Number = Math.PI / 180;
			aStart *= degreesPerRadian;
			aEnd *= degreesPerRadian;
			step *= degreesPerRadian;
			
			// Draw the segment
			_shape_layer.graphics.moveTo( x + ir * Math.cos(aStart), y + ir * Math.sin(aStart) );
			for ( var theta:Number = aStart; theta < aEnd; theta += Math.min(step, aEnd - theta) ) {
				_shape_layer.graphics.lineTo( x + or * Math.cos(theta), y + or * Math.sin(theta) );
			}
			_shape_layer.graphics.lineTo( x + or * Math.cos(aEnd), y + or * Math.sin(aEnd) );
			_shape_layer.graphics.lineTo( x + ir * Math.cos(aEnd), y + ir * Math.sin(aEnd) );
			for ( theta = aEnd; theta > aStart; theta -= Math.min(step, theta - aStart) ) {
				_shape_layer.graphics.lineTo( x + ir * Math.cos(theta), y + ir * Math.sin(theta) );
			}
			if(fill)
				_shape_layer.graphics.endFill();
		}
		
		private function getTf():TextField{
			var tf:TextField = null;
			if(tf == null){
				tf = new TextField();
				//tf.background = false;
				//tf.visible = true;
				_text_layer.addChild(tf);
				this._tfs.push(tf);
			}
			return tf;
		}
		
		public function Text( x:Number, y:Number, text:String,color:Number, align:String, fontSize:uint, bold:Boolean, background:Object, rotation:Number = 0, max_width:Number = 0 ):void{
			var myFormat:TextFormat = new TextFormat();
			myFormat.align = align;
			myFormat.font = "arial";
			myFormat.size = fontSize;
			myFormat.color = color;
			myFormat.bold = bold;
			
			var t:TextField =  getTf();
			if(max_width == 0){
				t.autoSize = flash.text.TextFieldAutoSize.CENTER;
			}else{
				t.width = max_width;
			}
			
			t.text = text;
			if(background != null){
				t.background = true;
				t.backgroundColor = background.color;
			}else{
				t.background = false;
			}
			t.setTextFormat(myFormat);
			t.x = x;
			t.y = y;
			if(rotation!=0)
				t.rotationZ = rotation;
		}
	}
}