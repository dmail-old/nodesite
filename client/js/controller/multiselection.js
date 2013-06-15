/* global */

/*

dependant de focused, si on ajoute mousedown focused avant ce controlleur
mousedown focused se produit avant mousedownmultiselect et shiftView est faussé

*/

NS.MultiSelectionController = require('../controller.js').extend({
	name: 'MultiSelectionController',
	requires: ['selecteds', 'focused', 'VisiblesTreeController'],

	constructor: function(){
		require('../controller.js').constructor.apply(this, arguments);
		this.selecteds.removeCurrent = this.removeCurrent.bind(this);
	},

	getSelecteds: function(){
		return this.selecteds.get();
	},

	getVisibles: function(){
		return this.VisiblesTreeController.get();
	},

	getFocused: function(){
		return this.focused.get();
	},

	unselectAll: function(e){
		NS.StateTreeController.removeCurrent.call(this.selecteds, e);
	},

	add: function(view, e){
		e = e || {};

		if( e.control ){
			view.toggleClass('selected', e);
		}
		else if( e.shift ){
			if( !this.shiftView ){
				this.shiftView = this.getFocused() || this.getVisibles()[0];
			}
			this.selectRange(this.createRange(this.shiftView, view), e);
		}
		else{
			delete this.shiftView;

			this.removeCurrent(e);
			view.addClass('selected', e);
		}
	},

	removeCurrent: function(e){
		// n'unselect pas si control ou shift appuyé
		// ou mousemove (compat avec selectionRectangle)
		if( e && (e.control || e.shift) ) return;
		this.unselectAll(e);
	},

	unselectOther: function(view, e){
		if( view.hasClass('selected') ){
			this.selecteds.list.remove(view);
			this.removeCurrent(e);
			this.selecteds.list.push(view);
		}
		else{
			this.removeCurrent(e);
		}
	},

	selectAll: function(e){
		this.getVisibles().forEach(function(view){
			view.addClass('selected', e);
		});
	},

	createRange: function(viewA, viewB){
		if( !viewA || !viewB ){
			throw new Error('no view to create range');
		}

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

		list.iterate(function(item){ range.push(item); }, 'right', from - 1, to);

		return range;
	},

	selectRange: function(range, e){
		// get selecteds view not in range
		var unselectList = this.getSelecteds().diff(range);

		// unselect view not in the range
		unselectList.forEach(function(view){ view.removeClass('selected', e); });
		// select view in the range
		range.forEach(function(view){ view.addClass('selected', e); });
	}
});
