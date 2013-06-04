/* global NodeController */

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

NodeController.create('multiselection', {
	events: {
		'view:select': function(view, e){
			this.unselectOther(view, e);
			this.selecteds.push(view);
		},

		'view:unselect': function(view){
			this.selecteds.remove(view);
		},

		'mousedown': function(view, e){
			if( view && view != this.view ){
				if( e.control ){
					view.toggleState('selected', e);
				}
				else{
					this.add(view, e);
				}
			}
			else{
				this.unselectAll(e);
			}
		},

		'click': function(view, e){
			if( view && view != this.view ){
				this.unselectOther(view, e);
			}
			else{
				this.unselectAll(e);
			}
		},

		'keydown': function(view, e){
			if( e.control && e.key == 'a' ){
				this.getVisibles().forEach(function(view){
					view.select(e);
				});
			}
		}
	},

	constructor: function(view){
		NodeController.prototype.constructor.apply(this, arguments);
		this.selecteds = [];
	},

	add: function(view, e){
		if( e && e.shift ){
			e.preventDefault();
			if( !this.shiftView ){
				this.shiftView = this.selecteds.getLast() || this.getVisibles()[0];
			}

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

		var range = [], list = this.getVisibles(), from = list.indexOf(viewA), to = list.indexOf(viewB);

		if( from === -1 ){
			throw new Error('cant create range from invisible view' + viewA.model.get('name'));
		}
		if( to === -1 ){
			throw new Error('cant create range from invisible view' + viewB.model.get('name'));
		}

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

NodeController.prototype.getSelecteds = function(){
	var controller = this.getController('multiselection');
	return controller ? controller.selecteds : null;
};
