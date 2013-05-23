/* global ListenerHandler, EventHandler, View, NodeView, viewDocument */

/*

NOTE

le scroll auto lors de expand/contract cherche à garder visibles les éléments
mais ne tiens pas compte de la largeur qui est importante: celle du texte
il prend la largeur de l'élément, souvent 100% et scroll sans qu'on en ait besoin

si on met l'arbre en mode compact le ul peut si on met les lie en float left faire la largeur de son contenu
cependant on perds alors la possibilité de drop un fichier hors d'un li

TODO

- faire la balise select, certaines portions de codes sont communes et doivents être regroupées

*/

// this function should call fn on every element after fromNode without getting out of this Node
TreeCrosser.crossAllAfter = function(fromNode, fn){
	var current = fromNode, ret = false;
	
	function run(element){
		ret = fn(element);
		if( ret == true ) return ret;
		if( ret == 'continue' ) return;
		element.cross(function(afterNode){
			ret = fn(afterNode);
			return ret;
		}, null, true);
	}
		
	while(current && current != this && ret !== true){
		current.crossRight(run);
		current = current.parentNode;
	}
};

// pour cross before le problème c'est que je dois partir du noeud le plus profond et remonter
// et encore pas le plus profond mais le plus proche en terme de nextSibling
// hors actuellement je part du noeud et je descend
// voir avec lastchild
TreeCrosser.crossAllBefore = function(fromNode, fn){
	var current = fromNode, ret = false;
	
	function run(element){
		ret = fn(element);
		if( ret == true ) return ret;
		if( ret == 'continue' ) return;
		element.cross(function(afterNode){
			ret = fn(afterNode);
			return ret;
		}, null, true);
	}
		
	while(current && current != this && ret !== true){
		current.crossLeft(run);
		current = current.parentNode;
	}
};

Element.prototype.crossAllAfter = TreeCrosser.crossAllAfter;
NodeView.prototype.crossAllAfter = TreeCrosser.crossAllAfter;
Element.prototype.crossAllAfter = TreeCrosser.crossAllAfter;
NodeView.prototype.crossAllBefore = TreeCrosser.crossAllBefore;

var ViewController = new Class({
	Extends: EventHandler,

	initialize: function(view){
		EventHandler.prototype.initialize.call(this);

		this.view = view;
		Object.eachPair(this.handlers, function(name){ this.view.events[name] = this; }, this);
	}
});

// this controller exists to keep the first/last/empty class on nodeview
var CSSViewController = new Class({
	Extends: ViewController,
	// on pourrait écrire 'view:append': true
	// renommer changeVisibility en handleEvent, et handle tout direct dedans
	padding: 18,
	handlers: {
		'view:append': function(e){
			// when the background of the node take full width we have to set a padding manually here
			//if( this.view.element.hasClass('line') )
			View(e).getDom('div').style.paddingLeft = this.padding * View(e).getLevel() + 'px';
			this.changeVisibility(e, false);
		},

		'view:remove': function(e){
			this.changeVisibility(e, true);
		},

		'view:hide': function(e){
			this.changeVisibility(e, true);
		},

		'view:show': function(e){
			this.changeVisibility(e, false);
		}
	},

	isVisible: function(){
		return !this.element.hasClass('hidden');
	},
	
	// FIX: this function is also called for listView
	changeVisibility: function(e, hidden){
		var view = View(e), prev = view.getPrev(this.isVisible), next = view.getNext(this.isVisible);

		if( prev && !next ) prev.element.toggleClass('last', hidden);
		else if( next && !prev ) next.element.toggleClass('first', hidden);
		view.element.toggleClass('first', Boolean(prev) == Boolean(hidden));
		view.element.toggleClass('last', Boolean(next) == Boolean(hidden));

		if( this.view != view ){
			// ajout d'un enfant visible
			if( !hidden ) view.parentNode.element.removeClass('empty');
			// suppression du dernier enfant visible
			else if( !prev && !next ) view.parentNode.element.addClass('empty');
		}
	}
});

