/*
equivalent to node process
*/

(function(ua){

	var browser = NS.browser = {};
	var UA = ua.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/) || [null, 'unknown', 0];
	var name = UA[1] == 'version' ? UA[3] : UA[1];
	var version;
	
	// version
	if( UA[1] == 'ie' && document.documentMode ) version = true;
	else if( UA[1] == 'opera' && UA[4] ) version = parseFloat(UA[4]);
	else version = parseFloat(UA[2]);

	browser.version = version;
	browser.name = name;
	browser[name] = true;
	browser[name + parseInt(version, 10)] = true;

	browser.features = {
		xpath: Boolean(document.evaluate),
		air: Boolean(window.runtime),
		query: Boolean(document.querySelector),
		json: Boolean(window.JSON)
	};

	browser.exec = function(text){
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

})(navigator.userAgent.toLowerCase());
