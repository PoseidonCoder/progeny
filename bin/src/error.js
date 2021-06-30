module.exports = {
	types: {
		SyntaxError: 'SyntaxError',
		NameError: 'NameError',
		InternalError: 'InternalError',
		TypeError: 'TypeError',
		KeyError: 'KeyError',
	},
	formError: (type, message, token) =>
		`\u001b[31;1m${type}: ${message}\n\tat line ${token.loc.line}, column ${token.loc.col}\u001b[0m`,
	peekError: (expected, type) =>
		`expected next token to be ${expected}, but got ${type}`,
	unexpected: (type) => 'unexpected token ' + type,
	variableNotFound: (name) => "couldn't find " + name,
	unknownOperator: (operator) => operator + ' is an unknown operator',
	unknownNode: (type) => `the node type "${type}" is unknown`,
	prefixOperatorError: (operator, right) =>
		`can't use ${operator} on ${right}`,
	expected: (got) => 'expected left to be a name, but got ' + got,
	keyError: (key) => key + ' not found in object',
};
