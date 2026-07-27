/** @import { ReactNode } from 'react' */
/** @import { TsrxErrorBoundaryProps, TsrxErrorBoundaryState } from '../types/error-boundary' */

import { Component } from 'react';

/**
 * A reusable React error boundary class component.
 *
 * Used by the `@tsrx/react` compiler to implement `try/catch` blocks.
 * The `fallback` prop receives the caught error and a `reset` function
 * that clears the error state to re-render the children.
 *
 * @extends {Component<TsrxErrorBoundaryProps, TsrxErrorBoundaryState>}
 */
export class TsrxErrorBoundary extends Component {
	/** @param {TsrxErrorBoundaryProps} props */
	constructor(props) {
		super(props);
		/** @type {TsrxErrorBoundaryState} */
		this.state = { error: null };
	}

	/**
	 * @param {Error} error
	 * @returns {TsrxErrorBoundaryState}
	 */
	static getDerivedStateFromError(error) {
		return { error };
	}

	/** @returns {ReactNode} */
	render() {
		const { error } = this.state;
		if (error !== null) {
			const reset = () => this.setState({ error: null });
			return this.props.fallback(error, reset);
		}
		return this.props.children;
	}
}