var NavViewController = new Class({
	Extends: ViewController,
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
				var view = View(e), element = view.element;
				// blur d'un noeud sans qu'aucun autre ne prenne se place
				this.activeView = View(element.getSibling() || element.parentNode.parentNode || this.view);
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

	isValid: function(element){
		return !element.hasClass('focused');
	},

	matchLetter: function(element, letter){
		if( !this.isValid(element) ) return false;
		var name = element.getNode('name');
		return name && name.innerHTML.startsWith(letter);
	},

	goLeft: function(view, e){
		if( view.hasState('expanded') ){
			view.contract(e);
		}
		else{
			return this.goTo(view.parentNode, e);
		}

		return false;
	},

	goRight: function(view, e){
		if( !view.hasState('expanded') && !view.element.hasClass('empty') ){
			view.expand(e);
		}
		else{
			return this.goTo(view.getChild(this.isVisible), e);
		}
		return false;
	},
	
	// todo: this function should cross node considered visible (not hidden and parent expanded) from view to the end
	crossNextVisible: function(view, fn, loop){
		var parent = view.parentNode, next, ret;
		
		while(view){
			ret = view.crossRight(function(right){
				right.crossAll(function(descendant){
					
				});
			});
			if( ret ) return;
			// si pas de nextsibling continue de chercher si un parent possède un nextsibling
			view = view.parentNode;
		}
	},
	
	goUp: function(view, e){		
		return this.goTo(this.getList().find(this.isValid, 'left', this.getVisibleIndex(element), this.loop), e);
	},

	goDown: function(element, e){
		return this.goTo(this.getList().find(this.isValid, 'right', this.getVisibleIndex(element), this.loop), e);
	},

	goPageDown: function(element, e){
		var index = this.getVisibleIndex(element), count, from, to;

		count = this.getPageCount(element);
		from = Math.min(index + count, this.getList().length - 1 ) + 1;
		to = index;

		return this.goTo(this.getList().find(this.isValid, 'left', from, to), e);
	},

	goPageUp: function(element, e){
		var index = this.getVisibleIndex(element), count, from, to;

		count = this.getPageCount(element);
		from = Math.max(index - count, 0) - 1;
		to = index;

		return this.goTo(this.getList().find(this.isValid, 'right', from, to), e);
	},

	goFirst: function(view, e){
		return this.goTo(this.view.getNode(this.isVisible), e);
	},

	goLast: function(element, e){
		return this.goTo(this.view, e);
	},

	goNextLetter: function(element, letter, e){
		return this.goTo(this.getList().find(this.matchLetter, 'right', this.getVisibleIndex(element), true), e);
	},

	goTo: function(view, e){
		if( view && !this.isRoot(view.element) ){
			this.go(view, e);
			return view;
		}
		return null;
	},

	go: function(view, e){
		this.naviguate(view, e);
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
					return this.goTo(this.visibles[0], e);
				}
				else{
					return this[methodName].call(this, this.activeView, e);
				}
			}
			else if( !e.control && (typeof e.key == 'number' || e.key.match(/^[a-zA-Z]$/)) ){
				return this.goNextLetter(this.activeView || this.visibles[0], e.key, e);
			}
		}
	}
});

var SelectionViewController = new Class({
	Extends: ViewController,

	handlers: {
		'view:select': function(e){
			if( this.selected ) this.selected.unselect(e);
			this.selected = View(e);
		},

		'view:unselect': function(e){
			delete this.selected;
		}
	}
});

// used in Element.prototype.crossInterval and no better way to do
NodeView.prototype.compareDocumentPosition = function(nodeview){
	return this.element.compareDocumentPosition(nodeview.element);
};

var MultipleSelectionViewController = new Class({
	Extends: SelectionViewController,
	selecteds: [],

	handlers: {
		'view:naviguate': function(e){
			var view = View(e);

			e = e.detail.args[0];

			// important car l'event 'view:select' ne se déclenche pas si l'élément est selected mias on doit quand même unselect les autres
			if( view.hasState('selected') ) this.unselectOther(view, e);

			if( e ){
				if( e.shift ){
					e.preventDefault();
					this.shiftView = this.shiftView || this.view.nav.activeView || View(this.view.nav.visibles[0]);
					this.selectRange(this.createRange(this.shiftView, view), e);
				}
				else{
					if( e.type == 'keydown' ) e.preventDefault();
					delete this.shiftView;
				}
			}
		},

		'view:select': function(e){
			var view = View(e);

			// e.detail.args[0] contient l'event qui à lancé select genre mousedown
			this.unselectOther(view, e.detail.args[0]);
			this.selecteds.push(view);
		},

		'view:unselect': function(e){
			var view = View(e);
			this.selecteds.remove(view);
		}
	},

	initialize: function(view){
		SelectionViewController.prototype.initialize.call(this, view);
		this.selecteds = [];
	},

	unselectOther: function(view, e){
		if( !e ) return;
		// n'unselect pas si control ou shift appuyé, ou mousemove (compat avec selectionRectangle)
		if( e.control || e.shift ) return;

		[].concat(this.selecteds).forEach(function(selected){
			if( selected != view ) selected.unselect(e);
		}, this);
	},

	unselectAll: function(e){
		// NOTE: need to loop that way because the selecteds array is spliced during the loop
		var i = this.selecteds.length;
		while(i--) this.selecteds[0].unselect(e);
	},

	createRange: function(viewA, viewB){
		var range = [];

		if( viewA && viewB ){
			// cross all element between the two specified to get the views between them
			viewA.crossInterval(viewB, function(view){
				if( view.hasState('hidden') ) return 'continue';
				range.push(view);
				if( !view.hasState('expanded') ) return 'continue';
			});
		}

		return range;
	},

	selectRange: function(range, e){
		// unselect view not in the range of the selection
		[].concat(this.selecteds).forEach(function(selected){
			if( !range.contains(selected) ) selected.unselect(e);
		});
		// select view in the range
		range.forEach(function(view){ view.select(e); });
	}
});

