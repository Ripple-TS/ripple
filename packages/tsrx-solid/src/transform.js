/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */

import { walk } from 'zimmerframe';
import { print } from 'esrap';
import tsx from 'esrap/languages/tsx';
import {
	renderStylesheets,
	setLocation,
	applyLazyTransforms as apply_lazy_transforms,
	collectLazyBindingsFromComponent as collect_lazy_bindings_from_component,
	preallocateLazyIds as preallocate_lazy_ids,
	replaceLazyParams as replace_lazy_params,
} from '@tsrx/core';

/**
 * @typedef {{
 *   needs_show: boolean,
 *   needs_for: boolean,
 *   needs_switch: boolean,
 *   needs_match: boolean,
 *   needs_error_boundary: boolean,
 *   needs_suspense: boolean,
 *   lazy_next_id: number,
 *   current_css_hash: string | null,
 * }} TransformContext
 */

/**
 * @typedef {{ source_name: string, read: () => any }} LazyBinding
 */

/**
 * Transform a parsed tsrx-solid AST into a TSX module targeting Solid 2.0.
 *
 * Each `component` declaration becomes a plain `FunctionDeclaration` that
 * returns Solid JSX. Control flow statements are rewritten to Solid's
 * built-in components (`<Show>`, `<Switch>/<Match>`, `<For>`, `<ErrorBoundary>`,
 * `<Suspense>`) so they remain reactive. Per-component `<style>` blocks are
 * collected, rendered via `@tsrx/core`'s stylesheet renderer, and returned
 * alongside the JS output so a downstream plugin can inject them.
 *
 * @param {AST.Program} ast
 * @param {string} source
 * @param {string} [filename]
 * @returns {{ ast: AST.Program, code: string, map: any, css: { code: string, hash: string } | null }}
 */
export function transform(ast, source, filename) {
	/** @type {any[]} */
	const stylesheets = [];

	/** @type {TransformContext} */
	const transform_context = {
		needs_show: false,
		needs_for: false,
		needs_switch: false,
		needs_match: false,
		needs_error_boundary: false,
		needs_suspense: false,
		lazy_next_id: 0,
		current_css_hash: null,
	};

	preallocate_lazy_ids(/** @type {any} */ (ast), transform_context);

	// First pass: collect stylesheets and annotate elements with the component hash.
	walk(/** @type {any} */ (ast), transform_context, {
		Component(node, { next, state }) {
			const as_any = /** @type {any} */ (node);
			const css = as_any.css;
			if (css) {
				stylesheets.push(css);
				annotate_component_with_hash(as_any, css.hash);
			}
			return next(state);
		},
	});

	// Second pass: transform Components, Elements, Text nodes, Tsx blocks, etc.
	const transformed = walk(/** @type {any} */ (ast), transform_context, {
		Component(node, { next, state }) {
			const as_any = /** @type {any} */ (node);

			const saved_css_hash = state.current_css_hash;
			state.current_css_hash = as_any.css ? as_any.css.hash : null;

			const inner = /** @type {any} */ (next() ?? node);

			state.current_css_hash = saved_css_hash;

			return /** @type {any} */ (component_to_function_declaration(inner, state));
		},

		Tsx(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (tsx_node_to_jsx_expression(inner));
		},

		TsxCompat(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (tsx_compat_node_to_jsx_expression(inner));
		},

		Element(node, { next, state }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (to_jsx_element(inner, state));
		},

		Text(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (
				to_jsx_expression_container(to_text_expression(inner.expression, inner), inner)
			);
		},

		TSRXExpression(node, { next }) {
			const inner = /** @type {any} */ (next() ?? node);
			return /** @type {any} */ (to_jsx_expression_container(inner.expression, inner));
		},

		MemberExpression(node, { next, state }) {
			const as_any = /** @type {any} */ (node);
			if (as_any.object && as_any.object.type === 'StyleIdentifier' && state.current_css_hash) {
				const class_name = as_any.computed ? as_any.property.value : as_any.property.name;
				const value = `${state.current_css_hash} ${class_name}`;
				return /** @type {any} */ ({ type: 'Literal', value, raw: JSON.stringify(value) });
			}
			return next();
		},
	});

	inject_solid_imports(/** @type {AST.Program} */ (transformed), transform_context);

	// Apply lazy destructuring transforms to module-level code (top-level function
	// declarations, arrow functions, etc.). Component bodies have already been
	// transformed inside component_to_function_declaration; this catches plain
	// functions outside components and any lazy patterns in module scope.
	const final_program = /** @type {any} */ (
		apply_lazy_transforms(/** @type {any} */ (transformed), new Map())
	);

	const result = print(/** @type {any} */ (final_program), tsx(), {
		sourceMapSource: filename,
		sourceMapContent: source,
	});

	const css =
		stylesheets.length > 0
			? {
					code: renderStylesheets(
						/** @type {any} */ (stylesheets.map(prepare_stylesheet_for_render)),
					),
					hash: stylesheets.map((s) => s.hash).join(' '),
				}
			: null;

	return {
		ast: /** @type {AST.Program} */ (final_program),
		code: result.code,
		map: result.map,
		css,
	};
}

// =====================================================================
// Component → FunctionDeclaration
// =====================================================================

/**
 * @param {any} component
 * @param {TransformContext} transform_context
 * @returns {AST.FunctionDeclaration}
 */
