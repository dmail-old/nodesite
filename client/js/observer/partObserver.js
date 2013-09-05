window.PartObserver = window.PropertyObserver.extend({
	nextPart: null,
	previousPart: null,

	notify: function(change){
		if( this.nextPart ){
			this.nextPart.setModel(change.value);
		}
		window.PropertyObserver.notify.call(this, change);
	}
});
