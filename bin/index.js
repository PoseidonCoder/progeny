#! /usr/bin/env node
const fs = require('fs');
const exec = require('./src/exec');
const Environment = require('./src/environment');
const yargs = require('yargs');
const argv = require('yargs')
	.scriptName('pog')
	.usage('Usage: $0 <filename>')
	.alias('h', 'help')
	.alias('v', 'version')
	.option('d', {
		alias: 'debug',
		describe: 'emits token stream and AST (for language developers)',
		type: 'boolean',
	})
	.parse();

switch (argv._.length) {
	case 0:
		require('./src/repl');
		break;

	case 1:
		const name = argv._[0] == '.' ? 'index.pog' : argv._[0] + '.pog';
		let code;

		try {
			code = fs.readFileSync(name).toString();
		} catch {
			return console.log(`\u001b[31;1m"${name}" doesn't exist\u001b[0m`);
		}

		exec(code, false, argv.d, new Environment());

		break;

	default:
		yargs.showHelp();
		break;
}
