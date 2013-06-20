NS.SelectedController = NS.Controller.extend({
	name: 'SelectedController',
	viewListeners: {
		'select': function(e){
			var event = e.args[0];

			if( !event || event.type != 'mousemove' ) this.setSelected(e.target);
		},

		'unselect': function(e){
			if( this.selected == e.target ) this.unsetSelected();
		},

		'active': function(e){
			var event = e.args[0];

			e.target.unactive(event);
			this.setSelected(e.target);
			this.view.close(event);
		},

		'blur': function(e){
			if( this.prevSelected != this.selected ){
				this.view.bubble('change', this.selected, e);
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
