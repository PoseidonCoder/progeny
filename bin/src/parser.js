const token = require('./token');
const error = require('./error');

class Parser {
	prefixParseFns = {};
	infixParseFns = {};
	errors = [];

	constructor(lexer) {
		this.lexer = lexer;

		this.precedences = {
			LOWEST: 1,
			is: 2,
			'=': 3,
			'+': 4,
			'-': 5,
			'/': 6,
			'*': 7,
			'**': 8,
			'(': 9,
			PREFIX: 10,
			'[': 11,
		};

		this.registerPrefix(token.types.FUNCTION, this.parseFunctionLiteral);
		this.registerPrefix(token.types.LBRACE, this.parseHashLiteral);
		this.registerPrefix(token.types.LBRACKET, this.parseArrayLiteral);
		this.registerPrefix(token.types.SHOW, this.parseShowExpression);
		this.registerPrefix(token.types.IF, this.parseIfStatement);
		this.registerPrefix(token.types.TRUE, this.parseBoolean);
		this.registerPrefix(token.types.FALSE, this.parseBoolean);
		this.registerPrefix(token.types.INT, this.parseIntegerLiteral);
		this.registerPrefix(token.types.STRING, this.parseStringLiteral);
		this.registerPrefix(token.types.MINUS, this.parsePrefixExpression);
		this.registerPrefix(token.types.LPAREN, this.parseGroupedExpression);
		this.registerPrefix(token.types.NOT, this.parsePrefixExpression);
		this.registerPrefix(token.types.IDENT, this.parseIdentifier);

		this.registerInfix(token.types.LBRACKET, this.parseIndexExpression);
		this.registerInfix(token.types.PLUS, this.parseInfixExpression);
		this.registerInfix(token.types.LPAREN, this.parseCallExpression);
		this.registerInfix(token.types.MINUS, this.parseInfixExpression);
		this.registerInfix(token.types.MULTIPLY, this.parseInfixExpression);
		this.registerInfix(token.types.DIVIDE, this.parseInfixExpression);
		this.registerInfix(token.types.EXPONENT, this.parseInfixExpression);
		this.registerInfix(token.types.IS, this.parseInfixExpression);
		this.registerInfix(token.types.ASSIGN, this.parseAssignExpression);

		this.nextToken();
		this.nextToken();
	}

	registerInfix(type, fn) {
		this.infixParseFns[type] = fn;
	}

	registerPrefix(type, fn) {
		this.prefixParseFns[type] = fn;
	}

	parseProgram() {
		let program = {
			type: 'program',
			statements: [],
		};

		while (!this.curTokenIs(token.types.EOF)) {
			let statement = this.parseStatement();
			if (statement != null) {
				program.statements.push(statement);
			}

			this.nextToken();
		}

		return program;
	}

	parseStatement() {
		switch (this.curToken.type) {
			case token.types.COMMENT:
				return this.parseComment();

			case token.types.RETURN:
				return this.parseReturnStatement();

			default:
				return this.parseExpressionStatement();
		}
	}

	parseComment() {
		return {
			type: 'comment',
			token: this.curToken,
			value: this.curToken.literal,
		};
	}

	parseReturnStatement() {
		let statement = {
			type: 'return',
			token: this.curToken,
		};

		this.nextToken();

		statement.value = this.parseExpression(this.precedences.LOWEST);

		if (this.peekTokenIs(token.types.SEMICOLON)) {
			this.nextToken();
		}

		return statement;
	}

	parseExpressionStatement() {
		const statement = {
			type: 'expression statement',
			token: this.curToken,
			expression: this.parseExpression(this.precedences.LOWEST),
		};

		if (this.peekTokenIs(token.types.SEMICOLON)) {
			this.nextToken();
		}

		return statement;
	}

	parseExpression(precendence) {
		let prefix = this.prefixParseFns[this.curToken.type];
		if (!prefix) {
			this.errors.push(
				error.formError(
					error.types.SyntaxError,
					error.unexpected(this.curToken.type),
					this.curToken
				)
			);
			return null;
		}

		prefix = prefix.bind(this);

		let leftExp = prefix();

		while (
			!this.peekTokenIs(token.types.SEMICOLON) &&
			precendence < this.peekPrecedence()
		) {
			this.nextToken();

			let infix = this.infixParseFns[this.curToken.type];
			if (!infix) {
				this.errors.push(
					error.formError(
						error.types.SyntaxError,
						error.unexpected(this.curToken.type),
						this.curToken
					)
				);
				return null;
			}
			infix = infix.bind(this);

			leftExp = infix(leftExp);
		}

		return leftExp;
	}

	parseIntegerLiteral() {
		return {
			type: 'integer',
			token: this.curToken,
			value: parseInt(this.curToken.literal),
		};
	}

	parseArrayLiteral() {
		return {
			type: 'array',
			token: this.curToken,
			elements: this.parseExpressionList(token.types.RBRACKET),
		};
	}

	parseExpressionList(end) {
		let list = [];

		if (this.peekTokenIs(end)) {
			this.nextToken();
			return list;
		}

		this.nextToken();
		list.push(this.parseExpression(this.precedences.LOWEST));

		while (this.peekTokenIs(token.types.COMMA)) {
			this.nextToken();
			this.nextToken();
			list.push(this.parseExpression(this.precedences.LOWEST));
		}

		if (!this.expectPeek(end)) {
			return null;
		}

		return list;
	}

	parseIndexExpression(left) {
		let expression = {
			type: 'index',
			token: this.curToken,
			left,
		};

		this.nextToken();
		expression.index = this.parseExpression(this.precedences.LOWEST);

		if (!this.expectPeek(token.types.RBRACKET)) {
			return null;
		}

		return expression;
	}

