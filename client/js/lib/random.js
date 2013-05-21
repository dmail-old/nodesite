/*

name: random

description: Add methods to create random Number/String and to get random value from Array/String

provides: Number.random, String.random, Array.range, String.LOWER, String.UPPER, String.NUMBER, String.ALL,
		  Array.prototype.getRandom, String.prototype.getRandom

*/

Number.random = function(min, max){
	return Math.floor(Math.random() * (max - min + 1) + min);
};

String.random = function(length, matrix){
	if( typeof length == 'undefined' ) length = 16;
	if( typeof matrix == 'undefined' ) matrix = String.ALL;
	if( typeof matrix.getRandom != 'function' ) throw new TypeError('matrix sould have a getRandom method');
	
	var str = '', i = 0;
	for(;i<length;i++) str+= matrix.getRandom();
	return str;
};

// Create an array containing the range of integers or characters from low to high (inclusive)
// discuss at: http://phpjs.org/functions/range
Array.range = function(low, high, step){
	var matrix = [], inival, endval, walker = step || 1, chars = false;
 
	if( !isNaN(low) && !isNaN(high) ){
		inival = parseInt(low);
		endval = parseInt(high);
	}
	else if( isNaN(low) && isNaN(high) ){
		chars = true;
		inival = low.charCodeAt(0);
		endval = high.charCodeAt(0);
	}
	else{
		inival = isNaN(low) ? 0 : low;
		endval = isNaN(high) ? 0 : high;
	}
	
	if( inival <= endval ){
		while(inival <= endval){
			matrix.push(chars ? String.fromCharCode(inival) : inival);
			inival+= walker;
		}
	}
	else{
		while(inival >= endval){
			matrix.push(chars ? String.fromCharCode(inival) : inival);
			inival-= walker;
		}
	}
 
	return matrix;
};

String.LOWER = Array.range('a', 'z').join('');
String.UPPER = Array.range('A', 'Z').join('');
String.NUMBER = Array.range(0, 9).join('');
String.ALL = String.LOWER + String.UPPER + String.NUMBER;

Array.prototype.getRandom = function(){
	return this.length ? this[Number.random(0, this.length - 1)] : null;
};

String.prototype.getRandom = function(){
	return this.length ? this.charAt(Number.random(0, this.length-1)) : '';
};

