/*

dependant de focused, si on ajoute mousedown focused avant ce controlleur
mousedown focused se produit avant mousedownmultiselect et shiftView est faussé

*/

NS.Controller.define('selection', {
	anchorNode: null,
	focusNode: null,
	state: 'selected',
	viewListeners: {
		'select': function(e){
			this.add(e.target, e.args[0]);
		},

		'unselect': function(e){
			this.remove(e.target, e.args[0]);
		},

		'selectAll': function(e){
			this.selectRange(this.getVisibles(), e.args[0]);
		},

		'unselectAll': function(e){
			this.removeAll(e.args[0]);
		},

		'collapse': function(e){
			this.collapse(e.target, e.args[0]);
		},

		'focus': function(e){
			this.anchorNode = e.target;
		}
	},

	constructor: function(multiple){
		NS.Controller.constructor.apply(this, arguments);
		this.list = [];
	},

	add: function(view, e){
		e = e || {};

		if( e.control ){
			view.toggleState(this.state, e);
		}
		else if( e.shift ){
			this.extend(view);
		}
		else{
			this.anchorNode = null;
			this.focusNode = null;

			if( !view.hasClass(this.state) ){
				view.addClass(this.state);
				this.removeAll(e);
				this.list.push(view);
			}
		}
	},

	remove: function(view, e){
		view.removeClass(this.state);
		this.list.remove(view);
	},

	getVisibles: function(){
		return this.view.controllers.visibles.get();
	},

	removeAll: function(e){
		// n'unselect pas si control ou shift appuyé
		// ou mousemove (compat avec selectionRectangle)
		if( e && (e.control || e.shift) ) return;

		var list = this.list, i = list.length;
		while(i--) list[0].unselect(e);
	},

	collapse: function(view, e){
		if( view.hasClass(this.state) ){
			this.list.remove(view);
			this.removeAll(e);
			this.list.push(view);
		}
		else{
			this.removeAll(e);
		}
	},

	// extend the selection to view
	extend: function(view, e){
		if( !this.anchorNode ) this.anchorNode = this.getVisibles()[0];
		this.focusNode = view;
		this.setRange(this.getRange(), e);
	},

	contains: function(view){
		return this.list.contains(view);
	},

	selectRange: function(range, e){
		range.forEach(function(view){
			view.select(e);
		});
	},

	unselectRange: function(range, e){
		range.forEach(function(view){
			view.unselect(e);
		});
	},

	getRange: function(){
		var from = this.anchorNode, to = this.focusNode, range = [], list;

		if( from && to ){
			list = this.getVisibles();
			from = list.indexOf(from);

			if( from === -1 ){
				throw new Error('anchorNode is invisible');
			}

			to = list.indexOf(to);
			if( to === -1 ){
				throw new Error('focusNode is invisible');
			}

			// respect order
			if( from > to ){
				var temp = to;
				to = from;
				from = temp;
			}

			list.iterate(function(item){ range.push(item); }, null, 'next', from - 1, to);
		}

		return range;
	},

	setRange: function(range, e){
		// get selecteds view not in range
		var unselectList = this.list.diff(range);

		// unselect view not in the range
		this.unselectRange(unselectList, e);
		// select view in the range
		this.selectRange(range, e);
	}
});
