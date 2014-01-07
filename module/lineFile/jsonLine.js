/*

Line in JSON format

item: the line as a JavaScript Object

TODO:

gestion des erreurs lorsque data ne peut être parse ou que item ne peut être stringify

*/

var Line = require('./line.js');

var JSONLine = Line.extend({
	item: null,

	setData: function(data){
		if( typeof data == 'string' ){
			this.data = data;
			this.item = this.parse(data) || {};
		}
		else if( typeof data == 'object' ){
			this.data = this.parse(data) || '';
			this.item = data;
		}		
	},

	empty: function(){
		Line.empty.call(this);
		this.item = {};
	},

	parse: function(data){
		var item = null;

		if( data.length ){
			try{
				item = JSON.parse(data);

				/*
				item = JSON.parse(data, , function(key, value){
					if( key == 'byte' || key == 'index' || key == 'data' ){
						return this.error('les propriétés index, byte et data sont réservé à la BDD');
					}
				}.bind(this));
				*/
			}
			catch(e){
				this.warn('ligne ' + this.length + ' malformée' + data);
				this.error(e);
			}
		}

		return item;
	},

	stringify: function(item){
		var data = '';

		try{
			data = JSON.stringify(item, function(key, value){
				if( key == 'line' ) return undefined;
				return value;
			});
		}
		catch(e){
			this.warn('objet ne pouvant pas être convertit en chaine');
		}

		return data;
	}
});