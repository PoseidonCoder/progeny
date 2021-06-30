const util = require('util');
const Lexer = require('./lexer');
const Parser = require('./parser');
const Eval = require('./eval');

function exec(input, repl, debug, environment) {
	if (debug) console.time('execution time');

	const lexer = new Lexer(input, debug);
	const parser = new Parser(lexer);

	const ast = parser.parseProgram();
	if (debug) {
		console.log();
		console.log(util.inspect(ast, { showHidden: false, depth: null }));
		console.log();

		console.log('done parsing...\n');
	}

	if (parser.errors.length) {
		parser.printParserErrors();
		return;
	}

	const returned = Eval(ast, environment);
	if (debug) {
		console.log('\ndone executing...');
		console.timeEnd('execution time');
	}

	if (
		repl &&
		returned &&
		returned.value != undefined &&
		returned.type != 'error'
	) {
		console.log('> ' + returned.value);
	}
}

module.exports = exec;
