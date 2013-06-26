NS.viewDocument.define('tree', {
	tagName: 'ul',
	className: 'tree root unselectable',
	attributes: {
		'tabindex': 0,
	},
	events: {
		'mouseover': function(e){
			var view = this.cast(e.target);

			// when light only occur on the name element
			if( view != this && this.hasClass('compact') && e.target != view.getDom('name') ){
				view = this;
			}

			if( view == this ){
				if( this.lighted ) this.lighted.unlight(e);
			}
			else{
				view.light(e);
			}
		},

		'mouseout': function(e){
			if( this.lighted ){
				// when the mouse go very fast out of the view mouseover event is'nt fired
				// on other view (event the parent view)
				// but we can check the relatedTarget to see if the mouse go out of all view
				var view = this.cast(e.relatedTarget);

				if( !this.contains(view) ){
					this.lighted.unlight(e);
				}
			}
		},

		mousedown: function(e){
			var view = this.cast(e);

			if( e.target.hasClass('tool') ){
				view.toggleState('expanded', e);
			}

			if( e.control ){
				view.toggleState('selected', e);
			}
			else if( e.shift ){
				this.selection.extend(view, e);
			}
			else{
				this.selection.removeAll(e);
				view.select(e);
			}

			this.selection.anchorNode = view;
			this.selection.focusNode = null;

			view.focus(e);
		},

		click: function(e){
			var view = this.cast(e);

			if( view == this ){
				this.selection.removeAll(e);
			}
			else{
				this.selection.collapse(view, e);
			}
		},

		dblclick: function(e){
			// le futur menu contextuel doit prendre le pas sur ce dblclick
			if( !e.target.hasClass('tool') ){
				this.cast(e).toggleState('expanded', e);
			}
		},

		keydown: function(e){
			if( e.control && e.key == 'a' ){
				this.selection.setRange(this.getVisibles(), e);
			}
		}
	},
	// listening own events
	listeners: {
		light: function(e){
			if( this.lighted ) this.lighted.unlight(e.args[0]);
			this.lighted = e.target;
		},

		unlight: function(e){
			this.lighted = null;
		},

		'expand': function(e){
			var view = e.target;
			if( !view.getChildrenElement() ) view.renderChildren();
		},

		'focus': function(e){
			if( this.focused ) this.focused.blur(e);
			this.focused = e.target;
		},

		'blur': function(e){
			this.focused = null;
		},

		'select': function(e){
			this.selection.removeAll(e);
			this.selection.range.push(e.target);
		},

		'unselect': function(e){
			this.selection.range.remove(e.target);
		},

		destroy: function(e){
			if( e.target.hasClass('lighted') ) e.target.unlight(e);
			if( e.target.hasClass('focused') ) e.target.blur(e);
			if( e.target.hasClass('selected') ) e.target.unselect(e);
		},

		'insertElement': function(e){
			var view = e.target, padding;

			this.changeVisibility(e.target, false);

			if( view != this ){
				padding = this.padding * this.getLevel(view);
				view.getDom('div').style.paddingLeft = padding + 'px';

				/*
				temporairement placé ici
				en gros une vue est vide lors de sa création, this.firstChild = null
				donc on test ici pour le moment
				*/
				if( !view.hasChildNodes() ){
					view.addClass('empty');
				}
			}
		},

		'removeElement': function(e){
			this.changeVisibility(e.target, true);
		},

		'hide': function(e){
			this.changeVisibility(e.target, true);
		},

		'show': function(e){
			this.changeVisibility(e.target, false);
		}
	},
	lighted: null,
	focused: null,
	selection: null,
	padding: 18,

	constructor: function(){
		NS.View.constructor.apply(this, arguments);

		this.listener = NS.Listener.new(this, this.listeners, this);
		this.listener.listen();

		this.selection = NS.Selection.new(this);
	},

	getChildrenElement: function(){
		return this.element;
	},

	isVisible: function(view){
		return !view.hasClass('hidden');
	},

	changeVisibility: function(view, hidden){
		var prev, next, parent = view.parentNode;

		if( parent ){
			prev = view.getPreviousSibling(this.isVisible);
			next = view.getNextSibling(this.isVisible);

			if( prev && !next ) prev.toggleClass('last', hidden);
			else if( next && !prev ) next.toggleClass('first', hidden);
			view.toggleClass('first', Boolean(prev) == Boolean(hidden));
			view.toggleClass('last', Boolean(next) == Boolean(hidden));

			// ajout d'un enfant visible
			if( !hidden ) parent.removeClass('empty');
			// suppression du dernier enfant visible
			else if( !prev && !next ) parent.addClass('empty');
		}
	},

	getLevel: function(view){
		var level = -1;

		while(view != this.view){
			level++;
			view = view.parentNode;
		}

		return level;
	}
});

NS.Selection = {
	node: null,
	anchorNode: null,
	focusNode: null,
	range: null,

	constructor: function(node, single){
		this.node = node;
		this.range = [];
	},

	filterNode: function(node){
		return node.isVisible();
	},

	removeAll: function(e){
		if( NS.Event.isPrototypeOf(e) ) e = e.args[0];

		// n'unselect pas si control ou shift appuyé
		// ou mousemove (compat avec selectionRectangle)
		if( e && (e.control || e.shift) ) return;

		var range = this.range, i = range.length;
		while(i--) range[0].unselect(e);
	},

	collapse: function(node, e){
		if( node.hasClass('selected') ){
			this.range.remove(node);
			this.removeAll(e);
			this.range.push(node);
		}
		else{
			this.removeAll(e);
		}
	},

	// extend the selection to node
	extend: function(node, e){
		if( !this.anchorNode ) this.anchorNode = this.node.getFirstNode(this.filterNode);
		this.focusNode = node;
		this.setRange(this.getRange(), e);
	},

	contains: function(node){
		return this.range.contains(node);
	},

	addRange: function(range, e){
		range.forEach(function(view){
			view.select(e);
		});
	},

	removeRange: function(range, e){
		range.forEach(function(view){
			view.unselect(e);
		});
	},

	setRange: function(range, e){
		// get selecteds view not in range
		var unselectList = this.range.diff(range);

		// unselect view not in the range
		this.removeRange(unselectList, e);
		// select view in the range
		this.addRange(range, e);
	},

	getRange: function(){
		var from = this.anchorNode, to = this.focusNode, range = [];

		if( !from ) return range;
		if( !to ) return range;
		if( from == to ) return range;

		// respect order
		if( from.compareDocumentPosition(to) & NS.NodeInterface.PRECEDING ){
			from = this.focusNode;
			to = this.anchorNode;
		}

		range.push(from);
		// get valid nodes between from and to
		while(from = from.getNextNode(this.filterNode)){
			if( from === to ) break;
			range.push(from);
		}
		range.push(to);

		return range;
	}
};
