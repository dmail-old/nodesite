Item.define('treestructure', {	oninsertchild: Function.EMPTY,	onremovechild: Function.EMPTY,	getChildItemName: function(){		return this.__name__;	},	create: function(item){		return Item.create(this.getChildItemName(), item);	},	parseChild: function(child){		if( Item.is(this.getChildItemName(), child) ){			if( child.parentNode ){				child.parentNode.removeChild(child);			}		}		else{			child = this.create(child);		}		child.parentNode = this;		return child;	},	parseChildren: function(children){		return children.map(this.parseChild, this);	},	initChildren: function(children){		if( children ){			this.children = this.parseChildren(children);		}		// only if this.children is undefined we set this.children = []		else if( typeof this.children == 'undefined' ){			this.children = [];		}	},	setChildren: function(children){		children.forEach(this.appendChild, this);		return this;	},	appendChild: function(child, index){		child = this.parseChild(child);		this.children.push(child);		this.oninsertchild(child);		return child;	},	removeChild: function(child){		if( child.parentNode == this ){			child.parentNode.children.remove(this);			delete child.parentNode;			this.onremovechild(child);		}		return child;	},	insertBefore: function(child, sibling){		child = this.parseChild(child);		if( !sibling  || sibling.parentNode != this ){			this.children.push(child);			this.oninsertchild(child);		}		else{			this.children.splice(this.children.indexOf(sibling), 0, child);			this.oninsertchild(child);		}		return child;	}});