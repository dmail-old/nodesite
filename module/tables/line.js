/*
Line is an line in a Table.

byte: number of the bute where the line starts in the file
data: the line as a string
item: the line string as a JavaScript Object

TODO:

gestion des erreurs lorsque data ne peut être parse ou que item ne peut être stringify

*/

var Line = {
	byte: 0,
	data: '',
	item: null,	

	create: function(byte, data){
		this.byte = byte;
		if( arguments.length > 1 ){
			this.setData(data);
		}
	},

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

	parse: function(data){
		var item = null;

		if( data.length ){
			try{
				item = JSON.parse(data);/*, function(key, value){
					if( key == 'byte' || key == 'index' || key == 'data' ) return this.error('les propriétés index, byte et data sont réservé à la BDD');
				}.bind(this));*/
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
};

module.exports = Line;
