/**

TODO

enum: type string only, doit faire partie d'une liste
min, max, regexp, singleSpace, trim sont spécifiques aux nombres ou aux chaines hors il est quand même possible de mettre cela si on a mit type number ou string

Pour une table on peut donner des contraintes aux propriétés:

type - (string) Impose que la valeur soit d'un type particulier
	'number':
	'date':
	'function':
	'array':
	'boolean':
	'object':
	'regexp':
unique - (boolean) A true la valeur doit être unique
default - (?) Une valeur ou une fonction retournant une valeur qui seras utilisé par défaut (si type = "function" on verras)
match - (function) Fonction qui recevras la valeur et retourne true ou false
regexp - (regexp) La valeur doit vérifier cette regexp
lowerCase - (booolean) La valeur seras mise en minuscule
upperCase - (boolean) La valeur seras mise en majuscule
trim - (boolean) Les espaces de début et de fin seront supprimé
singleSpace - (boolean) Les espaces doublé seront supprimé
min - (number) La valeur doit être supérieure ou égale à ce minimum
max - (number) La valeur doit être inférieur ou égale à ce maximum
length - (number) La valeur doit être de cette longueur
set - (function) Retourne la valeur telle qu'elle doit être sauvegardé
get - (function) Retourne la valeur telle qu'elle doit être retournée depuis la BDD

*/

var Rules = {
	id:{
		type: 'number',
		unique: true,
		index: true,
		default: function(){
			this.UID = this.getFree('id', this.UID || 1);
			return this.UID;
		}
	},
	name:{
		type: 'string',
		unique: true,
		index: true,
		trim: true,
		singleSpace: true,
		regexp: /^[\w ]+$/
	},
	email:{
		type: 'string',
		regexp: /^[a-z0-9&\'\.\-_\+]+@[a-z0-9\-]+\.([a-z0-9\-]+\.)*?[a-z]+$/i
	},
	ctime:{
		type: 'date',
		default: Date.now
	},
	mtime:{
		type: 'date',
		// lorsque la ligne est modifié le mtime est modifié
		onupdate: Date.now,
		default: Date.now
	}
};

var schemas = {};

schemas['default'] = {
	encoding: 'utf8',
	caseSensitive: false,
	// cela signifie que toutes les tables doivent avoir un id
	rules: {id: Rules.id}
};

schemas['user'] = {
	rules:{
		id: Rules.id,
		name: Rules.name,
		password: Rules.password,
		email: Rules.email,
		ctime: Rules.ctime,
		mtime: Rules.mtime
	}
};

schemas['user.session'] = {
	rules:{
		id: Rules.id,
		token: {type: 'string'},
		user: {ref: 'user'},
		ctime: Rules.ctime,
		mtime: Rules.mtime,
		ip: {type: 'string'}
	}
};

// un utilisateur peut avoir plusieurs joueur
schemas['user.players'] = {
	rules:{
		user: {ref: 'user'}
	}
};

schemas['player'] = {
	rules:{
		ctime: Rules.ctime
	}
};

// un joueur peut avoir plusieurs objet
schemas['player.items'] = {
	rules:{
		player: {ref: 'player'},
		item: {ref: 'item', notnull: true}
	}
};

module.exports = schemas;