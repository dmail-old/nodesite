/*

Permet aux noeud de disposer de propriété indirectes
( hérité du type ou de l'extension ou d'un schema 'default' ) 

*/

Tree.definePlugin('proto', {
	node: {
		getDefault: function(name){
			var schema = this.tree.schemas[name], value;
			
			if( schema && 'default' in schema ){
				value = schema['default'];
				if( typeof value == 'function' ) value = value.call(this);
			}
			
			return value;
		}
	}
});