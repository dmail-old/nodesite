window.server = {
	link: null,
	handlers: {
		'application/json': function(){
			var text = this.response.text, json;

			try{
				json = JSON.parse(text);
			}
			catch(e){
				return this.emit('handle', e);
			}

			if( json == null ){
				return this.emit('handle', new Error('empty json'));
			}
			if( json.status != 200 ){
				return this.emit('handle', new Error('SERVER : ' + json.data));
			}

			this.json = json;

			this.emit('handle', null, json.data);
		},

		'text/html': function(){
			var html = this.response.text;
			this.emit('handle', null, html);
		}
	},

	createLink: function(){
		var request = NS.Request.new({
			link: 'chain',
			method: 'post',
			format: 'json'
		});

		request.parseContentType = function(contentType){
			if( contentType ){
				var index = contentType.indexOf(';');
				if( index !== -1 ){
					contentType = contentType.slice(0, index);
				}
			}

			return contentType;
		};
		request.getContentType = function(){
			return this.parseContentType(this.getHeader('content-type'));
		};
		request.setHeader('Accept', 'application/json');
		request.options.isSuccess = function(){
			var status = this.status, ok = status >= 200 && status < 300;

			if( ok ){
				var type = this.getContentType();

				if( type in window.server.handlers ){
					window.server.handlers[type].call(this);
				}
				else{
					this.emit('handle', new Error('response content type not supported'));
				}

				return true;
			}
			else{
				this.emit('handle', new Error('bad status'));

				return false;
			}
		};
		request.on('request', function(options){
			if( options && options.callback ){
				this.once('handle', options.callback);
			}
		});

		this.link = request;
	},

	applyAction: function(action, args, callback){
		this.link.send({
			url: location.origin + '/action/' + action,
			format: 'json',
			data: { json: JSON.stringify(args) },
			callback: callback
		});
	},

	callAction: Function.createApplyAlias('applyAction', 1)
};

window.route = {
	location: document.location.href,
	routes: [],

	when: function(route, fn, bind){
		var test;

		if( typeof route == 'string' ){
			route = route.escapeRegExp();

			if( route.startsWith('\\/') ){
				route = '.+' + route.substring(2);
			}
			route = route.replace(/\\\*/g, '(.*)+');
			route = new RegExp(route);
		}
		if( route instanceof RegExp ){
			test = function(path){
				var match = path.match(this.route);

				if( match ){
					if( match.length > 1 ) return match.slice(1);
					return true;
				}
				return false;
			};
		}
		if( typeof route == 'function' ){
			test = route;
		}

		this.routes.push({
			route: route,
			test: test,
			listener: fn,
			bind: bind || this
		});
	},

	resolve: function(route, path){
		var result = route.test(path);

		if( result === true ){
			route.listener.call(route.bind);
			return true;
		}
		if( result instanceof Array ){
			route.listener.apply(route.bind, result);
			return true;
		}

		return false;
	},

	change: function(path){
		var i = this.routes.length;

		while(i--){
			if( this.resolve(this.routes[i], path) ) break;
		}
	}
};

window.app = {
	init: function(){
		String.implement('stripScripts', function(exec){
			var scripts = '';
			var text = this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(all, code){
				scripts += code + '\n';
				return '';
			});

			if( exec === true ){
				NS.browser.exec(scripts);
			}
			else if( typeof exec == 'function' ){
				exec(scripts, text);
			}

			return text;
		});

		window.server.createLink();

		this.emitter = NS.ElementEmitter.new(window);
		this.emitter.on({
			'click': this.click,
			'popstate': this.popstate
		});

		var prefix = 'client';

		window.route.when('*', function(where){
			this.go(where);
		}, this);

		window.route.when('/example', function(){
			var pathname = location.pathname;
			// pour le moment on va considérer que si y'a pas d'extension c un dossier
			var isDirectory = pathname.indexOf('.', pathname.lastIndexOf('/')) === - 1;

			if( isDirectory ){
				window.server.callAction(
					'filesystem/readdir',
					'client' + pathname,
					function(error, filenames){
						if( error ) return console.warn(error);

						var html = '', i = 0, j = filenames.length, filename;
						for(;i<j;i++){
							filename = filenames[i];
							html+= '<a href="'+ pathname +'/'+ filename +'">'+filename+'</a><br />';
						}

						window.app.setPage(html);
					}
				);
			}
			else{
				this.go(pathname);
			}
		}, this);

		window.route.change(document.location.href);
	},

	setPage: function(html){
		//$('page').innerHTML = html;
		document.body.innerHTML = html;
		if( typeof Template != 'undefined' ){
			window.Template.bootstrap(document.body);
		}
		html.stripScripts(true); // évalue le javascript se trouvant dans le html
	},

	// demande au serveur la page se trouvant à url
	go: function(url, state){
		document.title = url;

		// prevent browser caching document
		// if( filename.endsWith('.html') ) filename+= '?rand=' + new Date().getTime();

		var self = this;

		window.server.callAction('go', url, function(error, response){
			if( error ) return console.warn(error);

			var type = this.getContentType();

			if( type == 'application/json' ){
				type = this.json.headers['content-type'];
			}

			if( type == 'text/html' ){
				self.setPage(response);
			}
		});
	},

	// bouton back ou next activé
	popstate: function(e){
		window.route.change(document.location.href, e.state);
	},

	// lorsqu'on click sur un élément de la page
	click: function(e){
		var element = e.target;

		if( element != document && element.tagName.toLowerCase() == 'a' ){
			// click de molette
			if( e.code == 2 ) return true;
			// touche ctrl ou touche cmd
			if( e.control || e.meta ) return true;
			// URL courante, on laisse la page se recharger
			if( document.location.href == element.href ) return true;
			// URL externe
			if( document.location.hostname != element.hostname ) return true;

			// les URL internes entrainent une requête AJAX et history.pushState
			history.pushState(null, null, element.href);
			window.route.change(element.href);
			e.preventDefault();
			return false;
		}
	}
};
