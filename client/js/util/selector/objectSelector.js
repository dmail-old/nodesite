(function(Selector){

	var ObjectSelector = Selector.extend({
		filter: function(item){
			return this.selector === item;
		}
	});

	Selector.addConstructor('object', Selector);

})(NS.Selector);