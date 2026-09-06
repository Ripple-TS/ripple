// @ts-check

/**
 * Sibling-scoped `<style>` blocks, `$class`, and `apply` for the Ripple target
 * (RFC tsrx-org/RFCs#1). One pass over the analyzed program decides which
 * blocks belong to which scope, in what order their CSS is emitted, and which
 * classes every host element carries, so the client and server transforms
 * only serialize what is already on the AST and agree by construction.
 *
 * Scope model (shared with `@tsrx/core`'s `transform/jsx/style-scopes.js`):
 *
 * - A standalone block is a child of a native element or fragment, and that
 *   children list is its scope: the block styles the items beside it and
 *   everything below them, never the element that contains it. A `@{ … }`
 *   body or a directive branch body holds setup statements and one output
 *   node; a block there is the parser's multiple-outputs error or the core
 *   analyzer's `tsrx-style-standalone-needs-fragment`, so statement lists
 *   are only searched for nested templates and assigned blocks.
 * - Every block of one list shares the scope hash (the first bodied block's
 *   position-derived hash). Lists nested in a scope that hold blocks are
 *   nested scopes with hashes of their own.
 * - A scope's sheets are pruned against the list's other children and their
 *   subtrees, with ancestor paths that stop at the list, so a selector that
 *   only matches the container renders as an `(unused)` comment.
 * - Every host element (DOM elements and dynamic `<{tag}>` elements, not
 *   components) carries `metadata.tsrx_scope_class`: the hashes of all its
 *   enclosing scopes outer first, then the classes of every applied theme —
 *   string literals for same-module themes whose class is statically known,
 *   `theme.$class` reads otherwise. Function boundaries reset the chain.
 * - CSS is emitted in lexical pre-order into `analysis.stylesheets`: a scope's
 *   sheets sit where its first block is, after the assigned blocks declared
 *   before it, before the scopes and assigned blocks nested in it.
 * - Assigned blocks (`const theme = <style>…</style>`) are prepared here in
 *   the render mode the core analyzer classified (`metadata.styleKind`), and
 *   their `apply` targets resolve to `metadata.tsrx_style_class_parts`; the
 *   transforms build the class-map object from that.
 * - For the server, every component function records what its scopes need
 *   registered with the request (applied themes before the scope that
 *   applies them); see `get_style_registrations`.
 *
 * The pass runs after the Ripple analyzer walk and writes metadata only; the
 * tree itself is left alone (the transforms drop `<style>` blocks when they
 * render children).
 */

/**
@import * as AST from 'estree';
@import * as ESTreeJSX from 'estree-jsx';
@import { AnalysisResult, CompileError, StyleRegistration } from '../types/index';
*/

import {
	analyzeCss,
	builders,
	clone_ast_node,
	collectStyleRefAttributes,
	createScopeRoot,
	createStyleClassMap,
	createStyleRefSetupStatements,
	DIAGNOSTIC_CODES,
	error,
	getStyleElementStylesheet,
	isFunctionNode as is_function_node,
	isTemplateDirective as is_template_directive,
	prepareStylesheetForRender,
	pruneCss,
} from '@tsrx/core';
import {
	get_attribute_name,
	get_element_attributes,
	get_element_identifier,
	is_dynamic_element,
	is_template_element,
	is_template_fragment,
} from './template-ast.js';
import { is_element_dom_element, is_style_element } from './utils.js';

const b = builders;

const SKIP_KEYS = new Set(['loc', 'start', 'end', 'metadata', 'css', 'parent']);

/**
 * Per function, what the server registers with the active request before the
 * function renders its template (see `record_registrations`).
 * @type {WeakMap<AST.Function, StyleRegistration[]>}
 */
const style_registrations = new WeakMap();

