/*

name: Linker
description: Represent an HTMLElement contained in an other that will be linked to a model

path: lead to the HTMLElement ('0.1' => childNodes[0].childNodes[1])
link: called to link the HTMLElement to a model
unlink: called to unlink the HTMLElement from a model

*/

var Linker = {
	name: 'Linker',
	toString: function(){
		return this.name;
	},
	isLinker: function(item){
		return Linker.isPrototypeOf(item);
	},
	path: null,
	link: Function.EMPTY,
	unlink: Function.EMPTY,
	namedScope: Function.EMPTY,
	getNamedScopePath: function(path, subpath, alias){
		var namedPath = path;

		if( path == alias ){
			namedPath = subpath;
		}
		// à réécrire puisque subpath peut lui même contenir des .
		else if( path.split('.')[0] == alias ){
			namedPath = subpath + '.' + path.split('.').slice(1).join('.');
		}

		//console.log(path, '--', alias, 'veut dire', subpath, 'resultat:', namedPath);
		//console.log(path.split('.')[0].replace(' ', '_'), alias.replace(' ', '_'), path.split('.')[0] == alias);

		return namedPath;
	}
};