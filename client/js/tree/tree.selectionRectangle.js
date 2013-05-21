Tree.definePlugin('selectionRectangle', {	
	events: {
		'dom:mousedown': function(node, e){
			if( !node || !node.isDOMEventTarget(e) ){				
				// mousedown hors d'un noeud: démarre la sélection
				this.rectangle.mousedown(e);
			}
		},
		
		setElement: function(element){
			// faut que l'offsetParent devienne tree.element
			element.style.position = 'relative';
			this.rectangle = new SelectionRectangle(element, {
				visible: false,
				focusable: false,
				// tree.mousedown se chargeras de démarrer la sélection
				addmousedown: false
			});
			
			this.rectangle.tree = this;
			
			// n'apelle pas e.preventDefault pour donner le focus à l'arbre mousedown
			// on a pas besoin de e.preventDefault puisque tree.element possède la classe unselectable
			this.rectangle.checkPrevent = Function.FALSE;
			
			this.rectangle.on('update', function(e){
				var rectangleTop = this.get('top'), rectangleBottom = rectangleTop + this.get('height');
				var rectangleLeft = this.get('left'), rectangleRight = rectangleLeft + this.get('width');
						
				this.tree.visibles.forEach(function(node){
					var element = node.getDom('node');
					var choiceTop = element.measure('position', 'y'), choiceBottom = choiceTop + element.measure('size', 'y');
					var choiceLeft = element.measure('position', 'x'), choiceRight = choiceLeft + element.measure('size', 'x');
					
					if( rectangleTop <= choiceBottom && rectangleBottom >= choiceTop && rectangleLeft <= choiceRight && rectangleRight >= choiceLeft ){
						node.select();
					}
					else{
						node.unselect();
					}
				});
			});
		},
		
		destroyElement: function(){
			this.rectangle.destroy();
			delete this.rectangle;
		}
	}
});