/* global Controller */

Controller.define('selector', {
	Implements: Controller.Node,
	events: {
		'view:change:name': function(view, e){
			this.view.adapt();
		},

		'view:insertElement': function(view){
			this.view.adapt();
		},

		'view:removeElement': function(view){
			this.view.adapt();

			view.crossNode(function(descendant){
				if( view == this.view.selected ){
					if( view == this.view.defaultSelected ){
						this.view.defaultSelected = this.findDefaultSelected();
					}
					this.view.setSelected(this.view.defaultSelected);
				}
			}, this, true);
		},

		'view:select': function(view, e){
			if( !e || e.type != 'mousemove' ) this.setSelected(view);
		},

		'view:active': function(view, e){
			view.unactive(e);
			this.view.setSelected(view);
			this.view.close(e);
		},

		'mousedown': function(e){
			if( this.disabled ) return;

			var tool = this.getDom('tool');

			if( tool.contains(e.target) ){
				tool.addClass('active');
				e.preventDefault(); // pour pas que l'input perde le focus par le mousedown sur tool
				this.getDom('input').focus();
			}

			if( this.opened ){
				this.close(e);
			}
			else{
				this.open(e);
			}
		},

		'mouseup': function(e){
			this.getDom('tool').removeClass('active');
		},

		'keydown': function(e){
			if( e.key == 'enter' ){
				if( this.selected ){
					this.selected.active(e);
				}
			}
			else if( e.key == 'space' ){
				this.open(e);
			}
			else if( e.key == 'esc' ){
				this.close(e);
			}
			else{
				// send keydown event on the options list
				this.getDom('root').dispatchEvent(e);
			}
		},

		'blur': function(e){
			this.checkChange(e);
			this.close(e);
		}
	}
});
