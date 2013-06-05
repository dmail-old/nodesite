/* global Controller */

Controller.define('openstate', {
	events: {
		'mousedown': function(e){
			if( !this.view.hasClass('disabled') ){
				if( this.view.getDom('tool').contains(e.target) ){
					this.view.addClass('active');
					// pour pas que l'input perde le focus par le mousedown sur tool
					e.preventDefault();
					this.view.getDom('input').focus();
				}

				this.view.toggle(e);
			}
		},

		'mouseup': function(e){
			this.view.removeClass('active');
		},

		'keydown': function(e){
			if( e.key == 'space' ){
				this.view.open(e);
			}
			else if( e.key == 'esc' ){
				this.view.close(e);
			}
			else{
				// send keydown event on the options list
				this.view.getDom('root').dispatchEvent(e);
			}
		},

		'blur': function(e){
			this.view.close(e);
		}
	}
});
