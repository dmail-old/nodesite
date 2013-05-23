var Plugin = new Class({
	plugins: [],
	impacts: [],
	
	initialize: function(item){
		item.plugins: {},
		item.definePlugin = function(name, plugin){
			if( typeof plugin.require == 'string' ) plugin.require = plugin.require.split(',');
			this.plugins[name] = plugin;
		};
		
		item.implement({
			plugin: this,
			before: function(){
				
			},
			after: function(){
				
			}
		});
		
		item.prototype.plugin = this;
	},
	
	has: function(name){
		return this.plugins.contains(name);
	},
	
	get: function(name){
		return this.constructor.plugins[name];
	},
	
	add: function(name){
		if( this.has(name) ) return this;
		var plugin = this.get(name);
		if( !plugin ) console.warn('Le plugin '+name+' existe pas');
		
		var require = plugin.require, i, j, impacts = this.impacts;
		
		if( require ){
			i = 0;
			j = require.length;
			for(;i<j;i++){
				if( require[i] ) this.add(require[i]);
			}
		}
		this.plugins.push(name);
		
		i = 0;
		j = impacts.length;
		for(;i<j;i++) impacts[i].call(this, plugin);
		
		var impact;
		if( impact = plugin.impact ) this.impacts.push(impact);
		
		// if( options = plugin.options ) Object.append(this.options, options);
		// if( extend = plugin.tree ) Object.append(this, extend);
		// if( init = plugin.init ) init.apply(this, Array.slice(arguments, 1));
		// if( node = plugin.node ) Object.append(this.nodemethods, node);
		// if( nodeinit = plugin.nodeinit ) this.nodeinits.push(nodeinit);
	}
};