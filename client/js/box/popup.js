/*
---

name: Popup

description: Permet de créer des popups bien pratiques

TODO
- éviter les scrollbar au sein du contenu

FIX

...
*/

Element.Properties.onclick = {
	set: function(listener){
		this.on('click', listener);
	}
};

var exports = {
	options: {
		properties: {
			'html': '\
				<div class="body">\
					<div class="header">\
						<img src="../favicon.png" />\
						<h1>{title}</h1>\
						<button tabindex="-1"></button>\
					</div>\
					<form>\
						<div class="content" data-autoresize="true">{content}</div>\
					</form>\
				</div>\
			',
			'class': 'box popup big'
		},
		draggable: false,
		resizable: true,
		title: 'Titre',
		content: 'Hello world',
		zIndex: 90,
		left: NS.Box.calcPositionSpacePercent.curry('x', 0.5),
		top: NS.Box.calcPositionSpacePercent.curry('y', 0.5),
		overflow: 'auto',
		autoOpen: true,
		master: true,
		modal: false, // TODO
		submitclose: true,
		// disposedestroy: true,
		url: false,
		form: {
			// 'class': 'form'
		},
		buttons: []
	},

	constructor: function(){
		NS.Box.constructor.apply(this, arguments);

		if( this.options.submitclose ) this.on('submit', this.close);
	},

	createElement: function(){
		this.dom = {};

		this.options.properties.html = this.options.properties.html.parse({title: this.options.title, content: this.options.content});

		var
			element = NS.Box.createElement.call(this),
			header = element.getElement('className:*header*'),
			form = element.getElement('tagName:form'),
			title = header.getElement('tagName:h1'),
			closer = header.getElement('tagName:button'),
			content = form.getChild()
		;

		Object.append(this.dom, {
			popup: this.element,
			header: header,
			form: form,
			title: title,
			content: content
		});

		if( this.options.url ){
			this.options.overflow = 'hidden';
			this.dom.iframe = new window.IFrame({width:'100%', height:'100%', frameborder:0, onload:this.loaded.bind(this)});
			this.dom.content.innerHTML = '';
			this.dom.content.appendChild(this.dom.iframe);
		}

		content.style.overflow = this.options.overflow;
		form.setProperties(this.options.form);

		if( this.options.buttons && this.options.buttons.length ){
			var footer = new Element('div', {'class': 'footer'});
			var buttons = this.options.buttons, i = 0, j = buttons.length;

			for(;i<j;i++){
				footer.appendChild(new Element('button', buttons[i]));
			}

			form.appendChild(footer);
		}

		header.on('mousedown', function(e){ if( e.target != closer ) this.mousedown(e); }.bind(this));

		form.on('submit', this.bind('submit'));
		closer.on('click', this.bind('close'));

		return element;
	},

	getContainer: function(){
		return this.dom.content;
	},

	setTitle: function(title){
		this.dom.title.textContent = title;
		return this;
	},

	seturl: function(url){
		this.element.addClass('loading');
		this.dom.iframe.src = url || 'about:blank';
		return this;
	},

	loaded: function(){
		this.element.removeClass('loading');
		this.emit('load');
	},

	send: function(){
		this.dom.form.submit();
		return this;
	},

	submit: function(e){
		if( !this.dom.form.action ) e.stop();
		this.emit('submit', e);
	},

	dial: function(msg, error){
		if( !this.dialog || typeof msg == 'undefined' ) return this;

		this.dialog.innerHTML = msg;
		this.dialog[error ? 'addClass' : 'removeClass']('error');
		return this;
	},

	sendon: function(msg){
		var button = this.sendbutton;
		if( !button ) return this;

		button.removeProperty('disabled', true);
		return this.dial(msg);
	},

	sendoff: function(msg){
		var button = this.sendbutton;
		if( !button ) return this;

		button.setProperty('disabled', true);
		return this.dial(msg,true);
	}
};

exports = NS.Box.extend(exports);
NS.Popup = exports;

// autres classes qui se serviront de Popup

/*
var popFiles = new NS({
	Extends: Popup,
	options:{
		preview: false,
		selector: false
	},

	constructor: function(tree, options){
		this.tree = tree;
		this.parent(options);
	},

	build: function(){
		var options = this.options,
		fileContainer = new Element('div',{'class':'file_container'}),
		previewContainer = new Element('div',{'class':'preview_container'}),
		filePreview = new Element('div',{'class':'file_preview'}),
		canvas = new Element('canvas',{width:32,height:32});

		var files = new Files(fileContainer, this.tree, options);

		this.canvas = canvas;
		if( options.preview ){
			if( typeof options.preview != 'function' ) options.preview = this.basicPreview.bind(this);
			files.addEvent('select', options.preview);
		}
		files.addEvent('open',this.bound.close);

		filePreview.appendChild(canvas);
		previewContainer.appendChild(filePreview);

		options.body = [fileContainer, previewContainer];

		if( options.actionbody ){
			var fileAction = new Element('div',{className:'file_action'});
			fileContainer.style.height = '40%';
			fileAction.appendChild(options.actionbody);
			options.body.push(fileAction);
		}

		//if( options.selector ) this.selector = new Selector(filePreview, options.selector);
		//options.resizeList.push(body);

		this.parent();
	},

	sending: function(){
		this.files.open(this.files.selecteds[0]);
		this.parent();
	},

	dispose: function(){
		this.files.destroy();
		if( this.selector ) this.selector.destroy();
		this.parent();
	},

	basicPreview: function(file, canvas){
		canvas = this.canvas;

		var ctx = canvas.getContext('2d');

		loader.abort();
		ctx.clearRect(0,0,canvas.width,canvas.height);
		loader.load(file,{
			onComplete: function(img){
				canvas.width = img.width || 32;
				canvas.height = img.height || 32;
				if( !img.null ) ctx.drawImage(img,0,0);
			}.bind(this)
		});
	}
});
*/