function component_to_function_declaration(component, transform_context) {
	const params = component.params || [];
	const body = /** @type {any[]} */ (component.body || []);

	const lazy_bindings = collect_lazy_bindings_from_component(params, body, transform_context);

	// Detect top-level early-return pattern: `if (cond) { return; }`.
	// Solid components run their body once at setup, so an early `return` would
	// make subsequent statements and JSX permanently inert. To preserve
	// React-like "stop rendering the rest when cond becomes true" semantics,
	// lift everything after the early `if` (plus any JSX that appears before
	// it, since that too must disappear when cond flips) into a
	// `<Show when={!cond}>` whose function-children re-runs when cond changes.
	const early_idx = body.findIndex(is_early_return_if);
	/** @type {any[]} */
	let effective_body = body;
	if (early_idx !== -1) {
		const early_if = /** @type {any} */ (body[early_idx]);
		const before = body.slice(0, early_idx);
		const after = body.slice(early_idx + 1);
		/** @type {any[]} */
		const before_non_jsx = [];
		/** @type {any[]} */
		const before_jsx = [];
		for (const child of before) {
			if (is_jsx_child(child)) before_jsx.push(child);
			else before_non_jsx.push(child);
		}
		const lifted = [...before_jsx, ...after];
		if (lifted.length > 0) {
			transform_context.needs_show = true;
			const show_body = body_to_jsx_child(lifted, transform_context);
			const show_element = build_show_element(negate_expression(early_if.test), show_body, null);
			effective_body = [...before_non_jsx, show_element];
		}
	}

	const statements = [];
	const render_nodes = [];

	for (const child of effective_body) {
		if (is_jsx_child(child)) {
			render_nodes.push(to_jsx_child(child, transform_context));
		} else {
			statements.push(child);
		}
	}

	if (render_nodes.length > 0) {
		statements.push(
			/** @type {any} */ ({
				type: 'ReturnStatement',
				argument: build_return_expression(render_nodes) || {
					type: 'Literal',
					value: null,
					raw: 'null',
					metadata: { path: [] },
				},
				metadata: { path: [] },
			}),
		);
	}

	const final_params = lazy_bindings.size > 0 ? replace_lazy_params(params) : params;

	const body_block = /** @type {any} */ ({
		type: 'BlockStatement',
		body: statements,
		metadata: { path: [] },
	});
	const final_body =
		lazy_bindings.size > 0 ? apply_lazy_transforms(body_block, lazy_bindings) : body_block;

	const fn = /** @type {any} */ ({
		type: 'FunctionDeclaration',
		id: component.id,
		params: final_params,
		body: final_body,
		async: false,
		generator: false,
		metadata: {
			path: [],
			is_component: true,
		},
	});

	if (fn.id) {
		fn.id.metadata = /** @type {AST.Identifier['metadata']} */ ({
			...fn.id.metadata,
			is_component: true,
		});
	}

	setLocation(fn, /** @type {any} */ (component), true);
	return fn;
}

