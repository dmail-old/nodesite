module.exports = function(client, room, fn){
	client.join(room, fn);
	
	console.log('Le client', client.id, 'demande à rejoindre', room);
	
	client.join(room);
	
	// dit aux autres que celui-ci vient d'arriver
	client.broadcast.to(room).emit(room+'/join');
	// dit au client qu'il a été accepté
	client.emit(room+'/success');
	
	fn(true);
};