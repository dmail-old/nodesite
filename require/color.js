Object.append(String, {
	tags: {
		//styles
		bold: ['\033[1m', '\033[22m'],
		italic: ['\033[3m', '\033[23m'],
		underline: ['\033[4m', '\033[24m'],
		inverse: ['\033[7m', '\033[27m'],
		//grayscale
		white: ['\033[37m', '\033[39m'],
		grey: ['\033[90m', '\033[39m'],
		black: ['\033[30m', '\033[39m'],
		//colors
		blue: ['\033[34m', '\033[39m'],
		cyan: ['\033[36m', '\033[39m'],
		green: ['\033[32m', '\033[39m'],
		magenta: ['\033[35m', '\033[39m'],
		red: ['\033[31m', '\033[39m'],
		yellow: ['\033[33m', '\033[39m']
	},
	types: {},
	setters: {},
	
	defineType: function(type, properties){
		if( typeof properties == 'string' ) properties = {color: properties};
		
		this.types[type] = properties;
		// this.setters[type] = function(str){ return String.setType(str, type); };
	},
	
	setType: function(str, type){
		var key, properties = this.types[type], style, tag;
		
		for(key in properties){
			style = properties[key];
			tag = this.tags[style];
			if( tag ) str = tag[0] + str + tag[1];
		}
		
		return str;
	},
	
	removeTypes: function(str){
		return String(str).replace(/\u001b\[\d+m/g, '');
	}
});

String.defineType('a', {color: 'magenta', font:'bold'});
String.defineType('b', {color: 'grey'});
String.defineType('c', {color: 'red'});
String.defineType('d', {color: 'yellow'});
