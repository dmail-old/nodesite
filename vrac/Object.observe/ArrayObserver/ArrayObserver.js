var ObjectObserver = require('ObjectObserver');

var ArrayObserver = ObjectObserver.create({
	arrayObserve: true,

	init: function(){
		if (!Array.isArray(array))
			throw Error('Provided object is not an Array');
		ObjectObserver.call(this, array);
	},

	copyObject: function(arr) {
		return arr.slice();
	},

	check_: function(changeRecords) {
		var splices;
		if (hasObserve) {
			if (!changeRecords)
				return false;
			splices = projectArraySplices(this.value_, changeRecords);
		} else {
			splices = calcSplices(this.value_, 0, this.value_.length,
														this.oldObject_, 0, this.oldObject_.length);
		}

		if (!splices || !splices.length)
			return false;

		if (!hasObserve)
			this.oldObject_ = this.copyObject(this.value_);

		this.report_([splices]);
		return true;
	}
});

ArrayObserver.applySplices = function(previous, current, splices) {
	splices.forEach(function(splice) {
		var spliceArgs = [splice.index, splice.removed.length];
		var addIndex = splice.index;
		while (addIndex < splice.index + splice.addedCount) {
			spliceArgs.push(current[addIndex]);
			addIndex++;
		}

		Array.prototype.splice.apply(previous, spliceArgs);
	});
};


var arraySplice = require('./ArraySlice');

function newSplice(index, removed, addedCount) {
	return {
		index: index,
		removed: removed,
		addedCount: addedCount
	};
}

var EDIT_LEAVE = 0;
var EDIT_UPDATE = 1;
var EDIT_ADD = 2;
var EDIT_DELETE = 3;

function calcSplices(current, currentStart, currentEnd,
										 old, oldStart, oldEnd) {
	return arraySplice.calcSplices(current, currentStart, currentEnd,
																 old, oldStart, oldEnd);
}

function intersect(start1, end1, start2, end2) {
	// Disjoint
	if (end1 < start2 || end2 < start1)
		return -1;

	// Adjacent
	if (end1 == start2 || end2 == start1)
		return 0;

	// Non-zero intersect, span1 first
	if (start1 < start2) {
		if (end1 < end2)
			return end1 - start2; // Overlap
		else
			return end2 - start2; // Contained
	} else {
		// Non-zero intersect, span2 first
		if (end2 < end1)
			return end2 - start1; // Overlap
		else
			return end1 - start1; // Contained
	}
}

function mergeSplice(splices, index, removed, addedCount) {

	var splice = newSplice(index, removed, addedCount);

	var inserted = false;
	var insertionOffset = 0;

	for (var i = 0; i < splices.length; i++) {
		var current = splices[i];
		current.index += insertionOffset;

		if (inserted)
			continue;

		var intersectCount = intersect(splice.index,
																	 splice.index + splice.removed.length,
																	 current.index,
																	 current.index + current.addedCount);

		if (intersectCount >= 0) {
			// Merge the two splices

			splices.splice(i, 1);
			i--;

			insertionOffset -= current.addedCount - current.removed.length;

			splice.addedCount += current.addedCount - intersectCount;
			var deleteCount = splice.removed.length +
												current.removed.length - intersectCount;

			if (!splice.addedCount && !deleteCount) {
				// merged splice is a noop. discard.
				inserted = true;
			} else {
				var removed = current.removed;

				if (splice.index < current.index) {
					// some prefix of splice.removed is prepended to current.removed.
					var prepend = splice.removed.slice(0, current.index - splice.index);
					Array.prototype.push.apply(prepend, removed);
					removed = prepend;
				}

				if (splice.index + splice.removed.length > current.index + current.addedCount) {
					// some suffix of splice.removed is appended to current.removed.
					var append = splice.removed.slice(current.index + current.addedCount - splice.index);
					Array.prototype.push.apply(removed, append);
				}

				splice.removed = removed;
				if (current.index < splice.index) {
					splice.index = current.index;
				}
			}
		} else if (splice.index < current.index) {
			// Insert splice here.

			inserted = true;

			splices.splice(i, 0, splice);
			i++;

			var offset = splice.addedCount - splice.removed.length
			current.index += offset;
			insertionOffset += offset;
		}
	}

	if (!inserted)
		splices.push(splice);
}

function createInitialSplices(array, changeRecords) {
	var splices = [];

	for (var i = 0; i < changeRecords.length; i++) {
		var record = changeRecords[i];
		switch(record.type) {
			case 'splice':
				mergeSplice(splices, record.index, record.removed.slice(), record.addedCount);
				break;
			case 'add':
			case 'update':
			case 'delete':
				if (!isIndex(record.name))
					continue;
				var index = toNumber(record.name);
				if (index < 0)
					continue;
				mergeSplice(splices, index, [record.oldValue], 1);
				break;
			default:
				console.error('Unexpected record type: ' + JSON.stringify(record));
				break;
		}
	}

	return splices;
}

function projectArraySplices(array, changeRecords) {
	var splices = [];

	createInitialSplices(array, changeRecords).forEach(function(splice) {
		if (splice.addedCount == 1 && splice.removed.length == 1) {
			if (splice.removed[0] !== array[splice.index])
				splices.push(splice);

			return
		};

		splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount,
																				 splice.removed, 0, splice.removed.length));
	});

	return splices;
}

module.exports = ArrayObserver;