(function(Selector){

	var NumberSelector = Selector.extend({
		filter: function(){
			if( this.selector === 0 ){
				return this.ACCEPT;
			}
			this.selector--;
			return this.REJECT;
		}
	});

	Selector.addConstructor('number', NumberSelector);

})(NS.Selector);