function suggest(title, message, choices, callback){

	function onclose(){
		callback.call(this, choices[choices.length-1]);
	}

	if( !(choices instanceof Array) ) choices = [choices];

	var buttons = choices.map(function(choice, i){
		if( typeof choice == 'string' ) choice = {value: choice};

		var button = {
			type: 'button',
			'class': 'vx',
			html: choice.value,
			onclick: function(e){
				var popup = Item('domrectangle.box').getInstanceFromElement(this);
				popup.done(e);
				callback.call(popup, choice);
			}
		};

		// focus sur le premier choix
		if( i === 0 ) button['data-autofocus'] = true;

		return button;
	});

	var popup = Item('domrectangle.box.popup').new({
		title: title,
		properties: {
			'class': 'box popup big valid'
		},
		content: message,
		resizable: false,
		top: function(){
			return this.calcPositionSpacePercent('y', 0.15);
		},
		buttons: buttons
	});

	popup.on('close', onclose);
	popup.done = function(e){
		this.off('close', onclose);
		this.close(e);
	};
	popup.open();

	return popup;
}

function valid(message, callback){
	return suggest('Validation requise', message, [{name: 'yes', value: lang.yes}, {name: 'no', value: lang.no}], function(choice){
		callback(choice.name == 'yes' ? true : false);
	});
}

function inform(title, message, callback){
	return suggest(title, message, [{name: 'ok', value: lang.ok}], callback);
}

function monitor(title, message, callback){
	return suggest(title, message, [{name: 'cancel', value: lang.cancel}], callback);
}
