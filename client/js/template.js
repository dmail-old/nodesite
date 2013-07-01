NS.Template = {
	create: function(element){
		this.element = element;
		this.result = element.cloneNode(false);
		this.vars = {};
	},

	set: function(path, value){
		Object.setAt(this.vars, path, value);
	},

	get: function(path){
		return Object.getAt(this.vars, path);
	},

	parse: function(){
		this.element.getFirst(this.parseNode, this);
	},

	parseNode: function(node){
		var list = [];

		switch(node.nodeType){
		case 1: /* Element */
			var attributes = node.attributes, i = 0, j = attributes.length, attr;

			for(;i<j;i++){
				attr = attributes[i];

				var name = attr.name;
				if( name.startsWith('data-') ){
					name = attr.name.substr(5);
				}

				if( name in this.directives ){
					this.directives[name].call(this, attr.value, node);
				}
			}

			break;
		case 3: /* Text Node */
			var value = node.nodeValue;

			if( value.startsWith('{') ){
				value = value.substring(1, value.length - 1);
				node.nodeValue = this.get(value);
			}
			break;
		case 8: /* Comment */

			break;
		}
	},

	compile: function(){

	},

	exec: function(){
		this.element.parentNode.replaceChild(this.result, this.element);
	},

	/*
	si je fait cloneNode direct
	alors que le noeud que je clone n'a pas encore la bonne valeur
	ben je clone en boucledes noeud invalide

	comme angular faut commencer par trouver toutes les directives d'un noeud
	puis appliquer les directives dans l'ordre

	http://docs.angularjs.org/guide/directive
	*/
	directives: {
		repeat: function(declaration, node){
			var parts = declaration.split(' in ');
			var collection = this.get(parts[1]);

			collection.forEach(function(data){
				this.result.appendChild(node.cloneNode(true));
			}, this);
		}
	}
};
