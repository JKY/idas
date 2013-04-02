/**
 * Utils
 * @type 
 */
var ENCTAB = {
	' ' : 'ECH00',
	'!' : 'ECH01',
	'@' : 'ECH02',
	'#' : 'ECH03',
	'$' : 'ECH04',
	'%' : 'ECH05',
	'^' : 'ECH06',
	'&' : 'ECH07',
	'*' : 'ECH08',
	'(' : 'ECH09',
	')' : 'ECH10',
	//'-' : 'ECH11',
	'_' : 'ECH12',
	'+' : 'ECH13',
	'=' : 'ECH14',
	',' : 'ECH15',
	'<' : 'ECH16',
	'>' : 'ECH17',
	'.' : 'ECH18',
	'?' : 'ECH19',
	'/' : 'ECH20',
	':' : 'ECH21',
	';' : 'ECH22',
	'"' : 'ECH23',
	'\'' : 'ECH24',
	'[' : 'ECH25',
	']' : 'ECH26',
	'{' : 'ECH27',
	'}' : 'ECH28',
	'\\' : 'ECH29',
	'|' : 'ECH30',
	'~' : 'ECH31',
	'`' : 'ECH32',
	'\n' : 'ECH33'
};
var DECTAB = {
	'ECH00' : ' ',
	'ECH01' : '!',
	'ECH02' : '@',
	'ECH03' : '#',
	'ECH04' : '$',
	'ECH05' : '%',
	'ECH06' : '^',
	'ECH07' : '&',
	'ECH08' : '*',
	'ECH09' : '(',
	'ECH10' : ')',
	//'ECH11' : '-',
	'ECH12' : '_',
	'ECH13' : '+',
	'ECH14' : '=',
	'ECH15' : ',',
	'ECH16' : '<',
	'ECH17' : '>',
	'ECH18' : '.',
	'ECH19' : '?',
	'ECH20' : '/',
	'ECH21' : ':',
	'ECH22' : ';',
	'ECH23' : '"',
	'ECH24' : '\'',
	'ECH25' : '[',
	'ECH26' : ']',
	'ECH27' : '{',
	'ECH28' : '}',
	'ECH29' : '\\',
	'ECH30' : '|',
	'ECH31' : '~',
	'ECH32' : '`',
	'ECH33' : '\n'
};

function encode(str) {
	// str = $.trim(str);
	for (var c in ENCTAB) {
		// replace all
		while (str.indexOf(c) >= 0) {
			str = str.replace(c, this.ENCTAB[c]);
		};
	};
	return str;
};

function decode(str) {
	if (str == null) {
		return 'undefined';
	};
	// str = $.trim(str);
	for (var c in DECTAB) {
		str = str.replace(new RegExp(c, "gm"), this.DECTAB[c]);
	};
	return str;
};


function ds_val(args, dataset) {
	var num = 0;
	for (var i = 0; i < dataset.axes.length; i++) {
		var index = args[dataset.axes[i].name];
		var step = serialize_axes(dataset.axes, i + 1);
		num += step * index;
	};
	return dataset.data[num];
};

function serialize_axes(query_axes, start) {
	var n = 1;
	for (i = start; i < query_axes.length; i++) {
		n *= query_axes[i].members.length;
	};
	return n;
};


// encode axis name and memebers
function axis_enc(axis_name, members) {
	var enc_members = [];
	var enc_name = null;
	if (axis_name != null)
		enc_name = ch_enc(axis_name);
	if (members != null) {
		for (var i = 0; i < members.length; i++) {
			enc_members[i] = encode(members[i]);
		};
	};
	return {
		"name" : enc_name,
		"members" : enc_members
	};
};

function error(response) {
	if (response != null && typeof(response.error) != "undefined") {
		// this is a server response or error
		if (response.error == 0) {
			// this is a message
			// show the processing tip
			window.broadcaster.sendMessage(WM_POST_MESSAGE, {
						error : 0,
						message : response.message
					});
		} else {
			// a error
			window.broadcaster.sendMessage(WM_POST_MESSAGE, {
						error : 1,
						message : response.message
					});
		};
		return true;
	};
	// let others to handler this response
	return false;
};

function debug($s) {
	console.log($s);
};

/**
 * get user action depth
 */
function getUsageDepth() {
	var ur = get_cookie('__gp_');
	if (!is_empty(ur)) {
		return ur;
	};
	return 9999;
};

function setUsageDepth(step) {set_cookie("__gp_", step, 9999);};

function showtip(target,text,gravity,offset){
	if ($(target) != null) {
        $(target).attr("tip", text);
        $(target).tipsy({
                    trigger : 'manual',
                    gravity : gravity,
                    title : "tip",
                    offset : offset,
                    fade : true
                });
        $(target).tipsy("show");
    };
};

function cleartip(){
	$(".tipsy").css("display", "none");
};

