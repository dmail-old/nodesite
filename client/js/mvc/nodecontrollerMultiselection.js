/* global Controller, NodeControllerSelection */

/*

selection scenario:

OK	mousedown on nothing -> unselectAll
OK	mousedown on selected -> nothing
OK	mousedown on unselected -> select
OK	mousedown + ctrl on selected -> unselect only (thanks to if( e.control || e.shift ) return; )
OK	mousedown + ctrl on unselected -> select only (thanks to if( e.control || e.shift ) return; )
OK  mousedown + shift on selected -> check the shift range
OK  mousedown + shift on unselected -> check the shift range

OK	click on nothing -> unselectAll
OK	click on selected -> unselect other

*/

var NodeControllerMultiselection = new Class({
	Extends: NodeControllerSelection,
	events: {
		'view:select': function(view, e){
			this.unselectOther(view, e);
			this.selecteds.push(view);
		},

		'view:unselect': function(view){
			this.selecteds.remove(view);
		},

		'mousedown': function(view, e){
			if( view ){
				if( e.control ){
					view.toggleState('selected', e);
				}
				else{
					this.checkShift(view, e);
				}
			}
			else{
				this.unselectAll(e);
			}
		},

		'click': function(view, e){
			if( view ){
				this.unselectOther(view, e);
			}
			else{
				this.unselectAll(e);
			}
		},
		
		'keydown': function(view, e){
			if( e.control && e.key == 'a' ){
				this.view.visibles.forEach(function(view){
					view.select(e);
				});
			}
		}
	},

	initialize: function(view){
		NodeControllerSelection.prototype.initialize.apply(this, arguments);
		this.selecteds = [];
	},

	checkShift: function(view, e){
		if( e && e.shift ){
			e.preventDefault();
			this.shiftView = this.shiftView || this.selecteds.getLast() || this.view.root;
			this.selectRange(this.createRange(this.shiftView, view), e);
		}
		else{
			delete this.shiftView;
			view.select(e);
		}
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
		}, 'right', from - 1, to);

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

Controller.register('multiselection', NodeControllerMultiselection);
