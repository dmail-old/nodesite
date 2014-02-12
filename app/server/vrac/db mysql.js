var mysql = require('mysql');

/*
if( config.local ){
	var childProcess = require('child_process');
	var child = childProcess.spawn('C:\Program Files\EasyPHP5.3.0\mysql\bin\mysqld.exe', []);
}
*/

/*
DB.connect();
DB.connection.query('SELECT user.id,user.name,code.name FROM user JOIN code ON (user.id = code.user)  LIMIT 1', function(err, rows, fields){
	if( err ){
		console.log('Impossible de se connecter');
		throw 'end';
	}
	console.log('Query result: ', rows, fields);
});
*/

var DB = {
	connect: function(){
		this.connection = mysql.createConnection({
			host     : config.db.host,
			user     : config.db.user,
			password : config.db.password,
			database : config.db.name
			/*,port: config.db.port
			,multipleStatements: true
			*/
		});
		
		this.connection.on('close', function(error){
		
		});
		
		/*this.connection.connect(function(error){
			if( error ) throw error;
		});
		*/
		
		// query({sql: 'SELECT * from', nestTables: true})
		// pour récup par nom de table
	},
	
	close: function(){
		this.connection.end();
	},
	
	query: function(sql, callback){
		this.connection.query({sql: sql, nestTables: true}, callback)
	},
	
	count: function(){
		
	},
	
	find: function(table, fields, end){
		
	},
	
	findAll: function(table, fields, end){
		
	},
	
	add: function(table, fields){
		
	},
	
	replace: function(table, fields){
		
	},
	
	update: function(table, fields){
		
	},
	
	remove: function(table, condition){
		
	}
};

var Table = new Class({
	initialize: function(name){
		this.name = name;
		this.fields = {};
	},
	
	set: function(key, value){
		this.fields[key] = value;
	},
	
	get: function(key){
		return this.fields[key];
	},
	
	erase: function(key){
		delete this.fields[key];
	},
	
	has: function(key){
		return typeof this.fields[key] != 'undefined';
	},
	
	hydrate: function(fields){
		this.fields = fields;
	},
	
	create: function(fields){
		DB.insert(this.name, fields, function(result){
			this.hydrate(fields);
			// si on a pas donner d'id pour fields on suppose que le champ est en auto_increment
			if( !this.has('id') ){
				this.set('id', result.lastId());
			}
		}, this);
	},
	
	update: function(key, value){
		var id = this.get('id'), fields = {};
		
		if( !this.has('id') ){
			console.warn('Update impossible: Id inconnu pour ' + this.name);
			return;
		}
		
		if( typeof key == 'string' ){
			fields[key] = value;
		}
		
		DB.update(this.name, fields, 'WHERE id = ?', id, function(){
			for(var key in fields) this.set(key, fields[key]);
		}, this);
	},
	
	remove: function(){		
		var id = this.get('id');
		
		if( !this.has('id') ){
			console.warn('Remove impossible: Id inconnu pour ' + this.name);
			return;
		}
		
		DB.remove(this.name, 'WHERE id = ? ', id, function(){
			this.fields = {};
		}, this);
	},
	
	selectBy: function(){
		/*if( count($this->data) && $this->identic($field, $value) ) return $this;
		
		$data = DB::select($this->name, '*', "WHERE $field = ? LIMIT 1", $value);
		
		if( $data )
		{	
			$table = new $this($this->name);
			$table->set($data);
			return $table;
		}
		return null;*/
	},
	
	identic: function(key, value, current){
		if( typeof current == 'undefined' ) current = this.get(key);
		
		// la comparaison de 1 et true retourne false mais un champ int(1) devrait valoir true sur un boolean faudrait ptet faire (string) $value
		// la recherche est par défaut caseinsensitive, c'est la bdd qui le définit comme ça
		// ce qui signifie que la comparaison entre deux chaine devrait toujours appeler mb_strtolower
		return String(value).toLowerCase() == String(current).toLowerCase();
	}
});

global.DB = DB;