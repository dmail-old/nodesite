NS.Shortcut = {
	map: null,
	handler: null,

	create: function(handler){
		this.map = {};
		this.handler = handler;
	},

	set: function(shortcut, bind){
		this.map[shortcut] = bind;
	},

	unset: function(shortcut){
		delete this.map[shortcut];
	},

	match: function(shortcut, e){
		var parts = shortcut.split('+'), i = parts.length, part;

		while(i--){
			part = parts[i];

			if( part == e.key ){
				continue;
			}
			if( part == 'alt' ){
				if( e.alt ) continue;
				return false;
			}
			if( part == 'ctrl' ){
				if( e.control ) continue;
				return false;
			}
			if( part == 'shift' ){
				if( e.shift ) continue;
				return false;
			}
		}

		return false;
	},

	find: function(e){
		var shortcut, shortcuts = this.map;

		for(shortcut in shortcuts){
			if( this.match(shortcut, e) ){
				return shortcuts[shortcut];
			}
		}

		return null;
	},

	active: function(e){
		var node = this.find(e);

		if( node ){
			this.handler(node, e);
			return true;
		}
		return false;
	}
};