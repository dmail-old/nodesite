var node = NS.modelDocument.define('node', NS.Model.create({
	getters: {
		fullName: function(firstName, lastName){
			return firstName + ' ' + lastName;
		}//.supplement('argumentNames', ['firstName', 'lastName'])
	}
}));
