/*
---

name: keyshortcut

description: Le propriété key d'un noeud correspond à un raccourci clavier acivant ce noeud (utile pour menu et le futur plugin toolbar)

...
*/

var Keyboard = new Class({
	initialize: function(){
		this.listeners = {};
	},
	
	match: function(key, e){
		key = key.split('+');
		var i = key.length;
		while(i--){
			switch(key[i]){
				case e.key: 								break;
				case 'alt': if( !e.alt ) return false;		break;
				case 'ctrl': if( !e.control ) return false;	break;
				case 'shift': if( !e.shift ) return false;	break;
				default: return false;						break;
			}
		}
		return true;
	},
	
	firstMatch: function(e){		
		var listeners = this.listeners, key;
		for(key in listeners){
			if( this.match(key, e) ){
				return listeners[key];
			}
		}
		return null;
	},
	
	addListener: function(key, fn){
		this.listeners[key] = fn;
	},
	
	removeListener: function(key){
		delete this.listeners[key];
	},
	
	active: function(e, bind){
		var fn = this.firstMatch(e);
		if( fn ){
			if( e.preventDefault ) e.preventDefault();
			fn.call(bind, e);
			return true;
		}
		return false;
	}
});

Keyboard.prototype.on = Keyboard.prototype.addListener;

Tree.definePlugin('keyshortcut', {
	events: {
		'change:key': function(node, key){
			if( key ) node.setKey(key);
			else node.removeKey();
		},
		
		enter: function(node){
			if( node.has('key') ) node.setKey(node.get('key'));
		},
		
		leave: function(node){
			node.removeKey();
		}
	},
	
	node: {
		setKey: function(key){
			this.tree.keyboard.on(key, this.active.bind(this));
		},
		
		removeKey: function(){
			if( this.hasProperty('key') ) this.tree.keyboard.removeListener(this.getProperty('key')); 
		}
	}
});