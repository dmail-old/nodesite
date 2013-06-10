
/*

name: memory

description: save actions to be able to undo/redo them

new Memory(limit)

limit: maximum actions to memorize (-1 means infinity)
memory.store(action): call this function to save a new action in memory
memory.restore(action, mode): function you have to define to tell how to cancel an action

*/

NS.Memory = NS.Item.extend({
	constructor: function(limit){
		this.limit = limit || 10;
		this.reset();
	},

	reset: function(){
		this.undos = [];
		this.redos = [];
	},

	store: function(entry){
		// on ne peut pas sauvegarder plus de undo, on supprime le plus ancien (le premier dans le tableau)
		if( this.undos.length == this.limit ) this.undos.shift();
		this.undos.push(entry);
		// une nouvelle action supprime tous les redos suivants
		this.redos = [];
	},

	// fonction destinée à être définie par l'objet qui a besoin de Memory
	restore: function(entry, mode){
		this.store(entry, mode);
	},

	from: function(mode){
		return mode == 'undo' ? this.undos : this.redos;
	},

	to: function(mode){
		return mode == 'undo' ? this.redos : this.undos;
	},

	has: function(mode){
		return this.from(mode).length !== 0;
	},

	// go(+3) -> trois redo(), go(-3) trois undo(), retourne le nombre d'opérations lancées
	go: function(num){
		var mode, sign, n = 0;

		if( typeof num != 'number' ) throw new TypeError('number expected');
		if( num < 0 ){
			mode = 'undo';
			sign = 1;
		}
		else if( num > 0 ){
			mode = 'redo';
			sign = -1;
		}

		while( num && this.has(mode) ){
			this.restore(this.from(mode).pop(), mode);
			n++;
			num+= sign;
		}

		return n;
	},

	undo: function(){
		return Boolean(this.go(-1));
	},

	redo: function(){
		return Boolean(this.go(1));
	}
});
