var UNOPENED = 0;
var OPENED = 1;
var CLOSED = 2;
var RESETTING = 3;
var nextObserverId = 1;

var proto = require('@dmail/proto');

var Observer = proto.create({
	init: function(){
		this.state_ = UNOPENED;
		this.callback_ = undefined;
		this.target_ = undefined; // TODO(rafaelw): Should be WeakRef
		this.directObserver_ = undefined;
		this.value_ = undefined;
		this.id_ = nextObserverId++;
	},

	open: function(callback, target) {
		if (this.state_ != UNOPENED)
			throw Error('Observer has already been opened.');

		addToAll(this);
		this.callback_ = callback;
		this.target_ = target;
		this.connect_();
		this.state_ = OPENED;
		return this.value_;
	},

	close: function() {
		if (this.state_ != OPENED)
			return;

		removeFromAll(this);
		this.disconnect_();
		this.value_ = undefined;
		this.callback_ = undefined;
		this.target_ = undefined;
		this.state_ = CLOSED;
	},

	deliver: function() {
		if (this.state_ != OPENED)
			return;

		dirtyCheck(this);
	},

	report_: function(changes) {
		try {
			this.callback_.apply(this.target_, changes);
		} catch (ex) {
			Observer._errorThrownDuringCallback = true;
			console.error('Exception caught during observer callback: ' +
										 (ex.stack || ex));
		}
	},

	discardChanges: function() {
		this.check_(undefined, true);
		return this.value_;
	}
});

var collectObservers = !hasObserve;
var allObservers;
Observer._allObserversCount = 0;

if (collectObservers) {
	allObservers = [];
}

function addToAll(observer) {
	Observer._allObserversCount++;
	if (!collectObservers)
		return;

	allObservers.push(observer);
}

function removeFromAll(observer) {
	Observer._allObserversCount--;
}

module.exports = Observer;