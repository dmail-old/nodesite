var proto = require('proto');
var isThenable = require('object/is-thenable');
var isIterable = require('object/is-iterable');
require('promise');
require('iterator');

var TaskProcess = proto.extend({
	state: 'created', // 'created', 'started', 'blocked', 'waiting', 'resolved', 'rejected'
	current: null,

	time: true,
	canReact: !false,

	constructor: function(task){
		this.task = task;
		this.exec = this.task.exec;
		this.reaction = this.task.reaction;
		this.children = [];
		this.dependencies = null;

		this.promise = new Promise(function(resolve, reject){
			this._resolve = resolve;
			this._reject = reject;
		}.bind(this));
	},

	toString: function(){
		return '[Object TaskProcess]';
	},

	then: function(onResolve, onReject){
		return this.promise.then(onResolve, onReject);
	},

	hasReaction: function(method){
		return this.canReact && this.reaction && method in this.reaction;
	},

	react: function(method, value){
		if( this.hasReaction(method) ){
			this.reaction[method].call(this, value);
		}
	},

	progress: function(value){
		this.value = value;
		this.react('progress', value);
	},

	resolve: function(value){
		this.state = 'resolved';
		this.value = this.endValue = value;
		this._resolve(value);
		this.react('pass', value);
	},

	reject: function(value){
		this.state = 'rejected';
		this.value = this.endValue = value;
		this._reject(value);
		this.react('fail', value);
	},

	createChildProcess: function(task){
		var process = task.createProcess();

		this.state = 'blocked'; // blocked by a subprocess
		this.currentTask = task;
		this.currentProcess = process;
		process.reaction = this.reaction ? this.reaction[task.name] : null;

		return process;		
	},

	addChildProcess: function(process){
		this.children.push(process);
	},

	spawnChildProcess: function(task){
		var process = this.createChildProcess(task);

		this.addChildProcess(process);
		process.start(this.value);

		return process;
	},

	next: function(){
		var next = this.iterator.next();

		if( next.done ){
			this.resolve(this.value);
			return next;
		}
		
		var task = next.value;
		var process = this.spawnChildProcess(task);
		process.then(
			function(value){
				this.value = value;
				this.progress(value);
				this.next();
			}.bind(this),
			function(value){
				this.reject(value);
			}.bind(this)
		);

		return next;
	},

	handleResult: function(result){
		if( isIterable(this.dependencies) ){
			this.iterator = this.dependencies[Symbol.iterator]();
			this.state = 'blocked';
			this.next();
		}
		else if( isThenable(result) ){
			this.state = 'waiting'; // waiting for a promise
			result.then(this.resolve.bind(this), this.reject.bind(this));
		}
		else{
			this.resolve(result);
		}
	},

	start: function(value){
		var result;

		this.state = 'started';
		this.value = value;
		this.startValue = value;
		if( this.time ) this.startDate = new Date();
		this.react('start', this.value);

		try{
			result = this.exec.apply(this, arguments);
		}
		catch(e){
			return this.reject(e);
		}

		this.handleResult(result);

		return this;
	}
});

var Task = proto.extend({
	reaction: null,
	name: null,

	constructor: function(exec, reaction){
		this.exec = exec;
		this.name = exec.name;
		this.reaction = reaction;
	},

	toString: function(){
		return '[Object Task ' + this.name + ']';
	},

	createProcess: function(){
		return TaskProcess.create(this);
	},

	spawn: function(value){
		var taskProcess = this.createProcess();

		taskProcess.start(value);

		return taskProcess;
	}
});

var TaskSerie = proto.extend.call(Task, {
	constructor: function(tasks, reaction){
		this.tasks = tasks;

		TaskSerie.super.constructor.call(this, function(){
			this.dependencies = tasks;
		});		
	}
});

function increment(a){ return a + 1; }
function decrement(a){ return a - 1; }

var incrementTask = Task.create(increment);
var decrementTask = Task.create(decrement);
var noopTask = TaskSerie.create([incrementTask, decrementTask]);

noopTask.reaction = {
	start: function(){
		console.log('starting noop with', this.value);
	},

	progress: function(){
		console.log('noop', this.currentTask.name, 'value = ', this.value);
	},

	pass: function(){
		console.log('noop passed with', this.value);
	},

	increment: {
		start: function(){
			console.log('incrementing', this.value);
		}
	},

	decrement: {
		start: function(){
			console.log('decrementing', this.value);
		}
	}
};

incrementTask.spawn(10);
noopTask.spawn(10);

/*
var Call = proto.extend({
	constructor: function(fn, bind, args){
		this.fn = fn;
		this.bind = bind;
		this.args = args;
	},

	exec: function(){
		this.fn.apply(this.bind, this.args);
	}
});

var Method = proto.extend({
	constructor: function(fn, bind){
		this.fn = fn;
		this.bind = bind || this;
		this.calls = [];
	},

	createCall: function(args){
		var call = Call.create(this.fn, this.bind, args);
		return call;
	},

	add: function(args){
		var call = this.createCall(args);
		this.calls.push(call);
		return call;
	},

	call: function(){
		var call = this.add(arguments);
		return call.exec();
	},

	apply: function(args){
		var call = this.add(args);
		return call.exec();
	}
});
*/

module.exports = Task;

function activatePrompt(){
	var readline = require('readline'), interface = readline.createInterface(process.stdin, process.stdout);

	interface.setPrompt('> ');
	interface.prompt();
	interface.on('line', function(line){
		var code = line.trim();

		try{
			console.log(eval(code));
		}
		catch(e){
			console.log(e.stack);
		}

		interface.prompt();
	});
	interface.on('close', function(){
		process.exit(0);
	});
}

activatePrompt();