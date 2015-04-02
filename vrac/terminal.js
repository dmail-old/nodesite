require('net').createServer().listen(); // keep alive

function activatePrompt(){
	var readline = require('readline'), interface = readline.createInterface(process.stdin, process.stdout);

	interface.setPrompt('> ');
	interface.prompt();
	interface.on('line', function(line){
		var code = line.trim();

		try{
			console.log(eval(code));
		}
		catch(e){
			console.log(e.stack);
		}

		interface.prompt();
	});
	interface.on('close', function(){
		process.exit(0);
	});
}

function write(text){
	process.stdout.write(text);
}

function moveCursor(x, y){
	process.stdout.moveCursor(x, y);
}

function clearLine(){
	process.stdout.clearLine();
}

function cursorTo(x, y){
	process.stdout.cursorTo(x, y);
}

write('lineA');
write('\n');
write('lineB');
write('\n');
write('lineC');

//moveCursor(0, 1); // write('\n'); // ceci = moveCursor(0, 1); cursorTo(0, 1);
moveCursor(0, 1);
cursorTo(0);

var tpl = 'nom: damien, age: 24';
var nameStart = tpl.indexOf(' damien');
var ageStart = tpl.indexOf(' 24');

write(tpl);

cursorTo(nameStart);

write('clém');

// on va redesinner toutes la ligne

//cursorTo(nameStart);
//write('clément');
//activatePrompt();