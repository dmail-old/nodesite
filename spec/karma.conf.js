basePath = './';

files = [
	JASMINE,
  	JASMINE_ADAPTER,
	'./adapter.js',
	'../client/js/',
	'../client/js/lib/core/util.js',
	'../client/js/lib/core/object.js',
	'../client/js/lib/core/string.js',
	'../client/js/lib/core/boolean.js',
	'../client/js/lib/core/number.js',
	'../client/js/lib/core/regexp.js',
	'../client/js/lib/core/function.js',
	'../client/js/lib/core/array.js',

	'../client/js/lib/object.at.js',
	'../client/js/lib/filter.js',
	'../client/js/lib/random.js',
	'../client/js/lib/emitter.js',

	'test/**/*.js'
];

autoWatch = true;

browsers = ['Firefox'];

junitReporter = {
  outputFile: 'test.xml',
  suite: 'test'
};
