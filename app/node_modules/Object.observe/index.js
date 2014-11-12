var testingExposeCycleCount = global.testingExposeCycleCount;

// Detect and do basic sanity checking on Object/Array.observe.
function detectObjectObserve() {
	if (typeof Object.observe !== 'function' ||
			typeof Array.observe !== 'function') {
		return false;
	}

	var records = [];

	function callback(recs) {
		records = recs;
	}

	var test = {};
	var arr = [];
	Object.observe(test, callback);
	Array.observe(arr, callback);
	test.id = 1;
	test.id = 2;
	delete test.id;
	arr.push(1, 2);
	arr.length = 0;

	Object.deliverChangeRecords(callback);
	if (records.length !== 5)
		return false;

	if (records[0].type != 'add' ||
			records[1].type != 'update' ||
			records[2].type != 'delete' ||
			records[3].type != 'splice' ||
			records[4].type != 'splice') {
		return false;
	}

	Object.unobserve(test, callback);
	Array.unobserve(arr, callback);

	return true;
}

var hasObserve = detectObjectObserve();

var numberIsNaN = global.Number.isNaN || function(value) {
	return typeof value === 'number' && global.isNaN(value);
}

function areSameValue(left, right) {
	if (left === right)
		return left !== 0 || 1 / left === 1 / right;
	if (numberIsNaN(left) && numberIsNaN(right))
		return true;

	return left !== left && right !== right;
}

var MAX_DIRTY_CHECK_CYCLES = 1000;

function dirtyCheck(observer) {
	var cycles = 0;
	while (cycles < MAX_DIRTY_CHECK_CYCLES && observer.check_()) {
		cycles++;
	}
	if (testingExposeCycleCount)
		global.dirtyCheckCycleCount = cycles;

	return cycles > 0;
}

function objectIsEmpty(object) {
	for (var prop in object)
		return false;
	return true;
}

function diffIsEmpty(diff) {
	return objectIsEmpty(diff.added) &&
				 objectIsEmpty(diff.removed) &&
				 objectIsEmpty(diff.changed);
}

function diffObjectFromOldObject(object, oldObject) {
	var added = {};
	var removed = {};
	var changed = {};

	for (var prop in oldObject) {
		var newValue = object[prop];

		if (newValue !== undefined && newValue === oldObject[prop])
			continue;

		if (!(prop in object)) {
			removed[prop] = undefined;
			continue;
		}

		if (newValue !== oldObject[prop])
			changed[prop] = newValue;
	}

	for (var prop in object) {
		if (prop in oldObject)
			continue;

		added[prop] = object[prop];
	}

	if (Array.isArray(object) && object.length !== oldObject.length)
		changed.length = object.length;

	return {
		added: added,
		removed: removed,
		changed: changed
	};
}

var eomTasks = [];
function runEOMTasks() {
	if (!eomTasks.length)
		return false;

	for (var i = 0; i < eomTasks.length; i++) {
		eomTasks[i]();
	}
	eomTasks.length = 0;
	return true;
}

var runEOM = hasObserve ? (function(){
	return function(fn) {
		return Promise.resolve().then(fn);
	}
})() :
(function() {
	return function(fn) {
		eomTasks.push(fn);
	};
})();

var observedObjectCache = [];

function newObservedObject() {
	var observer;
	var object;
	var discardRecords = false;
	var first = true;

	function callback(records) {
		if (observer && observer.state_ === OPENED && !discardRecords)
			observer.check_(records);
	}

	return {
		open: function(obs) {
			if (observer)
				throw Error('ObservedObject in use');

			if (!first)
				Object.deliverChangeRecords(callback);

			observer = obs;
			first = false;
		},
		observe: function(obj, arrayObserve) {
			object = obj;
			if (arrayObserve)
				Array.observe(object, callback);
			else
				Object.observe(object, callback);
		},
		deliver: function(discard) {
			discardRecords = discard;
			Object.deliverChangeRecords(callback);
			discardRecords = false;
		},
		close: function() {
			observer = undefined;
			Object.unobserve(object, callback);
			observedObjectCache.push(this);
		}
	};
}

/*
 * The observedSet abstraction is a perf optimization which reduces the total
 * number of Object.observe observations of a set of objects. The idea is that
 * groups of Observers will have some object dependencies in common and this
 * observed set ensures that each object in the transitive closure of
 * dependencies is only observed once. The observedSet acts as a write barrier
 * such that whenever any change comes through, all Observers are checked for
 * changed values.
 *
 * Note that this optimization is explicitly moving work from setup-time to
 * change-time.
 *
 * TODO(rafaelw): Implement "garbage collection". In order to move work off
 * the critical path, when Observers are closed, their observed objects are
 * not Object.unobserve(d). As a result, it's possible that if the observedSet
 * is kept open, but some Observers have been closed, it could cause "leaks"
 * (prevent otherwise collectable objects from being collected). At some
 * point, we should implement incremental "gc" which keeps a list of
 * observedSets which may need clean-up and does small amounts of cleanup on a
 * timeout until all is clean.
 */

