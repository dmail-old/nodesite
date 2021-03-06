require('math/extra');

var AsyncProfile = require('async-profile');
var proto = require('@dmail/proto');
var Profile = proto.create({
	constructor: function(){
		this.asyncProfile = new AsyncProfile({
			callback: this.callback.bind(this)
		});
	},

	time: function(delta){
		return (1000 * delta[0] + delta[1] / 1000000).toFixed(3);
	},

	diff: function(end, start){
		return this.time([
			end[0] - start[0],
			end[1] - start[1]
		]);
	},

	getCallSiteFromStack: function(stack){
		var i = 0, j = stack.length, callSite, fileName, cwdIndex;

		for(;i<j;i++){
			callSite = stack[i];
			fileName = callSite.getFileName();
			cwdIndex = fileName.indexOf(process.cwd());

			if( cwdIndex === -1 ) continue;
			if( fileName.indexOf('node_modules') >= cwdIndex ) continue;
			if( fileName.indexOf('async-profile') !== -1 ) continue;
			if( fileName.indexOf('Promise') !== -1 ) continue;
			break;
		}

		return callSite;
	},

	createCall: function(tick){
		var call;

		if( tick.queue && tick.start && tick.end && tick.stack ){
			var callSite = this.getCallSiteFromStack(tick.stack);

			call = {
				name: callSite.getFunctionName(),
				file: callSite.getFileName(),
				line: callSite.getLineNumber(),
				column: callSite.getColumnNumber(),
				duration: parseFloat(this.time([
					tick.end[0] - tick.start[0] - tick.overhead[0],
					tick.end[1] - tick.start[1] - tick.overhead[1]
				]))
			};
		}

		return call;
	},

	computeData: function(result){
		var sum = [0, 0];
		var wait = [0, 0];
		var min = [Infinity, Infinity];
		var max = [0, 0];
		var total;
		var ticks = result.ticks;
		var tick;

		for( var i in ticks ){
			tick = ticks[i];

			if( !tick.queue || !tick.start || !tick.end ) continue;

			if( tick.queue[0] < min[0] || (tick.queue[0] == min[0] && tick.queue[1] < min[1]) ){
				min = tick.queue;
			}
			if( tick.end[0] > max[0] || (tick.end[0] == max[0] && tick.queue[1] > max[1]) ){
				max = tick.end;
			}

			sum[0]+= tick.end[0] - tick.start[0] - tick.overhead[0];
			sum[1]+= tick.end[1] - tick.start[1] - tick.overhead[1];
			wait[0]+= tick.start[0] - tick.queue[0];
			wait[1]+= tick.start[1] - tick.queue[1];
		}

		total = [sum[0] + wait[0], sum[1] + wait[1]];

		return {
			total: this.time(sum),
			duration: this.diff(max, min),
			CPUload: (this.time(sum) / this.diff(max, min)).toFixed(1),
			waitDuration: this.time(wait)//wait[1] - wait[0]
		};
	},

	callback: function(result){
		console.result = result;
		var calls = [], call;

		result.ticks.forEach(function(tick){
			call = this.createCall(tick);
			if( call ) calls.push(call);
		}, this);

		var methods = [], method;

		function findMethodByCall(call){
			var i = 0, j = methods.length;

			for(;i<j;i++){
				method = methods[i];
				if( method.name === call.name && method.file == call.file && method.line == call.line ){
					return methods[i];
				}
			}
			return null;
		}

		function addMethodCall(call){
			var method = findMethodByCall(call);

			if( method ){
				method.calls.push(call);
			}
			else{
				method = {
					name: call.name,
					file: call.file,
					line: call.line,
					calls: [call]
				};
				methods.push(method);
			}
		}

		calls.forEach(function(call){
			addMethodCall(call);
		});

		var totalDuration = 0;
		var totalCalls = 0;
		var methodCalls = methods.map(function(method){
			var durations = method.calls.map(function(call){
				return call.duration;
			});

			totalDuration+= Math.sum.apply(Math, durations);
			totalCalls+= method.calls.length;

			return [
				method.name,
				method.calls.length,
				null, // sera rempli automatiquement
				Math.sum.apply(Math, durations),
				Math.average.apply(Math, durations),
				Math.min.apply(Math, durations),
				Math.max.apply(Math, durations),
				method.file,
				method.line
			];
		});

		totalDuration = Math.round(totalDuration, 0);

		var Table = require('template-table');
		var table = Table.create();

		table.addRow(['Function', 'Calls', 'Percent', 'Time', 'Avg', 'Min', 'Max', 'File', 'Line']);
		table.addRows(methodCalls);

		function roundDuration(value){
			return Math.round(value) + 'ms';
		}

		function roundPercent(value){
			return Math.round(value * 100) + '%';
		}

		function basedirname(path){
			var sep = require('path').sep;
			var lastSlash = path.lastIndexOf(sep);
			var beforeLastSlash = path.lastIndexOf(sep, lastSlash - 1);

			return path.slice(beforeLastSlash);
		}

		table.row(0).fix().setClass('header'); // the first row will not be sorted and are headers

		table.column('Percent').addDependency(table.column('Time')).transform(function(time){
			return time / totalDuration;
		}).format(roundPercent);
		table.column('Time').format(roundDuration);
		table.column('Avg').format(roundDuration);
		table.column('Min').format(roundDuration);
		table.column('Max').format(roundDuration);
		table.column('File').format(basedirname);
		table.compile();
		table.sortRows('Percent', -1);

		console.log('Profiling results (' + totalDuration + 'ms, ' + totalCalls + ' calls)');
		console.log(table.toString());
	},

	stop: function(){
		this.asyncProfile.stop();
	}
});

var profile = null;
console.profile = function(){
	console.profileEnd();
	profile = new Profile();
};

console.profileEnd = function(){
	if( profile != null ){
		profile.stop();
		profile = null;
	}
};