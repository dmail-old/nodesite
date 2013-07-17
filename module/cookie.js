module.exports = {
	cache: {},

	getRegexp: function(){
		var regexp = this.cache[name];

		if( regexp ) return regexp;

		regexp = new RegExp(
			"(?:^|;) *" +
			name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") +
			"=([^;]*)"
		);

		return this.cache[name] = regexp;
	},

	parse: function(str, name){
		if( arguments.length == 1 ){
			var cookies = str.split(';'), i = 0, j = cookies.length, pair;
			var map = {};

			for(;i<j;i++){
				pair = cookies[i].split('=');
				map[pair[0].trim()] = (pair[1] || '').trim();
			}

			return map;
		}
		else{
			var match;

			if( str ){
				match = str.match(this.getRegexp(name));
				return match ? match[1] : null;
			}

			return null;
		}
	},

	stringify: function(cookie){
		var output = '';

		if( !cookie ) return '';

		output = cookie.name + '=' + cookie.value;

		if( cookie.path ) output+= "; path=" + cookie.path;
		if( cookie.duration ){
			var date = new Date();
			date.setTime(date.getTime() + cookie.duration * 24 * 60 * 60 * 1000);
			output+= '; expires=' + date.toUTCString(); // toGMTString maybe?
		}
		else if( cookie.expires ){
			output+= ', expires=' + cookie.expires;
		}
		if( cookie.domain ) output+= "; domain=" + cookie.domain;
		if( cookie.secure ) output+= "; secure";
		if( cookie.httpOnly ) output+= "; httponly";

		return output;
	}
};
