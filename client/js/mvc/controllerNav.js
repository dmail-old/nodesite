/* global Controller, NodeView */

var ControllerNav = new Class({
	Extends: Controller,
	events: {
		'keydown': function(view, e){
			if( e.control && e.key == 'a' ){
				this.getList().forEach(function(view){ view.select(e); });
			}
			else{
				if( e.key == 'enter' ){
					this.getActiveView().active(e);
				}
				else{
					var methodName = this.keyMethodNames[e.key];

					if( methodName ){
						if( !this.getActiveView() ){
							return this.go(this.root, e);
						}
						else{
							return this[methodName].call(this, this.getActiveView(), e);
						}
					}
					else if( !e.control && (typeof e.key == 'number' || e.key.match(/^[a-zA-Z]$/)) ){
						return this.goNextLetter(this.getActiveView() || this.root, e.key, e);
					}
				}
			}
		}
	},
	loop: false,
	keyMethodNames: {
		'left': 'goLeft',
		'up': 'goUp',
		'right': 'goRight',
		'down': 'goDown',
		'pageup': 'goPageUp',
		'pagedown': 'goPageDow',
		'home': 'goFirst',
		'end': 'goLast'
	},

	getActiveView: function(){
		return this.view.focused;
	},

	getlist: function(){
		return this.view.visibles;
	},

	/* methods concerning visibles list	*/
	isRoot: function(element){
		return this.view.element == element;
	},

	getPageCount: function(element){
		var total = element.offsetParent.clientHeight;
		var count = parseInt(total / this.view.getLine(element), 10) - 1;

		return count;
	},

	matchLetter: function(view, letter){
		var name = view.getDom('name');
		return name && name.innerHTML.startsWith(letter);
	},

	goLeft: function(view, e){
		if( view.hasState('expanded') ){
			view.contract(e);
		}
		else{
			return this.go(view.parentNode, e);
		}

		return false;
	},

	goRight: function(view, e){
		if( !view.hasState('expanded') && !view.hasClass('empty') ){
			view.expand(e);
		}
		else{
			return this.go(view.getChild(NodeView.isTargetable), e);
		}
		return false;
	},

	goUp: function(view, e){
		var list = this.getList(), index = list.indexOf(view);
		return this.goTo(list.find(NodeView.isTargetable, 'left', index, this.loop), e);
	},

	goDown: function(view, e){
		var list = this.getList(), index = list.indexOf(view);
		return this.goTo(list.find(NodeView.isTargetable, 'right', index, this.loop), e);
	},

	goPageUp: function(view, e){
		var list = this.getList(), index = list.indexOf(view), count = this.getPageCount(view.element), from = Math.max(index - count, 0) - 1;
		return this.go(list.find(NodeView.isTargetable, 'right', from, index), e);
	},

	goPageDown: function(view, e){
		var list = this.getList(), index = list.indexOf(view), count = this.getPageCount(view.element), from = Math.min(index + count, list.length - 1 ) + 1;
		return this.go(list.find(NodeView.isTargetable, 'left', from, index), e);
	},

	goFirst: function(view, e){
		return this.go(this.getList()[0], e);
	},

	goLast: function(view, e){
		return this.go(this.getList()[this.getList().length - 1], e);
	},

	goNextLetter: function(view, letter, e){
		var list = this.getList(), index = list.indexOf(view);
		return this.goTo(list.find(this.matchLetter, 'right', index, true), e);
	},

	go: function(view, e){
		if( view ){
			view.focus(e);
			if( !e.control ) view.select(e);
			if( e.type == 'keydown' ) e.preventDefault();
		}
	}
});

NodeView.isTargetable = function(view){
	return !view.hasState('disabled');
};

Controller.register('nav', ControllerNav);
