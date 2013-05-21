var defaultRadius = [0,0,0,0];
CanvasRenderingContext2D.prototype.roundedRect = function(x, y, width, height, radius){
	switch(typeof radius){
		case 'number': radius = [radius, radius, radius, radius]; break;
		case 'string': radius = radius.split(','); break;
		case 'object': break;
		default: radius = defaultRadius; break;
	}
	
    this.beginPath();
    this.moveTo(x + radius[0], y);
	// topright radius
    this.lineTo(x + width - radius[1], y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius[1]);
	// bottomright radius
    this.lineTo(x + width, y + height - radius[3]);
    this.quadraticCurveTo(x + width, y + height, x + width - radius[3], y + height);
	// bottomleft radius
    this.lineTo(x + radius[2], y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius[2]);
	// topleft radius
    this.lineTo(x, y + radius[0]);
    this.quadraticCurveTo(x, y, x + radius[0], y);
	
    this.closePath();
	return this;
} 

CanvasRenderingContext2D.prototype.border = function(size, color){
	this.lineWidth = size;
	this.strokeStyle = color;
	return this;
}

CanvasRenderingContext2D.prototype.shadow = function(offsetx, offsety, blur, color){
	this.shadowOffsetX = 2;
	this.shadowOffsetY = 2;
	this.shadowBlur = 4;
	this.shadowColor = color;
	return this;
}

CanvasRenderingContext2D.prototype.linearGradient = function(x, y, w, h, startcolor, endcolor){
	var gradient = this.createLinearGradient(x, y, x+w, y+h);
	gradient.addColorStop(0, startcolor);
	gradient.addColorStop(1, endcolor);
	this.fillStyle = gradient;
	return this;
}

CanvasRenderingContext2D.prototype.toImage = function(){
	var img = document.createElement('img');
	img.src = this.canvas.toDataURL();
	return img;
};

function getCanvas(img){
	var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
	canvas.width = 110;
	canvas.height = 110;
	
	ctx.roundedRect(0,0,105,105,5); // le ractangle arrondi doit faire canvas.width-shadow.width-border
	ctx.border(1, '#d9f1fc');
	ctx.linearGradient(1, 1, 90, 90, '#f7fbfd', '#e0f2fb'); // white blue to light blue
	ctx.shadow(2, 2, 4, 'rgba(0,0,0,0.3)');
	
	ctx.stroke();
	ctx.fill();
	
	return canvas;
}

function setDragImage(e, img){
	var canvas = getCanvas(img), ctx = canvas.getContext('2d');
	
	var src = img.src;
	img = new Image();
	img.src = src;
	
	if( img.complete ){
		ctx.drawImage(img, ((canvas.width - img.width) / 2) - 2, ((canvas.height - img.height) / 2) - 2);
	}
	
	var text = '200', x = canvas.width/2, y = canvas.height/2;
	ctx.font = '10pt Arial';
	ctx.textAlign = 'center';
	
	var metrics = ctx.measureText(text);
	var width = metrics.width, height = 10;	
	var textx = x - (width / 2); // text-align: center
	var texty = y - height; // vertical-align: baseline
	var padding = 5;
	var rectx = textx - padding;
	var recty = texty - padding;
	var rectw = width + padding*2;
	var recth = height + padding*2;
	
	ctx.roundedRect(rectx, recty, rectw, recth, 2);
	ctx.border(2, 'white');
	ctx.linearGradient(0, 0, rectw, recth, '#40408c', '#0093f9'); // from dark blue to blue
	
	ctx.stroke();
	ctx.fill();
	ctx.fillStyle = 'white';
	ctx.fillText(text, x, y);
	
	e.event.dataTransfer.setDragImage(canvas, 0, 0);
};