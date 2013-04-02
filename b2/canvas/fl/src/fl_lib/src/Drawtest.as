package
{
	import flash.display.Sprite;

	public class Drawtest extends Sprite
	{
		public function Drawtest()
		{
			var t = new B2Canvas();
			this.addChild(t);
			trace(new Date().time);
			for(var i=0; i<10000; i++){
				t.Rect( 0, 0, 1, 1, "ff0000", {} );
			};
			trace(new Date().time);
		}
	}
}