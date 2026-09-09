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
	/** Selectors the body needs, created ahead of the loop. */
	selectors: Array<{ id: AST.Identifier; source: AST.Expression }>;
}

declare module '@tsrx/core/types' {
	interface BaseNodeMetaData {
		/**
		 * The parent element a static component child appends into when it
		 * follows its template siblings (set by transform_children).
		 */
		append_after?: AST.Expression;
	}

	interface TransformClientState {
		/** Set while transforming a `@for` body. */
		selector_for?: SelectorForState;
		/** The render expression being visited; comparisons must sit directly inside it. */
		selector_root?: AST.Node;
	}
}
