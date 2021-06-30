const token = require('./token');

class Lexer {
	token = {};

	line = 1;
	col = 1;

	position = 0;
	readPosition = 0;

	constructor(input, debug) {
		this.input = input;
		this.debug = debug;
		this.readChar();
	}

	nextToken() {
		this.skipWhitespace();

		if (this.debug) console.log(this.token);

		switch (this.char) {
			case '+':
				this.newToken(token.types.PLUS);
				break;
			case '-':
				this.newToken(token.types.MINUS);
				break;
			case '*':
				if (this.input[this.readPosition] == '*') {
					this.token.type = token.types.EXPONENT;
					this.token.literal = '**';
					this.token.loc = this.currentPosition();
					this.readChar();
				} else {
					this.newToken(token.types.MULTIPLY);
				}

				break;
			case '/':
				this.newToken(token.types.DIVIDE);
				break;
			case '(':
				this.newToken(token.types.LPAREN);
				break;
			case ')':
				this.newToken(token.types.RPAREN);
				break;
			case '{':
				this.newToken(token.types.LBRACE);
				break;
			case '}':
				this.newToken(token.types.RBRACE);
				break;
			case ',':
				this.newToken(token.types.COMMA);
				break;
			case '=':
				this.newToken(token.types.ASSIGN);
				break;
			case '[':
				this.newToken(token.types.LBRACKET);
				break;
			case ']':
				this.newToken(token.types.RBRACKET);
				break;
			case ':':
				this.newToken(token.types.COLON);
				break;
			case '#':
				this.token.literal = this.readLine();
				this.token.type = token.types.COMMENT;
				this.token.loc = this.currentPosition();
				break;
			case '!':
				this.newToken(token.types.NOT);
				break;
			case ';':
				this.newToken(token.types.SEMICOLON);
				break;
			case null:
				this.newToken(token.types.EOF);
				break;
			case '"':
				const str = this.readString();

				this.token.literal = str;
				this.token.type = token.types.STRING;
				this.token.loc = this.currentPosition();
				break;
			default:
				if (this.isLetter()) {
					let literal = this.readIdentifier();

					this.token.type = token.lookupIdent(literal);
					this.token.literal = literal;
					this.token.loc = this.currentPosition();
					return this.token;
				} else if (this.isDigit()) {
					this.token.type = token.types.INT;
					this.token.literal = this.readNumber();
					this.token.loc = this.currentPosition();
					return this.token;
				} else {
					this.token.type = token.types.ILLEGAL;
					this.token.literal = '';
					this.token.loc = this.currentPosition();
				}
		}

		this.readChar();

		return this.token;
	}

	readChar() {
		if (this.readPosition >= this.input.length) {
			this.char = null;
		} else {
			this.char = this.input[this.readPosition];
		}

		this.position = this.readPosition;
		this.readPosition++;
	}

	readIdentifier() {
		let position = this.position;
		while (this.isLetter()) {
			this.readChar();
		}

		return this.input.slice(position, this.position);
	}

	readString() {
		let str = '';
		this.readChar();

		while (true) {
			if (this.char == '"' || this.char == null) {
				break;
			}

			str += this.char;
			this.readChar();
		}

		return str;
	}

	readNumber() {
		let position = this.position;
		while (this.isDigit() && this.char != null) {
			this.readChar();
		}

		return this.input.slice(position, this.position);
	}

	readLine() {
		const position = this.position + 1;

		while (this.char != '\n' && this.char != null) {
			this.readChar();
		}

		return this.input.slice(position, this.position);
	}

	newToken(type) {
		this.token = {
			type,
			literal: this.char,
			loc: this.currentPosition(),
		};
	}

	currentPosition() {
		return {
			line: this.line,
			col: this.col,
		};
	}

	skipWhitespace() {
		while (this.char == ' ' || this.char == '\t' || this.char == '\n') {
			if (this.char == '\n') {
				this.line++;
			} else if (this.char == ' ' || this.char == '\t') {
				this.col++;
			}
			this.readChar();
		}
	}

	isLetter() {
		if (this.char != null) {
			return this.char.match(/[a-z]/i);
		} else {
			return false;
		}
	}

	isDigit() {
		if (this.char != null) {
			return this.char.match(/[0-9]/i);
		} else {
			return false;
		}
	}
}

module.exports = Lexer;
