/*
---

name: ajax

description: Les actions pour lesquelles demon.isOnline retourne true sont envoyées au serveur par une requête ajax

require: demon

MORE
- si uname activé, le serveur pourras renvoyé une erreur genre: "nom indisponible", le plugin uname pourrais alors prendre la suite et demander ce qu'on veut faire
écraser ou annuler (le nom libre on le fournirait pas c'est le serveur qui le trouverais lui même)
les actions seraient alors renvoyé pour être traitées
-> a priori non c'est une erreur qu'on ne gère pas puisque pas censée se produire

...
*/

Tree.definePlugin('ajax', {
	require: 'demon',
	
	node: {
		startLoading: function(){
			if( this.trunk ){
				// on n'affiche pas le loader tout de suite, uniquement si l'action dure
				this.loadingTimeout = setTimeout(function(){
					delete this.loadingTimeout;
					this.ajaxLoader = this.getDom('node').appendChild('<span class="ajax"></span>'.toElement());
				}.bind(this), 300);
			}
		},
		
		endLoading: function(){
			if( this.loadingTimeout ){
				clearTimeout(this.loadingTimeout);
				delete this.loadingTimeout;
			}
			else if( this.ajaxLoader ){
				this.ajaxLoader.dispose();
				delete this.ajaxLoader;
			}
		}
	},
	
	tree: {
		sendServer: function(action, args, callback){
			server.applyAction('filesystem/' + action, args, callback);
		}
	},
	
	init: function(){
		if( this.hasPlugin('problems') ) throw new Error('ajax must be added before problems');
		
		Object.append(this.demon, {
			admit: function(admit, call){
				return admit.call(this, call) || this.tree.hasDefinition(call[0], 'toServer');
			}.curry(this.demon.admit),
			
			endCall: this.demon.submit,
			
			submit: function(call){
				var action = call[0], node = call[1], args = call[2], params = this.tree.applyDefinition(action, 'toServer', node, args);
				
				if( params ){
					node.startLoading();
					this.tree.sendServer(params[0], params.slice(1), function(error, response){
						// enlève l'icone de chargement des noeuds une fois fini
						node.endLoading();
						if( error ){
							this.cancel();
							this.cancelNext();
							throw error;
						}
						
						this.tree.callDefinition(action, 'serverResponseHandler', node, response, args);
						this.endCall(call);
					}.bind(this));
				}
				else{
					this.endCall(call);
				}
			}
		});
				
	}
});