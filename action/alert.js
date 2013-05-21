module.exports = function(value, fn){
	if( typeof fn == 'function' ) fn('Serveur: ' + value);
};