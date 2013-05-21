module.exports = function(client, room){
	console.log('Le client', client.id, 'demande à quitter', room);
	
	client.leave(room);
	
	// dit aux autres qu'il est parti
	client.broadcast.to(room).emit('leave');
	client.emit(room+'/success');
};