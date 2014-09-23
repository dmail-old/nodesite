/*

Une list de chose à vérifier, on peut s'arêter dès qu'une vérif plante
ou alors continuer à vérifier chaque élément de la liste

on pourrait penser que la liste doit contenir des fonctions à qui on passe checkList
et qui apelle checkList.checked(true ou false)

*/

var util = require('../util');
var CheckList = util.extend(Array.prototype, {
	name: 'Anonymous CheckList',
	failedCount: 0,
	stopOnFirstFail: true,
	parent: null,
	index: null,
	current: null,
	startTime: null,
	endTime: null,
	timeout: 100,

	init: function(){
		if( arguments.length ) this.push.apply(this, arguments);
	},

	createCheck: function(){

	},

	onend: function(){
		this.emit('end', this);
		this.teardown();
	},	

	checkDone: function(failed){
		if( failed ){
			this.failedCound++;
		}
		this.emit('checkend');
		this.next();
	},

	end: function(error){
		this.endTime = new Date().getTime();

		if( error ){
			this.error = error;
		}

		if( this.timer != null ){
			clearTimeout(this.timer);
			this.timer = null;
		}

		process.nextTick(this.onend.bind(this));
	},

	done: function(){
		this.end();
	},

	next: function(){
		// something to check has failed
		if( this.failedCount && this.stopOnFirstFail ){
			this.end();			
		}
		// all check passed with success
		else if( this.index >= this.length ){
			this.end();
		}
		// check the next stuff to check
		else{
			this.current = this[this.index];
			this.index++;

			this.check(this.current);
		}
	},

	ontimeout: function(){
		this.timer = null;
		this.end(new Error('test takes too long, forgot to call test.done()?'));
	},

	start: function(){
		this.emit('start');

		this.failedCount = 0;
		this.index = 0;
		this.current = null;

		if( typeof this.timeout == 'number' ){
			this.timer = setTimeout(this.ontimeout.bind(this), this.timeout);
		}

		this.setup();
		this.next();
	}
});

module.exports = CheckList;