/**
 * What a component registers with the request before rendering its template:
 * each of its scopes' applied themes first — a hash to register, or a
 * `theme.$class` read whose getter registers an imported theme's sheet — then
 * the scope's own hash, so an applied theme's CSS always precedes the scope
 * that applies it.
 * @param {AST.Function} fn
 * @returns {StyleRegistration[]}
 */
export function get_style_registrations(fn) {
	return style_registrations.get(fn) ?? [];
}

/**
 * @typedef {'statement' | 'expression'} WalkMode
 * @typedef {{ hash: string | null, applied: Array<string | AST.Expression> }} ScopeEntry
 * @typedef {{
 *   analysis: AnalysisResult,
 *   filename: string,
 *   collect: boolean,
 *   stack: ScopeEntry[],
 *   fn: AST.Function | null,
 *   static_classes: Map<AST.JSXStyleElement, string | null>,
 * }} StyleScopeState `fn` is the nearest enclosing function of the parse AST:
 *   the owner of the `ref` setup statements and server registrations of the
 *   scopes found inside it.
 */

/**
 * Run the pass over an analyzed program. Fills `analysis.stylesheets` in
 * emission order and records every function's server registrations.
 *
 * @param {AST.Program} ast
 * @param {AnalysisResult} analysis
 * @param {string} filename
 * @param {boolean} collect
 * @returns {void}
 */
export function prepare_style_scopes(ast, analysis, filename, collect) {
	/** @type {StyleScopeState} */
	const state = {
		analysis,
		filename,
		collect,
		stack: [],
		fn: null,
		static_classes: new Map(),
	};
	// Module scope is not a template scope: a standalone block here is a core
	// analyzer error, and its statements are only searched for scopes.
	walk_list(ast.body, state);
}

/**
 * @param {unknown} value
 * @returns {value is AST.Node}
 */
function is_ast_node(value) {
	return (
		value !== null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		typeof (/** @type {{ type?: unknown }} */ (value).type) === 'string'
	);
}

/**
 * @param {AST.Node} node
 * @param {string} key
 * @returns {boolean}
 */
function is_statement_list_key(node, key) {
	if (key === 'body') return node.type === 'BlockStatement' || node.type === 'Program';
	if (key === 'consequent') return node.type === 'SwitchCase';
	return false;
}

/**
 * @template T
 * @param {StyleScopeState} state
 * @param {ScopeEntry[]} stack
 * @param {() => T} run
 * @returns {T}
 */
function with_stack(state, stack, run) {
	const previous = state.stack;
	state.stack = stack;
	try {
		return run();
	} finally {
		state.stack = previous;
	}
}

/**
 * Visit every child node of `node`.
 *
 * @param {AST.Node} node
 * @param {(child: AST.Node, key: string) => void} visit
 * @returns {void}
 */
function each_child(node, visit) {
	for (const key of Object.keys(node)) {
		if (SKIP_KEYS.has(key)) continue;
		const value = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (node))[key];
		if (Array.isArray(value)) {
			for (const item of value) if (is_ast_node(item)) visit(item, key);
		} else if (is_ast_node(value)) {
			visit(value, key);
		}
	}
}

/**
 * The main walk. `mode` says what a `<style>` found here is: a value slot
 * holds an assigned block, a statement slot holds one the core analyzer
 * already reported.
 *
 * @param {AST.Node} node
 * @param {StyleScopeState} state
 * @param {WalkMode} mode
 * @returns {void}
 */
