/* global EventHandler, View, NodeView, NodeListView */

/*

NOTE

le scroll auto lors de expand/contract cherche à garder visibles les éléments
mais ne tiens pas compte de la largeur qui est importante: celle du texte
il prend la largeur de l'élément, souvent 100% et scroll sans qu'on en ait besoin

TODO

- faire la balise select, certaines portions de codes sont communes et doivents être regroupées

*/

var ViewController = new Class({
	//Implements: EventHandler,

	initialize: function(view){
		this.view = view;
		Object.eachPair(this.events, function(name){ this.view.events[name] = this; }, this);
	}
});

var NavViewController = new Class({
	//Extends: ViewController,
	activeView: null,
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
	visibles: [],
	loop: false,

	events: {
		'view:append': function(e){
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
		},

		'view:expand': function(e){
			var view = View(e);

			if( this.contains(view.element) ){
				//if( this.view.element.hasFocus() ) view.scrollTo('ul');
				this.updateVisibles();
			}
		},

		'view:contract': function(e){
			var view = View(e);

			if( this.contains(view.element) ){
				//if( this.view.element.hasFocus() ) view.scrollTo('ul');
				this.updateVisibles();
			}
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
		}
	},

	/* methods concerning visibles list	*/
	isRoot: function(element){
		return this.view.element == element;
	},

	isViewElement: function(element){
		return element.hasProperty(View.instanceKey);
	},

	isVisible: function(element){
		return !element.hasClass('hidden');
	},

	mayHaveVisibleDescendant: function(element){
		return this.isRoot(element) || element.hasClass('expanded');
	},

	updateVisibles: function(){
		this.visibles = [];

		/* list the visibles view elements, an element is visible if:
		- it has not the 'hidden' class
		- his parent is expanded
		*/

		this.view.element.crossAll(function(element){
			// only check element of view
			if( !this.isViewElement(element) ) return;

			// view is hidden, ignore all descendant
			if( !this.isVisible(element) ) return 'continue';
			this.visibles.push(element);
			// view cant have visible decendant, ignore all descendant
			if( !this.mayHaveVisibleDescendant(element) ) return 'continue';

		}, this);

		return this;
	},

	getVisibleIndex: function(element){
		return this.visibles.indexOf(element);
	},

	contains: function(element){
		return this.isRoot(element) || this.getVisibleIndex(element) > -1;
	},

	changeVisibility: function(e, hidden){
		var view = View(e), element = view.element, isRoot, parent, prev = element.getPrev(this.isVisible), next = element.getNext(this.isVisible);

		if( prev && !next ) prev.toggleClass('last', hidden);
		else if( next && !prev ) next.toggleClass('first', hidden);
		element.toggleClass('first', Boolean(prev) == Boolean(hidden));
		element.toggleClass('last', Boolean(next) == Boolean(hidden));

		if( this.isVisible(element) ){
			isRoot = this.isRoot(element);
			if( !isRoot ){
				parent = element.parentNode.parentNode;

				// ajout d'un enfant visible
				if( !hidden ) parent.removeClass('empty');
				// suppression du dernier enfant visible
				else if( !prev && !next ) parent.addClass('empty');
			}

			// si l'action se passe sur root ou sur un noeud qui est visible (le parent est expanded et visible) -> updateVisibles
			if( isRoot || (this.mayHaveVisibleDescendant(parent) && this.contains(parent)) ){
				this.updateVisibles();
			}
		}
	},

	/* naviguation over visibles methods */
	getList: function(){
		return this.visibles;
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
		var span = element.querySelector('div span');
		return span && span.innerHTML.startsWith(letter);
	},

	goLeft: function(element, e){
		if( element.hasClass('expanded') ){
			View(element).contract(e);
		}
		else{
			return this.goTo(element.parentNode.parentNode, e);
		}

		return false;
	},

	goRight: function(element, e){
		if( !element.hasClass('expanded') && !element.hasClass('empty') ){
			View(element).expand(e);
		}
		else{
			var ul = element.getChild('ul');
			if( ul ) return this.goTo(ul.getChild(this.isVisible), e);
		}
		return false;
	},

	goUp: function(element, e){
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

	goFirst: function(element, e){
		return this.goTo(this.getList[0], e);
	},

	goLast: function(element, e){
		return this.goTo(this.getList()[this.getList().length - 1], e);
	},

	goNextLetter: function(element, letter, e){
		return this.goTo(this.getList().find(this.matchLetter, 'right', this.getVisibleIndex(element), true), e);
	},

	goTo: function(element, e){
		var view = View(element);

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
					return this[methodName].call(this, this.activeView.element, e);
				}
			}
			else if( !e.control && (typeof e.key == 'number' || e.key.match(/^[a-zA-Z]$/)) ){
				return this.goNextLetter(this.activeView.element || this.visibles[0], e.key, e);
			}
		}
	}
});

/*
Conserve une liste des vues qui sont sélectionnées
et donne des méthodes pour les manipuler
*/

var SelectionViewController = new Class({
	//Extends: ViewController,
	selected: null,

	events: {
		'view:select': function(e){
			this.selected = View(e);
			// e.detail.args[1] contient l'event qui à lancé select genre mousedown
			this.unselect(e.detail.args[1]);
		},

		'view:unselect': function(e){
			if( this.selected == View(e) ) this.selected = null;
		}
	},

	add: function(view, e){
		view.select(e);
	},

	remove: function(view, e){
		view.unselect(e);
	},

	unselect: function(e){
		if( this.selected ) this.remove(this.selected, e);
	}
});

