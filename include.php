<?php
    
	function clear_all($dir) {
		  $dh=opendir($dir);
		  while ($file=readdir($dh)) {
		    if($file!="." && $file!="..") {
		      $fullpath=$dir."/".$file;
		      if(!is_dir($fullpath)) {
		          unlink($fullpath);
		      }
		    }
		  }
		  closedir($dh);
	}

	// first param: encoding (0:None, 10:Numeric, 62:Normal, 95: High ASCII)
	define('ENCODE_NUM', 62);
	define("WITH_B2",true);
	define("WITH_CHARTS",true);

	/**
	 * pack plugins js
	 */
	function packPlugin($plugins){
		$str = "";
		foreach ($plugins as $name) {
			$home_dir = dirname(__FILE__) . "/" . $name;
			if (is_dir($home_dir)) {
				$home = dir($home_dir);
				while ($file = $home->read()) {
					if ($file != '.' && $file != '..') {
						if (preg_match("/^(.*)\.js$/", $file, $matches)) {
								$path = "$home_dir/$file";
	                            $f = fopen($path ,'r');
								if(!$f)
									throw new Exception("script file not found:$file");
								$str .= fread($f,filesize($path));
								fclose($f);    
	                    }											}
				}
			}else{
				throw new Exception("can't find plugins dir");
			}
		}
		return $str;
	}


	function build($ver, $encode = true){
		$common = array(
					  "b2/b2.js",
					  "b2/b2.func.js",
					  "b2/b2.graphics.js",
					  "b2/b2.evt.js",
					  "b2/canvas/b2.canvas.js",
					  "b2/canvas/fl/swfobject.js",
					  "b2/canvas/html5/HTML5Canvas.js",
					  "b2/charts/b2.chart.js",
					  "b2/charts/comp/legend.js",
					  "b2/charts/comp/slider.js",
					  "idas_c.js"
					);
					
		$plugins = array("bar","line","pie","stack","bubble","sb","radar");
		///
		$dst = dirname(__FILE__) . "/cache";
		if(file_exists($dst)){
			clear_all($dst);
		} else {
			mkdir($dst);
		}
		/**
		 * models
		 */
		$str = "";
		foreach ($common as $file) {
			$path = dirname(__FILE__) . "/$file";
			$f = fopen($path,'r');
			if(!$f)
				throw new Exception("script file not found:$file");
			$str .= fread($f,filesize($path));
			fclose($f);
		}
		/// plugins
		$packed = $str . packPlugin($plugins);
		if($encode){
			require_once(dirname(__FILE__) . "/../lib/jspacker/JavaScriptPacker.class.php");
			$packer = new JavaScriptPacker($packed, ENCODE_NUM, true, false);
			$packed = $packer->pack();
		}
		$f = fopen($dst."/idas_$ver.js","w");
		fwrite($f,$packed);
		fclose($f);
	}

	//
	$ver = "1.0.0";
	$path = dirname(__FILE__) . "/cache/idas_$ver.js";
	//if(!file_exists($path)){
		build($ver,false);
	//};
	$f = fopen($path,'r');
	$content = fread($f,filesize($path));
	fclose($f);
	echo $content;
?>