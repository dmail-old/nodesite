/*
---

name: Item

description: Set/get pairs (used as sort of namespace)

provides: Item

...
*/

window.Item = function(key, value){
	switch(arguments.length){
	case 0:
		return Item.store;
	case 1:
		if( typeof key == 'string' ){
			if( key in Item.store ){
				key = Item.store[key];
			}
			else{
				key = null;
			}
		}
		return key;
	case 2:
		Item.store[key] = value;
		return value;
	}
};

window.Item.store = {};
