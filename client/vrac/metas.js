var Meta = {
	metas:{
		'content-type': 'text/html',
		'content-language': 'fr',
		charset: 'utf8',
		description: 'Description du site',
		keywords: 'des, mots, clés',
		robots: 'all',
		viewport: 'width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=1;' // pour les portables
	},
	
	http: [
		'charset',
		'content-type',
		'content-language',
		'cache-control',
		'refresh',
		'pragma',
		'expires'
	],	
	
	init: function(){
		for(var name in this.metas){
			this.create(name, this.metas[name]);
		}
	},
	
	getNameKey: function(name){
		return this.http.contains(name) ?  'http-equiv' : 'name';
	},
	
	getName: function(name){
		name = name.toLowerCase();
		
		return name;
	},
	
	setValue: function(meta, name, value){
		if( name == 'charset' ){
			meta.setProperty('charset', value);
		}
		else{
			meta.setProperty(this.getNameKey(name), name);
			meta.setProperty('content', value);
		}
	},
	
	find: function(name){
		name = this.getName(name);
		
		return document.head.getChild(function(el){
			if( el.tagName.toLowerCase() != 'meta' ) return false;
			var value = el.hasProperty('http-equiv') ? el.getProperty('http-equiv') : el.getProperty('name');
			if( value.toLowerCase() == name ) return true;
		});
	},
	
	create: function(name, value){
		name = this.getName(name);
		
		var meta = document.createElement('meta');
		
		this.setValue(meta, name, value);
		document.head.appendChild(meta);
		
		return meta;
	},
	
	update: function(name, value){
		name = this.getName(name);
		
		var meta = this.find(name);
		if( !meta ){
			this.create(name, value);
		}
		else{
			this.setValue(meta, name, value);
		}
	}
};