function walk(node, state, mode) {
	if (!is_ast_node(node)) return;

	switch (node.type) {
		case 'JSXStyleElement':
			if (mode === 'expression') prepare_assigned_style(node, state);
			return;
		case 'JSXCodeBlock':
			walk_list(/** @type {AST.Node[]} */ (node.body ?? []), state);
			if (node.render) walk_list_item(/** @type {AST.Node} */ (node.render), state);
			return;
		case 'JSXElement':
		case 'JSXFragment':
			if (is_template_element(node) || is_template_fragment(node)) {
				walk_template(node, state);
			} else {
				// Raw JSX (an attribute value) is outside every scope: not
				// stamped, not matched, but searched for assigned blocks.
				each_child(node, (child) => walk(child, state, 'expression'));
			}
			return;
		case 'JSXExpressionContainer':
			walk(/** @type {AST.Node} */ (node.expression), state, 'expression');
			return;
		case 'ExpressionStatement':
			walk(node.expression, state, 'statement');
			return;
		default:
			break;
	}

	if (is_template_directive(node)) {
		walk_directive(node, state);
		return;
	}

	if (is_function_node(node)) {
		// A function boundary: its template is not stamped by the enclosing
		// scopes, but still hosts scopes and assigned blocks of its own.
		const previous_fn = state.fn;
		state.fn = node;
		with_stack(state, [], () => each_child(node, (child) => walk(child, state, 'expression')));
		state.fn = previous_fn;
		return;
	}

	each_child(node, (child, key) =>
		walk(child, state, is_statement_list_key(node, key) ? 'statement' : 'expression'),
	);
}

/**
 * A statement list (a `@{ … }` body, a directive branch body, a switch case,
 * the program): not a scope of its own. Its items are searched for templates
 * and assigned blocks in the current chain.
 *
 * @param {AST.Node[]} nodes
 * @param {StyleScopeState} state
 * @returns {void}
 */
function walk_list(nodes, state) {
	for (const item of nodes) walk_list_item(item, state);
}

/**
 * @param {AST.Node} item
 * @param {StyleScopeState} state
 * @returns {void}
 */
function walk_list_item(item, state) {
	if (!is_ast_node(item)) return;
	if (is_template_element(item) || is_template_fragment(item)) {
		walk_template(item, state);
		return;
	}
	if (is_style_element(item)) return;
	if (item.type === 'JSXExpressionContainer') {
		walk(/** @type {AST.Node} */ (item.expression), state, 'expression');
		return;
	}
	walk(item, state, 'statement');
}

/**
 * Each branch body of a directive is a statement list holding one output
 * node; `@else if` chains parse as plain `IfStatement` alternates.
 *
 * @param {AST.Node} node
 * @param {StyleScopeState} state
 * @returns {void}
 */
function walk_directive(node, state) {
	each_child(node, (child, key) => {
		if (child.type === 'BlockStatement') {
			walk_list(child.body, state);
		} else if (child.type === 'CatchClause') {
			if (child.param) walk(child.param, state, 'expression');
			walk_list(child.body.body, state);
		} else if (child.type === 'SwitchCase') {
			if (child.test) walk(child.test, state, 'expression');
			walk_list(child.consequent, state);
		} else if (
			key === 'alternate' &&
			(is_template_directive(child) || child.type === 'IfStatement')
		) {
			walk_directive(child, state);
		} else {
			walk(child, state, 'expression');
		}
	});
}

/**
 * A native element or fragment: stamp it with the CURRENT chain (host
 * elements only — an element is never inside its own children's scope),
 * search its attribute values, then walk its children list. When the list
 * holds standalone blocks it is a scope, and the other children are walked
 * with that scope pushed.
 *
 * @param {AST.TSRXJSXElement | AST.TSRXJSXFragment} node
 * @param {StyleScopeState} state
 * @returns {void}
 */
function walk_template(node, state) {
	if (node.type === 'JSXElement') {
		// `<head>` content is rendered verbatim (a `<style>` there is a plain
		// document stylesheet), so nothing inside it is a scope or stamped.
		if (get_element_identifier(node)?.name === 'head') return;
		if (is_stamped_host(node)) stamp(node, state);
		for (const attr of get_element_attributes(node)) {
			if (attr.type === 'JSXAttribute') {
				if (attr.value) walk(/** @type {AST.Node} */ (attr.value), state, 'expression');
			} else {
				walk(attr.argument, state, 'expression');
			}
		}
	}

	const children = /** @type {AST.Node[]} */ (node.children ?? []);
	const own = collect_own_blocks(children);
	const scope =
		own.length > 0
			? prepare_scope(
					own,
					children.filter((child) => !own.includes(/** @type {AST.JSXStyleElement} */ (child))),
					state,
				)
			: null;

	with_stack(state, scope === null ? state.stack : [...state.stack, scope], () => {
		for (const child of children) {
			if (is_style_element(child)) continue;
			walk_list_item(child, state);
		}
	});
}

