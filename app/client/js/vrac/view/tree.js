/*

*/

NS.viewDocument.define('tree', NS.viewDocument.require('rootnode').create({
	template: '<ul class="root" tabindex="0" data-indent="18"></ul>',
	events: {
		mouseover: function(e){
			var node = this.cast(e.target);

			//this.hasClass('compact') && e.target == view.getDom('name')

			if( node === null || node === this ){
				if( this.lighted ) this.lighted.unlight(e);
			}
			else{
				node.light(e);
			}
		},

		mouseout: function(e){
			if( this.lighted && !this.element.contains(e.relatedTarget) ){
				this.lighted.unlight(e);
			}
		},

		mousedown: function(e){
			var node = this.cast(e);

			if( node == null || node == this ) return;

			if( e.target.hasClass('tool') ){
				node.toggleState('expanded', e);
			}

			node.focus(e);
		},

		dblclick: function(e){
			// le futur menu contextuel doit prendre le pas sur ce dblclick
			if( !e.target.hasClass('tool') ){
				var node = this.cast(e);

				if( node != this ) node.toggleState('expanded', e);
			}
		}
	},
	lighted: null,
	focused: null,

	create: function(){
		NS.viewDocument.require('rootnode').create.apply(this, arguments);

		// indent
		this.emitter.on('insertElement', function(e){
			this.indentNode(e.target);
		});

		// lighted

		// ne peut t-on pas s'inspirer de ça?
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
		// section manipulating DOM Node
		this.on({
			light: function(e){
				if( this.lighted ) this.lighted.unlight(e.args[0]);
				this.lighted = e.target;
			},

			unlight: function(e){
				this.lighted = null;
			},

			destroy: function(e){
				var node = e.target;

				if( node.hasClass('lighted') ) node.unlight(e);
			}
		});

		// focused
		this.on({
			focus: function(e){
				if( this.focused ) this.focused.blur(e);
				this.focused = e.target;
				this.keynav.current = this.focused;
			},

			blur: function(e){
				this.focused = null;
			},

			destroy: function(e){
				var node = e.target;
				if( node.hasClass('focused') ) node.blur(e);
			}
		});

		// selection
		this.selection = NS.Selection.new(this);
		this.selection.filter = this.isSelectable;
		this.selection.getTarget = function(e){
			return this.root.cast(e);
		};

		this.on({
			select: function(e){
				this.selection.removeAll(e.args[0]);
				this.selection.range.push(e.target);
			},

			unselect: function(e){
				this.selection.range.remove(e.target);
			},

			destroy: function(e){
				var node = e.target;

				if( node.hasClass('selected') ) node.unselect(e);
			}
		});
	},

	indentNode: function(node){
		var padding = this.getAttribute('data-indent'), level = this.getLevel(node);

		if( level > -1 ){
			node.getDom('div').style.paddingLeft = (padding * level) + 'px';
		}
	},

	getLevel: function(node){
		var level = -1;

		while(node != this){
			level++;
			node = node.parentNode;
		}

		return level;
	},

	edit: function(node){
		NS.Editable.new(node.getDom('span'), function(value, oldValue){
			console.log('name changed from', oldValue, 'to', value);
		});
	}
}));

