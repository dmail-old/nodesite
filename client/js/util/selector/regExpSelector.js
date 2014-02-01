(function(Selector){

	var RegExpSelector = Selector.extend({
		filter: function(item){		
			return this.selector.test(item);
		}
	});

	Selector.addConstructor(function(item){ return item instanceof RegExp; }, RegExpSelector);

})(NS.Selector);