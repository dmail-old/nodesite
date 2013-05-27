/* global Emitter */

var viewDocument = Object.append(Object.clone(Emitter), {
	views: [],
	viewAttribute: 'data-view',
	lastID: 0,

	handleEmit: function(view, name, args){
		this.applyListeners(name, [view].concat(args));
		//this.emit(name, view, args);

		if( view.element ){
			var event = this.createEvent(view, name, args);
			// View émet des évènements via son élément
			view.element.dispatchEvent(event);
		}
	},

	createEvent: function(view, name, args){
		var event = new CustomEvent('view:' + name, {
			bubbles: true,
			cancelable: true,
			detail: {
				view: view,
				name: name,
				args: args
			}
		});

		return event;
	},

	isElementView: function(element){
		return element.hasAttribute && element.hasAttribute(this.viewAttribute);
	},

	getElementView: function(element){
		var view = null;

		if( this.isElementView(element) ){
			view = this.views[element.getAttribute(this.viewAttribute)];
		}

		return view;
	},

	findElementView: function(element){
		var view = null;

		while( element ){
			view = this.getElementView(element);
			if( view ) break;
			element = element.parentNode;
		}

		return view;
	}
});

viewDocument.on({
	'create': function(view){
		this.views[view.DOMID = this.lastID++] = view;
	},

	'destroy': function(view){
		delete this.views[view.DOMID];
	}
});
