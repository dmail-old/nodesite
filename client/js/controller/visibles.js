/* global */

Item('controller.tree').extend('visibles', {
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

	isVisible: function(view){
		return !view.hasClass('hidden');
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
		if( parent.hasClass('expanded') && this.visibles.contains(parent) ) return true;

		return false;
	},

	changeVisibility: function(view, hidden){
		var prev, next, parent = view.parentNode;

		if( parent ){
			prev = view.getPrevSibling(this.isVisible);
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

		if( this.shouldBeVisible(view) ){
			this.updateVisibles();
		}
	},

	updateVisibles: function(){
		this.visibles = [];

		/* list the visibles view elements, an element is visible if:
		- it has not the 'hidden' class
		- his parent is expanded
		*/

		this.view.crossNode(function(view){
			// view is hidden, ignore all descendant
			if( view.hasClass('hidden') ) return 'continue';
			this.visibles.push(view);
			// view cant have visible decendant, ignore all descendant
			if( !view.hasClass('expanded') ) return 'continue';
		}, this);

		// this.view.visibles = this.visibles;

		return this;
	},

	get: function(){
		return this.visibles;
	}
});
