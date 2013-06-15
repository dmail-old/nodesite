module.exports = Object.prototype.extend({
	Url: require('url'),
	Cookie: require(root + '/module/cookie.js'),
	// metas utilisant l'attribut "http-equiv"
	http_equiv: [
		'content-language',
		'content-type',
		'refresh',
		'pragma',
		'expires',
		'cache-control',
		'cache'
	],
	metaTemplate: '<meta {attr}="{name}" content="{value}" />',
	styleTemplate: '<link type="text/css" rel="stylesheet" href="#" />',
	scriptTemplate: '<script type="text/javascript" src="#"></script>',

	// TODO, to avoid http request we serve the file directly
	//inlineStyleTemplate: '<style type="text/css">{css}</style>',
	//inlineScriptTemplate: '<script type="text/javascript">{js}</script>',

	constructor: function(request, response){
		var htmlFile = NS.File.new(root + '/client/app.html'), html;

		try{
			html = String(htmlFile.readSync());
		}catch(e){
			return NS.errorResponse.new(response, e);
		}

		var metas = {
			'charset': config.encoding,
			'content-type': 'text/html',
			'content-language': config.lang,
			'description': lang.metas.description,
			'keywords': lang.metas.keywords,
			'robots': config.robot || 'all'
			// viewport: 'width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=1;' // pour les portables
		};

		// si on est en local ceci évite la mise en cache qui est pénible
		if( config.local ){
			metas['cache-control'] = metas['pragma'] = 'no-cache';
			// metas['cache'] = 'no store';
			metas['expires'] = 0;
		}

		var data = {
			'metas': this.parseMetas(metas),
			'title': lang.metas.title,
			'favicon': this.setTagUrl('<link href="#" type="image/x-icon" rel="shortcut icon"/>', 'favicon.png'),
			'styles': this.parseStyles(config.css),
			'scripts': this.parseScripts(config.js),
			'lang': JSON.stringify(lang, Function.replacer),
			'config': JSON.stringify({
				'protocol': config.protocol,
				'host': config.host,
				'port': config.port
			})
		};

		logger.info('Send app.html');
		response.writeHead(200, {'content-type': 'text/html'});
		response.write(html.parse(data));
		response.end();
	},

	parseStyle: function(name){
		return this.setTagUrl(this.styleTemplate, 'css/' + name + '.css');
	},

	parseStyles: function(names){
		var output = [];

		names.forEach(function(name){
			output.push(this.parseStyle(name));
		}, this);

		return output.join('\n\t');
	},

	parseScript: function(name){
		return this.setTagUrl(this.scriptTemplate, 'js/' + name + '.js');
	},

	parseScripts: function(names){
		var output = [];

		names.forEach(function(name){
			output.push(this.parseScript(name));
		}, this);

		return output.join('\n\t');
	},

	parseMeta: function(name, value){
		name = name.toLowerCase();
		var attr = 'name', meta;

		if( this.http_equiv.contains(name) ){
			attr = 'http-equiv';
			name = name.capitalize();
		}

		if( name == 'charset' ){
			return '<meta charset="' + value + '" />';
		}

		return this.metaTemplate.parse({
			attr: attr,
			name: name,
			value: value
		});
	},

	parseMetas: function(metas){
		var output = [], name;

		for(name in metas){
			output.push(this.parseMeta(name, metas[name]));
		}

		return output.join('\n\t');
	},

	setTagUrl: function(tag, path){
		var url = this.Url.format({
			protocol: config.protocol,
			host: config.host + (config.port ? ':' + config.port : ''),
			pathname: path
		});

		return tag.replace('#', url);
	}
});
