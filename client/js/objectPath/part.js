window.PathPart = (function(){

	var Part = {
		name: null, // Number|String
		model: null,
		previousPart: null,
		nextPart: null,
		isMethod: false,

		create: function(name){
			this.name = name;
		},

		setModel: function(model){
			this.unsetModel(true);
			this.model = model;
			this.propagate();
			return this;
		},

		propagate: function(){
			if( this.nextPart ){
				this.nextPart.setModel(this.get());
			}
		},

		unsetModel: function(){
			if( this.nextPart ){
				this.nextPart.unsetModel();
			}
			this.model = null;
			return this;
		},

		set: function(value){
			var model = this.model;

			if( model == null ) return false;
			model[this.name] = value;
			this.propagate();
			return true;					
		},

		get: function(){
			var model = this.model;

			if( model == null ) return undefined;
			return model[this.name];
		},

		has: function(){
			var model = this.model;

			if( model == null ) return false;
			return this.name in model;	
		},

		hasOwn: function(){
			var model = this.model;

			if( model == null ) return false;
			//if( model.has ) return model.has(this.name);
			return Object.prototype.hasOwnProperty.call(model, this.name);
		}
	};

	return Part;

})();