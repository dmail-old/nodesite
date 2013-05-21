module.exports = function(path, data, callback){
	
	// default mode for file and directory
	var mode = 0777;
	
	if( data.type == 'file' ){
		FS.open(path + '/' + data.name, 'w', data.mode || mode, function(error, fd){
			if( error ) return callback(error);
			
			var content = data.content, type = typeof content;
			
			if( type == 'undefined' ) content = '';
			else if( type == 'object' ){
				try{
					content = JSON.stringify(content);
				}
				catch(e){
					return callback(e);
				}
			}
			else if( type != 'string' && !Buffer.isBuffer(content) ) return callback(new TypeError('file content must be a string or a buffer'));
			
			if( content.length === 0 ){
				FS.close(fd, callback);
			}
			else{
				if( typeof content == 'string' ){
					if( data.encoding == 'base64' ){
						// le navigateur ajoute 'data:image/gif;base64,' au début des données ce qui ne fait pas partie des données du fichier
						// ceci devrait surement se faire coté client
						content = content.replace(/^data:.*?;base64,/, '');
					}
					content = new Buffer(content, data.encoding || config.encoding);
				}
				
				FS.write(fd, content, 0, content.length, 0, function(error, written, buffer){
					if( error ) return callback(error);
					if( written != buffer.length ) return callback(new Error('partial writing'));
					FS.close(fd, callback);
				});
			}
		});
	}
	else{
		FS.mkdir(path + '/' + data.name, data.mode || mode, function(error){
			if( error ) return callback(error);
			
			var children = data.children;
			
			if( typeof children == 'undefined' ){
				callback();
			}
			else{
				if( !(children instanceof Array) ) return callback(new TypeError('directory children muste be an array'));
				
				function nextChild(error){
					if( error ) return callback(error);
					// tout les enfants ont été créés
					if( children.length === 0 ) return callback();
					
					callScript(__filename, this, path + '/' + data.name, children.shift(), nextChild);
				};
				nextChild();
			}
		});
	}
	
};