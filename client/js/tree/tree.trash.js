/*
---

name: trash

description: Cache les noeuds ayant l'extension 'trash' ce qui permet de simuler une corbeille gardant les fichiers avant suppression définitive

require: types,extension

require que l'extension soit ajoutée au type (actuellement dans tree.file puisqu'on ne fait ça que pour node.hasType('file'))

...
*/

Tree.trashExt = 'trash';

Tree.definePlugin('trash', {
	require: 'types,extension',
	
	extensions: {
		// l'extension trash cache les noeuds
		'trash': {
			hidden: true
		}
	},
	
	init: function(){
		/*
		on peut le faire mais par contre dans edit() on l'empêche
		si je l'empêche je suis embété au niveau de insertCall 'rename' avec .trash dans les conflit de nom 
		
		var preventrename = this.prevents.rename;
		this.definePrevent('rename', function(name){
			if( preventrename.apply(this, arguments) ) return true;
			return name.endsWith('.trash');
		});
		*/
		
		this.define('trash', 'method', function(){ this.setProperty('name', this.name + '.' + Tree.trashExt); });
		this.define('recycle', 'method', function(){ this.setProperty('name', Path.filename(this.name)); });
		this.define('trash', 'cancel', function(){ return Path.extname(this.name).substr(1) == Tree.trashExt; });
		this.define('recycle', 'cancel', function(){ return Path.extname(this.name).substr(1) != Tree.trashExt; });
		
		if( this.hasPlugin('memory') ){
			// si on utilise trash c'est que remove ne peut être annulé
			this.define('trash', 'reverse', function(){ return ['recycle', this]; });
			this.define('recycle', 'reverse', function(){ return ['trash', this]; });
		}
	}
});