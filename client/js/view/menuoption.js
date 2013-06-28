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
	},

	drawKey: function(key){
		var dom = this.getDom('key');
		if( dom ) dom.innerHTML = this.calcHTMLKey(value);
	},

	drawSep: function(value){
		this.toggleClass('sep', value);
	},

	naviguate: function(e){
		if( e && e.type == 'keydown' && e.key == 'left' ){
			if( this.isRoot ) return;
			this.contract(e);
		}

		this.focus(e);
		this.light(e);
	},

	active: function(e){
		if( !this.tree.opened ) this.reset();
		if( this.hasState('actived') && this.type == 'checkbox' ) return this.unactive(e);
		return this.demandAction('active', arguments);
	},

	setTimeout: function(action, args){
		if( action != this.timerAction ){
			this.clearTimeout();

			// permet d'éviter si node.expanded == undefined d'appeler node.contract
			//if( (action == 'expand' ? this.expanded : !this.expanded) ) return node;
			if( this.checkAction(action, args) ){
				this.timerAction = action;
				this.timer = setTimeout(
					function(){
						this.clearTimeout();
						this.demandAction.apply(this, arguments);
					}.bind(this, action, args),
					this.tree.options[action + 'Delay']
				);
			}
		}

		return this;
	},

	clearTimeout: function(){
		if( this.timer ){
			clearTimeout(this.timer);
			delete this.timer;
			delete this.timerAction;
		}

		return this;
	}
}));
