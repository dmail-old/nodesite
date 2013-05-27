/* global Controller, viewDocument, View, NodeView, TreeView */

var ControllerCSS = new Class({
	Extends: Controller,
	visibles: [],
	padding: 18,
	events: {
		'view:insertElement': function(view){
			if( view instanceof NodeView){
				// when the background of the node take full width we have to set a padding manually here
				var level = view.getLevel();
				if( this.view.hasClass('hideRoot') ) level--;
				view.getDom('div').style.paddingLeft = this.padding * level + 'px';
				this.changeVisibility(view, false);
			}
		},

		'view:remove': function(view){
			this.changeVisibility(view, true);
		},

		'view:hide': function(view){
			this.changeVisibility(view, true);
		},

		'view:show': function(view){
			this.changeVisibility(view, false);
		}
	},

	changeVisibility: function(view, hidden){
		var prev, next, parent = view.parentNode;

		if( parent ){
			prev = view.getPrev(viewDocument.isVisible);
			next = view.getNext(viewDocument.isVisible);

			if( prev && !next ) prev.toggleClass('last', hidden);
			else if( next && !prev ) next.toggleClass('first', hidden);
			view.toggleClass('first', Boolean(prev) == Boolean(hidden));
			view.toggleClass('last', Boolean(next) == Boolean(hidden));

			// ajout d'un enfant visible
			if( !hidden ) parent.removeClass('empty');
			// suppression du dernier enfant visible
			else if( !prev && !next ) parent.addClass('empty');
		}

		if( !parent || (parent.hasState('expanded') && this.visibles.contains(parent)) ){
			this.updateVisibles();
		}
	},

	updateVisibles: function(){
		this.visibles = [];

		/* list the visibles view elements, an element is visible if:
		- it has not the 'hidden' class
		- his parent is expanded
		*/

		this.view.root.crossAll(function(view){
			// view is hidden, ignore all descendant
			if( view.hasState('hidden') ) return 'continue';
			this.visibles.push(view);
			// view cant have visible decendant, ignore all descendant
			if( !view.hasState('expanded') ) return 'continue';
		}, this, !this.view.hasClass('hideRoot'));

		return this;
	}
});

viewDocument.isVisible = function(view){
	return !view.hasState('hidden');
};

TreeView.prototype.controllers.push(ControllerCSS);
