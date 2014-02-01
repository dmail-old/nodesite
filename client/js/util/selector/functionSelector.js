(function(Selector){

	var FunctionSelector = Selector.extend({
		filter: function(item){
			return this.selector.call(this, item);
		}
	});

	Selector.addConstructor('function', FunctionSelector);

})(NS.Selector);
