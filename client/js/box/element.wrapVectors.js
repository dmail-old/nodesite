Element.implement({
	setMargin: function(side, value){
		return this.setStyle('margin-' + side, value + 'px');
	},
	
	addMargin: function(side, value){
		return this.setMargin(side, this.getMargin(side) + value);
	}
});

Element.implement('wrapVectors', function(){
	var directions = 'nw,n,ne,w,e,sw,s,se'.split(',');
	var vector = '<div class="vector {direction}"></div>';
	var vectors = directions.map(vector.replace.bind(vector, new RegExp('{direction}'))).join('');
	var wrapper = this;
	
	// les éléments ne pouvant pas avoir de contenu en eux
	if( this.nodeName.match(/canvas|textarea|input|select|button|img/i) ){
		wrapper = new Element('div', {'class':'wrapper'}), dim = this.measure('size');
		
		wrapper.setStyles(Object.append(
			// rend les vecteurs visibles
			{overflow: 'visible'},
			{width: dim.x, height: dim.y},
			this.getStyles('position', 'top', 'left'),
			this.getStyles('margin-left', 'margin-top', 'margin-right', 'margin-bottom')
		));
		if( wrapper.getStyle('position') == 'static' ) wrapper.setStyle('position', 'relative');
		
		if( this.parentNode ) wrapper.wraps(this);
		else wrapper.appendChild(this);

		this.setStyle('position', 'static');
		this.setStyle('display', 'block');
	}
	
	var offset = wrapper.hasClass('small') ? 6 : 11;
	
	wrapper.addMargin('left', offset);
	wrapper.addMargin('top', offset);
	wrapper.addMargin('right', offset);
	wrapper.addMargin('bottom', offset);
	
	wrapper.adopt.apply(wrapper, new Element('div').set('html', vectors).children);
	wrapper.addClass('resizable');
	
	this.storage.set('wrapper', wrapper);
	
	return wrapper;
});

Element.implement('unwrapVectors', function(){
	if( !this.storage.has('wrapper') ) return this;
	
	var wrapper = this.storage.get('wrapper');
	
	wrapper.cross(function(child){
		if( child.hasClass('vector') ) child.dispose();
	});
	
	if( wrapper == this ){
		wrapper.removeClass('resizable');
		
		var offset = wrapper.hasClass('small') ? 6 : 11;
		
		wrapper.addMargin('left', -offset);
		wrapper.addMargin('top', -offset);
		wrapper.addMargin('right', -offset);
		wrapper.addMargin('bottom', -offset);
	}
	else{
		var parent = wrapper.parentNode;
		this.set('style', wrapper.get('style'));
		
		if( parent ){
			parent.insertBefore(this, wrapper);
			parent.removeChild(wrapper);
		}
	}
	
	this.storage.unset('wrapper');
	
	return this;
});
