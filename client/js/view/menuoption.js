NS.viewDocument.define('menuoption', NS.viewDocument.require('node').extend({
	// FIX: le navigateur cherche à charger {img} et ne trouve pas forcément
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
	imageSrc: './img/tree/',
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
			if( 'langName' in this ) name = this.langName;
			else{
				//name = NodeView.prototype.calcHTMLName.call(this, name);
				if( name in lang.menu ) name = lang.menu[name];
			}

			return name;
		},

		key: function(key){
			if( !key ) key = '';
			else if( 'key_' + key in lang ) key = lang['key_' + key];

			return key;
		}
	}
}));
