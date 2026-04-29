export interface TsrxErrorBoundaryProps {
	content: () => any;
	fallback: (error: unknown, reset: () => void) => any;
}

export interface TsrxErrorBoundaryComponent {
	(props: TsrxErrorBoundaryProps): any;
	__setup(): void;
}

export const TsrxErrorBoundary: TsrxErrorBoundaryComponent;