/**
 * Whether the scope chain is stamped on this element: a DOM element or a
 * dynamic `<{expr}>` tag. Components stop stamping (their host elements
 * belong to their own scopes), and a `style` host element —
 * `<style>{expr}</style>`, an ordinary element — is never stamped, like a
 * `<style>` block.
 *
 * @param {AST.TSRXJSXElement} node
 * @returns {boolean}
 */
function is_stamped_host(node) {
	if (get_element_identifier(node)?.name === 'style') return false;
	return is_element_dom_element(node) || is_dynamic_element(node);
}

/**
 * The standalone blocks a children list owns: its direct `<style>` items, in
 * source order. A `<style href>` resource is a plain element, not a block.
 *
 * @param {AST.Node[]} children
 * @returns {AST.JSXStyleElement[]}
 */
function collect_own_blocks(children) {
	return children
		.filter(is_style_element)
		.filter(
			(block) =>
				!get_element_attributes(block).some(
					(attr) => attr.type === 'JSXAttribute' && get_attribute_name(attr) === 'href',
				),
		)
		.sort((a, c) => /** @type {number} */ (a.start) - /** @type {number} */ (c.start));
}

/**
 * The elements a scope's selectors can match: every template element among
 * the list's items and their subtrees, nested scopes included, stopping at
 * function boundaries and skipping `<head>` and `<style>` hosts. Each element
 * comes with the ancestor chain it has INSIDE the scope, which `pruneCss`
 * reads for combinators: rooted at a fragment holding the items, so `+` and
 * `~` between top-level items find their siblings, while the containing
 * element is not part of it and a selector that only matches the container
 * is pruned.
 *
 * @param {AST.Node[]} items
 * @returns {Array<{ element: AST.TSRXJSXElement, path: AST.Node[] }>}
 */
function collect_scope_elements(items) {
	/** @type {Array<{ element: AST.TSRXJSXElement, path: AST.Node[] }>} */
	const elements = [];

	/**
	 * @param {AST.Node} node
	 * @param {AST.Node[]} path
	 */
	const visit = (node, path) => {
		if (!is_ast_node(node)) return;
		if (is_function_node(node) || is_style_element(node)) return;
		if (node.type === 'JSXElement') {
			const name = get_element_identifier(node)?.name;
			if (name === 'head' || name === 'style') return;
			if (is_template_element(node)) elements.push({ element: node, path });
		}
		const child_path = [...path, node];
		each_child(node, (child) => visit(child, child_path));
	};

	const root = [createScopeRoot(items)];
	for (const item of items) visit(item, root);
	return elements;
}

/**
 * Render a scope's sheets and compute what its elements carry.
 *
 * @param {AST.JSXStyleElement[]} own the list's standalone blocks
 * @param {AST.Node[]} items the list's other children — what the blocks reach
 * @param {StyleScopeState} state
 * @returns {ScopeEntry}
 */
