/*
---

name: History

description: History Management via popstate or hashchange.

authors: Christoph Pojer (@cpojer)

license: MIT-style license.

requires: [Core/Events, Core/Element.Event, Class-Extras/Class.Binds]

provides: History

...
*/

(function(){

function cleanURL(url){
	if( url.match(/^https?:\/\//) ) url = '/' + url.split('/').slice(3).join('/');
	return url;
}

var location = window.location, base = cleanURL(location.href);

var History = this.History = {
	back: function(){
		history.back();
	},

	forward: function(){
		history.forward();
	},
	
	onChange: function(){
		this.applyListeners('change', arguments);
	},
	
	push: function(url, title, state){
		url = cleanURL(url);
		if( base && base != url ) base = null;
		history.pushState(state || null, title || null, url);
		this.onChange(url, state);
	},

	replace: function(url, title, state){
		history.replaceState(state || null, title || null, cleanURL(url));
	},
	
	pop: function(e){
		var url = cleanURL(location.href);
		if (url == base){
			base = null;
			return;
		}
		this.onChange(url, e.state);
		this.emit('popstate', e);
	},
	
	getPath: function(){
		return cleanURL(location.href);
	}
};

Object.append(History, Emitter);
Element.NativeEvents.popstate = 1;
window.addListener('popstate', History.pop.bind(History));

})();