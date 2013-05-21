/*
---

name: clipboard

description: copy, cut and paste treenodes

require: transform, draw

...
*/

Tree.clipboard = new Emitter();

Object.append(Tree.clipboard, {
	effect: null,
	nodes: null,
	
	setData: function(data){
		var i = 0, j = data.length, nodes;
		
		if( j ){
			nodes = [];
			for(;i<j;i++){
				nodes[i] = data[i].setProperty('clipboard', this.effect);
			}
			
			this.emit('set', nodes);
			this.clearData(true);
			this.nodes = nodes;
			this.emit('change');
		}
		
		return nodes;
	},
	
	hasData: function(){
		return this.nodes;
	},
	
	clearData: function(nochange){
		var nodes = this.nodes;
		if( nodes ){
			var i = 0, j = nodes.length;
			for(;i<j;i++) nodes[i].removeProperty('clipboard');
			
			this.emit('clear', nodes);
			delete this.nodes;
			if( !nochange ) this.emit('change');
		}
	},
	
	cut: function(node, e){
		this.effect = 'cut';
		this.setData(node.tree.selecteds.orderBy('getVisibleIndex()'));
	},
	
	copy: function(node, e){
		this.effect = 'copy';
		this.setData(node.tree.selecteds.orderBy('getVisibleIndex()'));
	},
	
	paste: function(node, e){
		var nodes = this.nodes;
		if( nodes ){
			switch(this.effect){
				case 'cut':
					this.clearData();
					if( nodes.contains(node) ) return;
					node.tree.move(nodes, node, 'inside');
				break;
				default:
					node.tree.copy(nodes, node, 'inside');
				break;
			}
		}
		return this;
	}
});

Tree.definePlugin('clipboard', {
	require: 'transform',
	
	init: function(){
		this.setSchema('clipboard', 'draw', function(value, current){
			this.getDom('node').removeClass(current);
			if( value ) this.getDom('node').addClass(value);
		});
		
		this.on('moveout', function(node){
			if( node.clipboard ){
				Tree.clipboard.nodes.remove(node);
				if( Tree.clipboard.nodes.length == 0 ) delete Tree.clipboard.nodes; // devrait mettre à jour le menu si l'option paste était dispo elle ne l'est plus
			}
		});
		
		this.keyboard.on('esc', function(){ Tree.clipboard.clearData(); });
	}
});