/* global */

NS.OpenstateController = NS.Controller.extend({
	name: 'OpenstateController',
	events: {
		'mousedown': function(e){
			this.view.toggle(e);
		},

		'blur': function(e){
			this.view.close(e);
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
		}
	}
});
