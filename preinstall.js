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