	parseStringLiteral() {
		return {
			type: 'string',
			token: this.curToken,
			value: this.curToken.literal,
		};
	}

	parseIdentifier() {
		return {
			type: 'identifier',
			token: this.curToken,
			value: this.curToken.literal,
		};
	}

	parseShowExpression() {
		let se = {
			type: 'show',
			token: this.curToken,
		};

		this.nextToken();
		se.value = this.parseExpression(this.precedences.LOWEST);
		return se;
	}

	parseIfStatement() {
		let expression = {
			type: 'if',
			token: this.curToken,
		};

		this.nextToken();
		expression.condition = this.parseExpression(this.precedences['LOWEST']);
		this.nextToken();
		expression.consequence = this.parseBlockStatement();

		if (this.peekTokenIs(token.types.ELSE)) {
			this.nextToken();

			if (!this.expectPeek(token.types.LBRACE)) {
				return null;
			}

			expression.alternative = this.parseBlockStatement();
		}

		return expression;
	}

	parseBlockStatement() {
		let block = {
			type: 'block',
			token: this.curToken,
			statements: [],
		};

		this.nextToken();

		while (
			!this.curTokenIs(token.types.RBRACE) &&
			!this.curTokenIs(token.types.EOF)
		) {
			let statement = this.parseStatement();
			if (statement != null) {
				block.statements.push(statement);
			}

			this.nextToken();
		}

		return block;
	}

	parsePrefixExpression() {
		let expression = {
			type: 'prefix',
			token: this.curToken,
			operator: this.curToken.literal,
		};

		this.nextToken();

		expression.right = this.parseExpression(this.precedences.PREFIX);

		return expression;
	}

	parseAssignExpression(left) {
		if (left.type != 'identifier') {
			this.errors.push(
				error.formError(
					error.types.SyntaxError,
					error.expected(left.type),
					this.curToken
				)
			);

			return null;
		}

		let expression = {
			type: 'assign',
			token: this.curToken,
			left,
		};

		this.nextToken();
		expression.value = this.parseExpression(this.precedences.LOWEST);

		return expression;
	}

	parseFunctionLiteral() {
		let literal = {
			type: 'function',
			token: this.curToken,
		};

		if (!this.expectPeek(token.types.LPAREN)) {
			return null;
		}

		literal.parameters = this.parseFunctionParameters();

		if (!this.expectPeek(token.types.LBRACE)) {
			return null;
		}

		literal.body = this.parseBlockStatement();

		return literal;
	}

	parseFunctionParameters() {
		let identifiers = [];

		if (this.peekTokenIs(token.types.RPAREN)) {
			this.nextToken();
			return identifiers;
		}

		this.nextToken();

		identifiers.push(this.parseIdentifier());

		while (this.peekTokenIs(token.types.COMMA)) {
			this.nextToken();
			this.nextToken();
			identifiers.push(this.parseIdentifier());
		}

		if (!this.expectPeek(token.types.RPAREN)) {
			return null;
		}

		return identifiers;
	}

	parseHashLiteral() {
		let hash = {
			type: 'hash',
			token: this.curToken,
			value: {},
		};

		while (!this.peekTokenIs(token.types.RBRACE)) {
			this.nextToken();
			const key = this.parseExpression(this.precedences.LOWEST);

			if (!this.expectPeek(token.types.COLON)) {
				return null;
			}

			this.nextToken();
			const value = this.parseExpression(this.precedences.LOWEST);

			hash.value[JSON.stringify(key)] = value;

			if (
				!this.peekTokenIs(token.types.RBRACE) &&
				!this.expectPeek(token.types.COMMA)
			) {
				return null;
			}
		}

		if (!this.expectPeek(token.types.RBRACE)) {
			return null;
		}

		return hash;
	}

	parseGroupedExpression() {
		this.nextToken();

		const exp = this.parseExpression(this.precedences['LOWEST']);
		if (!this.expectPeek(token.types.RPAREN)) {
			return null;
		}

		return exp;
	}

	parseBoolean() {
		return {
			type: 'boolean',
			value: this.curTokenIs(token.types.TRUE),
		};
	}

	parseInfixExpression(left) {
		let expression = {
			type: 'infix',
			token: this.curToken,
			operator: this.curToken.literal,
			left,
		};

		const precedence = this.curPrecedence();
		this.nextToken();
		expression.right = this.parseExpression(precedence);

		return expression;
	}

	parseCallExpression(name) {
		return {
			type: 'call',
			token: this.curToken,
			name,
			arguments: this.parseExpressionList(token.types.RPAREN),
		};
	}

	expectPeek(type) {
		if (this.peekTokenIs(type)) {
			this.nextToken();
			return true;
		} else {
			this.errors.push(
				error.formError(
					error.types.SyntaxError,
					error.peekError(type, this.peekToken.type),
					this.peekToken
				)
			);
			return false;
		}
	}

	peekPrecedence() {
		const p = this.precedences[this.peekToken.type];
		return p ? p : this.precedences['LOWEST'];
	}

	curPrecedence() {
		const p = this.precedences[this.curToken.type];
		return p ? p : this.precedences['LOWEST'];
	}

	curTokenIs(t) {
		return this.curToken.type == t;
	}

	peekTokenIs(t) {
		return this.peekToken.type == t;
	}

	nextToken() {
		if (this.peekToken) {
			this.curToken = JSON.parse(JSON.stringify(this.peekToken));
		}

		this.peekToken = this.lexer.nextToken();
	}

	printParserErrors() {
		this.errors.forEach((msg) => console.log(msg));
	}
}

module.exports = Parser;