// =====================================================================
// Control flow → Solid JSX components
// =====================================================================

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_jsx_child(node) {
	if (!node) return false;
	const t = node.type;
	return (
		t === 'JSXElement' ||
		t === 'JSXFragment' ||
		t === 'JSXExpressionContainer' ||
		t === 'JSXText' ||
		t === 'Tsx' ||
		t === 'TsxCompat' ||
		t === 'Element' ||
		t === 'Text' ||
		t === 'TSRXExpression' ||
		t === 'Html' ||
		t === 'IfStatement' ||
		t === 'ForOfStatement' ||
		t === 'SwitchStatement' ||
		t === 'TryStatement'
	);
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function to_jsx_child(node, transform_context) {
	if (!node) return node;
	switch (node.type) {
		case 'Tsx':
			return tsx_node_to_jsx_expression(node);
		case 'TsxCompat':
			return tsx_compat_node_to_jsx_expression(node);
		case 'Element':
			return to_jsx_element(node, transform_context);
		case 'Text':
			return to_jsx_expression_container(to_text_expression(node.expression, node), node);
		case 'TSRXExpression':
			return to_jsx_expression_container(node.expression, node);
		case 'Html':
			throw new Error(
				'`{html ...}` must appear as the only child of a host element; it lowers to Solid `innerHTML`.',
			);
		case 'IfStatement':
			return if_statement_to_jsx_child(node, transform_context);
		case 'ForOfStatement':
			return for_of_statement_to_jsx_child(node, transform_context);
		case 'SwitchStatement':
			return switch_statement_to_jsx_child(node, transform_context);
		case 'TryStatement':
			return try_statement_to_jsx_child(node, transform_context);
		default:
			return node;
	}
}

/**
 * Convert a list of body nodes to a Solid JSX child.
 *
 * If the body is purely JSX, returns the JSX node (or fragment) directly.
 *
 * If the body contains non-JSX statements (declarations, throws, etc.), we
 * must preserve them — they may declare signals, throw errors, or perform
 * other branch-local setup that subsequent JSX depends on. We wrap them in
 * an `ArrowFunctionExpression` whose block body is
 *   `() => { ...statements; return <>...jsx</>; }`
 * Callers are responsible for placing that arrow where Solid's runtime will
 * actually call it:
 *   - `<Show>` / `<Match>` children: invoked as function children via
 *     {@link to_function_child} which ensures `length > 0` so Solid's
 *     runtime calls them with a condition accessor.
 *   - `<For>` / `<Errored fallback>`: the outer iteration/fallback arrow's
 *     body is merged with the branch arrow's body via
 *     {@link merge_branch_body_into_arrow}.
 *   - Fallback props (`<Show fallback>`, `<Switch fallback>`,
 *     `<Loading fallback>`): IIFE-wrapped via {@link iife_if_arrow}.
 *
 * @param {any[]} body_nodes
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function body_to_jsx_child(body_nodes, transform_context) {
	/** @type {any[]} */
	const statements = [];
	/** @type {any[]} */
	const children = [];
	for (const child of body_nodes) {
		if (is_jsx_child(child)) {
			children.push(to_jsx_child(child, transform_context));
		} else {
			statements.push(child);
		}
	}

	if (statements.length === 0) {
		if (children.length === 0) return create_null_literal();
		if (children.length === 1) {
			const only = children[0];
			if (only.type === 'JSXExpressionContainer') return only.expression;
			return only;
		}
		return build_return_expression(children);
	}

	// Branch body has non-JSX statements: wrap everything in an arrow so the
	// statements run when (and only when) the branch actually renders.
	/** @type {any[]} */
	const block_body = [...statements];
	if (children.length > 0) {
		block_body.push(
			/** @type {any} */ ({
				type: 'ReturnStatement',
				argument: build_return_expression(children),
				metadata: { path: [] },
			}),
		);
	}

	return /** @type {any} */ ({
		type: 'ArrowFunctionExpression',
		params: [],
		body: {
			type: 'BlockStatement',
			body: block_body,
			metadata: { path: [] },
		},
		async: false,
		generator: false,
		expression: false,
		metadata: { path: [], is_branch_arrow: true },
	});
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_branch_arrow(node) {
	return (
		node &&
		node.type === 'ArrowFunctionExpression' &&
		node.metadata &&
		node.metadata.is_branch_arrow === true
	);
}

/**
 * Turn a branch arrow (`() => { ...; return jsx; }`) into a function child
 * that Solid's `<Show>` / `<Match>` runtime will actually invoke. Those
 * components only call `children` as a function when `children.length > 0`,
 * so we give the arrow a single underscore-prefixed parameter that it
 * ignores.
 *
 * If the input isn't a branch arrow, it's returned unchanged.
 *
 * @param {any} node
 * @returns {any}
 */
function to_function_child(node) {
	if (!is_branch_arrow(node)) return node;
	return {
		...node,
		params: [create_generated_identifier('_')],
	};
}

/**
 * Inline a branch arrow's statements into an existing arrow (e.g. the
 * `(item, i) => ...` passed to `<For>` or the `(err, reset) => ...` passed
 * to `<Errored fallback>`). Returns the arrow with its body replaced by the
 * merged block.
 *
 * @param {any} outer_arrow
 * @param {any} branch_body
 * @returns {any}
 */
function merge_branch_body_into_arrow(outer_arrow, branch_body) {
	if (!is_branch_arrow(branch_body)) {
		return { ...outer_arrow, body: branch_body, expression: true };
	}
	return {
		...outer_arrow,
		body: branch_body.body,
		expression: false,
	};
}

/**
 * Detect the top-level early-return pattern `if (cond) { return; }` (or
 * `if (cond) return;`) with no `else` branch.
 *
 * @param {any} node
 * @returns {boolean}
 */
function is_early_return_if(node) {
	if (!node || node.type !== 'IfStatement' || node.alternate) return false;
	const consequent = node.consequent;
	if (!consequent) return false;
	if (consequent.type === 'ReturnStatement' && !consequent.argument) return true;
	if (
		consequent.type === 'BlockStatement' &&
		consequent.body.length === 1 &&
		consequent.body[0].type === 'ReturnStatement' &&
		!consequent.body[0].argument
	) {
		return true;
	}
	return false;
}

/**
 * Build a logical-negation (`!expr`) expression.
 *
 * @param {any} expr
 * @returns {any}
 */
function negate_expression(expr) {
	return {
		type: 'UnaryExpression',
		operator: '!',
		prefix: true,
		argument: expr,
		metadata: { path: [] },
	};
}

/**
 * Wrap a branch arrow in an IIFE so it can be used as a prop value (e.g.
 * `<Show fallback={...}>`). Returns non-arrow inputs unchanged.
 *
 * @param {any} node
 * @returns {any}
 */
function iife_if_arrow(node) {
	if (!is_branch_arrow(node)) return node;
	return {
		type: 'CallExpression',
		callee: node,
		arguments: [],
		optional: false,
		metadata: { path: [] },
	};
}

/**
 * `if (test) { ... }` → `<Show when={test}>...</Show>`
 * `if (test) { a } else { b }` → `<Show when={test} fallback={b}>a</Show>`
 * `if (a) { } else if (b) { } else { }` → `<Switch fallback={...}><Match when={a}>...</Match>...</Switch>`
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function if_statement_to_jsx_child(node, transform_context) {
	const branches = flatten_if_chain(node);

	if (branches.length === 1) {
		// Single `if` with no else → <Show when>
		transform_context.needs_show = true;
		const [{ test, body }] = branches;
		return build_show_element(test, body_to_jsx_child(body, transform_context), null);
	}

	if (branches.length === 2 && branches[1].test === null) {
		// Plain if/else → <Show when fallback>
		transform_context.needs_show = true;
		const [if_branch, else_branch] = branches;
		return build_show_element(
			if_branch.test,
			body_to_jsx_child(if_branch.body, transform_context),
			body_to_jsx_child(else_branch.body, transform_context),
		);
	}

	// 3+ branches → <Switch fallback>{<Match when>...</Match>}...</Switch>
	transform_context.needs_switch = true;
	transform_context.needs_match = true;

	let fallback = null;
	const match_branches = [];
	for (const branch of branches) {
		if (branch.test === null) {
			fallback = body_to_jsx_child(branch.body, transform_context);
		} else {
			match_branches.push(branch);
		}
	}

	const attributes =
		fallback !== null
			? [
					{
						type: 'JSXAttribute',
						name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
						value: to_jsx_expression_container(iife_if_arrow(fallback)),
						metadata: { path: [] },
					},
				]
			: [];

	const children = match_branches.map((branch) =>
		create_jsx_element(
			'Match',
			[
				{
					type: 'JSXAttribute',
					name: { type: 'JSXIdentifier', name: 'when', metadata: { path: [] } },
					value: to_jsx_expression_container(branch.test),
					metadata: { path: [] },
				},
			],
			[jsx_child_wrap(to_function_child(body_to_jsx_child(branch.body, transform_context)))],
		),
	);

	return create_jsx_element('Switch', attributes, children);
}

/**
 * Flatten an if/else-if chain into an array of `{ test, body }` branches.
 * The final `else` (if present) is represented as `{ test: null, body }`.
 *
 * @param {any} node
 * @returns {{ test: any, body: any[] }[]}
 */
function flatten_if_chain(node) {
	const branches = [];
	/** @type {any} */
	let current = node;
	while (current && current.type === 'IfStatement') {
		const consequent_body =
			current.consequent.type === 'BlockStatement' ? current.consequent.body : [current.consequent];
		branches.push({ test: current.test, body: consequent_body });
		if (current.alternate && current.alternate.type === 'IfStatement') {
			current = current.alternate;
			continue;
		}
		if (current.alternate) {
			const alt_body =
				current.alternate.type === 'BlockStatement' ? current.alternate.body : [current.alternate];
			branches.push({ test: null, body: alt_body });
		}
		break;
	}
	return branches;
}

/**
 * @param {any} test
 * @param {any} children
 * @param {any} fallback
 * @returns {any}
 */
function build_show_element(test, children, fallback) {
	const attributes = [
		{
			type: 'JSXAttribute',
			name: { type: 'JSXIdentifier', name: 'when', metadata: { path: [] } },
			value: to_jsx_expression_container(test),
			metadata: { path: [] },
		},
	];
	if (fallback !== null && fallback !== undefined) {
		attributes.push({
			type: 'JSXAttribute',
			name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
			value: to_jsx_expression_container(iife_if_arrow(fallback)),
			metadata: { path: [] },
		});
	}
	return create_jsx_element('Show', attributes, [jsx_child_wrap(to_function_child(children))]);
}

/**
 * `for (const item of items; index i) { ... }` →
 * `<For each={items}>{(item, i) => ...}</For>`
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function for_of_statement_to_jsx_child(node, transform_context) {
	if (node.key) {
		throw create_compile_error(
			node.key,
			"Solid TSRX does not support `key` in `for` control flow. Solid's <For> uses reference identity; use <Index> or restructure your data if you need index-based keying.",
		);
	}

	transform_context.needs_for = true;

	const loop_params = get_for_of_iteration_params(node.left, node.index);
	const loop_body = node.body.type === 'BlockStatement' ? node.body.body : [node.body];

	const body_jsx = body_to_jsx_child(loop_body, transform_context);

	const arrow = merge_branch_body_into_arrow(
		/** @type {any} */ ({
			type: 'ArrowFunctionExpression',
			params: loop_params,
			body: null,
			async: false,
			generator: false,
			expression: true,
			metadata: { path: [] },
		}),
		body_jsx,
	);

	return create_jsx_element(
		'For',
		[
			{
				type: 'JSXAttribute',
				name: { type: 'JSXIdentifier', name: 'each', metadata: { path: [] } },
				value: to_jsx_expression_container(node.right),
				metadata: { path: [] },
			},
		],
		[to_jsx_expression_container(arrow)],
	);
}

