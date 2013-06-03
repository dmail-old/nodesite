/* global Controller, NodeController, NodeView */

var NodeControllerVisibles = new Class({
	Extends: NodeController,
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
			prev = view.getPrev(NodeView.isVisible);
			next = view.getNext(NodeView.isVisible);

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

		this.view.root.crossNode(function(view){
			// view is hidden, ignore all descendant
			if( view.hasState('hidden') ) return 'continue';
			this.visibles.push(view);
			// view cant have visible decendant, ignore all descendant
			if( !view.hasState('expanded') ) return 'continue';
		}, this, !this.view.hasClass('hideRoot'));

		return this;
	}
});

NodeController.prototype.getVisibles = function(){
	var controller = this.getController('visibles');
	return controller ? controller.visibles : [];
};

NodeView.isVisible = function(view){
	return !view.hasState('hidden');
};

Controller.register('visibles', NodeControllerVisibles);