// working on drag support
Object.merge(NS.viewDocument.require('tree'), {
	events: {
		dragstart: function(e){
			var node = this.cast(e);

			if( node && node != this ){
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('nodes', this.toDataTransfer(this.selection.range));
			}
		},

		// lancé à intervalle régulier tant que je suis sur une cible
		dragover: function(e){
			var node = this.cast(e);


			if( node && node != this ){
				if( this.overed ) this.removePointer(this.overed);

				e.preventDefault();

				node.light(e);

				this.where = this.getWhere(node, e);
				this.overed = node;
				this.addPointer(node);
				this.checkDragScroll(e);
				this.checkDropEffect(e);
			}
		},

		// lancé une fois lorsque j'arrive sur une cible
		dragenter: function(e){
			var node = this.cast(e);

			if( node && node != this ){
				node.light(e);
			}
		},

		dragleave: function(e){
			var node = this.cast(e);

			if( node && node != this ){
				node.unlight(e);
				if( this.overed ) this.removePointer(this.overed);
			}
		},

		drop: function(e){
			var node = this.cast(e);

			if( this.overed ) this.removePointer(this.overed);

			if( node && node != this ){
				e.preventDefault();
				this.overed = node;
			}
			else{
				// lorsque je lache sur tree j'apelle unlight sur le noeud qui est ciblé
				if( this.overed ) this.overed.unlight(e);
			}

			this.checkDrop(e, node);
		},

		dragend: function(e){
			if( this.overed ) this.removePointer(this.overed);
		}
	},

	toDataTransfer: function(nodes){
		return nodes.map(function(node){
			return node.id;
		}).join(',');
	},

	fromDataTransfer: function(data){
		return data.split(',').map(function(id){
			return NS.View.self.instances[id];
		});
	},

	addPointer: function(node){
		node.addClass('dragover');
		node.addClass(this.where);
	},

	removePointer: function(node){
		node.removeClass('dragover');
		node.removeClass(this.where);
	},

	getWhere: function(node, e){
		if( node == this.firstChild && !this.allowRootInsertion ){
			return 'inside';
		}

		var height = this.getHeight(node), delta = e.pageY - node.element.measure('cumulativePosition', 'y');

		if( delta < height * 0.25 ){
			return 'before';
		}
		if( delta > height * 0.75 ){
			return 'after';
		}

		return 'inside';
	},

	checkDragScroll: function(e){
		/*var y = e.event.pageY;
		var top = this.element.measure('cumulativePosition', 'y');
		var bottom = top + this.element.measure('size', 'y');
		var offset = 30;
		var overflowY;

		// scroll vers le haut
		if( y > top && y < top + offset ){
			overflowY = -(y - top);
		}
		// scroll vers le bas
		else if( y > bottom - offset && y < bottom ){
			overflowY = (bottom - y);
		}
		else{
			overflowY = 0;
		}

		if( overflowY != this.overflow.y ){
			this.overflow.y = overflowY;

			if( overflowY == 0 ){
				this.scroller.cancel();
			}
			else{
				this.startScroll();
			}
		}*/
	},

	checkDropEffect: function(e){
		// chrome doesn't let us access getData during dragover
		if( NS.browser.chrome ) return;

		// alias: 'application/x-moz-file',
		if( e.dataTransfer.types.contains('files') ){
			if( this.overed.noinsert ) e.dataTransfer.dropEffect = 'none';
		}
		if( e.dataTransfer.types.contains('nodes') ){
			var nodes = this.fromDataTransfer(e.dataTransfer.getData('nodes'));
			var effect = e.dataTransfer.effectAllowed;
			var i;

			if( nodes.contains(this.overed) ){
				e.dataTransfer.dropEffect = effect;
			}
			else{
				for(i in nodes){
					if( true || nodes[i].checkAction(effect, this.overed, this.where) ){
						e.dataTransfer.dropEffect = effect;
					}
				}

				e.dataTransfer.dropEffect = 'none';
			}
		}
	},

	checkDrop: function(e){
		if( e.dataTransfer.types.contains('files') ){
			var files = e.dataTransfer.getData('files');
			// faut insérer ces fichiers
		}
		else if( e.dataTransfer.types.contains('nodes') ){
			var nodes = this.fromDataTransfer(e.dataTransfer.getData('nodes'));
			var effect = e.dataTransfer.effectAllowed;

			// si on lache le noeud sur un noeud du groupe on ne fait rien
			if( nodes.contains(this.overed) ) return;

			// le déplacement doit respecter l'ordre visuel
			nodes = nodes.sort(Element.comparePosition);
			if( this.where == 'after' ) nodes = nodes.reverse();

			// maintenant on déplace tout les noeuds
			for(var i in nodes){
				nodes[i][effect](this.overed, this.where);
			}
		}
	}
});

Object.append({}, {
	createFileReader: function(){
		var fileReader = new FileReader();

		fileReader.onerror = this.readError.bind(this);
		fileReader.onabort = this.readAbort.bind(this);
		fileReader.onprogress = this.readProgress.bind(this);
		fileReader.onload = this.readLoad.bind(this);

		return fileReader();
	},

	readError: function(e){
		switch(e.target.error.code){
		case e.target.error.NOT_FOUND_ERR:
			alert('File Not Found!');
			break;
		case e.target.error.NOT_READABLE_ERR:
			alert('File is not readable');
			break;
		case e.target.error.ABORT_ERR:
			break; // noop
		default:
			alert('An error occurred reading this file.');
		}
	},

	readProgress: function(e){
		if( e.lengthComputable ){
			var percentLoaded = Math.round((e.loaded / e.total) * 100);
		}

		// affiche la progression du chargement d'un fichier
	},

	readLoad: function(e){
		this.callback(null, e.target.result);
		this.callback = null;
	},

	readFile: function(file, encoding, callback){
		this.callback = callback;

		switch( encoding ){
		case 'base64':
			this.filereader.readAsDataURL(file);
			break;
		case 'binary':
			this.filereader.readAsBinaryString(file);
			break;
		case 'buffer':
			// non supporté pour le moment puisque difficile à passer au serveur
			this.tree.filereader.readAsArrayBuffer(file);
			break;
		default:
			this.tree.filereader.readAsText(file, document.characterSet);
			break;
		}
	},

	insert: function(child, index){
		function transfer(){}

		if( child instanceof File ){
			if( child.isFile() ){
				this.readFile(child, child.get('encoding'), function(error, data){
					child.set('data', data);
					transfer();
				});
			}
			else{
				child.set('listed', true);
				transfer();
			}
		}
		else{
			transfer();
		}
	}
});
