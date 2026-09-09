export class Money {
	/** @param {number} amount @param {string} currency */
	constructor(amount, currency) {
		this.amount = amount;
		this.currency = currency;
	}
	format() {
		return `${this.amount} ${this.currency}`;
	}
}
