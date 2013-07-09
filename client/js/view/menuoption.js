NS.viewDocument.define('menuoption', NS.viewDocument.require('node').extend({
	template: '\
		<li class="node">\
			<div>\
				<img class="img" alt="" src="{img}" />\
				<span class="name">{name}</span>\
				<span class="key">{key}</span>\
				<ins class="tool"></ins>\
			</div>\
		</li>\
	',
	imageSrc: root + '/img/tree/',
	types: {
		radio: {
			img: 'menuradio.png',
			'class': 'radio'
		},
		checkbox: {
			img: 'menucheckbox.png',
			'class': 'checkbox'
		}
	},
	getters: {
		img: function(type, img){
			if( img ){
				return this.imageSrc + img;
			}

			if( type ){
				return this.imageSrc + this.types[type].img;
			}

			return Image.EMPTY;
		},

		name: function(name){
			if( name && name in lang.menu ){
				return lang.menu[name];
			}

			return name;
		},

		key: function(key){
			if( key && 'key_' + key in lang ){
				return lang['key_' + key];
			}

			return key;
		}
	}
}));
