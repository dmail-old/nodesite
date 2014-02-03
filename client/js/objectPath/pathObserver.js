window.PathObserver = (function(Path, Part){

	var PathObserver = Path.extend({
		partConstructor: Part,
		closed: false,

		toString: function(){
			return 'PathObserver';
		},

		create: function(path, model, listener, bind, id){
			Path.create.call(this, path);

			this.setModel(model);
			this.lastPart.onChange(listener, bind || this);
			this.lastPart.id = id;
		},

		close: function(){
			// all part must be closed
			if( this.closed === false ){
				// closing firstPart auto close nextParts
				this.firstPart.close();
				this.closed = true;
			}
		}
	});

	return PathObserver;

})(window.ObjectPath, window.PartObserver);