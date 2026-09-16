import React from 'react';

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error('React Error Boundary caught an error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="error" data-testid="error">
					<h2 className="error__title">Something went wrong</h2>
					<p className="error__message">
						An unexpected error occurred. Please refresh the page and try again.
					</p>
					<details style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
						<summary>Error details</summary>
						<pre
							style={{
								marginTop: '0.5rem',
								padding: '0.5rem',
								background: '#f5f5f5',
								borderRadius: '4px',
							}}
						>
							{this.state.error?.toString()}
						</pre>
					</details>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
