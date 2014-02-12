
/* Fonction pouvant servir mais inutilisée pour le moment
Treenode.implement({	
	// compte le nombre de descendant de ce noeud
	count: function(){
		var count = 0;
		this.crossAll(function(){ count++ });
		return count;
	},
	
	// compte le nombre de parent de ce noeud
	getLevel: function(){
		var node = this, n = 0;
		while(node = node.parentNode) n++;
		return n;
	},
	
	// retourne la position du noeud par rapport à son parent (descendant compris)
	getParentPosition: function(){
		var position = 0, parent = this.parentNode, children, i, isPrev, child;
		
		if( parent ){
			children = parent.children;
			i = children.length;
			
			while(i--){
				child = children[i];
				if( isPrev ) position+= child.count() + 1;
				else if( child == this ){
					position+= 1;
					isPrev = true;
				}
			}
		}
		
		return position;
	},
	
	// retourne la position du noeud dans l'abre
	getTreePosition: function(){
		var node = this, position = this.tree.forest ? -1 : 0;
		
		do{
			position+= node.getParentPosition();
		}
		while(node = node.parentNode)
		
		return position;
	}	
});
*/

/*

schemas:

hasSchema: function(name, part){
		return name in this.schemas && part in this.schemas[name];
	},
	
	setSchema: function(name, part, value){
		if( !(name in this.schemas) ) this.schemas[name] = {};
		this.schemas[name][part] = value;
	},
	
	getSchema: function(name, part){
		return name in this.schemas ? this.schemas[name][part] : undefined;
	},
	
	removeSchema: function(name, part){
		if( this.hasSchema(name, part) ){
			delete this.schemas[name][part];
		}
	},
	
	applySchema: function(name, part, bind, args){
		var value = this.getSchema(name, part);
		return typeof value == 'function' ? value.apply(bind, args) : undefined;
	},
	
	callSchema: function(name, part, bind){
		return this.applySchema(name, part, bind, toArray(arguments, 3));
	},
	
	events: propertyChange: function(node, property, value){
		// this.callSchema(property, 'set', node, value);
	}


*/