function getObservedObject(observer, object, arrayObserve) {
	var dir = observedObjectCache.pop() || newObservedObject();
	dir.open(observer);
	dir.observe(object, arrayObserve);
	return dir;
}

var observedSetCache = [];

function newObservedSet() {
	var observerCount = 0;
	var observers = [];
	var objects = [];
	var rootObj;
	var rootObjProps;

	function observe(obj, prop) {
		if (!obj)
			return;

		if (obj === rootObj)
			rootObjProps[prop] = true;

		if (objects.indexOf(obj) < 0) {
			objects.push(obj);
			Object.observe(obj, callback);
		}

		observe(Object.getPrototypeOf(obj), prop);
	}

	function allRootObjNonObservedProps(recs) {
		for (var i = 0; i < recs.length; i++) {
			var rec = recs[i];
			if (rec.object !== rootObj ||
					rootObjProps[rec.name] ||
					rec.type === 'setPrototype') {
				return false;
			}
		}
		return true;
	}

	function callback(recs) {
		if (allRootObjNonObservedProps(recs))
			return;

		var observer;
		for (var i = 0; i < observers.length; i++) {
			observer = observers[i];
			if (observer.state_ == OPENED) {
				observer.iterateObjects_(observe);
			}
		}

		for (var i = 0; i < observers.length; i++) {
			observer = observers[i];
			if (observer.state_ == OPENED) {
				observer.check_();
			}
		}
	}

	var record = {
		objects: objects,
		get rootObject() { return rootObj; },
		set rootObject(value) {
			rootObj = value;
			rootObjProps = {};
		},
		open: function(obs, object) {
			observers.push(obs);
			observerCount++;
			obs.iterateObjects_(observe);
		},
		close: function(obs) {
			observerCount--;
			if (observerCount > 0) {
				return;
			}

			for (var i = 0; i < objects.length; i++) {
				Object.unobserve(objects[i], callback);
				Observer.unobservedCount++;
			}

			observers.length = 0;
			objects.length = 0;
			rootObj = undefined;
			rootObjProps = undefined;
			observedSetCache.push(this);
			if (lastObservedSet === this)
				lastObservedSet = null;
		},
	};

	return record;
}

var lastObservedSet;

function getObservedSet(observer, obj) {
	if (!lastObservedSet || lastObservedSet.rootObject !== obj) {
		lastObservedSet = observedSetCache.pop() || newObservedSet();
		lastObservedSet.rootObject = obj;
	}
	lastObservedSet.open(observer, obj);
	return lastObservedSet;
}

var runningMicrotaskCheckpoint = false;

global.Platform = global.Platform || {};

global.Platform.performMicrotaskCheckpoint = function() {
	if (runningMicrotaskCheckpoint)
		return;

	if (!collectObservers)
		return;

	runningMicrotaskCheckpoint = true;

	var cycles = 0;
	var anyChanged, toCheck;

	do {
		cycles++;
		toCheck = allObservers;
		allObservers = [];
		anyChanged = false;

		for (var i = 0; i < toCheck.length; i++) {
			var observer = toCheck[i];
			if (observer.state_ != OPENED)
				continue;

			if (observer.check_())
				anyChanged = true;

			allObservers.push(observer);
		}
		if (runEOMTasks())
			anyChanged = true;
	} while (cycles < MAX_DIRTY_CHECK_CYCLES && anyChanged);

	if (testingExposeCycleCount)
		global.dirtyCheckCycleCount = cycles;

	runningMicrotaskCheckpoint = false;
};

if (collectObservers) {
	global.Platform.clearObservers = function() {
		allObservers = [];
	};
}

var expectedRecordTypes = {
	add: true,
	update: true,
	delete: true
};

function diffObjectFromChangeRecords(object, changeRecords, oldValues) {
	var added = {};
	var removed = {};

	for (var i = 0; i < changeRecords.length; i++) {
		var record = changeRecords[i];
		if (!expectedRecordTypes[record.type]) {
			console.error('Unknown changeRecord type: ' + record.type);
			console.error(record);
			continue;
		}

		if (!(record.name in oldValues))
			oldValues[record.name] = record.oldValue;

		if (record.type == 'update')
			continue;

		if (record.type == 'add') {
			if (record.name in removed)
				delete removed[record.name];
			else
				added[record.name] = true;

			continue;
		}

		// type = 'delete'
		if (record.name in added) {
			delete added[record.name];
			delete oldValues[record.name];
		} else {
			removed[record.name] = true;
		}
	}

	for (var prop in added)
		added[prop] = object[prop];

	for (var prop in removed)
		removed[prop] = undefined;

	var changed = {};
	for (var prop in oldValues) {
		if (prop in added || prop in removed)
			continue;

		var newValue = object[prop];
		if (oldValues[prop] !== newValue)
			changed[prop] = newValue;
	}

	return {
		added: added,
		removed: removed,
		changed: changed
	};
}