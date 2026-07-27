import type * as AST from 'estree';
import type * as ESTreeJSX from 'estree-jsx';

/**
 * A source node Solid's template lowering accepts as a render child — the
 * domain of `is_solid_render_child`. Control-flow statements only qualify when
 * they carry render-control metadata or came from an `@if`/`@for`/`@switch`/
 * `@try` directive.
 */
export type SolidRenderSource =
	| AST.TSRXJSXElement
	| AST.TSRXJSXFragment
	| ESTreeJSX.JSXExpressionContainer
	| ESTreeJSX.JSXText
	| AST.JSXTemplateDirective
	| AST.IfStatement
	| AST.ForOfStatement
	| AST.SwitchStatement
	| AST.TryStatement;

/**
 * What Solid's lowering can put in a render slot. Narrower than
 * `ESTreeJSX.JSXRenderNode`: Solid never emits `JSXSpreadChild`.
 */
export type SolidRenderNode = AST.Expression | ESTreeJSX.JSXExpressionContainer | ESTreeJSX.JSXText;

/** The function forms a native TSRX component body can take. */
export type SolidFunctionLike =
	AST.FunctionDeclaration | AST.FunctionExpression | AST.ArrowFunctionExpression;

/**
 * A `() => { …setup; return jsx; }` wrapper built for a branch body that
 * carries setup statements. Callers either invoke it (`iife_if_arrow`), hand it
 * to Solid as a function child (`to_function_child`), or inline its block into
 * an outer arrow (`merge_branch_body_into_arrow`).
 */
export type SolidBranchArrow = AST.ArrowFunctionExpression & { body: AST.BlockStatement };

/** An `if` / `else if` arm of a flattened chain. */
export interface SolidIfTestBranch {
	test: AST.Expression;
	body: AST.Node[];
}

/** The trailing `else` arm of a flattened chain. */
export interface SolidIfElseBranch {
	test: null;
	body: AST.Node[];
}

/** One arm of a flattened `if` / `else if` / `else` chain. */
export type SolidIfBranch = SolidIfTestBranch | SolidIfElseBranch;

/** A `<Match when={test}>{body_jsx}</Match>` arm built from a `switch` case. */
export interface SolidMatchEntry {
	test: AST.Expression;
	body_jsx: AST.Expression;
}

/**
 * The result of lowering a statement list inside a native Solid component body.
 *
 * `nodes` is a list mid-lowering, not a valid `Statement[]`: the pre-passes
 * leave bare render expressions in statement slots, and this lowering folds
 * `return <jsx/>` into more of them.
 * `solid_component_body_nodes_to_function_statements` re-splits the list into
 * real statements plus a single `return`.
 */
export interface SolidLoweredList {
	nodes: AST.Node[];
	/** The list ends in render output or a `throw`, so what follows is unreachable. */
	terminal: boolean;
	/** At least one statement was rewritten into Solid render control flow. */
	changed: boolean;
}

/** The result of lowering a single control-flow statement. See {@link SolidLoweredList}. */
export interface SolidLoweredStatement {
	node: AST.Node;
	terminal: boolean;
	/** The lowered node absorbed the statements that followed it. */
	consumesRest?: boolean;
}

/**
 * A top-level `if` with no `else` whose consequent contains a bare `return` —
 * the shape `@for` bodies use to skip an iteration.
 */
export interface SolidReturningIf {
	/** The `if`'s test, for rebuilding the guard around the lowered body. */
	test: AST.Expression;
	consequent_body: AST.Node[];
	return_index: number;
}
