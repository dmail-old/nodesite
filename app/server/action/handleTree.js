module.exports = function(actions){	
	var callback = this.send.bind(this);
	
	console.log('un arbre demande les actions suivantes:', actions);
	
	var self = this;
	var responses = [];
	
	function onAction(error){
		if( error ){
			responses.push(error);
			return callback(responses);
		}
		
		
		var action = actions.shift();
		
		if( !action ) return callback(responses);
		
		var args = action[1];
		args.concat(action[2]);
		args.push(onAction);
		
		self.applyScript('./filesystem/' + action[0] + '.js', args);
	}
	onAction();	
};