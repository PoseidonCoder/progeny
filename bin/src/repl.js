const exec = require('./exec');
const environment = new (require('./environment'))();
const readline = require('readline');

const repl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false,
});

repl.on('close', function () {
	console.log('\nGoodbye!');
	process.exit(0);
});

console.log('\u001b[40mWelcome to progeny@0.0.2!\u001b[0m');
console.log('Type "exit" to stop the repl');

function ask() {
	repl.question('>>> ', (input) => {
		if (input != 'exit') {
			exec(input, true, false, environment);
			ask();
		} else {
			repl.close();
		}
	});
}

ask();
