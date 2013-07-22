// see https://github.com/federomero/negotiator/blob/master/lib/mediaType.js

module.exports = {
	parseMediaType: function(s){
		var match = s.match(/\s*(\S+)\/([^;\s]+)\s*(?:;(.*))?/);
		if( !match ) return null;

		var type = match[1], subtype = match[2], full = '' + type + '/' + subtype, params = {}, q = 1;

		if( match[3] ){
			params = match[3].split(';').map(function(s){
				return s.trim().split('=');
			}).reduce(function(set, p){
				set[p[0]] = p[1];
				return set;
			}, params);

			if( params.q != null ){
				q = parseFloat(params.q);
				delete params.q;
			}
		}

		return {
			type: type,
			subtype: subtype,
			params: params,
			q: q,
			full: full
		};
	},

	parse: function(string){
		return string.split(',').map(function(mediaType){
			return this.parseMediaType(mediaType.trim());
		}, this).filter(function(e){
			return e && e.q > 0;
		});
	},

	accepteds: function(provided){
		var filtered;

		if( provided ){
			filtered = provided.filter(function(type){
				return list.find('full', type);
			});
			filtered = filtered.sort(function(){

			});
		}
		else{
			filtered = list;
		}

		return provided;
	}
};

// faudrait ça
route.accept = function(type){

};

// ensuite quand on répond depuis le serveur ben on regarde juste ce que le client préfère
// on répond selon ce qu'il préfère
// si on dispose de cette manière de répondre bien sur