/**
 * Solid doesn't have a dedicated `<Switch>` statement — we reuse the
 * `<Switch>/<Match>` components pair that `if` chains use. A `switch`
 * statement with a discriminant `d` and cases `[c1, c2, default]` becomes:
 *   <Switch fallback={...default}><Match when={d === c1}>...</Match>...</Switch>
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function switch_statement_to_jsx_child(node, transform_context) {
	transform_context.needs_switch = true;
	transform_context.needs_match = true;

	/** @type {any} */
	let fallback = null;
	const match_children = [];

	for (const switch_case of node.cases) {
		const consequent = flatten_switch_consequent(switch_case.consequent || []);
		const body = [];
		for (const child of consequent) {
			if (child.type === 'BreakStatement') break;
			body.push(child);
		}

		const body_jsx = body_to_jsx_child(body, transform_context);
		if (switch_case.test === null) {
			fallback = body_jsx;
			continue;
		}

		const test = /** @type {any} */ ({
			type: 'BinaryExpression',
			operator: '===',
			left: node.discriminant,
			right: switch_case.test,
			metadata: { path: [] },
		});

		match_children.push(
			create_jsx_element(
				'Match',
				[
					{
						type: 'JSXAttribute',
						name: { type: 'JSXIdentifier', name: 'when', metadata: { path: [] } },
						value: to_jsx_expression_container(test),
						metadata: { path: [] },
					},
				],
				[jsx_child_wrap(to_function_child(body_jsx))],
			),
		);
	}

	const attributes =
		fallback !== null
			? [
					{
						type: 'JSXAttribute',
						name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
						value: to_jsx_expression_container(iife_if_arrow(fallback)),
						metadata: { path: [] },
					},
				]
			: [];

	return create_jsx_element('Switch', attributes, match_children);
}

