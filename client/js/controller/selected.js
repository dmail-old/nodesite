/* global */

Item('controller.tree').extend('selected', {
	events:{
		'view:addclass:selected': function(view, e){
			if( !e || e.type != 'mousemove' ) this.setSelected(view);
		},

		'view:removeclass:selected': function(view){
			if( this.selected == view ) this.unsetSelected();
		},

		'view:addclass:actived': function(view, e){
			view.removeClass('actived', e);
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
