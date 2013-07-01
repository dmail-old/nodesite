NS.viewDocument.define('node', NS.viewDocument.require('node').extend({
	innerHTML: '\
		<div>\
			<img class="img" alt="" src="{img}" />\
			<span class="name">{name}</span>\
			<span class="key">{key}</span>\
			<ins class="tool"></ins>\
		</div>\
	',

	htmlName: function(name){
		if( 'langName' in this ) name = this.langName;
		else{
			//name = NodeView.prototype.calcHTMLName.call(this, name);
			if( name in lang.menu ) name = lang.menu[name];
		}
		return name;
	},

	htmlKey: function(key){
		if( !key ) key = '';
		else if( 'key_' + key in lang ) key = lang['key_' + key];
		return key;
	}
}));