/**
 * Transform a `try { ... } pending { ... } catch (err, reset) { ... }` block
 * into Solid's `<ErrorBoundary>` and/or `<Suspense>` JSX elements.
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function try_statement_to_jsx_child(node, transform_context) {
	const pending = node.pending;
	const handler = node.handler;
	const finalizer = node.finalizer;

	if (finalizer) {
		throw create_compile_error(
			finalizer,
			'Solid TSRX does not support `finally` blocks in component templates. Move the try statement into a function if you need a finally block.',
		);
	}

	if (!pending && !handler) {
		throw create_compile_error(
			node,
			'Component try statements must have a `pending` or `catch` block.',
		);
	}

	const try_body_nodes = node.block.body || [];
	/** @type {any} */
	let result = jsx_child_wrap(iife_if_arrow(body_to_jsx_child(try_body_nodes, transform_context)));

	if (pending) {
		transform_context.needs_suspense = true;
		const pending_body_nodes = pending.body || [];
		const fallback_content = body_to_jsx_child(pending_body_nodes, transform_context);

		result = create_jsx_element(
			'Loading',
			[
				{
					type: 'JSXAttribute',
					name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
					value: to_jsx_expression_container(iife_if_arrow(fallback_content)),
					metadata: { path: [] },
				},
			],
			[result],
		);
	}

	if (handler) {
		transform_context.needs_error_boundary = true;

		const catch_params = [];
		if (handler.param) catch_params.push(handler.param);
		else catch_params.push(create_generated_identifier('_error'));
		if (handler.resetParam) catch_params.push(handler.resetParam);
		else catch_params.push(create_generated_identifier('_reset'));

		const catch_body_nodes = handler.body.body || [];
		const catch_jsx = body_to_jsx_child(catch_body_nodes, transform_context);

		const fallback_fn = merge_branch_body_into_arrow(
			/** @type {any} */ ({
				type: 'ArrowFunctionExpression',
				params: catch_params,
				body: null,
				async: false,
				generator: false,
				expression: true,
				metadata: { path: [] },
			}),
			catch_jsx,
		);

		result = create_jsx_element(
			'Errored',
			[
				{
					type: 'JSXAttribute',
					name: { type: 'JSXIdentifier', name: 'fallback', metadata: { path: [] } },
					value: to_jsx_expression_container(fallback_fn),
					metadata: { path: [] },
				},
			],
			[result],
		);
	}

	return result;
}

/**
 * If `child` is already a JSX child node return it; otherwise wrap in
 * a JSXExpressionContainer so it can live inside a JSX element's children list.
 *
 * @param {any} child
 * @returns {any}
 */
function jsx_child_wrap(child) {
	if (!child) return child;
	if (child.type === 'JSXElement' || child.type === 'JSXFragment') return child;
	return to_jsx_expression_container(child);
}

/**
 * @param {string} tag_name
 * @param {any[]} attributes
 * @param {any[]} children
 * @returns {any}
 */
function create_jsx_element(tag_name, attributes, children) {
	const name = { type: 'JSXIdentifier', name: tag_name, metadata: { path: [] } };
	const filtered_children = children.filter(Boolean);
	return {
		type: 'JSXElement',
		openingElement: {
			type: 'JSXOpeningElement',
			name,
			attributes,
			selfClosing: filtered_children.length === 0,
			metadata: { path: [] },
		},
		closingElement:
			filtered_children.length > 0
				? {
						type: 'JSXClosingElement',
						name: { type: 'JSXIdentifier', name: tag_name, metadata: { path: [] } },
						metadata: { path: [] },
					}
				: null,
		children: filtered_children,
		metadata: { path: [] },
	};
}

/**
 * Inject `import { Show, For, Switch, Match, ErrorBoundary, Suspense } from 'solid-js'`
 * specifiers for whichever control-flow primitives the transform emitted.
 *
 * @param {AST.Program} program
 * @param {TransformContext} transform_context
 */
function inject_solid_imports(program, transform_context) {
	const needed = [];
	if (transform_context.needs_show) needed.push('Show');
	if (transform_context.needs_for) needed.push('For');
	if (transform_context.needs_switch) needed.push('Switch');
	if (transform_context.needs_match) needed.push('Match');
	if (transform_context.needs_error_boundary) needed.push('Errored');
	if (transform_context.needs_suspense) needed.push('Loading');

	if (needed.length === 0) return;

	const specifiers = needed.map((name) => ({
		type: 'ImportSpecifier',
		imported: { type: 'Identifier', name, metadata: { path: [] } },
		local: { type: 'Identifier', name, metadata: { path: [] } },
		metadata: { path: [] },
	}));

	program.body.unshift(
		/** @type {any} */ ({
			type: 'ImportDeclaration',
			specifiers,
			source: { type: 'Literal', value: 'solid-js', raw: "'solid-js'" },
			metadata: { path: [] },
		}),
	);
}

// =====================================================================
// Element → JSX (with Solid-specific attribute handling)
// =====================================================================

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function to_jsx_element(node, transform_context) {
	if (node.type === 'JSXElement') return node;
	if (is_dynamic_element_id(node.id)) {
		return dynamic_element_to_jsx_child(node, transform_context);
	}

	const name = identifier_to_jsx_name(node.id);
	const attributes = (node.attributes || []).map(to_jsx_attribute);

	// `{html expr}` children become a Solid `innerHTML={expr}` attribute on
	// the parent element. Only one `{html ...}` may appear per element, and
	// it can't share the element with sibling children (innerHTML replaces
	// everything else).
	const raw_children = node.children || [];
	const html_children = raw_children.filter(
		(/** @type {any} */ child) => child && child.type === 'Html',
	);
	let children;
	let selfClosing = !!node.selfClosing;
	if (html_children.length > 0) {
		if (html_children.length > 1) {
			throw new Error('Only one `{html ...}` expression is allowed inside an element.');
		}
		const other_children = raw_children.filter(
			(/** @type {any} */ child) => !child || child.type !== 'Html',
		);
		if (other_children.length > 0) {
			throw new Error(
				'`{html ...}` must be the only child of its element; it replaces all other content.',
			);
		}
		attributes.push(
			set_loc(
				/** @type {any} */ ({
					type: 'JSXAttribute',
					name: {
						type: 'JSXIdentifier',
						name: 'innerHTML',
						metadata: { path: [] },
					},
					value: to_jsx_expression_container(html_children[0].expression, html_children[0]),
					shorthand: false,
					metadata: { path: [] },
				}),
				html_children[0],
			),
		);
		children = [];
		selfClosing = true;
	} else {
		children = create_element_children(raw_children, transform_context);
	}

	const openingElement = set_loc(
		/** @type {any} */ ({
			type: 'JSXOpeningElement',
			name,
			attributes,
			selfClosing,
		}),
		node.openingElement || node,
	);

	const closingElement = selfClosing
		? null
		: set_loc(
				/** @type {any} */ ({
					type: 'JSXClosingElement',
					name: clone_jsx_name(name, node.closingElement || node),
				}),
				node.closingElement || node,
			);

	return set_loc(
		/** @type {any} */ ({
			type: 'JSXElement',
			openingElement,
			closingElement,
			children,
		}),
		node,
	);
}

