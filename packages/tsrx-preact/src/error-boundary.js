import { Component } from 'preact';

/**
 * A reusable Preact error boundary class component.
 *
 * Used by the `@tsrx/preact` compiler to implement `try/catch` blocks.
 * The `fallback` prop receives the caught error and a `reset` function
 * that clears the error state to re-render the children.
 */
export class TsrxErrorBoundary extends Component {
	constructor(/** @type {any} */ props) {
		super(props);
		/** @type {{ error: Error | null }} */
		this.state = { error: null };
	}

	/**
	 * @param {Error} error
	 * @returns {{ error: Error }}
	 */
	static getDerivedStateFromError(error) {
		return { error };
	}

	render() {
		const { error } = /** @type {{ error: Error | null }} */ (this.state);
		if (error !== null) {
			const reset = () => this.setState({ error: null });
			return this.props.fallback(error, reset);
		}
		return this.props.children;
	}
}
