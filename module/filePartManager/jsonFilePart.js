/*

FilePart in JSON format

item: the part as a JavaScript Object

*/

var FilePart = require('./filePart.js');

var JSONFilePart = FilePart.extend({
	item: null,
	JSONError: null,

	setBuffer: function(buffer){
		this.JSONError = null;

		if( typeof buffer == 'string' ){
			try{
				this.item = this.parse(buffer);
			}
			catch(e){
				this.JSONError = e;
			}
		}
		else if( typeof buffer == 'object' ){
			this.item = buffer;

			try{
				buffer = this.stringify(buffer);
			}
			catch(e){
				this.JSONError = e;
			}
		}

		return FilePart.setBuffer.apply(this, arguments);
	},

	empty: function(){
		this.item = JSONFilePart.item;
		return FilePart.empty.call(this);
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