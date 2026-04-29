import { Component, type ComponentChildren, type VNode } from 'preact';

export interface TsrxErrorBoundaryProps {
	fallback: (error: Error, reset: () => void) => ComponentChildren;
	children?: ComponentChildren;
}

export interface TsrxErrorBoundaryState {
	error: Error | null;
}

export class TsrxErrorBoundary extends Component<TsrxErrorBoundaryProps, TsrxErrorBoundaryState> {
	static getDerivedStateFromError(error: Error): { error: Error };
	render(): ComponentChildren | VNode;
}
