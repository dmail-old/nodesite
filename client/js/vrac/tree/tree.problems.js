/*
---

name: problems

description: Permet de détecter un problème sur l'appel d'une action et de prendre une décision (confirmer, ajouter une action ou annuler)

require: actions,demon

...
*/

Tree.definePlugin('problems', {
	require: 'actions,demon',
	
	init: function(){
	
		Object.append(this.demon, {
			deciders: {},
			
			admit: function(admit, call){
				return admit.call(this, call) || this.tree.hasDefinition(call[0], 'handler');
			}.curry(this.demon.admit),			
						
			decide: function(decision){
				this.deciders[decision].apply(this, toArray(arguments, 1));
			},
			
			// on passe à l'appel suivant on a choisit d'ignorer le problème
			transferCall: this.demon.submit,
			
			// annule l'appel en cours
			cancelCall: function(){
				this.stack.splice(this.index, 1);
				this.index--;
				delete this.call;
			},
			
			replaceCall: function(call){
				this.stack[this.index] = this.call = call;
			},
			
			// insère un appel avant l'appel en cours
			insertCall: function(action, node, args){
				this.call = [action, node, args || []];
				this.stack.splice(this.index - 1, 0, this.call);
			},
			
			submit: function(call){
				if( this.tree.hasDefinition(call[0], 'handler') ){
					this.tree.applyDefinition(call[0], 'handler', call[1], call[2]);
				}
				else{
					this.transferCall(call);
				}
			}
		});
		
	}
});