/* global Module */

// require call are not async (dont worry)
//Module.prototype.async = false;
// Module are encoded as specified in config
//Module.prototype.charset = 'utf8';//config.encoding;

Module.prototype.getPath = function(){
	return root + '/js' + '/' + this.id + '.' + 'js';
};

Module.prototype.getModuleScriptElement = function(){
	var scripts = document.scripts;
	var i = 0, j = scripts.length;
	var script;

	for(;i<j;i++){
		script = scripts[i];
		if( script.hasAttribute('data-module') && script.getAttribute('data-module') == this.id ){
			return script;
		}
	}

	return null;
};

// define specific Module.load
Module.prototype.load = function(){
	var element = document.createElement('script'), script;

	element.type = 'text/javascript';
	//element.charset = this.charset;

	script = this.getModuleScriptElement();

	if( script ){
		var code = script.innerHTML;
		code = code.substring(2, code.length - 2);

		element.setAttribute('data-module', this.id);
		element.text = document.createTextNode(code).data;

		script.parentNode.replaceChild(element, script);

		this.onload();
	}
	else{
		element.async = true; //this.async;
		element.onerror = this.onerror.bind(this);
		element.onload = this.onload.bind(this);
		element.src = this.getPath();

		document.head.appendChild(element);
	}
};

//window.module = new Module(document.location.pathname);
