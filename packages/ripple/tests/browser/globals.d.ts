// Globals installed by the browser entries and read inside Playwright callbacks.
declare var hydrateTrace: {
	kind: string;
	name: string;
	time: number;
	duration?: number;
}[];
declare var runHydrate: () => void;
declare var disposeHydrate: () => void;
declare var openLarge: () => void;
declare var flushHydrate: () => void;

declare var activityTrace: {
	kind: string;
	index?: number;
	task: number;
	time: number;
}[];
