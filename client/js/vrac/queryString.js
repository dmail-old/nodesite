// https://github.com/joyent/node/blob/master/lib/querystring.js


NS.QueryString = {
	sep: '&',
	eq: '=',

	stringifyPrimitive: function(v) {
		switch( typeof v ){
		case 'string':
			return v;
		case 'boolean':
			return v ? 'true' : 'false';
		case 'number':
			return isFinite(v) ? v : '';
		default:
			return '';
		}
	},

	escape: function(str){
		return encodeURIComponent(str);
	},

	unescape: function(str){
		return decodeURIComponent(str);
	},

	stringifyObject: function(object, prefix){
		var ret = [], keys = Object.keys(object), i = 0, j = keys.length, key, value;

		for(;i<j;i++){
			key = keys[i];

			if( key === '' ) continue;
			if( value == null ) ret.push(this.encode(key) + eq);
			else{
				var otherprefix;

				if( prefix ){
					otherprefix = '[' + this.escape(key) + ']';
				}
				else{
					otherprefix = this.escape(key);
				}

				ret.push(this.stringify(value, otherprefix));
			}
		}

		return ret.join(this.sep);
	},

	stringifyArray: function(array, prefix){
		var values = [], i = 0, j = array.length;

		for(;i<j;i++){
			values[i] = prefix + this.escape(this.stringifyPrimitive(array[i]));
		}

		return values.join(this.sep);
	},

	stringify: function(object, prefix){
		prefix = this.escape(this.stringifyPrimitive(prefix));

		if( object === null ) object = undefined;

		if( Array.isArray(object) ){
			return this.stringifyArray(obj, prefix);
		}
		else if( typeof object == 'object' ){
			return this.stringifyObject(obj, prefix);
		}
		else if( typeof object == 'string' ){
			return this.stringifyString(obj, prefix);
		}
		else{
			return prefix + this.eq + this.escape(this.stringifyPrimitive(object));
		}
	},

	parse: function(qs, sep, eq, options) {
		sep = sep || '&';
		eq = eq || '=';
		var obj = {};

		if( typeof qs !== 'string' || qs.length === 0 )
			return obj;
		}

		var regexp = /\+/g;
		qs = qs.split(sep);

		var maxKeys = 1000;
		if (options && typeof options.maxKeys === 'number') {
			maxKeys = options.maxKeys;
		}

		var len = qs.length;
		// maxKeys <= 0 means that we should not limit keys count
		if (maxKeys > 0 && len > maxKeys) {
			len = maxKeys;
		}

		for (var i = 0; i < len; ++i) {
			var x = qs[i].replace(regexp, '%20'),
					idx = x.indexOf(eq),
					kstr, vstr, k, v;

			if (idx >= 0) {
				kstr = x.substr(0, idx);
				vstr = x.substr(idx + 1);
			} else {
				kstr = x;
				vstr = '';
			}

			try {
				k = decodeURIComponent(kstr);
				v = decodeURIComponent(vstr);
			} catch (e) {
				k = QueryString.unescape(kstr, true);
				v = QueryString.unescape(vstr, true);
			}

			if (!hasOwnProperty(obj, k)) {
				obj[k] = v;
			} else if (Array.isArray(obj[k])) {
				obj[k].push(v);
			} else {
				obj[k] = [obj[k], v];
			}
		}

		return obj;
	}
};
