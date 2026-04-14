import type { Context } from './context.js';

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

export type Tracked<V = any> = {
	DO_NOT_ACCESS_THIS_OBJECT_DIRECTLY?: true;
	a: { get?: Function; set?: Function };
	b: Block;
	c: number;
	f: number;
	__v: V;
	readonly [0]: V;
	[1]: Tracked<V>;
	value: V;
	readonly length: 2;
	[Symbol.iterator](): Iterator<V | Tracked<V>>;
};

export type AsyncBoundaryEntry = {
	s: Block; // source block
	t: Block | null; // boundary block
	i: number; // request id, 0 if no pending request
};

export type Derived = {
	DO_NOT_ACCESS_THIS_OBJECT_DIRECTLY?: true;
	a: { get?: Function; set?: Function };
	aa: AbortController | null;
	ab: AsyncBoundaryEntry[] | null;
	ap: PromiseLike<any> | null;
	av: number; // staleness guard against resolving when multiple requests were fired
	dr: ((value: any) => void) | null; // deferred / synthetic promise resolve function
	dj: ((reason: any) => void) | null; // deferred / synthetic promise reject function
	b: Block;
	blocks: null | Block[];
	c: number;
	co: null | Component;
	d: null | Dependency;
	f: number;
	fn: Function;
	__v: any;
	readonly [0]: any;
	[1]: Derived;
	value: any;
	readonly length: 2;
	[Symbol.iterator](): Iterator<any | Derived>;
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
