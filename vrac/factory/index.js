var proto = require('proto');
require('array/prototype/every');
require('array/prototype/findIndex');

var Factory = proto.extend({
	product: null,
	plugins: null,
	pluginEffects: {},

	constructor: function(product, plugins){
		this.product = product;
		this.plugins = [];

		if( plugins ){
			var i = 0, j = plugins.length;
			for(;i<j;i++){
				this.addPlugin(plugins[i]);
			}
		}

		return this.createProduct();
	},

	createProduct: function(){
		var product = proto.extend.call(this.product, {
			factory: this,
			constructor: this.productConstructor
		});

		this.plugins.forEach(function(plugin){
			for(var key in this.pluginEffects){
				if( plugin.hasOwnProperty(key) ){
					this.pluginEffects[key].call(this, product, plugin[key]);
				}
			}
		}, this);

		return product;
	},

	productConstructor: function(){
		var args = arguments, factory = this.factory;

		factory.plugins.forEach(function(plugin){
			if( plugin.hasOwnProperty('constructor') ){
				plugin.constructor.apply(this, args);
			}
		}, this);

		return factory.product.constructor.apply(this, arguments);
	},

	hasPlugin: function(name){
		this.pluginIndex = this.plugins.findIndex(function(plugin){ return plugin.name == name; });
		return this.pluginIndex !== -1;
	},

	getPlugin: function(name){
		return this.hasPlugin(name) ? this.plugins[this.pluginIndex] : null;
	},

	hasPlugins: function(plugins){
		return plugins.every(this.hasPlugin, this);
	},

	addPlugin: function(plugin){
		if( Object(plugin) != plugin ){
			throw new TypeError('plugin must be an object');
		}
		if( plugin.dependencies && !this.hasPlugins(plugin.dependencies) ){
			throw new Error('missing request plugin');
		}
		if( this.hasPlugin(plugin.name) ){
			return;
		}

		this.plugins.push(plugin);
	},

	removePlugin: function(name){
		if( this.hasPlugin(name) ){
			this.plugins.splice(this.pluginIndex, 1);
		}
	}
});

module.exports = Factory;