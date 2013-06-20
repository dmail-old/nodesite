NS.Controller.define('selected', {
	selected: null,
	previousSelected: null,
	state: 'selected',
	viewListeners: {
		'select': function(e){
			var view = e.target;
			e = e.args[0];

			this.setSelected(view, e);
		},

		'unselect': function(e){
			var view = e.target;

			if( this.selected == view ) this.unsetSelected(view, e);
		},

		'active': function(e){
			var event = e.args[0];

			e.target.unactive(event);
			this.setSelected(e.target);
			this.view.close(event);
		},

		'blur': function(e){
			if( this.previousSelected != this.selected ){
				this.view.bubble('change', this.selected, e);
				this.previousSelected = this.selected;
			}
		},

		'destroy': function(e){

		}
	},

	setSelected: function(view, e){
		if( e && e.type == 'mousemove' ) return;

		if( this.selected != view ){
			this.selected = view;
			this.view.setValue(view.model.get('name'));
		}
	},

	unsetSelected: function(view, e){
		if( this.selected ){
			this.selected = null;
			this.view.setValue('');
		}
	}
});
