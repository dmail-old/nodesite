/* global Controller */

Controller.extends('selected', {
	Implements: Controller.Node,
	events:{
		'view:removeElement': function(view, e){
			// lorsqu'on supprime l'option sélectionnée
			var selected = view.getNode(function(descendant){
				return descendant == this.selected;
			}, this, true);

			if( selected ){
				this.unsetSelected();
			}
		},

		'view:select': function(view, e){
			if( !e || e.type != 'mousemove' ) this.setSelected(view);
		},

		'view:unselect': function(view){
			if( this.selected == view ) this.unsetSelected();
		},

		'view:active': function(view, e){
			view.unactive(e);
			this.setSelected(view);
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

	setSelected: function(view){
		if( this.selected != view ){
			this.selected = view;
			this.view.setValue(view.model.get('name'));
		}
	},

	unsetSelected: function(view){
		if( this.selected ){
			delete this.selected;
			this.view.setValue('');
		}
	}
});
