/*

NOTE:

VERY IMPORTANT: Cant catch the following:

- delete array[index] due to ObjectChangeEmitter limitations (Object.watch cant detect delete)
- array[index] = value where index is greater than array.length, value and previous values to array.length will be ignored
- array.length = Number where Number != array.length, thus adding or removing entries without being notified

REQUIRE:

object.js, object.at.js

USAGE:

var array = [];
var listener = function(change){
	// change has type, oldValue and value properties
};
var observer = ArrayObserver.new(array, listener);

*/

window.ArrayObserver = {
	mutators: {
		push: function(){
			var length = this.applyMethod('push', arguments), i = 0, j = arguments.length, index;

			for(;i<j;i++){
				index = i + length - j;
				this.observeValueAt(index);
				this.notify({
					type: 'add',
					index: index,
					value: this.array[index]
				});
			}

			return length;
		},

		unshift: function(){
			var length = this.applyMethod('unshift', arguments), i = 0, j = arguments.length, index;

			for(;i<j;i++){
				index = i + length - j;
				// observe value at the end
				this.observeValueAt(index);
				// notify the add value at the beginning
				this.notify({
					type: 'add',
					index: i,
					value: this.array[i]
				});
			}

			return length;
		},

		pop: function(){
			var value = this.applyMethod('pop'), index = this.array.length;

			this.unobserveValueAt(index);
			this.notify({
				type: 'remove',
				index: index,
				value: value
			});

			return value;
		},

		shift: function(){
			var value = this.applyMethod('shift'), index = this.array.length;

			this.unobserveValueAt(index);
			this.notify({
				type: 'remove',
				index: 0,
				value: value
			});

			return value;
		},

		splice: function(index, length){
			var removed = this.applyMethod('splice', arguments), inserted = Array.slice(arguments, 2), i, j;

			// from spec, negative index are computed as follow
			if( index < 0 ){
				index+= this.array.length;
			}

			i = 0;
			j = removed.length;
			for(;i<j;i++){
				this.notify({
					type: 'remove',
					index: index + i,
					value: removed[i]
				});
			}
			i = 0;
			j = inserted.length;
			for(;i<j;i++){
				this.notify({
					type: 'add',
					index: index + i,
					value: inserted[i]
				});
			}

			return removed;
		},

		reverse: function(){
			this.applyMethod('reverse', arguments);

			var i = 0, j = this.array.length, index, affectations = [];

			for(;i<j;i++){
				index = j - i - 1;
				if( i != index ){
					affectations.push(index, i);
				}
			}

			this.notify({
				type: 'affectations',
				value: affectations
			});

			return this.array;
		},

		sort: function(comparer){
			this.delayed = true;
			var affectations = this.array.sortWithAffectations(comparer);
			this.delayed = false;

			this.notify({
				type: 'affectations',
				value: affectations
			});

			return this.array;
		}
	},
	array: null,
	listener: null,
	bind: null,
	methods: null,
	observer: null,
	delayed: false,
	closed: false,
	valueChangedType: 'update',

	create: function(array, listener, bind){
		this.array = array;
		this.listener = listener;
		this.bind = bind || this;
		this.methods = {};
		this.observer = window.ObjectChangeEmitter.new(array);

		var i = 0, j = array.length;
		for(;i<j;i++){
			this.observeValueAt(i);
			this.notify({
				type: 'add',
				index: i,
				value: this.array[i]
			});
		}
		this.wrapAll();
	},

	close: function(){
		if( this.closed === false ){
			this.unwrapAll();

			var i = this.array.length;
			while(i--) this.unobserveValueAt(i);
			this.observer = null;

			this.array = null;
			this.listener = null;
			this.bind = null;
			this.methods = null;

			this.closed = true;
		}
	},

	notify: function(change){
		if( this.delayed === false && typeof this.listener == 'function' ){
			this.listener.call(this.bind, change);
		}
	},

	observeValueAt: function(index){
		this.observer.on(index, this);
	},

	unobserveValueAt: function(index){
		this.observer.off(index, this);
	},

	wrapAll: function(){
		for(var method in this.mutators ){
			this.wrap(method);
		}
	},

	unwrapAll: function(){
		for(var method in this.methods ){
			this.unwrap(method);
		}
	},

	wrap: function(method){
		this.methods[method] = this.array[method];
		this.array[method] = this.mutators[method].bind(this);
	},

	unwrap: function(method){
		this.array[method] = this.methods[method];
		delete this.methods[method];
	},

	applyMethod: function(method, args, supressDelay){
		if( !supressDelay ) this.delayed = true;
		var result = this.methods[method].apply(this.array, args);
		if( !supressDelay ) this.delayed = false;
		return result;
	},

	handleEvent: function(name, args){
		this.valueChanged.apply(this, args);
	},

	valueChanged: function(index, oldValue, value){
		this.notify({
			type: this.valueChangedType,
			index: index,
			oldValue: oldValue,
			value: value
		});
	},

	performAffectations: function(affectations, into, from){
		var i = 0, j = affectations.length, oldIndex, index;

		from = from || this.array;

		for(;i<j;i+=2){
			oldIndex = affectations[i];
			index = affectations[i + 1];
			into[index] = from[index];
		}
	},

	/*
	"affectation" refers to:
		assigning 0 at 1 in ['a', 'b', 'c'] gives -> ['a', 'a', 'c']
	"move" refers to:
		moving 0 at 1 in ['a', 'b', 'c'] gives -> ['b', 'a', 'c']

	This function take an array of affectations
	[oldIndex, newIndex, ...]
	and returns a list of moves
	[oldIndex, newIndex, ...]
	that correspond to those affectations
	*/
	transformAffectationsToMoves: function(affectations){
		var i = 0, j = affectations.length, oldIndex, index;
		var trace = [], moves = [], from, to, gap, tempTrace, traceIndex, k, l;

		for(;i<j;i+=2){
			oldIndex = affectations[i];
			if( typeof trace[oldIndex] === 'number' ){
				oldIndex = trace[oldIndex];
			}
			index = affectations[i + 1];

			if( oldIndex == index ){
				// affectations made this move useless
			}
			else{
				moves.push(oldIndex, index);

				// the value is moved to the left or the right of it's current index
				if( index < oldIndex ){
					gap = 1;
				}
				else{
					gap = -1;
				}

				/*
				for this affectations, store trace in a tempTrace array, that will be merge with trace after
				else the trace array could contain two identical index
				thus making trace.indexOf(from); possibly return the wrong index location
				*/
				tempTrace = [];

				from = oldIndex;
				to = index;
				if( typeof trace[from] == 'number' ){
					traceIndex = trace.indexOf(from);
					if( traceIndex > -1 ){
						from = traceIndex;
					}
				}
				tempTrace.push(from, to);
				//console.log(oldIndex, 'becomes', index, loopTrace);

				while(index != oldIndex){
					from = index;
					to = index + gap;
					if( typeof trace[from] == 'number' ){
						traceIndex = trace.indexOf(from);
						if( traceIndex > -1 ){
							from = traceIndex;
						}
					}
					tempTrace.push(from, to);
					//console.log(index, 'becomes', index+gap, loopTrace);

					index+= gap;
				}

				k = 0;
				l = tempTrace.length;
				for(;k<l;k+=2){
					trace[tempTrace[k]] = tempTrace[k+1];
				}

				//console.log('move', value, 'from', oldIndex, 'to', affectations[i + 1]);
				//console.log('result', array);
				//console.log('trace', trace);
			}
		}

		return moves;
	}
};

// sort an array with comparer and return the list of performed affectations
Array.implement('sortWithAffectations', function(comparer){
	var array = this, i = 0, j = array.length, pairs = [], pair, affectations = [];

	for(;i<j;i++){
		pairs[i] = [i, array[i]];
	}

	if( typeof comparer != 'function' ) comparer = Function.COMPARE;

	pairs.sort(function(a, b){
		return comparer.call(array, a[1], b[1]);
	});

	i = 0;
	for(;i<j;i++){
		pair = pairs[i];
		affectations.push(pair[0], i);
		array[i] = pair[1];
	}

	return affectations;
});