function prepare_scope(own, items, state) {
	const { analysis } = state;
	/** @type {Array<[AST.JSXStyleElement, AST.CSS.StyleSheet]>} */
	const sheets = [];
	for (const block of own) {
		const sheet = getStyleElementStylesheet(block);
		if (sheet) sheets.push([block, sheet]);
	}
	const hash = sheets.length > 0 ? sheets[0][1].hash : null;
	// The first block's metadata accumulates the scope's class map (for
	// `<style ref>`), so two scopes never share a map.
	const holder = own[0];
	const refs = collectStyleRefAttributes(own);

	/** @type {AST.CSS.StyleSheet | null} */
	let first_sheet = null;
	if (sheets.length > 0) {
		const elements = collect_scope_elements(items);
		/** @type {Map<string, unknown>} */
		const style_classes = new Map();
		const top_scoped_classes = holder.metadata.topScopedClasses ?? new Map();
		const saved_paths = elements.map(({ element }) => element.metadata.path);
		for (const { element, path } of elements) element.metadata.path = path;
		try {
			for (const [block, sheet] of sheets) {
				const region_hash = sheet.hash;
				sheet.hash = /** @type {string} */ (hash);
				if (!analyze_scope_css(block, sheet, state)) continue;
				const prune = () => {
					for (const { element } of elements) {
						pruneCss(
							sheet,
							element,
							/** @type {any} */ (style_classes),
							top_scoped_classes,
							region_hash,
						);
					}
				};
				prune();
				if (refs.length > 0) {
					for (const [class_name, class_info] of top_scoped_classes) {
						style_classes.set(class_name, class_info.selector ?? class_info);
					}
					prune();
				}
				analysis.stylesheets.push(sheet);
				first_sheet ??= sheet;
			}
		} finally {
			elements.forEach(({ element }, i) => {
				element.metadata.path = saved_paths[i];
			});
		}
		if (top_scoped_classes.size > 0) holder.metadata.topScopedClasses = top_scoped_classes;
	}

	/** @type {Array<string | AST.Expression>} */
	const applied = [];
	for (const block of own) {
		for (const part of resolve_style_applies(block, state)) {
			if (typeof part !== 'string' || !applied.includes(part)) applied.push(part);
		}
	}

	if (refs.length > 0 && state.fn !== null) {
		const statements = createStyleRefSetupStatements(
			refs,
			createStyleClassMap(holder, first_sheet, { applied, hash }),
			{
				allowMutableRefTarget: true,
				createTempIdentifier: () => b.id(analysis.scope.generate('style_ref')),
			},
		);
		const metadata = state.fn.metadata;
		metadata.tsrx_style_ref_statements = [
			...(metadata.tsrx_style_ref_statements ?? []),
			...statements,
		];
	}

	if (state.fn !== null) record_registrations(state.fn, applied, hash);

	return { hash, applied };
}

/**
 * Record a scope's server registrations on its function: the applied themes'
 * class parts (static hashes to register, or `theme.$class` reads), then the
 * scope's own hash.
 *
 * @param {AST.Function} fn
 * @param {Array<string | AST.Expression>} applied
 * @param {string | null} hash
 * @returns {void}
 */
function record_registrations(fn, applied, hash) {
	const registrations = style_registrations.get(fn) ?? [];
	/** @param {StyleRegistration} entry */
	const add = (entry) => {
		if (typeof entry === 'string' && registrations.includes(entry)) return;
		registrations.push(entry);
	};
	for (const part of applied) add(part);
	if (hash !== null) add(hash);
	style_registrations.set(fn, registrations);
}

/**
 * `analyzeCss` reports `:global` placement through a coded fatal error with
 * CSS-relative positions; re-anchor it on the block so editors can place it,
 * and keep going in collect mode.
 *
 * @param {AST.JSXStyleElement} block
 * @param {AST.CSS.StyleSheet} sheet
 * @param {StyleScopeState} state
 * @returns {boolean} whether the sheet is usable
 */
function analyze_scope_css(block, sheet, state) {
	try {
		analyzeCss(sheet);
		return true;
	} catch (thrown) {
		const compile_error = /** @type {CompileError} */ (thrown);
		if (compile_error?.code !== DIAGNOSTIC_CODES.CSS_GLOBAL_PLACEMENT) throw thrown;
		error(
			compile_error.message,
			state.filename,
			block,
			state.collect ? state.analysis.errors : undefined,
			state.analysis.comments,
			compile_error.code,
		);
		return false;
	}
}