/**
 * @param {any[]} children
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function create_element_children(children, transform_context) {
	if (children.length === 0) return [];
	// Solid doesn't need React's hook-safe IIFE wrapping; every child is inline.
	return children.map((/** @type {any} */ child) => to_jsx_child(child, transform_context));
}

/**
 * Attribute transform. Unlike React, Solid uses the native `class` attribute
 * (not `className`). `{ref expr}` compiles to `ref={(el) => (expr = el)}`.
 *
 * @param {any} attr
 * @returns {any}
 */
function to_jsx_attribute(attr) {
	if (!attr) return attr;
	if (attr.type === 'JSXAttribute' || attr.type === 'JSXSpreadAttribute') return attr;
	if (attr.type === 'SpreadAttribute') {
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXSpreadAttribute',
				argument: attr.argument,
			}),
			attr,
		);
	}
	if (attr.type === 'RefAttribute') {
		// `{ref expr}` → `ref={(__ref_el) => (expr = __ref_el)}`.
		// Use a mangled param name so it can't shadow a user binding named `el`.
		const el_param = create_generated_identifier('__ref_el');
		const assignment = /** @type {any} */ ({
			type: 'AssignmentExpression',
			operator: '=',
			left: attr.argument,
			right: clone_identifier(el_param),
			metadata: { path: [] },
		});
		const arrow = /** @type {any} */ ({
			type: 'ArrowFunctionExpression',
			params: [el_param],
			body: assignment,
			async: false,
			generator: false,
			expression: true,
			metadata: { path: [] },
		});
		return /** @type {any} */ ({
			type: 'JSXAttribute',
			name: { type: 'JSXIdentifier', name: 'ref', metadata: { path: [] } },
			value: to_jsx_expression_container(arrow),
			shorthand: false,
			metadata: { path: [] },
		});
	}

	const attr_name = attr.name;
	const name =
		attr_name && attr_name.type === 'Identifier' ? identifier_to_jsx_name(attr_name) : attr_name;

	let value = attr.value;
	if (value) {
		if (value.type === 'Literal' && typeof value.value === 'string') {
			// Keep string literal as attribute string.
		} else if (value.type !== 'JSXExpressionContainer') {
			value = to_jsx_expression_container(value);
		}
	}

	return set_loc(
		/** @type {any} */ ({
			type: 'JSXAttribute',
			name,
			value: value || null,
			shorthand: false,
			metadata: { path: [] },
		}),
		attr,
	);
}

/**
 * @param {any} id
 * @returns {boolean}
 */
function is_dynamic_element_id(id) {
	if (!id || typeof id !== 'object') return false;
	if (id.type === 'Identifier') return !!id.tracked;
	if (id.type === 'MemberExpression') return is_dynamic_element_id(id.object);
	return false;
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function dynamic_element_to_jsx_child(node, transform_context) {
	const dynamic_id = set_loc(create_generated_identifier('DynamicElement'), node.id);
	const alias_declaration = set_loc(
		/** @type {any} */ ({
			type: 'VariableDeclaration',
			kind: 'const',
			declarations: [
				{
					type: 'VariableDeclarator',
					id: dynamic_id,
					init: clone_expression_node(node.id),
					metadata: { path: [] },
				},
			],
			metadata: { path: [] },
		}),
		node,
	);
	const jsx_element = create_dynamic_jsx_element(dynamic_id, node, transform_context);

	return to_jsx_expression_container(
		/** @type {any} */ ({
			type: 'CallExpression',
			callee: {
				type: 'ArrowFunctionExpression',
				params: [],
				body: /** @type {any} */ ({
					type: 'BlockStatement',
					body: [
						alias_declaration,
						{
							type: 'ReturnStatement',
							argument: {
								type: 'ConditionalExpression',
								test: clone_identifier(dynamic_id),
								consequent: jsx_element,
								alternate: create_null_literal(),
								metadata: { path: [] },
							},
							metadata: { path: [] },
						},
					],
					metadata: { path: [] },
				}),
				async: false,
				generator: false,
				expression: false,
				metadata: { path: [] },
			},
			arguments: [],
			optional: false,
			metadata: { path: [] },
		}),
		node,
	);
}

/**
 * @param {AST.Identifier} dynamic_id
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function create_dynamic_jsx_element(dynamic_id, node, transform_context) {
	const attributes = (node.attributes || []).map(to_jsx_attribute);
	const selfClosing = !!node.selfClosing;
	const children = create_element_children(node.children || [], transform_context);
	const name = identifier_to_jsx_name(clone_identifier(dynamic_id));

	return /** @type {any} */ ({
		type: 'JSXElement',
		openingElement: {
			type: 'JSXOpeningElement',
			name,
			attributes,
			selfClosing,
			metadata: { path: [] },
		},
		closingElement: selfClosing
			? null
			: {
					type: 'JSXClosingElement',
					name: clone_jsx_name(name),
					metadata: { path: [] },
				},
		children,
		metadata: { path: [] },
	});
}

