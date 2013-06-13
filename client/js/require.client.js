/* global Module */

// require call are async
require.prototype.async = true;
// script are encoded as specified in config
require.prototype.charset = 'utf8';//config.encoding;
require.prototype.root = root + '/js';

// define specific Module.load
require.Module.prototype.load = function(){
	var element = document.createElement('script');

	element.type = 'text/javascript';
	element.charset = this.require.charset;
	element.async = this.require.async;
	element.onerror = this.onerror.bind(this);
	element.onload = this.onload.bind(this);

	document.head.appendChild(element);

	element.src = this.id;
};

require.CSSModule = function CSSModule(){ return Module.apply(this, arguments); };
require.CSSModule.prototype = Object.create(Module.prototype);

// css are loaded that way
require.CSSModule.prototype.load = function(){
	var element = document.createElement('link');

	element.type = 'text/css';
	element.rel = 'stylesheet';
	element.onerror = this.onerror.bind(this);
	element.onload = this.onload.bind(this);

	document.head.appendChild(element);

	element.href = this.id;
};

// require.css('filea', 'fileb') to load CSS :)
require.css = require.extend({
	Module: require.CSSModule,
	cache: {}, // split require.css cache from require.cache
	root: root + '/css',
	extension: 'css'
});

// require.js('filea', 'fileb') to load js sync
require.js = require.extend({
	cache: {}, // split require.js cache from require.cache
	async: false
});
