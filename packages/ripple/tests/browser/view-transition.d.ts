interface Window {
	crossDocument: {
		supported: boolean;
		ready: boolean;
		finished: boolean;
		hydrated: boolean;
		pseudos: Array<string | null>;
		error?: string;
	};
	reactTransitions: globalThis.ViewTransition[];
	reactReference: {
		run(action: string): void;
		resolveAsync(): void;
		events: Array<{ kind: string; name: string }>;
		cleanups: string[];
	};
	vtTest: {
		fixture: {
			run(action: string, skip?: boolean): import('ripple').ViewTransitionHandle;
			resolveAsync(): void;
			runActivity(mode: 'visible' | 'hidden'): import('ripple').ViewTransitionHandle;
			events: Array<{
				kind: string;
				name: string;
				names: readonly string[];
				types: readonly string[];
				duration: string;
			}>;
			cleanups: string[];
		};
		dispose(): void;
		initial: Element[];
		hydration: number;
		starts(): number;
		finished(): Promise<void>;
	};
}
