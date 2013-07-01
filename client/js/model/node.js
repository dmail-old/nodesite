var node = NS.modelDocument.define('node', NS.Model.extend({
	getters: {
		fullName: function(firstName, lastName){
			return firstName + ' ' + lastName;
		}//.supplement('argumentNames', ['firstName', 'lastName'])
	}
}));
