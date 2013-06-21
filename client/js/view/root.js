NS.viewDocument.define('root', NS.viewstate, {
	tagName: 'ul',
	className: 'root',
	attributes: {
		'tabindex': 0,
	},

	getChildrenElement: function(){
		return this.element;
	}
});
