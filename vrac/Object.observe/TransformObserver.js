var proto = require('@dmail/proto');

function identFn(value) { return value; }

var TransformObserver = {
	init: function(observable, getValueFn, setValueFn, dontPassThroughSet){
		this.callback_ = undefined;
		this.target_ = undefined;
		this.value_ = undefined;
		this.observable_ = observable;
		this.getValueFn_ = getValueFn || identFn;
		this.setValueFn_ = setValueFn || identFn;
		// TODO(rafaelw): This is a temporary hack. PolymerExpressions needs this
		// at the moment because of a bug in it's dependency tracking.
		this.dontPassThroughSet_ = dontPassThroughSet;
	},

	open: function(callback, target) {
		this.callback_ = callback;
		this.target_ = target;
		this.value_ =
				this.getValueFn_(this.observable_.open(this.observedCallback_, this));
		return this.value_;
	},

	observedCallback_: function(value) {
		value = this.getValueFn_(value);
		if (areSameValue(value, this.value_))
			return;
		var oldValue = this.value_;
		this.value_ = value;
		this.callback_.call(this.target_, this.value_, oldValue);
	},

	discardChanges: function() {
		this.value_ = this.getValueFn_(this.observable_.discardChanges());
		return this.value_;
	},

	deliver: function() {
		return this.observable_.deliver();
	},

	setValue: function(value) {
		value = this.setValueFn_(value);
		if (!this.dontPassThroughSet_ && this.observable_.setValue)
			return this.observable_.setValue(value);
	},

	close: function() {
		if (this.observable_)
			this.observable_.close();
		this.callback_ = undefined;
		this.target_ = undefined;
		this.observable_ = undefined;
		this.value_ = undefined;
		this.getValueFn_ = undefined;
		this.setValueFn_ = undefined;
	}
};

module.exports = TransformObserver;