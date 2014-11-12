var Observer = require('../Observer');

var ObjectObserver = Observer.create({
	arrayObserve: false,

	init: function(object){
		Observer.init.call(this);
		this.value_ = object;
		this.oldObject_ = undefined;
	},

	connect_: function(callback, target) {
		if (hasObserve) {
			this.directObserver_ = getObservedObject(this, this.value_,
																							 this.arrayObserve);
		} else {
			this.oldObject_ = this.copyObject(this.value_);
		}

	},

	copyObject: function(object) {
		var copy = Array.isArray(object) ? [] : {};
		for (var prop in object) {
			copy[prop] = object[prop];
		};
		if (Array.isArray(object))
			copy.length = object.length;
		return copy;
	},

	check_: function(changeRecords, skipChanges) {
		var diff;
		var oldValues;
		if (hasObserve) {
			if (!changeRecords)
				return false;

			oldValues = {};
			diff = diffObjectFromChangeRecords(this.value_, changeRecords,
																				 oldValues);
		} else {
			oldValues = this.oldObject_;
			diff = diffObjectFromOldObject(this.value_, this.oldObject_);
		}

		if (diffIsEmpty(diff))
			return false;

		if (!hasObserve)
			this.oldObject_ = this.copyObject(this.value_);

		this.report_([
			diff.added || {},
			diff.removed || {},
			diff.changed || {},
			function(property) {
				return oldValues[property];
			}
		]);

		return true;
	},

	disconnect_: function() {
		if (hasObserve) {
			this.directObserver_.close();
			this.directObserver_ = undefined;
		} else {
			this.oldObject_ = undefined;
		}
	},

	deliver: function() {
		if (this.state_ != OPENED)
			return;

		if (hasObserve)
			this.directObserver_.deliver(false);
		else
			dirtyCheck(this);
	},

	discardChanges: function() {
		if (this.directObserver_)
			this.directObserver_.deliver(true);
		else
			this.oldObject_ = this.copyObject(this.value_);

		return this.value_;
	}
};

module.exports = ObjectObserver;