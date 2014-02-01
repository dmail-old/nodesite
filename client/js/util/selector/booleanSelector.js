(function(Selector){

	var BooleanSelector = Selector.extend({
		create: function(){		
			Selector.create.apply(this, arguments);
			
			if( this.selector === true ){
				this.filter = this.alwaysTrue;
			}
			else{
				this.filter = this.alwaysFalse;
			}
		}
	});

	Selector.addConstructor('boolean', BooleanSelector);

})(NS.Selector);