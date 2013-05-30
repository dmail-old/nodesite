var SelectView = new Class(View, {
	tagName: 'div',
	events: {

	}
});

SelectView.implement(ViewSelectionController, ViewNaviguationController, ViewVisibilityController);
