#! /usr/bin/env node
const fs = require('fs');
const exec = require('./src/exec');
const Environment = require('./src/environment');
const argv = require('yargs')
	.scriptName('intui')
	.usage('Usage: $0 <filename>')
	.alias('h', 'help')
	.alias('v', 'version')
	.option('d', {
		alias: 'debug',
		describe: 'emits token stream and AST (for language developers)',
		type: 'boolean',
	})
	.parse();

if (argv._.length == 0) {
	require('./src/repl');
} else if (argv._.length == 1) {
	const file = fs.readFileSync(argv._[0]).toString();
	exec(file, false, argv.d, new Environment());
}
