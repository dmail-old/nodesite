/*
---

name: Menu plugin

description: Lorsque Tree possède lui même un menu

...
*/

(function(){

function getMenuOptions(){
	var options = [];
	
	var active = {
		name: 'active',
		state: function(node){
			if( !node ) console.trace();
			if( node.never('active') ) return 'hidden';
			if( !node.can('active') ) return 'disabled';
		},
		action: function(node, e){
			node.active(e);
		}
	};
	
	options.push(active);
	
	if( this.hasPlugin('tool') ){
		var expand = {
			name: 'expand',
			state: function(node){
				if( node.never('expand') || node.hasState('expanded') ) return 'hidden';
				if( !node.can('expand') ) return 'disabled';
			},
			action: function(node, e){
				node.expand(e);
			}
		};
		
		var contract = {
			name: 'contract',
			sep: true,
			state: function(node){
				if( node.never('contract') || !node.hasState('expanded') ) return 'hidden';
				if( !node.can('contract') ) return 'disabled';
			},
			action: function(node,e){
				node.contract(e);
			}
		};
		
		options.push(expand, contract);
	}
	
	/*
	'download' in document.createElement('a') -> vrai que sous chrome, sinon on doit passer par le serveur
	if( this.hasPlugin('file') ){
		var download = {
			name: 'download',
			state: function(node){
				
			},
			action: function(node, e){
				var a, blob;
				
				if( node.origin instanceof File ){
					blob = node.origin;
				}
				else{
					blob = new Blob(['hey'], {'type':'application/octet-stream'});
				}
				
				a = document.createElement('a');
				
				a.innerHTML = 'télécharger';
				a.setProperty('download', node.name);
				a.setProperty('href', window.URL.createObjectURL(blob));
				a.click();
				
				document.body.appendChild(a);
			}
		};
		
		options.push(download);
	}
	*/
	
	//var open = {name: 'open'};	
	
	var display = {
		name: 'display',
		state: function(node){
			if( !node.isRoot ) return 'hidden';
		},
		sep: true,
		children: []
	};
	
	display.children.push({
		name: 'soft',
		type: 'radio',
		state: function(node){
			if( node.tree.element.hasClass('line') ) return 'actived';
		},
		action: function(node){
			node.tree.element.removeClass('compact').addClass('line');
		}
	});
	display.children.push({
		name: 'dot',
		type: 'radio',
		state: function(node){
			if( node.tree.element.hasClass('compact') ) return 'actived';
		},
		action: function(node){
			node.tree.element.removeClass('line').addClass('compact');
		}
	});
	
	options.push(display);
	
	if( this.hasPlugin('sort') ){
		var sort = {
			name: 'sort',
			state: function(node){ if( node.never('sort') ) return 'hidden'; },
			children: []
		};
		
		['index','name','mtime','type','size'].each(function(name,i){
			sort.children[i] = {
				type: 'radio',
				name: name,
				state: function(node){
					if( node.get('orderby').substr(1) == name ) return 'actived';
					this.langName = lang.keys[name] || name;
					this.updateHTMLName();
					if( !node.can('sort', node.get('orderby').substr(0,1) + name) ) return 'disabled';
				},
				action: function(node){
					node.sort(node.get('orderby').susbtr(0,1) + name);
				}
			};
		});
		sort.children[0].langName = lang.none;
		sort.children[4].sep = true;
		['asc','desc'].each(function(name){
			sort.children.push({
				type: 'radio',
				name: name,
				state: function(node){
					var order = name == 'asc' ? '+' : '-';
					if( node.get('orderby').substr(0,1) == order ) return 'actived';
					if( !node.can('sort', order + node.get('orderby').substr(1)) ) return 'disabled';
				},
				action: function(node){
					var order = name == 'asc' ? '+' : '-';
					node.sort(order + node.get('orderby').substr(1));
				}
			});
		});
		
		options.push(sort);			
	}
	
	if( this.hasPlugin('list') ){
		var relist = {
			name: 'relist',
			key: 'f5',
			sep: true,
			state: function(node){
				if( !node.is('listed') ) return 'hidden';
			},
			action: function(node){
				node.relist();
			}
		};
		
		options.push(relist);
	}
	
	if( this.hasPlugin('clipboard') ){
		var cut = {
			name: 'cut',
			key: 'ctrl+x',
			state: function(node){
				if( node.isRoot ) return 'hidden';
			},
			action: function(node, e){
				Tree.clipboard.cut(node, e);
			}
		};
		
		var copy = {
			name: 'copy',
			key: 'ctrl+c',
			state: cut.state,
			action: function(node, e){
				Tree.clipboard.copy(node, e);
			}
		};
		
		var paste = {
			name: 'paste',
			key: 'ctrl+v',
			sep: true,
			// lorsque targetNode est un fichier on fait paste sur le parent de ce noeud
			active: function(e){
				if( this.tree.targetNode.never('insert') ) this.tree.targetNode = this.tree.targetNode.parentNode;
				this.tree.nodeConstructor.prototype.active.call(this, e);
			},
			state: function(node){
				if( node.never('insert') || !Tree.clipboard.hasData() ) return 'hidden';
			},
			action: function(node, e){
				Tree.clipboard.paste(node, e);
			}
		};
		
		Tree.clipboard.on('change', function(){
			this.menu.getNode('paste').reset();
		}.bind(this));
		
		options.push(cut, copy, paste);
	}
	
	if( this.hasPlugin('memory') ){
		var undo = {
			name: 'undo',
			key: 'ctrl+z',
			state: function(node){
				if( !node.tree.memory.has('undo') ) return 'hidden';
				
				var undos = node.tree.memory.undos;
				var entry = undos[undos.length - 1];
				var call = entry[0];
				var action = call[0];
				
				if( action == 'insert' ) action = 'remove';
				else if( action == 'remove' ){
					action = call[2][0] == 'fromcopy' ? 'copy' : 'insert';
				}
				else if( action == 'update' && call[2][0] == 'name' ){
					action = 'rename';
				}
				
				this.htmlName = 'undo_' + action;
				this.updateHTMLName();
			},
			action: function(node){
				node.tree.memory.undo();
			}
		};			
		
		var redo = {
			name: 'redo',
			key: 'ctrl+y',
			sep: true,
			state: function(node){
				if( !node.tree.memory.has('redo') ) return 'hidden';
				
				var redos = node.tree.memory.redos;
				var entry = redos[redos.length -1];
				var call = entry[entry.length - 1];
				var action = call[0];
				
				if( action == 'update' && call[2][0] == 'name' ){
					action = 'rename';
				}
				
				this.htmlName = 'redo_' + action;
				this.updateHTMLName();
			},
			action: function(node){
				node.tree.memory.redo();
			}
		};
		
		options.push(undo, redo);
	}
	
	var remove = {
		name: 'remove',
		key: 'delete',
		state: function(node){
			if( node.never(this.name) ) return 'hidden';
			
			this.htmlName = node.tree.hasPlugin('trash') ? 'trash' : 'remove';
			this.updateHTMLName();
		},
		action: function(node, e){
			var
				tree = node.tree,
				nodes = tree.selecteds,
				j = nodes.length,
				message,
				action = e.shift || !tree.hasPlugin('trash') ? 'remove' : 'trash'
			;
			
			if( j == 0 ) return;
			if( j == 1 ) message = lang.menu['valid_' + action].parse({name: node.name});
			else message = lang.menu['valid_multi_' + action].parse({count: j});
			
			tree.setPopup(valid(
				message,
				function(yes){ if( yes ) tree[action](nodes, e); }
			));
		}
	};
	
	options.push(remove);
	
	if( this.hasPlugin('edit') ){
		// rename et insert ont besoin du plugin edit
		var rename = {
			name: 'rename',
			key: 'f2',
			sep: true,
			state: function(node){
				if( node.never(this.name) ) return 'hidden';
			},
			action: function(node){
				node.edit();
			}
		};
		
		var insert = {
			name: 'insert',
			sep: true,
			state: function(node){
				if( node.never(this.name) ) return 'hidden';
			},
			children: []
		};
		
		['dir','file'].forEach(function(type){
			insert.children.push({
				img: 'extensions/' + type + '.png',
				name: 'insert_' + type,
				action: function(node){
					// désélectionne le noeud
					node.unselect();
					
					var name = lang.menu.getInsertName.call(node, type);					
					var child = node.tree.createNode({
						type: type,
						focused: true,
						selected: true,
						name: node.tree.hasPlugin('unique') ? node.getFree('name', name) : name,
					});
					
					if( type == 'dir' ) child.setProperty('listed', true);
					child.defaultEdit = true;
					
					node.insert(child, 'inside');
				}
			});
		});
		
		options.push(rename, insert);
	}
	
	var properties = {
		name: 'properties',
		key: 'space',
		sep: true,
		action: function(node){
			var content = '<ul>';
			
			for(var property in node.properties){
				content+= '<li>';
				content+= '<label>' + (lang.keys[property] || property) + '</label>';
				content+= '<span>' + node.properties[property] + '</span>';
				content+= '</li>';
			}
			
			content+= '</ul>';
			
			var popup = new Popup({
				minwidth: 350,
				title: 'Propriétés de '+node.name,
				content: content
			});
			
			popup.open();
			node.tree.setPopup(popup);
		}
	};
	
	options.push(properties);
	
	return options;
}

Tree.definePlugin('menu', {
	require: 'popup',
		
	init: function(){
		this.menu = new Menu();
		this.menu.root.setChildren(getMenuOptions.call(this));
		
		Object.append(this.menu, {
			tree: this,
			
			updateTarget: function(e){
				var node;
				
				if( e ){
					// comme l'event keydown se produit sur l'arbre il faut bien dire que c'est le noeud focused qui est concerné
					if( e.type == 'keydown' ) node = this.tree.focused;
					// lorsqu'on appui sur la touche clavier contextmenu
					else if( e.type == 'contextmenu' && !e.rightClick ) node = this.tree.focused;
					else node = e.target.toTreenode();
					
					if( e.type == 'dblclick' && e.target.hasClass('tool') ){
						this.target = e.target;
						this.targetNode = null;
					}
				}
				
				if( !node ) node = this.tree.root;
				
				this.target = node.getDom(node.isRoot ? 'branch' : 'name');
				this.targetNode = node;
				
				return this;
			},
			
			getTarget: function(){
				return this.targetNode || this.tree.focused;
			}
		});
		
		// l'event keydown et dblclik sont maintenant géré par le menu
		this.eventList.remove('keydown', 'dblclick');
		
		this.menu.on('open', function(){
			// pendant que le menu est ouvert -> pas d'effet lighted
			if( this.tree.eventList.contains('mouseover') ){
				this.tree.eventList.remove('mouseover');
				this.once('close', function(){ this.tree.eventList.add('mouseover'); });
			}
			this.tree.eventList.remove('keydown');
			this.once('close', function(){ this.tree.eventList.add('keydown'); });
		});
		
		this.on('setElement', function(element){
			this.menu.attach(element);
		});
		this.on('destroyElement', function(){
			this.menu.detach();
		});
		
	}
});

})();