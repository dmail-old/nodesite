var observerSentinel = {};

var Observer = require('../Observer');

var ObserverList = Observer.create({
	init: function(reportChangesOnOpen){
		Observer.init.call(this);

		this.reportChangesOnOpen_ = reportChangesOnOpen;
		this.value_ = [];
		this.directObserver_ = undefined;
		this.observed_ = [];
	},

	connect_: function() {
		if (hasObserve) {
			var object;
			var needsDirectObserver = false;
			for (var i = 0; i < this.observed_.length; i += 2) {
				object = this.observed_[i]
				if (object !== observerSentinel) {
					needsDirectObserver = true;
					break;
				}
			}

			if (needsDirectObserver)
				this.directObserver_ = getObservedSet(this, object);
		}

		this.check_(undefined, !this.reportChangesOnOpen_);
	},

	disconnect_: function() {
		for (var i = 0; i < this.observed_.length; i += 2) {
			if (this.observed_[i] === observerSentinel)
				this.observed_[i + 1].close();
		}
		this.observed_.length = 0;
		this.value_.length = 0;

		if (this.directObserver_) {
			this.directObserver_.close(this);
			this.directObserver_ = undefined;
		}
	},

	addPath: function(object, path) {
		if (this.state_ != UNOPENED && this.state_ != RESETTING)
			throw Error('Cannot add paths once started.');

		var path = getPath(path);
		this.observed_.push(object, path);
		if (!this.reportChangesOnOpen_)
			return;
		var index = this.observed_.length / 2 - 1;
		this.value_[index] = path.getValueFrom(object);
	},

	addObserver: function(observer) {
		if (this.state_ != UNOPENED && this.state_ != RESETTING)
			throw Error('Cannot add observers once started.');

		this.observed_.push(observerSentinel, observer);
		if (!this.reportChangesOnOpen_)
			return;
		var index = this.observed_.length / 2 - 1;
		this.value_[index] = observer.open(this.deliver, this);
	},

	startReset: function() {
		if (this.state_ != OPENED)
			throw Error('Can only reset while open');

		this.state_ = RESETTING;
		this.disconnect_();
	},

	finishReset: function() {
		if (this.state_ != RESETTING)
			throw Error('Can only finishReset after startReset');
		this.state_ = OPENED;
		this.connect_();

		return this.value_;
	},

	iterateObjects_: function(observe) {
		var object;
		for (var i = 0; i < this.observed_.length; i += 2) {
			object = this.observed_[i]
			if (object !== observerSentinel)
				this.observed_[i + 1].iterateObjects(object, observe)
		}
	},

	check_: function(changeRecords, skipChanges) {
		var oldValues;
		for (var i = 0; i < this.observed_.length; i += 2) {
			var object = this.observed_[i];
			var path = this.observed_[i+1];
			var value;
			if (object === observerSentinel) {
				var observable = path;
				value = this.state_ === UNOPENED ?
						observable.open(this.deliver, this) :
						observable.discardChanges();
			} else {
				value = path.getValueFrom(object);
			}

			if (skipChanges) {
				this.value_[i / 2] = value;
				continue;
			}

			if (areSameValue(value, this.value_[i / 2]))
				continue;

			oldValues = oldValues || [];
			oldValues[i / 2] = this.value_[i / 2];
			this.value_[i / 2] = value;
		}

		if (!oldValues)
			return false;

		// TODO(rafaelw): Having observed_ as the third callback arg here is
		// pretty lame API. Fix.
		this.report_([this.value_, oldValues, this.observed_]);
		return true;
	}
});

module.exports = ObserverList;