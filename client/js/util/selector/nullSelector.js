(function(Selector){

	var NullSelector = Selector.extend({
		filter: Function.FALSE
	});

	Selector.addConstructor(function(selector){ return selector == null; },  NullSelector);

})(NS.Selector);