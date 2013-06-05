/* global Controller */

Controller.define('selected', {
	Implements: Controller.Node,
	events:{
		'view:removeElement': function(view, e){
			// lorsqu'on supprime l'option sélectionnée
			var selected = view.getNode(function(descendant){
				return descendant == this.selected;
			}, this, true);

			if( selected ){
				this.set(null);
			}
		},

		'view:select': function(view, e){
			if( !e || e.type != 'mousemove' ) this.set(view);
		},

		'view:active': function(view, e){
			view.unactive(e);
			this.set(view);
			this.view.close(e);
		},

		'blur': function(view, e){
			if( this.prevSelected != this.selected ){
				this.view.emit('change', this.selected, e);
				this.prevSelected = this.selected;
			}
		}
	},
	prevSelected: null,

	set: function(view){
		if( this.selected != view ){
			this.selected = view;
			this.view.setValue(view ? view.model.get('name') : '');
		}
	}
});
