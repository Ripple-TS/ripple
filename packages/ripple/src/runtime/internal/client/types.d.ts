import type { Tracked, Derived } from './runtime.js';
import type { Context } from './context.js';

export { Tracked, Derived };

export type Component = {
	b: null | Block;
	c: null | Map<Context<any>, any>;
	e: null | Array<{
		b: Block;
		fn: Function;
		r: null | Block | Derived;
	}>;
	p: null | Component;
	m: boolean;
};

export type Dependency = {
	c: number;
	t: Tracked | Derived;
	n: null | Dependency;
};

export type DeferredTrackedEntry = {
	b: Block; // boundary block
	r: number; // request version id
};

export type Block = {
	co: null | Component;
	d: null | Dependency;
	first: null | Block;
	f: number;
	fn: any;
	last: null | Block;
	next: null | Block;
	p: null | Block;
	prev: null | Block;
	s: any;
	// teardown function
	t: (() => {}) | null;
};

export type TryBoundaryState = {
	p: boolean; // whether pending_fn exists
	b: () => number; // begin request, returns request id
	r: (request_id: number, show_resolved_branch?: boolean) => boolean; // complete request, returns whether the request was active
	c: ((error: any) => void) | null; // catch function
	rd: (request_id: number, reject_fn: (reason: any) => void) => void; // register deferred reject function
	pb: (block: Block) => void; // register paused block
	rp: (old_request_id: number) => number; // replace request, returns new request id
};

export type BlockWithTryBoundary = Omit<Block, 's'> & {
	s: TryBoundaryState;
};

export type BlockWithTryBoundaryAndCatch = Omit<BlockWithTryBoundary, 's'> & {
	s: TryBoundaryState & { c: NonNullable<TryBoundaryState['c']> };
};

export type CompatApi = {
	createRoot: () => void;
	createComponent: (node: any, children_fn: () => any) => void;
	jsx: (type: any, props: any) => any;
};

export type CompatOptions = {
	[key: string]: CompatApi;
};

declare global {
	interface Element {
		__attributes?: {
			checked?: boolean;
			value?: string;
		};
		__click?: () => void;
		__ripple_block?: Block;
	}

	interface Event {
		__root?: EventTarget;
	}

	interface HTMLSelectElement {
		__value?: unknown;
	}

	interface Text {
		__t?: string | null;
	}
}
