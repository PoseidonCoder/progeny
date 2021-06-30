const types = {
	SHOW: 'show',
	IS: 'is',
	TRUE: 'true',
	FALSE: 'false',
	IF: 'if',
	ELSE: 'else',
	RETURN: 'return',
	FUNCTION: 'function',

	PLUS: '+',
	MINUS: '-',
	MULTIPLY: '*',
	DIVIDE: '/',
	EXPONENT: '**',
	ASSIGN: '=',
	LPAREN: '(',
	RPAREN: ')',
	LBRACE: '{',
	RBRACE: '}',
	LBRACKET: '[',
	RBRACKET: ']',
	COMMA: ',',
	NOT: '!',
	SEMICOLON: ';',
	COLON: ':',

	IDENT: 'identifier',
	COMMENT: 'comment',
	STRING: 'string',
	INT: 'integer',

	ILLEGAL: 'ILLEGAL',
	EOF: 'EOF',
};

const keywords = {
	show: types.SHOW,
	is: types.IS,
	if: types.IF,
	true: types.TRUE,
	false: types.FALSE,
	else: types.ELSE,
	return: types.RETURN,
	fun: types.FUNCTION,
};

function lookupIdent(ident) {
	const keyword = keywords[ident];
	return keyword ? keyword : types.IDENT;
}

module.exports = {
	types,
	keywords,
	lookupIdent,
};
