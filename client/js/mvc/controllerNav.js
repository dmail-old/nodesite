/* global viewDocument, Controller, View */

var ControllerNav = new Class({
	Extends: Controller,
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
	loop: false,

	handlers: {
		'view:expand': function(e){
			var view = View(e);
			//if( this.view.element.hasFocus() ) view.scrollTo('ul');
		},

		'view:contract': function(e){
			var view = View(e);

			//if( this.view.element.hasFocus() ) view.scrollTo('ul');
		},

		'view:focus': function(e){
			var view = View(e), current = this.activeView;
			this.activeView = view;
			if( current && current != view ) current.blur(e);
		},

		'view:blur': function(e){
			if( !this.activeView ){
				var view = View(e);
				// blur d'un noeud sans qu'aucun autre ne prenne se place
				this.activeView = view.getSibling() || this.parentNode || this.view.root;
			}
		},

		'mousedown': function(e){
			var view = View(e);

			if( view && view.focus ){
				view.focus(e);
			}
		}
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
		if( !view.hasState('expanded') && !view.element.hasClass('empty') ){
			view.expand(e);
		}
		else{
			return this.go(view.getChild(viewDocument.isTargetable), e);
		}
		return false;
	},

	goUp: function(view, e){
		var list = this.getList(), index = list.indexOf(view);
		return this.goTo(list.find(viewDocument.isTargetable, 'left', index, this.loop), e);
	},

	goDown: function(view, e){
		var list = this.getList(), index = list.indexOf(view);
		return this.goTo(list.find(viewDocument.isTargetable, 'right', index, this.loop), e);
	},

	goPageUp: function(view, e){
		var list = this.getList(), index = list.indexOf(view), count = this.getPageCount(view.element), from = Math.max(index - count, 0) - 1;
		return this.go(list.find(viewDocument.isTargetable, 'right', from, index), e);
	},

	goPageDown: function(view, e){
		var list = this.getList(), index = list.indexOf(view), count = this.getPageCount(view.element), from = Math.min(index + count, list.length - 1 ) + 1;
		return this.go(list.find(viewDocument.isTargetable, 'left', from, index), e);
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
		if( view ) this.naviguate(view, e);
	},

	naviguate: function(view, e){
		view.emit('naviguate', e);
		view.focus(e);
		if( !e.control ) view.select(e);
	},

	keydown: function(e){
		if( e.key == 'enter' ){
			this.activeView.active(e);
		}
		else{
			var methodName = this.keyMethodNames[e.key];

			if( methodName ){
				if( !this.activeView ){
					return this.go(this.root, e);
				}
				else{
					return this[methodName].call(this, this.activeView, e);
				}
			}
			else if( !e.control && (typeof e.key == 'number' || e.key.match(/^[a-zA-Z]$/)) ){
				return this.goNextLetter(this.activeView || this.root, e.key, e);
			}
		}
	}
});

viewDocument.isTargetable = function(view){
	return !view.hasState('disabled');
};
