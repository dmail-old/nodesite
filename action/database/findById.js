module.exports = function(table, id, fn){	
	if( typeof table == null ) return fn(null);
	if( typeof id == null ) return fn(null);
	
	table = DB.getTable(table);
	table.find(id, function(error, row){
		if( error ) return fn(error);
		fn({row: row});
	});
};