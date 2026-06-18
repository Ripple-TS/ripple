declare module '*.tsrx';
declare namespace JSX {
	interface IntrinsicElements {
		[tag: string]: any;
	}
}
