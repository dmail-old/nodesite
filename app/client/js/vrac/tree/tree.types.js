/*
---

name: plugin types

description: Donne des propriétés à un noeud selon son/ses types

require: proto

...
*/

Tree.definePlugin('types', {	
	require: 'proto',
	
	tree: {
		
	},
	
	node: {
		calcProto: function(){
			var proto = {}, type = this.properties.type || this.getDefault('type');
			
			this.type = type;
			if( type ) Object.append(proto, this.tree.getTypeProperties(type));
			
			return proto;
		}
	},
	
	events: {
		
	},
		
	init: function(){
		// pour calcProto
		if( this.hasPlugin('extension') ) throw new Error('types plugin must be set before extension plugin');
	}
});
