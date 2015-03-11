/*

Ce que fait youtube est plutot cool il envoit une requête AJAX
et recoit css, html, title, js ensuite il a pu qu'à mettre le CSS et le HTML ou il faut le script aussi

*/

var helper = {
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
	charsetMetaTemplate: '<meta charset="{value}" />',
	tags: {
		favicon: '<link href="#" type="image/x-icon" rel="shortcut icon"/>',
		style: '<link href="#" type="text/css" rel="stylesheet" />',
		script: '<script src="#" type="text/javascript"></script>',
		module: '<script src="#" type="text/module"></script>'
	},

	setTagUrl: function(tag, path){
		var url = require('url').format({
			protocol: config.protocol,
			host: config.host + (config.port ? ':' + config.port : ''),
			pathname: path
		});

		return tag.replace('#', url);
	},

	renderTag: function(type, name){
		return this.setTagUrl(this.tags[type], name);
	},

	renderTags: function(type, names){
		var output = [];

		names.forEach(function(name){
			output.push(this.renderTag(type, name));
		}, this);

		return output.join('\n\t');
	},

	renderMetaTag: function(name, value){
		name = name.toLowerCase();
		var attr = 'name', meta;

		if( this.http_equiv.indexOf(name) != -1 ){
			attr = 'http-equiv';
			name = name.capitalize();
		}

		if( name == 'charset' ){
			return this.charsetMetaTemplate.render({
				value: value
			});
		}

		return this.metaTemplate.render({
			attr: attr,
			name: name,
			value: value
		});
	},

	renderMetaTags: function(metas){
		var output = [], name;

		for(name in metas){
			output.push(this.renderMetaTag(name, metas[name]));
		}

		return output.join('\n\t');
	}
};

module.exports = {
	title: 'coucou',

	GET: function(page){
		var metas = {
			'charset': config.charset,
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

		var jsFiles = config.js;

		/*
		if( config.debug_modules ){
			var testFiles = require('fs.extra').readdirSyncRecursive(global.CLIENT_PATH + '/tests');
			testFiles = testFiles.map(function(fileName){ return fileName.slice(global.CLIENT_PATH.length); });
			testFiles.unshift('node_modules/tester.js');
			jsFiles = jsFiles.concat(testFiles);
		}
		*/

		// les fichiers js proviendront à la fois des dossier test/
		// mais seront aussi automatiquement injecté, voir dans node_modules.dependencies

		var modules = []; // ça c'est à faire

		var cssFiles = config.css.map(function(name){
			return 'css/' + name + '.css';
		});

		jsFiles = jsFiles.map(function(name){
			if( !name.endsWith('.js') ) return name + '.js';
			return name;
		});

		var origin = require('url').format({
			protocol: config.protocol,
			host: config.host + (config.port ? ':' + config.port : ''),
			pathname: page.request.url.pathname
		});

		// return Promise.resolve()
		return {
			body: {
				'origin': origin,
				'metas': helper.renderMetaTags(metas),
				'title': lang.metas.title,
				'favicon': 'favicon.png',
				'styles': helper.renderTags('style', cssFiles),
				'scripts': helper.renderTags('script', jsFiles),
				// module requested are cached, we can use that cache to preload module on page init
				// we got the requested module and their resolvedPaths
				'moduleTree': null,// this.requestHandler.router.middlewares.module.RequireContext.cache,
				'lang': lang,
				'config': {
					'protocol': config.protocol,
					'host': config.host,
					'port': config.port
				}
			}
		};
	}
};