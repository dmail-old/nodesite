var SelectView = new Class({
	Extends: View,
	tagName: 'div',
	events: {

	}
});

SelectView.implement(ViewSelectionController, ViewNaviguationController, ViewVisibilityController);
