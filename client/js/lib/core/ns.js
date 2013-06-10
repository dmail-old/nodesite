/*
---

name: NS

description: Set/get pairs (used as sort of namespace)

provides: NS

...
*/

window.NS = function(key, value){
	switch(arguments.length){
	case 0:
		return window.NS;
	case 1:
		if( typeof key == 'string' ){
			if( key in window.NS ){
				key = window.NS[key];
			}
			else{
				key = null;
			}
		}
		return key;
	case 2:
		window.NS[key] = value;
		return value;
	}
};