// =====================================================================
// Text, expression, and helper utilities
// =====================================================================

/**
 * @param {AST.Expression} expression
 * @param {any} [source_node]
 * @returns {any}
 */
function to_jsx_expression_container(expression, source_node = expression) {
	return /** @type {any} */ ({
		type: 'JSXExpressionContainer',
		expression: /** @type {any} */ (expression),
		metadata: { path: [] },
	});
}

/**
 * `{text expr}` → `expr == null ? '' : expr + ''` — coerce to string,
 * matching React's text semantics so booleans/objects render as text.
 *
 * @param {AST.Expression} expression
 * @param {any} [source_node]
 * @returns {AST.Expression}
 */
function to_text_expression(expression, source_node = expression) {
	return set_loc(
		/** @type {AST.Expression} */ ({
			type: 'ConditionalExpression',
			test: {
				type: 'BinaryExpression',
				operator: '==',
				left: clone_expression_node(expression),
				right: { type: 'Literal', value: null, raw: 'null', metadata: { path: [] } },
				metadata: { path: [] },
			},
			consequent: { type: 'Literal', value: '', raw: "''", metadata: { path: [] } },
			alternate: {
				type: 'BinaryExpression',
				operator: '+',
				left: clone_expression_node(expression),
				right: { type: 'Literal', value: '', raw: "''", metadata: { path: [] } },
				metadata: { path: [] },
			},
			metadata: { path: [] },
		}),
		source_node,
	);
}

/**
 * @param {any[]} render_nodes
 * @returns {any}
 */
function build_return_expression(render_nodes) {
	if (render_nodes.length === 0) return null;
	if (render_nodes.length === 1) {
		const only = render_nodes[0];
		if (only.type === 'JSXExpressionContainer') return only.expression;
		return only;
	}
	const first = render_nodes[0];
	const last = render_nodes[render_nodes.length - 1];
	return set_loc(
		/** @type {any} */ ({
			type: 'JSXFragment',
			openingFragment: { type: 'JSXOpeningFragment', metadata: { path: [] } },
			closingFragment: { type: 'JSXClosingFragment', metadata: { path: [] } },
			children: render_nodes,
			metadata: { path: [] },
		}),
		first?.loc && last?.loc
			? { start: first.start, end: last.end, loc: { start: first.loc.start, end: last.loc.end } }
			: undefined,
	);
}

/**
 * @param {AST.Identifier | AST.MemberExpression | any} id
 * @returns {any}
 */
function identifier_to_jsx_name(id) {
	if (id.type === 'Identifier') {
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXIdentifier',
				name: id.name,
				metadata: { path: [], is_component: /^[A-Z]/.test(id.name) },
			}),
			id,
		);
	}
	if (id.type === 'MemberExpression') {
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXMemberExpression',
				object: /** @type {any} */ (identifier_to_jsx_name(id.object)),
				property: /** @type {any} */ (identifier_to_jsx_name(id.property)),
			}),
			id,
		);
	}
	return id;
}

/**
 * @param {any} name
 * @param {any} [source_node]
 * @returns {any}
 */
function clone_jsx_name(name, source_node = name) {
	if (name.type === 'JSXIdentifier') {
		return set_loc(
			{ type: 'JSXIdentifier', name: name.name, metadata: name.metadata || { path: [] } },
			source_node,
		);
	}
	if (name.type === 'JSXMemberExpression') {
		return set_loc(
			{
				type: 'JSXMemberExpression',
				object: clone_jsx_name(name.object, source_node.object || name.object),
				property: clone_jsx_name(name.property, source_node.property || name.property),
				metadata: name.metadata || { path: [] },
			},
			source_node,
		);
	}
	return name;
}

/**
 * @param {AST.Identifier} identifier
 * @returns {any}
 */
function clone_identifier(identifier) {
	return set_loc(
		/** @type {any} */ ({
			type: 'Identifier',
			name: identifier.name,
			metadata: { path: [] },
		}),
		identifier,
	);
}

/**
 * @param {any} node
 * @returns {any}
 */
function clone_expression_node(node) {
	if (!node || typeof node !== 'object') return node;
	if (Array.isArray(node)) return node.map(clone_expression_node);
	const clone = { ...node };
	for (const key of Object.keys(clone)) {
		if (key === 'metadata') {
			clone.metadata = clone.metadata ? { ...clone.metadata } : { path: [] };
			continue;
		}
		clone[key] = clone_expression_node(clone[key]);
	}
	return clone;
}

/**
 * @returns {AST.Literal}
 */
function create_null_literal() {
	return /** @type {any} */ ({ type: 'Literal', value: null, raw: 'null', metadata: { path: [] } });
}

/**
 * @template T
 * @param {T} node
 * @param {any} source_node
 * @returns {T}
 */
function set_loc(node, source_node) {
	/** @type {any} */ (node).metadata ??= { path: [] };
	if (source_node?.loc) {
		return /** @type {T} */ (setLocation(/** @type {any} */ (node), source_node, true));
	}
	return node;
}

/**
 * @param {any} left
 * @param {any} index
 * @returns {any[]}
 */
function get_for_of_iteration_params(left, index) {
	const params = [];
	if (left?.type === 'VariableDeclaration') {
		params.push(left.declarations[0]?.id);
	} else {
		params.push(left);
	}
	if (index) params.push(index);
	return params;
}

/**
 * @param {string} name
 * @returns {any}
 */
function create_generated_identifier(name) {
	return /** @type {any} */ ({ type: 'Identifier', name, metadata: { path: [] } });
}

/**
 * @param {any} node
 * @param {string} message
 * @returns {Error & { pos: number, end: number }}
 */
