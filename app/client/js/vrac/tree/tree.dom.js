// l'arbre représente le dom (function, array, object)

Tree.definePlugin('dom', {
	types: {
		string: {
			nolist: true,
		},
		
		'function': {
			list: function(){
				
			}
		},
		
		object: {
			list: function(){
				var children = [];
				
				if( this instanceof Array ){
					
				}
				else{
					
				}
				
				this.callAction('list', children);
			}
		}
	}
	
	init: function(){
		this.setSchema('list', 'populate', true);
	}
});