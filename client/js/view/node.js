NS.viewDocument.define('node', NS.View.extend({
	template: '\
		<li class="node">\
			<div>\
				<ins class="tool"></ins>\
				<span class="name">{name}</span>\
			</div>\
		</li>\
	',
	states: {
		lighted: ['light', 'unlight'],
		selected: ['select', 'unselect'],
		expanded: ['expand', 'contract'],
		focused: ['focus', 'blur'],
		hidden: ['hide', 'show'],
		actived: ['active', 'unactive']
	},

	hasState: NS.View.hasClass,

	addState: function(state, e){
		if( !this.hasState(state) ){
			this.addClass(state);
			this.emit(this.states[state][0], e);
		}
		return this;
	},

	removeState: function(state, e){
		if( this.hasState(state) ){
			this.removeClass(state);
			this.emit(this.states[state][1], e);
		}
	},

	toggleState: function(state, e, force){
		if( typeof force == 'undefined' ) force = !this.hasState(state);
		return force ? this.addState(state, e) : this.removeState(state, e);
	},

	isVisible: function(){
		var parent = this;

		if( this.hasState('hidden') ) return false;

		while(parent = parent.parentNode){
			if( parent == null || parent.parentNode == null ) return true;
			if( parent.hasState('hidden') || !parent.hasState('expanded') ) return false;
		}

		return true;
	},

	getChildrenElement: function(){
		return this.getDom('ul');
	},

	scrollTo: function(element){
		element = element || this.element;

		element.keepIntoView();

		return this;
	},

	getDom: function(what){
		var dom;

		switch(what){
		case 'li':
			return this.element;
		case 'ul':
		case 'div':
			dom = this.getDom('li');
			return dom ? dom.getFirstChild(what) : null;
		case 'name':
			dom = this.getDom('div');
			return dom ? dom.getFirstChild('span') : null;
		default:
			dom = this.getDom('div');
			return dom ? dom.getFirstChild(what) : null;
		}
	}
}));

(function(node){

	Object.eachPair(node.states, function(state, methods){
		var on = methods[0], off = methods[1];

		node[on] = function(e){ return this.addState(state, e); };
		node[off] = function(e){ return this.removeState(state, e); };
	});

})(NS.viewDocument.require('node'));
