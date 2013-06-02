/* global Controller, NodeController, NodeView */

var NodeControllerNav = new Class({
	Extends: NodeController,
	events: {
		'keydown': function(view, e){
			// need String(e.key) because the 0-9 key return numbers
			var key = String(e.key), method = this.keys[key];

			if( !method && (key.length == 1 && RegExp.alphanum.test(key)) ){
				method = this.keys['*'];
			}
			if( method ){
				this.currentView = this.getActiveView();
				this.list = this.getList();
				this.target = null;

				// no currentView -> naviguate to home view
				if( !this.currentView && method != '*' ){
					method = this.keys['home'];
				}

				method.call(this, e);
				if( this.target ){
					this.go(this.target, e);
					e.preventDefault();
				}
			}
		}
	},
	loop: false,
	keys: {
		'enter': function(e){
			// activate currentView, do nothing if no view is active
			this.currentView.active(e);
		},

		'left': function(e){
			if( this.currentView.hasState('expanded') ){
				this.currentView.contract(e);
			}
			else{
				this.target = this.currentView.parentNode;
			}
		},

		'right': function(e){
			if( !this.currentView.hasState('expanded') ){
				this.currentView.expand(e);
			}
			else{
				this.target = this.currentView.getChild(NodeView.isTargetable);
			}
		},

		'home': function(){
			this.target = this.list.find(NodeView.isTargetable, 'right');
		},

		'end': function(){
			this.target = this.list.find(NodeView.isTargetable, 'left');
		},

		'up': function(){
			var index = this.list.indexOf(this.currentView);
			this.target = this.list.find(NodeView.isTargetable, 'left', index, this.loop);
		},

		'down': function(){
			var index = this.list.indexOf(this.currentView);
			this.target = this.list.find(NodeView.isTargetable, 'right', index, this.loop);
		},

		'pageup': function(){
			var view = this.currentView;
			var index = this.list.indexOf(view);
			var from = Math.max(index - this.getPageCount(view), 0) - 1;

			this.target = this.list.find(NodeView.isTargetable, 'right', from, index);
		},

		'pagedown': function(){
			var view = this.currentView;
			var index = this.list.indexOf(view);
			var from = Math.min(index + this.getPageCount(view), this.list.length - 1 ) + 1;

			this.target = this.list.find(NodeView.isTargetable, 'left', from, index);
		},

		'*': function(e){
			// avoid conflict with shortcut like ctrl+a, ctrl+c
			if( e.control ) return;

			var index = this.list.indexOf(this.currentView);

			this.target = this.list.find(function(view){
				return NodeView.isTargetable(view) && NodeView.matchLetter(view, e.key);
			}, 'right', index, true);
		}
	},

	go: function(view, e){
		if( view ){
			view.focus(e);
			//if( !e || !e.control ) view.select(e);
			if( e && e.type == 'keydown' ) e.preventDefault();
			return true;
		}
		return false;
	},

	getLine: function(element){
		if( !element ) return 0;

		// tention pour control ce seras 'size', 'x'
		// on fait -1 parce que dans le CSS on a mit un margin-top:-1px pour éviter le chevauchement des bords des noeuds
		return element.getChild('div').measure('size', 'y') - 1;
	},

	getPageCount: function(view){
		var element = view.element;
		var total = element.offsetParent.clientHeight;
		var count = parseInt(total / this.getLine(element), 10) - 1;

		return count;
	},

	getActiveView: function(){
		return this.view.focused;
	},

	getList: function(){
		return this.view.visibles;
	}
});

RegExp.alphanum = /[a-zA-Z0-9]/;

NodeView.isTargetable = function(view){
	return !view.hasState('disabled');
};

NodeView.matchLetter = function(view, letter){
	var name = view.getDom('name');
	return name && name.innerHTML.startsWith(letter);
};

Controller.register('nav', NodeControllerNav);