String.prototype.trim = function() {
	return this.replace(/(^\s*)|(\s*$)/g, "");
};
// is str empty
function is_empty(str) {
	if (str == 'undefined' || str == 'null' || str == null || str.trim() == "") {
		return true;
	};
	return false;
};
// check browser
function is_browser_supported() {
	var ua = navigator.userAgent.toLowerCase(), isOpera = /opera/.test(ua), isChrome = /chrome/
			.test(ua), isSafari = !isChrome && /safari/.test(ua), isFirefox = /firefox/
			.test(ua), isIE = !isOpera && /msie/.test(ua), isIE9 = isIE
			&& /msie 9/.test(ua), isIE8 = isIE && /msie 8/.test(ua), isIE7 = isIE
			&& /msie 7/.test(ua),isIE10 = isIE && /msie 10/.test(ua);

	if (!isChrome && !isSafari && !isFirefox && !isIE9 && !isIE8 && !isIE7 && !isIE10) {
		return false;
	};
	return true;
};

function is_ie() {
	var ua = navigator.userAgent.toLowerCase(), isOpera = /opera/.test(ua), isIE = !isOpera
			&& /msie/.test(ua);

	return isIE;
};

function get_cookie(c_name) {
	if (document.cookie.length > 0) {
		var c_start = document.cookie.indexOf(c_name + "=");
		if (c_start != -1) {
			c_start = c_start + c_name.length + 1;
			c_end = document.cookie.indexOf(";", c_start);
			if (c_end == -1)
				c_end = document.cookie.length;
			return unescape(document.cookie.substring(c_start, c_end));
		};
	};
	return "";
};

function set_cookie(c_name, value, expire) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + expire);
	document.cookie = c_name + "=" + escape(value)
			+ ((expire == null) ? "" : ";expires=" + exdate.toGMTString())
			+ ";path=/";
};

function del_cookie(c_name, path, domain) {
	if (get_cookie(c_name))
		document.cookie = c_name + "=" + ((path) ? ";path=" + path : "")
				+ ((domain) ? ";domain=" + domain : "")
				+ ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
};

function ds_axis(name, dataset) {
	for (var i = 0; i < dataset.axes.length; i++) {
		if (dataset.axes[i].name == name) {
			return dataset.axes[i];
		};
	};
};
/**
 * show loading div
 * @param {} el : element, target element
 * @param {} text: string, loading text
 * @param {} mask: true or false, if mask the background
 * @param {} timeout int
 */
function loading_show(el, text, mask, timeout) {
	var background = document.createElement('div');
	var loadingEl = document.createElement('div');
	
	var offset = $(el).offset();
	var width = $(el).width();
	var height = $(el).height();
	if(!width || !height || width == 0 || height == 0) {
		throw new Error('width and height must be defined.');
	};
	
	// background style
	background.className = 'idas_loading_div';
	loadingEl.className = 'sprtldrtxt round shdw unselectable';
	$(el).append(background);
	$(background).append(loadingEl);
	$(loadingEl).html(text);
	
	var position = $(el).css('position');
	var left = offset.left;
	var top = offset.top;
	if(position && (position === 'relative')) {
		left = 0;
		top = 0;
	};
	
	$(background).css({
		width: width,
		height: height,
		left: left,
		top: top
	});
	
	var padding_top = 15, padding_left = 23;
	// center processbar
	var pwidth = $(loadingEl).width();
	var pheight = $(loadingEl).height(); 
	var pleft = (width-pwidth-padding_left)/2+left;
	var ptop = (height-pheight-padding_top)/2+top;
	$(loadingEl).css({
		left: pleft,
		top: ptop,
		padding: padding_top + 'px ' + padding_left +'px'
	});
	// if mask, set black for background
	if(mask) {
		$(background).css({
			background: 'black'
		});
	};
	// timeout
	if(timeout) {
		setTimeout(function() {
			loading_hide(el);
		}, timeout);
	};
};
/**
 * hide loading div
 * @param {} el
 * @param {} text
 */
function loading_hide(el, text) {
	var loading_el = $(el).find('.idas_loading_div');
	if(!loading_el || loading_el.length == 0) {
		return;
	};
	$(loading_el).remove();
};
/**
 * chart color array
 * @type 
 */
window.COLOR_ARRAY = ['27a5cf', 'cf2b27', '3fcf27', '8de894', '339999',
            'cfc527', '834e00', '6f6c6f', '669933', 'ff0000', 'ff9900',
            '9900cc', 'bbbbbb', '330033'];
function colors(i) {
	return COLOR_ARRAY[i%COLOR_ARRAY.length];
};

/**
*	validate file name
**/
function validate_fn(name){
	var reg = /^[^*/\\?:|<>\"]+$/g;
	return reg.test(name);
};

/**
*	validate function
**/
function validate_func(str){
	var reg = /([\s\S]*)\(([\s\S]*)\)/;
	return reg.test(str);
};