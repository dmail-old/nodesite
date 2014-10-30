var sectionRegex = /{#([A-Za-z][A-Za-z0-9]*)[^}]*}(.*?){\/\1}/g;
var pathRegex = /{([A-Za-z][A-Za-z0-9]*)[^}]*}/g;
var SectionExpression = {};
var PathExpression = {};

function createSectionFromMatches(matches){
	return 'Section-' + matches[1]; // {path: matches[1], template: matches[2]};
	//return SectionExpression.new(matches[1], matches[2]);
}

function createPathFromMatches(matches){
	return 'Path-' + matches[1];
	//return PathExpression.new(matches[1]);
}

function createString(string){
	return 'String-' + string;
}

function compile(string){
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
	var index, sectionMatches;
	var strings = [], expressions = [];
	var result = [];
	var before, after;
	var afterIndex;

	index = 0;
	sectionRegex.lastIndex = 0;

	function compilePaths(string){
		var index = 0, pathMatches;

		pathRegex.lastIndex = 0;

		// pour chaque path que l'on trouve
		while( true ){
			pathMatches = pathRegex.exec(string);
			if( pathMatches == null ) break;

			// ce qui est avant est un string
			result.push(createString(string.slice(index, pathMatches.index)));
			// crée le path
			result.push(createPathFromMatches(pathMatches));
			index+= pathRegex.lastIndex;
		}

		result.push(createString(string.slice(index, string.length)));
	}

	// pour chaque section que l'on trouve
	while( true ){
		sectionMatches = sectionRegex.exec(string);
		if( sectionMatches == null ) break;

		// ce qui est avant la section contient ptet des path et/ou strings		
		compilePaths(string.slice(index, sectionMatches.index));

		// crée la section
		result.push(createSectionFromMatches(sectionMatches));
		index+= sectionRegex.lastIndex;
	}
	
	// y'a plus de section, cherche dans ce qui reste (ce qui reste peut être tout)
	compilePaths(string.slice(index));

	return result;
}

compile('ok{#seca}{secapath}{/seca}a {name} ok {#section}{sectionpath}{/section}');