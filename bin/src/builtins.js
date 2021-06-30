const reader = require('readline-sync');
const error = require('./error');

module.exports = {
	length: (args, token) => {
		let str = args[0];

		if (str.type == 'string' || str.type == 'array') {
			return {
				type: 'integer',
				value:
					str.type == 'string'
						? str.value.length
						: str.elements.length,
			};
		} else {
			return {
				type: 'error',
				value: error.formError(
					error.types.TypeError,
					error.peekError('string', str.type),
					token
				),
			};
		}
	},
	input: (args, token) => {
		const prompt = args[0] ? args[0].value : '>> ';
		return { type: 'string', value: reader.question(prompt) };
	},
	random: (args, token) => {
		return args[0].elements[
			Math.floor(Math.random() * args[0].elements.length)
		];
	},
};