var MultipleSelectionViewController = new Class({
	//Extends: SelectionViewController,
	shiftView: null,

	events: {
		'view:naviguate': function(e){
			var view = View(e);

			e = e.detail.args[1];

			// important car l'event 'view:select' ne se déclenche pas si l'élément est selected mias on doit quand même unselect les autres
			if( view.hasState('selected') ) this.unselectOther(view, e);

			if( e ){
				if( e.shift ){
					e.preventDefault();
					this.shiftView = this.shiftView || this.view.nav.activeView || View(this.view.nav.visibles[0]);
					this.selectRange(this.shiftView, view, e);
				}
				else{
					if( e.type == 'keydown' ) e.preventDefault();
					this.shiftView = null;
				}
			}
		},

		'view:select': function(e){
			var view = View(e);

			// e.detail.args[1] contient l'event qui à lancé select genre mousedown
			this.unselectOther(view, e.detail.args[1]);
			this.list.push(view);
		},

		'view:unselect': function(e){
			var view = View(e);
			this.list.remove(view);
		}
	},

	initialize: function(view){
		SelectionViewController.prototype.initialize.call(this, view);
		this.list = [];
	},

	unselectOther: function(view, e){
		if( !e ) return;
		// n'unselect pas si control ou shift appuyé, ou mousemove (compat avec selectionRectangle)
		if( e.control || e.shift ) return;

		[].concat(this.list).forEach(function(selected){
			if( selected != view ) this.remove(selected, e);
		}, this);
	},

	unselect: function(e){
		// [].concat puisque le tableau selecteds est modifié par unselect
		[].concat(this.list).forEach(function(selected){ this.remove(selected, e); }, this);
	},

	createRange: function(elementA, elementB){
		var from, to, min, max, unselectList, selectList, i;

		if( !elementA || !elementB ) return null;

		from = this.view.nav.getVisibleIndex(elementA);
		to = this.view.nav.getVisibleIndex(elementB);

		if( from == -1 || to == -1 ) return null;

		if( from > to ){ min = to; max = from; }
		else{ min = from; max = to; }

		// désélectionne tout les noeuds selectionné qui ne sont pas dans l'intervalle
		unselectList = this.list.filter(function(selected){
			var index = this.view.nav.getVisibleIndex(selected.element);
			return index < min || index > max;
		}, this);

		unselectList = unselectList.map(function(view){ return view.element; });

		// sélectionne les noeuds de l'intervalle
		selectList = [];
		i = max - min + 1;
		while(i){
			i--;
			selectList.push(this.view.nav.visibles[i + min]);
		}

		return {
			selectList: selectList,
			unselectList: unselectList
		};
	},

	selectRange: function(viewA, viewB, e){
		var range = this.createRange(viewA.element, viewB.element);

		if( range ){
			range.unselectList.forEach(function(item){ View(item).unselect(e); }, this);
			range.selectList.forEach(function(item){ View(item).select(e); }, this);
		}

		return this;
	}
});

var baseViewController = new EventHandler(document, {
	'view:focus': function(e){
		View(e).scrollTo();
	},
	'view:expand': function(e){
		var view = View(e);
		if( view.childrenView ) view.childrenView.element.removeProperty('hidden');
		else view.createChildrenView();
	},
	'view:contract': function(e){
		var view = View(e);
		if( view.childrenView ){
			view.childrenView.element.setProperty('hidden', 'hidden');
		}
	}
});
baseViewController.enableAll();

/*
Store the lighted view and allow only one view to be lighted at once
*/
var lightedViewHandler = new EventHandler(document, {
	'mouseover': function(e){
		var view = View(e);

		if( view && view.light ){
			view.light(e);
		}
		else if( this.view ) {
			this.view.unlight(e);
		}
	},

	'view:light': function(e){
		var prev = this.view;
		this.view = View(e);
		if( prev && prev != this.view ){
			prev.unlight(e);
		}
	},

	'view:unlight': function(e){
		if( this.view == View(e) ) this.view = null;
	}
});
lightedViewHandler.enableAll();

var TreeView = new Class({
	Extends: View,
	tagName: 'div',
	multiSelection: true,
	events: {
		mousedown: function(e){
			var view = this.getViewFromEvent(e);

			if( view ){
				if( e.target.tagName.toLowerCase() == 'ins' ){ view.focus(e); view.toggleState('expanded', e); }
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
				if( e.target.tagName.toLowerCase() != 'ins' ){
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
	},

	attributes: {
		'tabindex': 0,
		'class': 'tree line'
	},

	initialize: function(root, hideRoot){
		View.prototype.initialize.call(this, root);
		this.hideRoot = hideRoot;
		this.createRootView();

		//this.nav = new NavViewController(this);
		//this.selection = this.multiSelection ? new MultipleSelectionViewController(this) : new SelectionViewController(this);
	},

	getLine: function(element){
		if( !element ) return 0;

		// tention pour control ce seras 'size', 'x'
		// on fait -1 parce que dans le CSS on a mit un margin-top:-1px pour éviter le chevauchement des bords des noeuds
		return element.getChild('div').measure('size', 'y') - 1;
	},

	createRootView: function(){
		if( this.hideRoot ){
			this.rootView = new NodeListView(this.model.children);
		}
		else{
			this.rootView = new NodeView(this.model);
		}
	},

	append: function(){
		View.prototype.append.apply(this, arguments);

		this.rootView.render();

		if( this.hideRoot ){
			this.rootView.append(this.element);
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
