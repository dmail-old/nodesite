/*
---

name: eventList

description: liste des évènements pour les relier au méthodes d'un objet

*/

var EventList = new Class({
	Extends: Array,
	
	initialize: function(){
		this.push.apply(this, arguments);
		return this;
	},
	
	add: function(){
		Array.prototype.forEach.call(arguments, function(name){
			if( Array.prototype.add.call(this, name) ){
				if( this.element ) this.addListener(name);
			}
		}, this);
		
		return this;
	},
	
	remove: function(){
		Array.prototype.forEach.call(arguments, function(name){
			if( Array.prototype.remove.call(this, name) ){
				if( this.element ) this.removeListener(name);
			}
		}, this);
		
		return this;
	},
	
	addListener: function(name){
		this.element.on(name, this.listener, this.capture);
		return this;
	},
	
	removeListener: function(name){
		this.element.off(name, this.listener, this.capture);
		return this;
	},
	
	attach: function(element, listener, capture){		
		if( this.element ) this.detach();
		
		this.element = element;
		this.listener = listener;
		this.capture = capture;
		
		this.forEach(this.addListener, this);
		return this;
	},
	
	detach: function(){
		if( this.element ){
			this.forEach(this.removeListener, this);
			delete this.element;
			delete this.listener;
		}		
		return this;
	}
});