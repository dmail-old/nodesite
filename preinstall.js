if( process.env.npm_config_production !== 'true' ){
	var fs = require('fs');
	var childProcess = require('child_process');
	var path = require('path');
	var json = JSON.parse(fs.readFileSync('./package.json'));
	var dependencies = json.dependencies;

	Object.keys(dependencies).forEach(function(key){
		var modulePath;

		try{
			modulePath = require.resolve(key);
		}
		catch(e){
			console.log(e.stack);
			return;
		}

		var relativeModulePath = path.relative(process.cwd(), modulePath);
		var relativeModuleDirectory = path.dirname(relativeModulePath);
		var linkCmdOut;

		// the module exists already, just npm link it
		try{
			linkCmdOut = childProcess.execSync('npm link ' + relativeModuleDirectory);
		}
		catch(e){
			throw e;
		}

		console.log(linkCmdOut.toString());
		//console.log('linking', relativeModuleDirectory);
	});
}

process.exit();

/*

For each module defined in the ../node_modules folder
Search the duplicate version and link them

*/

/*
var fs = require('fs');
var childProcess = require('child_process');
var path = require('path');
var devDirectoryPath = '..' + path.sep + '@dmail';

function collectDir(filename){
	return fs.readdirSync(filename).filter(function(name){
		return fs.statSync(filename).isDirectory();
	}).map(function(name){
		return filename + path.sep + name;
	});
}

function rmdirRecursive(filename){
	var stat = fs.statSync(filename);

	if( stat.isDirectory() ){
		fs.readdirSync(filename).map(function(name){
			return filename + path.sep + name;
		}).forEach(rmdirRecursive);

		fs.rmdirSync(filename);
	}
	else{
		fs.unlinkSync(filename);
	}
}

if( false && process.env.npm_config_production !== 'true' ){
	var workingDirectoryPath = process.cwd();
	var devModulePaths = collectDir(devDirectoryPath);

	devModulePaths.forEach(function(devModulePath, index){
		var devModuleName = devModulePath.slice(('..' + path.sep).length);
		var modulePath;

		console.log('trying to find', devModuleName);

		try{
			modulePath = require.resolve(devModuleName);
		}
		catch(e){
			console.log(devModuleName, 'is not a module');
			return;
		}

		if( modulePath.indexOf(workingDirectoryPath) === -1 ){
			console.log(devModuleName, 'not found');
			return;
		}

		//var relativeModulePath = path.relative(process.cwd(), modulePath);
		var moduleDirectoryPath = path.dirname(modulePath);

		devModulePath = path.resolve(workingDirectoryPath, devModulePath);

		// delete the module and symlink to the local dev version
		rmdirRecursive(moduleDirectoryPath);
		console.log('linking', devModulePath, '->', moduleDirectoryPath);
		fs.symlinkSync(devModulePath, moduleDirectoryPath, 'dir');
	});
}
*/