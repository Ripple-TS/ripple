import type { Tracked, Derived } from './runtime.js';
import type { Context } from './context.js';

export { Tracked, Derived };

export type Component = {
	b: null | Block;
	c: null | Map<Context<any>, any>;
	// Effects deferred until the component has rendered, as flat triples:
	// fn, the block to create it under, the reaction active at the call.
	e: null | Array<Function | Block | Derived | null>;
	p: null | Component;
	m: boolean;
};

export type Dependency = {
	// clock of the tracked value when it was read
	c: number;
	t: Tracked | Derived;
	// next dependency of the same reaction
	n: null | Dependency;
	// the reaction that read the tracked value
	r: Block | Derived;
	// previous / next subscriber of the same tracked value
	sp: null | Dependency;
	sn: null | Dependency;
};

export type DeferredTrackedEntry = {
	b: Block; // boundary block
	r: number; // request version id
};

/**
 * Anchor sentinel for one-shot appends at the end of `parent` (all-component
 * children, portal content). Only valid at first render: a block that keeps
 * inserting relative to its anchor must go through `resolve_anchor` first.
 */
export type AppendIntoAnchor = {
	parent: Node;
	/** Marks the sentinel; a missing-property read on a DOM node is cheaper than `in`. */
	into: true;
};

export type Block = {
	co: null | Component;
	d: null | Dependency;
	first: null | Block;
	f: number;
	fn: any;
	// creation id; flushes run scheduled blocks in this order
	i: number;
	last: null | Block;
	next: null | Block;
	p: null | Block;
	prev: null | Block;
	s: any;
	// teardown function
	/** teardown; runtime-internal teardowns receive the block state */
	t: ((state?: any) => void) | null;
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

export type RootBoundaryOptions = {
	pending?: (anchor: Node, props: Record<string, never>, block: Block | null) => void;
	catch?: (anchor: Node, props: { error: unknown; reset: () => void }, block: Block | null) => void;
};

/**
 * Called by the inline stream runtime when a boundary's chunk arrives after
 * hydration: receives the chunk template (null for error-only chunks) and a
 * truthy flag when the unit errored server-side.
 */
export type StreamBoundaryActivator = (
	template: HTMLTemplateElement | null,
	errored?: number,
) => void;

/**
 * `window.__RIPPLE_B__` — shared between the inline stream runtime and
 * hydrated try boundaries. A boundary that hydrated a still-pending slot
 * registers `{ a: activator }` under its unit id; the runtime stores `1`
 * once the slot has been swapped or handed over.
 */
export type StreamBoundaryRegistry = Record<string | number, 1 | { a: StreamBoundaryActivator }>;

declare global {
	interface Window {
		/** streamed-boundary registry, see {@link StreamBoundaryRegistry} */
		__RIPPLE_B__?: StreamBoundaryRegistry;
		/** inline stream runtime entry point: swaps unit `id`'s chunk into its slot */
		__RIPPLE_S__?: (id: number, errored?: number) => void;
	}

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
}
