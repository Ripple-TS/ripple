import { Component, type ReactNode } from 'react';

export interface TsrxErrorBoundaryProps {
	fallback: (error: Error, reset: () => void) => ReactNode;
	children?: ReactNode;
}

export interface TsrxErrorBoundaryState {
	error: Error | null;
}

export class TsrxErrorBoundary extends Component<TsrxErrorBoundaryProps, TsrxErrorBoundaryState> {
	static getDerivedStateFromError(error: Error): { error: Error };
	render(): ReactNode;
}
