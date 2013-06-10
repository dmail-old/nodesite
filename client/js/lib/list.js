// we are not really heriting from NS.base, because we herit from Array.prototype
// but we add NS.base methods to the list object

NS('list', Object.merge(Object.create(Array.prototype), NS('item'), {
	__name__: 'list',

	constructor: function(){
		this.push.apply(this, arguments);
	}
}));
