module.exports = function(user, callback){

	user.session = global.generateUID();
	DB.insert('user', user, callback);

};