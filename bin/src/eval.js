const error = require('./error');
const builtins = require('./builtins');

const TRUE = {
	type: 'boolean',
	value: true,
};

const FALSE = {
	type: 'boolean',
	value: false,
};

function evalNode(node, env) {
	switch (node.type) {
		case 'program':
			return evalProgram(node, env);

		case 'expression statement':
			return evalNode(node.expression, env);

		case 'return':
			let value = evalNode(node.value, env);
			if (value.type == 'error') return val;

			return { type: 'return', value };

		case 'block':
			return evalBlockStatement(node, env);

		case 'prefix':
			return evalPrefixExpression(
				node.operator,
				evalNode(node.right, env),
				node.token
			);

		case 'infix':
			return evalInfixExpression(
				node.operator,
				evalNode(node.left, env),
				evalNode(node.right, env),
				node.token,
				env
			);

		case 'integer':
			return { type: 'integer', value: node.value };

		case 'string':
			return { type: 'string', value: node.value };

		case 'boolean':
			return { type: 'boolean', value: node.value };

		case 'hash':
			return evalHashLiteral(node, env);

		case 'show':
			return console.log(evalNode(node.value, env).value);

		case 'assign':
			return env.set(node.left.value, evalNode(node.value, env));

		case 'if':
			return evalIfStatement(node, env);

		case 'function':
			return {
				type: 'function',
				parameters: node.parameters,
				body: node.body,
				env,
			};

		case 'call':
			let func = evalNode(node.name, env);
			if (func.type == 'error') return func;

			let args = evalExpressions(node.arguments, env);
			if (args.length == 1 && args[0].type == 'error') {
				return args[0];
			}

			return applyFunction(func, args, node.token);

		case 'array':
			let elements = evalExpressions(node.elements, env);
			if (elements.length == 1 && elements[0].type == 'error') {
				return elements[0];
			}

			return {
				type: 'array',
				elements,
			};

		case 'index':
			let left = evalNode(node.left, env);
			if (left.type == 'error') {
				return left;
			}

			let index = evalNode(node.index, env);
			if (index.type == 'error') {
				return index;
			}

			return evalIndexExpression(left, index);

		case 'identifier':
			return evalIdentifier(node, env);

		case 'comment':
			return null;

		default:
			return newError(
				error.types.InternalError,
				error.unknownNode(node.type),
				node.token
			);
	}
}

function evalProgram(program, env) {
	let result;

	program.statements.forEach((statement) => {
		result = evalNode(statement, env);

		if (result && result.type == 'error') {
			console.log(result.value);
		}
	});

	return result;
}

function evalBlockStatement(block, env) {
	let result;

	block.statements.forEach((statement) => {
		result = evalNode(statement, env);

		if (result) {
			switch (result.type) {
				case 'error':
					console.log(result.value);
					break;

				case 'return':
					return result;
			}
		}
	});

	return result ? result.value : result;
}

function evalExpressions(exps, env) {
	let result = [];

	exps.forEach((e) => {
		result.push(evalNode(e, env));
	});

	return result;
}

function isTruthy(node) {
	switch (node.value) {
		case true:
			return true;

		case false:
			return false;

		default:
			return true;
	}
}

function evalIfStatement(ie, env) {
	let condition = evalNode(ie.condition, env);
	if (condition && condition.type == 'error') {
		return condition;
	}

	if (isTruthy(condition)) {
		return evalNode(ie.consequence, env);
	} else if (ie.alternative != null) {
		return evalNode(ie.alternative, env);
	} else {
		return null;
	}
}

function evalPrefixExpression(operator, right, token) {
	switch (operator) {
		case '-':
			if (right.type != 'integer') {
				return newError(
					error.types.TypeError,
					error.prefixOperatorError(operator, right.type),
					token
				);
			}

			return {
				type: 'integer',
				value: -right.value,
			};
		case '!':
			if (right.type != 'boolean') {
				return newError(
					error.types.TypeError,
					error.prefixOperatorError(operator, right.type),
					token
				);
			}

			return {
				type: 'boolean',
				value: !isTruthy(right),
			};
	}
}

function evalInfixExpression(operator, left, right, token, env) {
	switch (operator) {
		case 'is':
			return {
				type: 'boolean',
				token,
				value: left.value == right.value,
			};

		default:
			return {
				type: 'integer',
				token,
				value: evalMathExpression(left.value, operator, right.value),
			};
	}
}

function evalMathExpression(left, operator, right) {
	switch (operator) {
		case '+':
			return left + right;
		case '-':
			return left - right;
		case '*':
			return left * right;
		case '/':
			return left / right;
		case '**':
			return left ** right;
	}
}

function evalHashLiteral(node, env) {
	let pairs = {};

	for (let i in node.value) {
		const keyN = JSON.parse(i);
		const valueN = node.value[i];

		const key = evalNode(keyN, env);
		if (key.type == 'error') return key;

		const value = evalNode(valueN, env);
		if (value.type == 'error') return value;

		pairs[JSON.stringify(key)] = value;
	}

	return {
		type: 'hash',
		value: pairs,
	};
}

function evalIdentifier(node, env) {
	const value = env.get(node.value);
	if (value) return value;

	const builtin = builtins[node.value];
	if (builtin) return { type: 'builtin', fn: builtin };

	return newError(
		error.types.NameError,
		error.variableNotFound(node.value),
		node.token
	);
}

function evalIndexExpression(array, index, env) {
	switch (array.type) {
		case 'hash':
			const key = JSON.stringify(index);
			const value = array.value[key];

			if (!value) {
				return newError(
					error.types.KeyError,
					error.keyError(key),
					array.token
				);
			}

			return value;

		case 'array':
			const max = array.elements.length;
			const i = index.value;

			if (i < 0 || i > max) {
				return null;
			}

			return array.elements[i - 1];

		default:
			return null;
	}
}

function applyFunction(fn, args, token) {
	switch (fn.type) {
		case 'builtin':
			return fn.fn(args, token);

		case 'function':
			let evaluated = evalNode(
				fn.body,
				extendFunctionEnvironment(fn, args)
			);

			return evaluated && evaluated.type == 'return'
				? evaluated.value
				: evaluated;
	}
}

function extendFunctionEnvironment(fn, args) {
	let env = fn.env.clone();

	fn.parameters.forEach((param, i) => {
		env.set(param.value, args[i]);
	});

	return env;
}

function newError(type, message, token) {
	return {
		type: 'error',
		value: error.formError(type, message, token),
	};
}

module.exports = evalNode;
