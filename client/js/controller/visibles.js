NS.Controller.define('visibles', {
	viewListeners: {
		'insertElement': function(e){
			this.changeVisibility(e.target, false);
		},

		'removeElement': function(e){
			this.changeVisibility(e.target, true);
		},

		'hide': function(e){
			this.changeVisibility(e.target, true);
		},

		'show': function(e){
			this.changeVisibility(e.target, false);
		},

		'expand': function(e){
			if( this.visibles.contains(e.target) ) this.updateVisibles();
		},

		'contract': function(e){
			if( this.visibles.contains(e.target) ) this.updateVisibles();
		}
	},
	visibles: [],

	isVisible: function(view){
		return !view.hasClass('hidden');
	},

	isExpanded: function(view){
		return view.hasClass('expanded');
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
		if( this.isExpanded(parent) && this.visibles.contains(parent) ) return true;

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
			if( !this.isVisible(view) ) return NS.Filter.SKIP;
			this.visibles.push(view);
			// view cant have visible decendant, ignore all descendant
			if( !this.isExpanded(view) ) return NS.Filter.SKIP;
		}, this);

		return this;
	},

	get: function(){
		return this.visibles;
	}
});
