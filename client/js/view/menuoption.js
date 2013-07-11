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
		/*

		NOTE: on déclare que img dépend de type et img, en réalité:
		- img dépend aussi de this.imageSrc & this.types
		- name dépend de lang.menu
		- key dépend de lang['key_' + key]

		faudrait normalement prévoir ces dépendances
		si je change la lang de 'fr' vers 'en' ce serais cool que tout s'update seul

		*/

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
