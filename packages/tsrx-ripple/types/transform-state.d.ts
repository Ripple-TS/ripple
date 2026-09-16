import type * as AST from 'estree';
import type { Binding, ScopeInterface } from '@tsrx/core/types';

/**
 * Per-loop bookkeeping the client transform keeps while lowering a `@for`
 * body, so `outer === item` comparisons in its render expressions can share
 * one selector per loop.
 */
export interface SelectorForState {
	/** Bindings introduced by the loop's item pattern. */
	pattern_bindings: Set<Binding>;
	/** The scope the loop is declared in; selector sources must be visible there. */
	outer_scope: ScopeInterface;
	/** Selectors the body needs, created ahead of the loop, one per outer read. */
	selectors: Array<{ id: AST.Identifier; source: AST.Expression; outer: AST.Expression }>;
	/**
	 * The loop's key expression when the body may read it as the item's key
	 * (`__key`, fixed for the item block's life), or null.
	 */
	key: AST.Expression | null;
	/** The loop body's scope, where the key parameter is named. */
	body_scope: ScopeInterface;
	/** The key parameter, once a lowered comparison reads it: the render function then receives it. */
	key_id: AST.Identifier | null;
}

declare module '@tsrx/core/types' {
	interface BaseNodeMetaData {
		/**
		 * The parent element a static component child appends into when it
		 * follows its template siblings (set by transform_children).
		 */
		append_after?: AST.Expression;
		/**
		 * The template `@if` is the last thing rendered into `append_after`: its
		 * sentinel is the parent's tail, so it never needs an anchor node.
		 */
		append_tail?: boolean;
		/**
		 * A static component, template `@if`, or template `@for` followed by a
		 * static DOM element sibling inserts before that element instead of a
		 * `<!>` placeholder of its own (set by transform_children).
		 */
		append_before?: boolean;
		/**
		 * The previous sibling has `append_before`, so in the client this node's
		 * variable is the previous node's variable (the element the sibling
		 * inserts before); only hydration steps to it.
		 */
		alias_prev?: boolean;
	}

	interface TransformClientState {
		/** the output can hydrate server HTML (see `CompileOptions.hydration`) */
		hydration: boolean;
		/**
		 * Set by an element for its children: flips to true when the element's
		 * only child is a text node hydrated in place (`hydrate_text`), which
		 * leaves the hydration cursor on the element so no `pop()` is needed.
		 */
		leaf_text?: { value: boolean };
		/** Set while transforming a `@for` body. */
		selector_for?: SelectorForState;
		/** The render expression being visited; comparisons must sit directly inside it. */
		selector_root?: AST.Node;
	}
}
