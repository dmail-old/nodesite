var exports = {};

exports.ua = navigator.userAgent.toLowerCase();
exports.plat = navigator.platform.toLowerCase();
exports.UA = exports.ua.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/) || [null, 'unknown', 0];

exports.name = exports.UA[1] == 'version' ? exports.UA[3] : exports.UA[1];

// version
if( exports.UA[1] == 'ie' && document.documentMode ) exports.version = true;
else if( exports.UA[1] == 'opera' && exports.UA[4] ) exports.version = parseFloat(exports.UA[4]);
else exports.version = parseFloat(exports.UA[2]);

// platform
if( exports.ua.match(/ip(?:ad|od|hone)/) ) exports.platform  = 'ios';
else exports.platform = (exports.ua.match(/(?:webos|android)/) || exports.plat.match(/mac|win|linux/) || ['other'])[0];

exports.features = {
	xpath: Boolean(document.evaluate),
	air: Boolean(window.runtime),
	query: Boolean(document.querySelector),
	json: Boolean(window.JSON)
};
exports[exports.name] = true;
exports[exports.name + parseInt(exports.version, 10)] = true;
exports[exports.platform] = true;

exports.exec = function(text){
	if( !text ) return text;
	if( window.execScript ) window.execScript(text);
	else{
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.text = text;
		document.head.appendChild(script);
		document.head.removeChild(script);
	}
	return text;
};

if( !window.setImmediate ){

	window.setImmediate = function(fn, args){
		return window.setTimeout(fn, 0, args);
	};
	window.clearImmediate = window.clearTimeout;

}

window.Browser = exports;
