/* global browser */

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

			if( json == null ) return this.emit('handle', new Error('empty json'));
			if( json.error ) return this.emit('handle', new Error('SERVER : ' + json.message));
			this.emit('handle', null, json);
		},

		'text/html': function(){
			var html = this.response.text;
			this.emit('handle', null, html);
		}
	},

	createLink: function(){
		var request = NS.Request.new({
			link: 'chain',
			method: 'post'
		});

		request.setHeader('Accept', 'application/json');
		request.options.isSuccess = function(){
			var status = this.status, ok = status >= 200 && status < 300;

			if( ok ){
				var type = this.getHeader('content-type');

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
			if( options && options.callback ) this.once('handle', options.callback);
		});

		this.link = request;
	},

	init: function(callback){
		var data = {
			page: document.location.pathname
		};

		if( localStorage.userId ){
			data.userId = localStorage.userId;
		}

		this.callAction('init', data, callback);
	},

	applyAction: function(action, args, callback){
		this.link.send({
			callback: callback,
			data:{
				json: JSON.stringify([action].concat(args))
			}
		});
	},

	callAction: function(action){
		var args = Array.slice(arguments, 1);
		var callback = args[args.length-1];

		if( typeof callback == 'function' ) args.pop();

		return this.applyAction(action, args, callback);
	}
};

window.app = {
	setters: {
		title: function(title){
			document.title = title;
		}
	},

	events: {
		'click': 'click',
		'popstate':  'popstate'
	},

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

		this.eventListeners = NS.EventListener.new(window, this.events, this);
		this.eventListeners.listen();

		window.app.go();
	},

	showProgress: function(){
		var progress = this.progress = document.createElement('progress');

		progress.max = 100;
		this.setProgress(0);
		document.body.appendChild(progress);
	},

	setProgress: function(percent){
		this.progress.value = percent;
		this.progress.innerHTML = percent + '%';
	},

	setPage: function(page){
		for(var key in page){
			if( this.setters[key] ) this.setters[key].call(this, page[key]);
		}
	},

	// demande au serveur la page se trouvant à url
	go: function(url, state){
		var filename = document.location.pathname;

		// send the index file instead of the app.html file
		if( filename == '/app.html' ) filename = '/';

		document.title = filename;

		// prevent browser caching document
		// if( filename.endsWith('.html') ) filename+= '?rand=' + new Date().getTime();

		window.server.callAction('go', filename, function(error, response){
			if( error ) return console.error(error);

			var type = this.getHeader('content-type');

			if( type == 'text/html' ){
				document.body.innerHTML = response;
				response.stripScripts(true); // évalue le javascript se trouvant dans le html
			}
			else{
				if( response.html ) document.body.innerHTML = response.html;
			}
		});
	},

	// bouton back ou next activé
	popstate: function(e){
		window.app.go(document.location.href, e.state);
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
			window.app.go(element.href);
			e.preventDefault();
			return false;
		}
	}
};
