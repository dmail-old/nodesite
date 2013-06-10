// we are not really heriting from Item.base, because we herit from Array.prototype
// but we add Item.base methods to the list object

Item('list', Object.merge(Object.create(Array.prototype), Item('base'), {
	__name__: 'list',

	constructor: function(){
		this.push.apply(this, arguments);
	}
}));
