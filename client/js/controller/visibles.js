/* global Controller, View */

Controller.define('visibles', {
	Implements: Controller.Node,
	events: {
		'view:insertElement': function(view){
			this.changeVisibility(view, false);
		},

		'view:removeElement': function(view){
			this.changeVisibility(view, true);
		},

		'view:hide': function(view){
			this.changeVisibility(view, true);
		},

		'view:show': function(view){
			this.changeVisibility(view, false);
		},

		'view:expand': function(view){
			if( this.visibles.contains(view) ) this.updateVisibles();
		},

		'view:contract': function(view){
			if( this.visibles.contains(view) ) this.updateVisibles();
		}
	},
	visibles: [],

	changeVisibility: function(view, hidden){
		var prev, next, parent = view.parentNode;

		if( parent ){
			prev = view.getPrevSibling(View.isVisible);
			next = view.getNextSibling(View.isVisible);

			if( prev && !next ) prev.toggleClass('last', hidden);
			else if( next && !prev ) next.toggleClass('first', hidden);
			view.toggleClass('first', Boolean(prev) == Boolean(hidden));
			view.toggleClass('last', Boolean(next) == Boolean(hidden));

			// ajout d'un enfant visible
			if( !hidden ) parent.removeClass('empty');
			// suppression du dernier enfant visible
			else if( !prev && !next ) parent.addClass('empty');
		}

		if( this.shouldBeVisible(view) ){
			this.updateVisibles();
		}
	},

	/*
	return if the specified view should be visible
	*/
	shouldBeVisible: function(view){
		var parent = view.parentNode;

		// view is the root
		if( !parent ) return true;
		// view is a root direct child
		if( !parent.parentNode ) return true;
		// view has an expanded and visible parent
		if( parent.hasState('expanded') && this.visibles.contains(parent) ) return true;

		return false;
	},

	updateVisibles: function(){
		this.visibles = [];

		/* list the visibles view elements, an element is visible if:
		- it has not the 'hidden' class
		- his parent is expanded
		*/

		this.view.crossNode(function(view){
			// view is hidden, ignore all descendant
			if( view.hasState('hidden') ) return 'continue';
			this.visibles.push(view);
			// view cant have visible decendant, ignore all descendant
			if( !view.hasState('expanded') ) return 'continue';
		}, this);

		return this;
	}
});

Controller.prototype.getVisibles = function(){
	var controller = this.getController('visibles');
	return controller ? controller.visibles : [];
};

View.isVisible = function(view){
	return !view.hasState('hidden');
};
