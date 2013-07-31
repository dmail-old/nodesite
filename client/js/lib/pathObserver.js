var PathObserver = {
	path: '',
	firstPart: null,
	lastPart: null,

	create: function(path){
		this.path = path;

		var parts = path.split('.'), i = 0, j = parts.length, currentPart, part;

		for(;i<j;i++){
			currentPart = PartObserver.new(parts[i]);

			if( part ){
				currentPart.previousPart = part;
				part.nextPart = currentPart;
			}
			part = currentPart;

			if( i == 0 ){
				this.firstPart = part;
			}
			if( i == j -1 ){
				this.lastPart = part;
			}
		}
	}
};
