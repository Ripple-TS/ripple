import type { EffectScope } from 'vue';

/**
 * The slice of Vue's Vapor runtime that `@tsrx/vue`'s error boundary drives
 * directly.
 *
 * None of these are part of `vue`'s published type surface — the Vapor
 * renderer ships them as runtime-internal helpers — so `src/error-boundary.js`
 * narrows the `vue` namespace to this interface once, and every call site is
 * checked against it from there.
 */
export interface VaporRuntime {
	/** Groups a block of rendered nodes behind a single anchor. */
	VaporFragment: new (nodes: VaporBlock) => VaporFragment;
	isFragment(value: unknown): value is VaporFragment;
	isVaporComponent(value: unknown): value is VaporComponentInstance;
	/** Runs `fn` now and re-runs it whenever its reactive dependencies change. */
	renderEffect(fn: () => void): void;
	insert(block: VaporBlock, parent: ParentNode, anchor?: Node | null): void;
	remove(block: VaporBlock, parent: ParentNode): void;
}

/**
 * Anything Vue's Vapor renderer accepts as a renderable block: a DOM node, a
 * fragment, a vapor component instance, or a (possibly nested) array of those.
 * Mirrors the renderer's internal `Block` union.
 */
export type VaporBlock = Node | VaporFragment | VaporComponentInstance | VaporBlock[];

/**
 * The narrowed block shape the error boundary holds onto between renders.
 * `normalize_block` always resolves its input down to one of these two, so the
 * boundary can patch the previous value in place on the next render.
 */
export type VaporRenderedBlock = Node | VaporFragment;

/** A block of nodes mounted behind `anchor`, owned by `scope`. */
export interface VaporFragment {
	nodes: VaporBlock;
	/** Trailing marker node the fragment's contents are inserted before. */
	anchor?: Node;
	/** Effect scope owning the fragment's render effects, stopped on teardown. */
	scope?: EffectScope;
}

/** A component instance created by the Vapor renderer. */
export interface VaporComponentInstance {
	/** Raw (unresolved) props; accessor-valued entries are reactive getters. */
	rawProps?: Record<string, unknown> | null;
}
