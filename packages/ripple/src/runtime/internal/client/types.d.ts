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

export type TryCatchFunction = (anchor: Node, error: any, reset?: () => void) => void;
export type TryPendingFunction = (anchor: Node) => void;

/**
 * The state of a `@try` block or root boundary. Everything the boundary's
 * pending, catch, request and streaming helpers need lives here, so those
 * helpers are module functions that compile only when a boundary uses them.
 */
export type TryState = {
	anchor: Node;
	try_fn: (anchor: Node, block?: Block) => void;
	catch_fn: TryCatchFunction | null;
	pending_fn: TryPendingFunction | null;
	/** the catch branch's `reset` callback, created on first use */
	reset: (() => void) | null;
	pending_count: number;
	request_version: number;
	active_requests: Set<number>;
	try_block: Block | null;
	resolved_branch: Block | null;
	pending_branch: Block | null;
	catch_branch: Block | null;
	offscreen_fragment: DocumentFragment | null;
	has_resolved: boolean;
	mode: 'resolved' | 'pending' | 'catch';
	pending_deferreds: Map<number, (reason: any) => void>;
	paused_blocks: Set<Block>;
	/** a streamed slot this boundary hydrated, until its chunk activates it */
	streamed_id: string | null;
	streamed_errored: boolean;
	streamed_fallback: boolean;
	slot_open: Comment | null;
	slot_close: Comment | null;
};

export type BlockWithTryBoundary = Omit<Block, 's'> & {
	s: TryState;
};

export type BlockWithTryBoundaryAndCatch = Omit<BlockWithTryBoundary, 's'> & {
	s: TryState & { catch_fn: TryCatchFunction };
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
	/** Replaced by bundlers after checking whether registration is retained. */
	var __RIPPLE_TRANSPORT__: boolean | undefined;
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
