basePath = './';

files = [
	JASMINE,
  	JASMINE_ADAPTER,
	'../client/js/lib/core/object.js',
	'test/**/*.js'
];

autoWatch = true;

browsers = ['Firefox'];

junitReporter = {
  outputFile: 'test.xml',
  suite: 'test'
};