/**
 * The class parts a block's `apply` contributes: a literal for a same-module
 * theme whose class is statically known, otherwise a runtime `<target>.$class`
 * read. Memoized on the block's metadata for the assigned-block lowering.
 *
 * @param {AST.JSXStyleElement} block
 * @param {StyleScopeState} state
 * @returns {Array<string | AST.Expression>}
 */
function resolve_style_applies(block, state) {
	if (block.metadata.tsrx_style_class_parts) return block.metadata.tsrx_style_class_parts;
	/** @type {Array<string | AST.Expression>} */
	const parts = [];
	for (const resolution of block.metadata.styleApplies ?? []) {
		const static_class = resolution.target ? static_style_class(resolution.target, state) : null;
		if (static_class !== null) {
			// One entry per hash so a diamond (`a` applied directly and through
			// `b`) stamps each hash once.
			for (const hash of static_class.split(' ')) {
				if (hash && !parts.includes(hash)) parts.push(hash);
			}
			continue;
		}
		parts.push(b.member(clone_ast_node(resolution.expression), b.id('$class')));
	}
	block.metadata.tsrx_style_class_parts = parts;
	return parts;
}

/**
 * The `$class` value of an assigned block when every applied theme in its
 * chain is a same-module block: applied classes first, own hash last.
 *
 * @param {AST.JSXStyleElement} block
 * @param {StyleScopeState} state
 * @returns {string | null}
 */
function static_style_class(block, state) {
	const cached = state.static_classes.get(block);
	if (cached !== undefined) return cached;
	/** @type {string[]} */
	const parts = [];
	/** @type {string | null} */
	let result = '';
	for (const resolution of block.metadata.styleApplies ?? []) {
		const applied = resolution.target ? static_style_class(resolution.target, state) : null;
		if (applied === null) {
			result = null;
			break;
		}
		for (const hash of applied.split(' ')) {
			if (hash && !parts.includes(hash)) parts.push(hash);
		}
	}
	if (result !== null) {
		const sheet = getStyleElementStylesheet(block);
		if (sheet && !parts.includes(sheet.hash)) parts.push(sheet.hash);
		result = parts.join(' ');
	}
	state.static_classes.set(block, result);
	return result;
}

/**
 * Prepare an assigned block's sheet at its declaration position so it lands
 * in lexical order with the scopes around it; the transforms build the
 * class-map object later from the same sheet and `tsrx_style_class_parts`.
 *
 * @param {AST.JSXStyleElement} node
 * @param {StyleScopeState} state
 * @returns {void}
 */
function prepare_assigned_style(node, state) {
	if (node.metadata.tsrx_style_prepared) return;
	node.metadata.tsrx_style_prepared = true;
	resolve_style_applies(node, state);
	const sheet = getStyleElementStylesheet(node);
	if (!sheet) return;
	if (!analyze_scope_css(node, sheet, state)) return;
	state.analysis.stylesheets.push(
		prepareStylesheetForRender(sheet, node.metadata.styleKind === 'theme' ? 'theme' : 'class-map'),
	);
}

/**
 * Stamp the current chain on a host element: scope hashes outer first, then
 * applied theme classes, each once.
 *
 * @param {AST.TSRXJSXElement} node
 * @param {StyleScopeState} state
 * @returns {void}
 */
function stamp(node, state) {
	/** @type {string[]} */
	const hashes = [];
	/** @type {Array<string | AST.Expression>} */
	const applied = [];
	for (const entry of state.stack) {
		if (entry.hash !== null && !hashes.includes(entry.hash)) hashes.push(entry.hash);
		for (const part of entry.applied) {
			if (typeof part !== 'string' || (!applied.includes(part) && !hashes.includes(part))) {
				applied.push(part);
			}
		}
	}
	if (hashes.length === 0 && applied.length === 0) return;
	node.metadata.tsrx_scope_class = { base: null, hashes, applied };
}
