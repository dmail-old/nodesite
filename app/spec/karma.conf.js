basePath = './';

files = [
	JASMINE,
  	JASMINE_ADAPTER,
	'./adapter.js',
	'../client/js/core/object.js',
	'../client/js/core/regexp.js',
	'../client/js/core/boolean.js',
	'../client/js/core/number.js',
	'../client/js/core/string.js',
	'../client/js/core/function.js',
	'../client/js/core/array.js',

	'../client/js/util/object.at.js',
	'../client/js/util/filter.js',
	'../client/js/util/random.js',

	'../client/js/lib/emitter.js',
	'../client/js/lib/partObserver.js',
	'../client/js/lib/pathObserver.js',

	'test/**/*.js'
];

autoWatch = true;

browsers = ['Firefox'];

junitReporter = {
  outputFile: 'test.xml',
  suite: 'test'
};