var LightedViewController = new Class({
	Extends: ViewController,
	handlers: {
		'mouseover': function(e){
			var view = View(e);

			if( view ){
				if( !view.light ) view = null;
				// when light only occur on the name element 
				else if( this.view.element.hasClass('compact') && e.target != view.getDom('name') ) view = null;				
			}
			
			if( view ){
				view.light(e);
			}			
			else if( this.lighted ) {
				this.lighted.unlight(e);
			}
		},

		'view:light': function(e){
			if( this.lighted ) this.lighted.unlight(e);
			this.lighted = View(e);
		},

		'view:unlight': function(e){
			delete this.lighted;
		}
	}
});

// TODO: option hideRoot
var TreeView = new Class({
	Extends: View,
	tagName: 'div',
	multiSelection: true,
	events: {
		/*
		mousedown: function(e){
			var view = this.getViewFromEvent(e);

			if( view ){
				if( e.target.tagName.toLowerCase() == 'tool' ){ view.focus(e); view.toggleState('expanded', e); }
				if( this.multiSelection && e.control ){ view.focus(e); view.toggleState('selected', e); }
				else{
					this.nav.go(view, e);
				}
			}
			else{
				this.selection.unselect(e);
			}
		},

		click: function(e){
			var view = this.getViewFromEvent(e);

			if( view ){
				if( this.multiSelection ) this.selection.unselectOther(view, e);
			}
			else this.selection.unselect(e);
		},

		dblclick: function(e){
			var view = this.getViewFromEvent(e);

			if( view ){
				if( e.target.tagName.toLowerCase() != 'tool' ){
					if( this.menu ) this.menu.activeFirst(e);
					else view.toggleState('expanded', e);
				}
			}
		},

		keydown: function(e){
			if( e.control && e.key == 'a' ){
				if( this.multiSelection ) this.nav.visibles.forEach(function(el){ View(el).select(e); });
			}
			else{
				this.nav.keydown(e);
			}
		}
		*/
	},

	attributes: {
		'tabindex': 0,
		'class': 'tree line',
		//'data-treeview': true
	},

	initialize: function(root, hideRoot){
		View.prototype.initialize.call(this, root);
		this.hideRoot = hideRoot;
		this.createRootView();

		this.lighted = new LightedViewController(this);
		this.selection = new MultipleSelectionViewController(this);
		this.cssController = new CSSViewController(this);
	},

	getLine: function(element){
		if( !element ) return 0;

		// tention pour control ce seras 'size', 'x'
		// on fait -1 parce que dans le CSS on a mit un margin-top:-1px pour éviter le chevauchement des bords des noeuds
		return element.getChild('div').measure('size', 'y') - 1;
	},

	createRootView: function(){
		this.rootView = new NodeView(this.model);
	},

	append: function(){
		View.prototype.append.apply(this, arguments);

		this.rootView.render();

		if( this.hideRoot ){
			this.rootView.append(this.element);
			this.rootView.createChildrenView();
		}
		else{
			var ul = new Element('ul');
			this.element.appendChild(ul);
			this.rootView.append(ul);
		}

		return this;
	},

	getViewFromEvent: function(e){
		var view = View(e);

		if( view && !this.checkView(view, e) ) view = null;

		return view;
	},

	// check is the view is a valid view for that event
	checkView: function(view, e){
		if( view == this ) return false;
		if( this.element.hasClass('compact') && view.element == e.target ) return false;
		return true;
	}
});
