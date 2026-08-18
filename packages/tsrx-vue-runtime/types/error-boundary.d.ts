import type { VaporRenderedBlock } from './vapor-runtime.js';

export interface TsrxErrorBoundaryProps {
	/**
	 * Renders the `try` body. Returns whatever the Vapor JSX runtime produced —
	 * the boundary narrows it to a mountable block, stringifying anything that
	 * isn't already a node, fragment, or component instance.
	 */
	content: () => unknown;
	/** Renders the `catch` body for a caught error. See {@link content}. */
	fallback: (error: unknown, reset: () => void) => unknown;
}

export interface TsrxErrorBoundaryComponent {
	(props: TsrxErrorBoundaryProps): Array<VaporRenderedBlock | undefined>;
	__setup(): void;
}

export const TsrxErrorBoundary: TsrxErrorBoundaryComponent;
