/*
---

name: drag

description: Ajoute la possibilité de drag'ndrop sur les noeuds

require: transform, draw

NOTE
- transfert entre onglet nécéssite de transformer les noeuds en chains de carac
- scroll par mousewheel IMPOSSIBLE pendant le drag: mousewheel désactiver par le navigateur pendant drag&drop

TODO
- autoexpand d'un noeud après un settimeout dragover
- autoscroll pendant le dragover lorsque je m'approche des bords, faudrais réutiliser le scroller de selectionRectangle

...
*/

var DragManager = new Class({
	initialize: function(){
		this.setters = {};
		this.getters = {};
		this.checkers = {};
		this.droppers = {};
		this.types = {};
	},
	
	addDropSupport: function(type, definition){
		this.types[type] = definition;
		
		if( definition.set ) this.setters[type] = definition.set;
		if( definition.get ) this.getters[type] = definition.get;
		if( definition.canDrop ) this.checkers[type] = definition.canDrop;
		if( definition.drop ) this.droppers[type] = definition.drop;
	},
	
	setData: function(e, type, data){
		var setter = this.setters[type];
		if( typeof setter == 'function' ) data = setter.call(this, data);
		e.event.dataTransfer.setData(type, data);
		return data;
	},
	
	getData: function(e, type){
		var data = e.event.dataTransfer.getData(type), getter = this.getters[type];
		if( typeof getter == 'function' ) data = getter.call(this, data);
		return data;
	},
	
	matchType: function(types, type){
		if( types.contains(type) ) return true;
		
		var alias = this.types[type].alias;
		
		if( !alias ) return false;
		
		if( typeof alias == 'string' ) return types.contains(alias);
		
		if( typeof alias == 'object' ) return alias.some(function(alias){ return types.contains(alias); });
		
		return false;
	},
	
	eachType: function(e, callback){
		var eventTypes = Array.prototype.mapCall.call(e.event.dataTransfer.types, 'toLowerCase');
		
		for(var type in this.types){
			if( this.matchType(eventTypes, type) ){
				callback.call(this, type);
				break;
			}
		}
	},
	
	updateEffect: function(e){
		var effect = this.getEffect(e);
		
		if( effect ){
			this.eachType(e, function(type){
				update = this.checkers[type];
				if( typeof update == 'function' && !this.callMethod(update, e) ) effect = 'none';
				return true;
			});
		}
		
		e.event.dataTransfer.dropEffect = effect || 'none';
		
		return effect;
	},
	
	setEffect: function(e, effect){
		e.event.dataTransfer.effectAllowed = effect || 'all';
	},
	
	getEffect: function(e){
		return e.event.dataTransfer.effectAllowed;
	},
	
	callMethod: function(method, e){
		return method.call(this, e);
	},
	
	drop: function(e){
		this.eachType(e, function(type){
			var dropper = this.droppers[type];
			if( typeof dropper == 'function' ) this.callMethod(dropper, e);
		});
	}
});

Object.append(ExplorerTreeView.prototype.DOMEvents, {
	dragstart: function(node, e){
		if( node && !node.never('move') ){
			this.drag.setEffect(e, 'move');
			this.drag.setData(e, 'nodes', this.selecteds);
		}
	},
	
	// lancé à intervalle régulier tant que je suis sur une cible
	dragover: function(node, e){
		if( node ){
			e.preventDefault();
			this.drag.updateOvered(node, e);		
			node.light(e);
		}
	},
	
	// lancé une fois lorsque j'arrive sur une cible
	dragenter: function(node, e){
		if( node ) node.light(e);
	},
	
	dragleave: function(node, e){			
		if( node ){
			node.unlight(e);
			this.drag.removePointer();
		}
	},

	drop: function(node, e){			
		if( node ){
			// lorsque je lache sur tree j'apelle unlight sur le noeud qui est ciblé
			if( !node.isDOMEventTarget(e) ) node.unlight(e);
			e.stop();
			e.preventDefault();
			this.drag.removePointer();
			this.drag.overed = node;
			this.drag.drop(e);
		}
	},
	
	dragend: function(node, e){
		if( node ) this.drag.removePointer();
	}
});

Tree.definePlugin('drag', {
	init: function(){
		this.drag = new DragManager();
		
		Object.append(this.drag, {
			tree: this,
			overflow: {},
			
			getWhere: function(node, e){
				// pour la racine seul inside est autorisé, sauf si je suis en forestroot
				if( !node.isRoot ){
					var height = this.tree.getLine(), delta = e.event.pageY - node.trunk.measure('cumulativePosition', 'y');
					
					if( delta < height*0.25 ) return 'before';
					else if( delta > height*0.75 ) return 'after';
				}
				return 'inside';
			},
			
			updateOvered: function(node, e){	
				var where = this.getWhere(node, e);
				
				/*
				var y = e.event.pageY;
				var top = this.tree.element.measure('cumulativePosition', 'y');
				var bottom = top + this.tree.element.measure('size', 'y');
				var offset = 30;
				var overflowY;
				
				if( y > top && y < top + offset ){
					// scroll vers le haut
					overflowY = -(y - top);
				}
				else if( y > bottom - offset && y < bottom ){
					// scroll vers le bas
					overflowY = (bottom - y);
				}
				else{
					overflowY = 0;
				}
				
				if( overflowY != this.overflow.y ){
					this.overflow.y = overflowY;
					
					if( overflowY == 0 ){
						this.tree.scroller.cancel();
					}
					else{
						this.tree.startScroll();
					}
				}
				*/
				
				this.removePointer();
				this.overed = node;
				this.where = where;
				
				// chrome ne donne pas accès à dataTransfer.getData('nodes') pendant le dragover, on considère toujours la cible comme valide
				if( browser.chrome || this.updateEffect(e) != 'none' ) this.addPointer();				
			},
						
			addPointer: function(){
				if( this.overed ) this.overed.trunk.addClass('dragover').addClass(this.where);
			},
			
			removePointer: function(){
				if( this.overed ) this.overed.trunk.removeClass('dragover').removeClass(this.where);
			}
		});
		
		this.drag.addDropSupport('nodes', {
			set: function(data){
				var i = 0, j = data.length, uids = [], uid;
				for(;i<j;i++) if( typeof (uid = data[i].uid) == 'number' ) uids.push(uid); // seul les noeud ayant un uid
				return uids.join(',');
			},
			
			get: function(data){
				var uids = data.split(','), i = 0, j = uids.length, nodes = [];
				for(;i<j;i++) nodes[i] = Treenode.uids[uids[i]];
				return nodes;
			},
			
			canDrop: function(e){
				var nodes = this.getData(e, 'nodes');
				if( nodes.contains(this.overed) ) return true;
				var i = nodes.length, effect = this.getEffect(e);
				var args = this.tree.getDestination(this.overed, this.where);
				
				while(i--){
					if( nodes[i].checkAction(effect, args) ) return true;
				}
				return false;
			},
			
			drop: function(e){
				var nodes = this.getData(e, 'nodes'), effect = this.getEffect(e);
				
				// si on lache le noeud sur un noeud du groupe on ne fait rien
				if( nodes.contains(this.overed) ) return;
				
				// le déplacement doit respecter l'ordre visuel
				nodes = nodes.orderBy(NodeView.prototype.getVisibleIndex, this.where == 'after' ? -1 : 1);
				
				this.tree[effect](nodes, this.overed, this.where);
			}
		});
		
		this.eventList.add('dragstart', 'dragover', 'dragenter', 'dragleave', 'drop', 'dragend');		
	}
});