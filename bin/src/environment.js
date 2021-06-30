class Environment {
	store = {};

	clone() {
		const env = new Environment();
		env.parent = this;
		return env;
	}

	get(name) {
		const item = this.store[name];
		if (!item && this.parent != null) {
			return this.parent.get(name);
		}

		return item;
	}

	set(name, value) {
		this.store[name] = value;
		return value;
	}
}

module.exports = Environment;
