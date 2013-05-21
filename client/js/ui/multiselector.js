/*

Balise HTML avec multiselection, en fait il s'agit juste d'un arbre qu'on affiche d'une manière particulière

*/

Tree.definePlugin('drawMultiSelector', {	
	node: {
		getNodeHTML: function(){
			return '<div' + Object.toHTMLAttributes(this.getNodeAttributes()) + '><span class="name">' + this.getHTMLName() + '</span>\</div>';
		},
		
		mousedown: function(e){
			if( !this.hasState('selected') ) this.select(e);
			else if( e.control ) this.unselect(e);
			this.focus(e);
		}
	},
	
	tree: {
		
	},
	
	init: function(){
		// c'est pas ça mais en gros les options ayant des sous options devrait être expanded par défaut
		// this.baseNode.expanded = true;
		this.addPlugin('draw');
		this.eventList = new EventList('mousedown');
		this.addPlugin('keyboard');
	}
});

var MultiSelector = function(tree){
	Object.append(tree, {
		width: 'auto',
		height: 'auto',
		minwidth: 'auto',
		minheight: 70,
		size: 4,
	});
	
	tree.addPlugin('drawMultiSelector');
	
	// this.applyListeners('change', arguments);
	// tree.on('select', this.onchange);
	// tree.on('unselect', this.onchange);
			
	tree.setElement(tree.createElement());
	tree.rectangle = new SelectionRectangle(tree.element, {visible: true});
	tree.rectangle.element.style.visibility = 'hidden';			
	tree.rectangle.on('change', function(e){
		var rectangleTop = this.get('top'), rectangleBottom = rectangleTop + this.get('height');
				
		tree.root.getNode(function(node){					
			var choiceTop = node.trunk.measure('position', 'y'), choiceBottom = choiceTop + node.trunk.measure('size', 'y');
					
			node[rectangleTop < choiceBottom && rectangleBottom > choiceTop ? 'select' : 'unselect'](e);
		});
	});
	
	tree.element.className = 'tree line vx multi';
	
	tree.adapt = function(){
		this.element.setStyles({
			width: this.width,
			height: this.height,
			minWidth: this.minwidth,
			minHeight: this.minheight,
			maxHeight: this.size ? this.getLine() * this.size + 1 : 'auto'
		});
	};
	tree.adapt();
	
	return tree;
};