function splitParts(parts, splitter){
	var i, j, part, subparts;

	i = 0;
	j = parts.length;
	while( i < j ){
		part = parts[i];
		if( typeof part == 'string' ){
			subparts = part.split(splitter);
			parts[i] = subparts;
		}
		else{
			splitParts(part, splitter);
		}

		i+= 2;
	}
}

function splitAll(string, splitters){
	var parts, i, j, splitter;
	
	i = 0;
	j = splitters.length;

	parts = string.split(splitters[i]);
	i++;
	while( i < j ){
		splitter = splitters[i];
		splitParts(parts, splitter, i, j);
		i++;
	}

	if( j > 1 ){
		parts = parts.flatten();
	}
	
	return parts;
}

String.prototype.splitBy = function(){
	return splitAll(this, Array.slice(arguments));
};