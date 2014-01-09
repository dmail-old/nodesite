/*

FilePart in JSON format

item: the part as a JavaScript Object

TODO:

gestion des erreurs lorsque data ne peut être parse ou que item ne peut être stringify
pour la gestion du json a priori on gèreras pas ça ici c'est JSONFile qui attendras forcément un object js
qu'on parseras

*/

var FilePart = require('./filePart.js');

var JSONFilePart = FilePart.extend({
	item: null,
	JSONerror: null,

	setData: function(data){
		this.JSONerror = null;

		if( typeof data == 'string' ){
			this.data = data;
			
			try{
				this.item = this.parse(data);
			}
			catch(e){
				this.JSONerror = e;
			}
		}
		else if( typeof data == 'object' ){
			this.item = data;

			try{
				this.data = this.parse(data);
			}
			catch(e){
				this.JSONerror = e;
			}
		}
	},

	empty: function(){
		FilePart.empty.call(this);
		this.item = null;
	},

	parse: function(data){
		var item = null;

		if( data.length ){
			item = JSON.parse(data);

			/*
			item = JSON.parse(data, , function(key, value){
				if( key == 'byte' || key == 'index' || key == 'data' ){
					return this.error('les propriétés index, byte et data sont réservé à la BDD');
				}
			}.bind(this));
			*/
		}

		return item;
	},

	stringify: function(item){
		var data = '';

		/*
		data = JSON.stringify(item, function(key, value){
			if( key == 'line' ) return undefined;
			return value;
		});
		*/

		data = JSON.stringify(item);

		return data;
	}
});