function create_compile_error(node, message) {
	const error = /** @type {Error & { pos: number, end: number }} */ (new Error(message));
	error.pos = node.start ?? 0;
	error.end = node.end ?? error.pos + 1;
	return error;
}

/**
 * @param {any[]} consequent
 * @returns {any[]}
 */
function flatten_switch_consequent(consequent) {
	const result = [];
	for (const node of consequent) {
		if (node.type === 'BlockStatement') result.push(...node.body);
		else result.push(node);
	}
	return result;
}

/**
 * @param {any} node
 * @returns {any}
 */
function tsx_compat_node_to_jsx_expression(node) {
	if (node.kind !== 'solid') {
		throw create_compile_error(
			node,
			`Solid TSRX does not support <tsx:${node.kind}> blocks. Use <tsx> or <tsx:solid>.`,
		);
	}
	return tsx_node_to_jsx_expression(node);
}

/**
 * `<tsx>...</tsx>` → Solid JSX fragment (or single child if only one).
 *
 * @param {any} node
 * @returns {any}
 */
function tsx_node_to_jsx_expression(node) {
	const children = (node.children || []).filter(
		(/** @type {any} */ child) => child.type !== 'JSXText' || child.value.trim() !== '',
	);

	if (children.length === 1 && children[0].type !== 'JSXText') {
		return strip_locations(children[0]);
	}

	return strip_locations(
		/** @type {any} */ ({
			type: 'JSXFragment',
			openingFragment: { type: 'JSXOpeningFragment', metadata: { path: [] } },
			closingFragment: { type: 'JSXClosingFragment', metadata: { path: [] } },
			children,
			metadata: { path: [] },
		}),
	);
}

/**
 * @param {any} node
 * @returns {any}
 */
function strip_locations(node) {
	if (!node || typeof node !== 'object') return node;
	if (Array.isArray(node)) return node.map(strip_locations);
	delete node.loc;
	delete node.start;
	delete node.end;
	for (const key of Object.keys(node)) {
		if (key === 'metadata') continue;
		node[key] = strip_locations(node[key]);
	}
	return node;
}

// =====================================================================
// CSS scoping — ported verbatim from @tsrx/react
// =====================================================================

/**
 * @param {any} stylesheet
 * @returns {any}
 */
function prepare_stylesheet_for_render(stylesheet) {
	walk(stylesheet, null, {
		_(node, { next }) {
			if (node && node.metadata && typeof node.metadata === 'object') {
				node.metadata.used = true;
				if (node.type === 'RelativeSelector' && !node.metadata.is_global) {
					node.metadata.scoped = true;
				}
			}
			return next();
		},
	});
	return stylesheet;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_style_element(node) {
	return (
		node &&
		node.type === 'Element' &&
		node.id &&
		node.id.type === 'Identifier' &&
		node.id.name === 'style'
	);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_composite_element(node) {
	if (!node || node.type !== 'Element' || !node.id) return false;
	if (node.id.type === 'Identifier') return /^[A-Z]/.test(node.id.name);
	return node.id.type === 'MemberExpression';
}

/**
 * @param {any} node
 * @param {string} hash
 * @returns {any}
 */
function annotate_with_hash(node, hash) {
	if (!node || typeof node !== 'object') return node;
	if (
		node.type === 'Component' ||
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
	) {
		return node;
	}

	if (node.type === 'Element') {
		if (!is_style_element(node) && !is_composite_element(node)) {
			add_hash_class(node, hash);
		}
		if (Array.isArray(node.children)) {
			node.children = node.children
				.filter((/** @type {any} */ child) => !is_style_element(child))
				.map((/** @type {any} */ child) => annotate_with_hash(child, hash));
		}
		return node;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata' || key === 'css') {
			continue;
		}
		const value = node[key];
		if (Array.isArray(value)) {
			node[key] = value.map((/** @type {any} */ child) => annotate_with_hash(child, hash));
		} else if (value && typeof value === 'object') {
			node[key] = annotate_with_hash(value, hash);
		}
	}

	return node;
}

/**
 * @param {any} component
 * @param {string} hash
 * @returns {void}
 */
function annotate_component_with_hash(component, hash) {
	/** @type {any[]} */
	const body = component.body;
	component.body = body
		.filter((/** @type {any} */ child) => !is_style_element(child))
		.map((/** @type {any} */ child) => annotate_with_hash(child, hash));
}

/**
 * @param {any} element
 * @param {string} hash
 */
function add_hash_class(element, hash) {
	const attrs = element.attributes || (element.attributes = []);
	const existing = attrs.find(
		(/** @type {any} */ a) =>
			a.type === 'Attribute' &&
			a.name &&
			a.name.type === 'Identifier' &&
			(a.name.name === 'class' || a.name.name === 'className'),
	);

	if (!existing) {
		attrs.push({
			type: 'Attribute',
			name: { type: 'Identifier', name: 'class' },
			value: { type: 'Literal', value: hash, raw: JSON.stringify(hash) },
		});
		return;
	}

	const value = existing.value;
	if (!value) {
		existing.value = { type: 'Literal', value: hash, raw: JSON.stringify(hash) };
		return;
	}

	if (value.type === 'Literal' && typeof value.value === 'string') {
		const merged = `${value.value} ${hash}`;
		existing.value = { type: 'Literal', value: merged, raw: JSON.stringify(merged) };
		return;
	}

	const expression = value.type === 'JSXExpressionContainer' ? value.expression : value;
	existing.value = {
		type: 'TemplateLiteral',
		expressions: [expression],
		quasis: [
			{ type: 'TemplateElement', value: { raw: '', cooked: '' }, tail: false },
			{ type: 'TemplateElement', value: { raw: ` ${hash}`, cooked: ` ${hash}` }, tail: true },
		],
	};
}
