/* global Controller, ControllerSelection, View, TreeView */

var ControllerMultipleSelection = new Class({
	Extends: ControllerSelection,
	selecteds: [],
	events: {
		'mousedown': function(view, e){
			console.log('mousedown multiple');
			if( view ){
				if( e.control ) view.toggleState('selected', e);
				else view.select(e);
			}
			else{
				this.unselectAll(e);
			}
		},

		click: function(view, e){
			if( view ){
				this.unselectOther(view, e);
			}
			else{
				this.unselectAll(e);
			}
		},

		'view:naviguate': function(view, e){
			// important car l'event 'view:select' ne se déclenche pas si l'élément est selected mias on doit quand même unselect les autres
			if( view.hasState('selected') ) this.unselectOther(view, e);

			if( e ){
				if( e.shift ){
					e.preventDefault();
					this.shiftView = this.shiftView || this.view.nav.activeView || this.view.root;
					this.selectRange(this.createRange(this.shiftView, view), e);
				}
				else{
					if( e.type == 'keydown' ) e.preventDefault();
					delete this.shiftView;
				}
			}
		},

		'view:select': function(view, e){
			this.unselectOther(view, e);
			this.selecteds.push(view);
		},

		'view:unselect': function(view){
			this.selecteds.remove(view);
		}
	},

	initialize: function(view){
		ControllerSelection.prototype.initialize.apply(this, arguments);
		this.selecteds = [];
	},

	unselectOther: function(view, e){
		if( !e ) return;
		// n'unselect pas si control ou shift appuyé, ou mousemove (compat avec selectionRectangle)
		if( e.control || e.shift ) return;

		[].concat(this.selecteds).forEach(function(selected){
			if( selected != view ) selected.unselect(e);
		}, this);
	},

	unselectAll: function(e){
		// NOTE: need to loop that way because the selecteds array is spliced during the loop
		var i = this.selecteds.length;
		while(i--) this.selecteds[0].unselect(e);
	},

	createRange: function(viewA, viewB){
		if( !viewA || !viewB ) throw new Error('no view to create range');

		var range = [], list = this.view.visibles, from = list.indexOf(viewA), to = list.indexOf(viewB);

		if( from === -1 || to === -1 ) throw new Error('cant create range from invisible view');
		// respect order
		if( from > to ){
			var temp = to;
			to = from;
			from = temp;
		}

		list.iterate(function(view){
			range.push(view);
		}, 'right', from, to);

		return range;
	},

	selectRange: function(range, e){
		// unselect view not in the range of the selection
		[].concat(this.selecteds).forEach(function(selected){
			if( !range.contains(selected) ) selected.unselect(e);
		});
		// select view in the range
		range.forEach(function(view){ view.select(e); });
	}
});

View.addController(TreeView, 'multiSelection', ControllerMultipleSelection);
View.defineController(TreeView, 'selection', {
	condition: function(view){
		return view.multiSelection !== true;
	}
});
