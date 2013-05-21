(function(){Element.getScrollView = function(element, offsetParent, axis){	var scroll = offsetParent.measure('scroll', axis), offset = element.measure('offset', axis), size, clientSize, end;		// scroll vers le bord haut ou gauche de l'élément	if( offset < scroll ) return offset;		size = element.measure('size', axis);	clientSize = offsetParent.measure('clientSize', axis);		// si l'élément est plus grand que l'offsetParent on ne scroll pas	if( size >= clientSize ) return scroll;		end = offset + size;	// scroll vers le bord droit ou bas de l'élément	if( end > clientSize + scroll ) return end - clientSize;		// ne scroll pas	return scroll;};Element.prototype.keepIntoView = function(){	var offsetParent = this.offsetParent;			// seulement si dans le DOM	if( offsetParent ){		// on appele offsetParent.scrollTo au cas où offsetParent est body auquel cas il faut scroller la fenêtre		offsetParent.scrollTo(Element.getScrollView(this, offsetParent, 'x'), Element.getScrollView(this, offsetParent, 'y')); 	}		return this;};})();