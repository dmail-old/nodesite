NS.viewDocument.define('menu', NS.viewDocument.require('rootnode').extend({
	template: '<ul class="root menu line unselectable"></ul>',
	events: {
		mousedown: function(e){
			var node = this.cast(e);

			e.preventDefault();
			if( node && node.firstChild ) node.expand(e);
		},

		mousemove: function(e){
			var node = this.cast(e);

			if( node && node != this ){
				if( !node.hasState('lighted') ){
					node.focus(e);
					node.light(e);
				}
				if( node.firstChild ){
					this.setTimeout(node, 'expand', e);
				}
			}
		},

		mouseout: function(e){
			if( !this.expandNode.element.contains(e.relatedTarget) ){
				var lighted = this.expandNode.getFirstChild(function(child){ return child.hasClass('lighted'); });
				if( lighted ) lighted.unlight(e);
			}
		},

		contextmenu: function(e){
			e.preventDefault();
			this.activeNode(this.cast(e), e);
		},

		click: function(e){
			e.preventDefault();
			this.activeNode(this.cast(e), e);
		},

		keydown: function(e){
			var node = this.focused, key = e.key;

			if( this.opened ){
				// sers juste à prévenir le blur de l'élément par tabulation
				if( key == 'tab' ){
					e.preventDefault();
				}
				// échap sur un noeud contract son parent
				else if( key == 'esc' ){
					if( node == this ){
						this.close(e);
					}
					else{
						node.parentNode.contract(e).focus(e);
					}
				}
				else if( key == 'enter' ){
					this.activeNode(node, e);
				}
				else{
					this.nav(node, e);
				}
			}
			else{
				if( e.key == 'enter' ){
					this.activeFirst(e);
				}
				else{
					this.updateTarget(e);
					this.nav(node, e);
				}
			}
		}
	},

	opened: false,
	expandNode: null,
	target: null,
	shortcut: null,

	options: {
		expandDelay: 270,
		contractDelay: 350,
		radioClose: true
	},

	create: function(){
		NS.viewDocument.require('rootnode').create.apply(this, arguments);

		this.expandNode = this;

		this.keynav.loop = true;
		this.keynav.setChildOnly(true);
		this.keynav.onnav = function(node, e){
			node.light(e);
			node.focus(e);
		};

		this.on('insertElement', function(e){
			var node = e.target;

			if( this.opened ){
				this.resetNode(node);
			}
		});

		this.on({
			active: function(e){
				var node = e.target, action, target, model, type;

				if( !this.isActivable(node) ) return;

				model = node.model;
				action = model.get('action');
				target = this.getTarget();
				type = model.get('type');

				if( typeof action != 'function' ) action = target[model.get('name')];
				if( typeof action == 'function' ) action.call(node, target, e);

				if( type == 'radio' ){
					// désactive tout les radios avant celui-ci
					node.getPreviousSibling(function(node){
						if( node.hasClass('sep') || node.model.get('type') != 'radio' ) return true;
						node.unactive(e);
					});
					// désactive tout les radios après celui-ci (tant qu'on trouve pas une séparation)
					if( !node.hasClass('sep') ){
						node.getNextSibling(function(node){
							if( node.model.get('type') != 'radio' ) return true;
							node.unactive(e);
							if( node.hasClass('sep') ) return true;
						});
					}
					if( this.options.radioClose ){
						this.close(e);
					}
				}
				else if( type == 'checkbox' ){

				}
				else{
					this.close(e);
				}
			},

			light: function(e){
				var node = e.target, parent = node.parentNode, lightedSibling;

				if( parent ){
					lightedSibling = parent.getFirstChild(function(child){
						return child !== node && child.hasClass('lighted');
					});

					if( lightedSibling ){
						// si un frère est lighted, unlight le
						lightedSibling.unlight(e);
					}

					if( parent != this ){
						// relight le parent (il peut avoir été unlight si la souris est sortie du menu)
						parent.light(e);
						// et previent l'eventuel contract du parent
						this.clearTimeout();
					}
				}
			},

			unlight: function(e){
				var node = e.target;

				if( node.firstChild ){
					// unlight d'un noeud amorce sa contraction
					this.setTimeout(node, 'contract', e);
				}
			},

			expand: function(e){
				var node = e.target, sibling;

				sibling = node.getSibling(function(node){ return node.hasState('expanded'); });

				if( sibling ){
					sibling.contract(e);
				}
				if( node.isVisible() ){
					node.childNodes.forEach(this.resetNode, this);
				}

				if( e && e.key == 'right' ){
					this.go(node.getFirstChild(this.isSelectable, this), e);
				}

				this.expandNode = node;
			},

			contract: function(e){
				var node = e.target;

				this.expandNode = node.parentNode;
			}
		});

		this.shortcut = NS.Shortcut.new(function(node, e){
			e.preventDefault();
			node.active(e);
		});

		this.trace('key', function(node, value, previous){
			if( value ){
				this.shortcut.set(value, node);
			}
			if( previous ){
				this.shortcut.unset(previous);
			}
		});

		this.documentEmitter = NS.ElementEmitter.new(document, this);
	},

	add: function(data){
		var model = NS.modelDocument.createNode('menuoption', data);
		var view = NS.viewDocument.createNode('menuoption', model);

		this.appendChild(view);
	},

	// call fn on property init/change/remove on a node
	trace: function(property, fn){
		this.on('insertElement', function(e){
			var node = e.target;

			if( node != this ){
				fn.call(this, node, node.model.get(property), undefined);
			}

		});

		this.on('removeElement', function(e){
			var node = e.target;

			if( node != this ){
				fn.call(this, node, undefined, node.model.get(property));
			}
		});

		this.on('change:' + property, function(e){
			var node = e.target, value = e.args[0], previous = e.args[1];

			fn.call(this, node, value, previous);
		});
	},

	destroy: function(){
		this.close();
		this.detach();
	},

	nav: function(node, e){
		if( !this.shortcut.active(e) ){
			this.keynav.current = this.focused;
			this.keynav.keydown(e);
		}
	},

	setTimeout: function(node, action, e){
		if( action != this.timerAction ){
			this.clearTimeout();
			this.timerAction = action;
			this.timer = setTimeout(
				function(){ node[action](e); },
				this.options[action + 'Delay']
			);
		}

		return this;
	},

	clearTimeout: function(){
		if( this.timer ){
			clearTimeout(this.timer);
			this.timer = null;
			this.timerAction = null;
		}

		return this;
	},

	activeNode: function(node, e){
		if( node ){
			if( node.firstChild ){
				node.expand(e);
			}
			else{
				if( node.hasClass('actived') && node.hasClass('checkbox') ){
					node.unactive(e);
				}
				else{
					node.active(e);
				}
			}
		}
	},

	move: function(x, y){
		if( x + this.element.measure('size', 'x') > document.measure('size', 'x') ){
			x-= this.element.measure('size', 'x');
		}

		this.setStyle('left', x);
		this.setStyle('top', y);
	},

	moveAtEvent: function(e){
		var x, y;

		if( e && e.rightClick ){
			x = e.page.x;
			y = e.page.y;
		}
		// centre sur la cible
		else{
			x = this.target.measure('cumulativePosition', 'x') + this.target.measure('size', 'x') / 2;
			y = this.target.measure('cumulativePosition', 'y') + this.target.measure('size', 'y') / 2;
		}

		this.move(x, y);
	},

	open: function(e){
		if( this.opened ) return this;
		this.updateTarget(e);
		if( this.target == null) return this;
		if( e ) e.preventDefault();

		this.emit('beforeopen', e);
		this.target.focus();
		this.childNodes.forEach(this.resetNode, this);

		this.documentEmitter.on('mousedown mouseup', this.mouseclose);
		this.setStyle('display', 'block');
		this.moveAtEvent(e);
		this.emit('open', e);
		this.opened = true;

		return this;
	},

	close: function(e){
		if( this.opened ){
			this.opened = false;
			this.setStyle('display', 'none');
			this.documentEmitter.off('mousedown mouseup', this.mouseclose);
			this.emit('close', e);
		}

		return this;
	},

	checkTarget: function(target){
		// lorsque je clic droit sur un input je n'affiche pas mon contextmenu
		return target.tagName.toLowerCase() != 'input';
	},

	updateTarget: function(e){
		var target = e.target;

		if( this.checkTarget(target) ){
			this.target = target;
		}
		else{
			this.target = null;
		}

		return this;
	},

	getTarget: function(){
		return this.target;
	},

	resetNode: function(node){
		var keepState = this.state;
		if( typeof keepState == 'function' ) keepState = keepState.call(this, this.target);

		// met tout les états à off sauf celui retourné par state
		Object.eachPair(this.states, function(state){
			if( keepState != state ) this.setState(state, false);
		}, this);

		if( typeof keepState == 'string' ){
			// met l'état retournée par state à on
			if( !this.hasClass(keepState) ) this.setState(keepState, true);
			// si on veut que le noeud reste expanded, donc visible on reset aussi ses enfants
			if( keepState == 'expanded' ) this.childNodes.forEach(this.resetNode, this);
		}

		if( this.hasClass('sep') && this.previousSibling ){
			// lorsqu'un noeud ayant 'sep' est hidden 'sep' passe au previousSibling
			if( this.hasState('hidden') ){
				this.previousSibling.addClass('sep');
			}
			// sinon on enlève 'sep' de previousSibling (deux 'sep' ne peuvent pas se suivre)
			else if( this.previousSibling.hasClass('sep') ){
				this.previousSibling.removeClass('sep');
			}
		}

		return this;
	},

	isActivable: function(node){
		if( !this.opened ) this.resetNode(node);

		if( node.hasClass('disabled') ) return false;
		if( node.hasClass('hidden') ) return false;
		if( node.firstChild ) return false;
		return true;
	},

	getFirstActivable: function(e){
		return this.getFirstChild(this.isActivable, this);
	},

	activeFirst: function(e){
		var node = this.getFirstActivable(e);
		if( node ){
			e.preventDefault();
			node.active(e);
		}
	},

	mouseclose: function(e){
		if( this.contains(e.target) ){
			e.preventDefault();
		}
		else{
			this.close(e);
		}
	},

	targetEmitter: null,
	attach: function(element, options){

		this.targetEmitter = NS.ElementEmitter.new(element, this);

		this.targetEmitter.on({
			keydown: function(e){
				this.keydown(e);
			},

			focus: function(e){
				this.updateTarget(e);
			},

			blur: function(e){
				this.close(e);
			},

			dblclick: function(e){
				this.updateTarget(e);
				if( this.target ) this.activeFirst(e);
			},

			// open the menu when contextmenu on that element
			// other possibility: open by mousedown
			contextmenu: function(e){
				this.open(e);
			}
		});

		this.insertElement(document.body);

		this.once('destroy', this.detach);

		return this;
	},

	detach: function(){
		this.targetEmitter.off();
		this.targetEmitter = null;
		this.removeElement();

		return this;
	}
}));

/*

// place submenu right or left

Menu.checkPosition = function(e){
	var node = e.target;
	var element = node.element;
	var branch = node.getChildrenElement();

	// si la branche dépasse à droite alors on la met à gauche
	if( !branch.hasClass('left') ){
		if( element.measure('cumulativePosition', 'x') - branch.measure('size', 'x') > 0 ){
			if( branch.measure('cumulativePosition', 'x') + branch.measure('size', 'x') > document.measure('size', 'x') ){
				branch.addClass('left');
			}

		}
	}
	// si la branche est à gauche et qu'elle dépasse à gauche ou que y'a la place à droite on la met à droite
	if( branch.hasClass('left') ){
		if( branch.measure('cumulativePosition', 'x') < 0
		|| element.measure('cumulativePosition', 'x') + element.measure('size', 'x') + branch.measure('size', 'x')
		< document.measure('size', 'x') ){
			branch.removeClass('left');
		}
	}
};

Menu.watchPosition = function(){
	this.on('expand', this.checkPosition);
};

Menu.unWatchPosition = function(){
	this.off('expand', this.checkPosition);
};

*/
