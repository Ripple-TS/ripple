/** @import * as AST from 'estree' */
/** @import * as ESTreeJSX from 'estree-jsx' */
/** @import { JsxTransformContext } from '@tsrx/core/types' */

import {
	createJsxTransform,
	error,
	mergeDuplicateRefs,
	toJsxAttribute,
	validateAtMostOneRefAttribute,
	addJsxSetupDeclaration as add_jsx_setup_declaration,
	extractJsxSetupDeclarations as extract_jsx_setup_declarations,
	rewriteLoopContinuesToBareReturns as rewrite_loop_continues_to_bare_returns,
	isInterleavedBody as is_interleaved_body_core,
	isCapturableJsxChild as is_capturable_jsx_child,
	captureJsxChild,
	NORMALIZE_SPREAD_PROPS_FOR_REF_ATTR_INTERNAL_NAME,
	NORMALIZE_SPREAD_PROPS_INTERNAL_NAME,
	returnValueBodyToExpression as return_value_body_to_expression,
	tsxNodeToJsxExpression as tsx_node_to_jsx_expression,
	// Shared AST builders (truly platform-agnostic utilities).
	clone_expression_node,
	clone_identifier,
	clone_jsx_name,
	cloneSwitchHelperInvocation as clone_switch_helper_invocation,
	contains_component_jsx,
	create_generated_identifier,
	create_null_literal,
	get_for_of_iteration_params,
	is_component_like_element,
	planSwitchLift as plan_switch_lift,
	identifier_to_jsx_name,
	is_bare_render_expression,
	is_dynamic_element_id,
	is_jsx_child,
	set_loc,
	to_text_expression,
} from '@tsrx/core';

import { builders as b } from '@tsrx/core';

/**
 * Solid extends the shared `JsxTransformContext` with `needs_*` flags that
 * track which Solid runtime primitives (`Show`, `For`, `Switch`, `Match`,
 * `Errored`, `Loading`) the lowered output requires. The factory seeds these
 * via `hooks.initialState`; everything else (filename, collect, errors,
 * helper_state, …) comes from the shared base.
 *
 * @typedef {JsxTransformContext & {
 *   needs_show: boolean,
 *   needs_for: boolean,
 *   needs_switch: boolean,
 *   needs_match: boolean,
 *   needs_errored: boolean,
 *   needs_loading: boolean,
 *   needs_normalize_spread_props: boolean,
 *   needs_normalize_spread_props_for_ref_attr: boolean,
 * }} TransformContext
 */

/**
 * @typedef {{ source_name: string, read: () => any }} LazyBinding
 */

/**
 * Solid platform descriptor consumed by `createJsxTransform`. Everything
 * that diverges from React/Preact is plugged in via `hooks`:
 * - Component-level `await` is rejected outright (no `"use server"` escape).
 * - Control-flow statements become Solid's `<Show>` / `<For>` /
 *   `<Switch>/<Match>` / `<Errored>/<Loading>` instead of inline JSX.
 * - Uppercase native TSRX functions use Solid render-time control flow, so
 *   branches stay reactive without reintroducing a TSRX-specific declaration.
 * - Element attributes support composite elements and lift a lone direct text
 *   child into a `textContent` attribute.
 * - `needs_show` / `needs_for` / etc. flags track which runtime
 *   primitives must be imported, injected by `inject_solid_imports`.
 *
 * @type {import('@tsrx/core/types').JsxPlatform}
 */
const solid_platform = {
	name: 'Solid',
	imports: {
		// Solid doesn't use the React-style Suspense / ErrorBoundary pair.
		// Both fields are here to satisfy the descriptor shape; actual
		// import injection goes through `hooks.injectImports`.
		suspense: 'solid-js',
		errorBoundary: 'solid-js',
		refProp: '@tsrx/solid/ref',
	},
	jsx: {
		rewriteClassAttr: false,
		acceptedTsxKinds: ['solid'],
		// Solid's runtime accepts an array of refs natively, so multiple
		// `ref` attributes collapse to `ref={[a, b, ...]}` rather than
		// going through a `mergeRefs` helper.
		multiRefStrategy: 'array',
	},
	validation: {
		requireUseServerForAwait: true,
		// Solid's custom validator always rejects component-level await,
		// so directive scanning is redundant work. Keep the fallback flag
		// above true as a safety net if the custom hook is removed.
		scanUseServerDirectiveForAwaitWithCustomValidator: false,
	},
	hooks: {
		// Hoist to module scope in the client transform —
		// same trade-off as React and Vue, where one definition per helper
		// keeps bundles small and source mappings 1:1. The
		// `compile_to_volar_mappings` entry point opts back out so Volar's
		// type-only output keeps helpers inline against the component body.
		moduleScopedHookComponents: true,
		initialState: () => ({
			needs_show: false,
			needs_for: false,
			needs_switch: false,
			needs_match: false,
			needs_errored: false,
			needs_loading: false,
			needs_normalize_spread_props: false,
		}),
		canHoistStaticNode(node) {
			// Solid's reactive runtime doesn't reuse JSX-element identity the
			// way React does, so hoisting `<Component />` references to module
			// level pays no runtime cost — it just creates an extra `const`
			// that aliases a helper invocation (e.g. `App__static1 =
			// <App__StatementBodyHook2 />`). Truly-static DOM trees like
			// `<span>'Hello'</span>` still benefit from being hoisted out of
			// the per-render closure, so we only veto hoisting when the
			// subtree contains a *component* JSX element. Same logic Vue uses.
			return !contains_component_jsx(node);
		},
		validateComponentAwait: (await_expression, _component, ctx, _requires, source) => {
			const await_start = get_await_keyword_start(await_expression, source);
			const adjusted_node = /** @type {any} */ ({
				...await_expression,
				start: await_start,
				end: await_start + 'await'.length,
			});
			error(
				'`await` is not allowed inside Solid components.',
				ctx?.filename ?? null,
				adjusted_node,
				ctx?.errors,
				ctx?.comments,
			);
		},
		controlFlow: {
			ifStatement: if_statement_to_jsx_child,
			forOf: for_of_statement_to_jsx_child,
			switchStatement: switch_statement_to_jsx_child,
			tryStatement: try_statement_to_jsx_child,
		},
		injectImports: (program, ctx) => inject_solid_imports(program, /** @type {any} */ (ctx)),
		// `transformElementAttributes` is intentionally omitted: the
		// `transformElement` hook below short-circuits core's element walker
		// before `to_jsx_element` runs, so the dispatch path that would call
		// `transformElementAttributes` is never reached for Solid. Attribute
		// lowering happens in Solid's local `transform_element_attributes`,
		// which `to_jsx_element` and `create_dynamic_jsx_element` call directly.
		transformElementChildren(node, walked_children, raw_children, attributes, ctx) {
			return rewrite_solid_host_children(
				node,
				walked_children,
				raw_children,
				attributes,
				/** @type {any} */ (ctx),
			);
		},
		transformElement: (inner, ctx, raw_children) =>
			to_jsx_element(/** @type {any} */ (inner), /** @type {any} */ (ctx), raw_children),
	},
};

export const transform = createJsxTransform(solid_platform);

/**
 * @param {any} await_node
 * @param {string} source
 * @returns {number}
 */
function get_await_keyword_start(await_node, source) {
	if (await_node?.type === 'AwaitExpression') {
		return await_node.start ?? 0;
	}

	if (await_node?.type === 'ForOfStatement' && await_node.await === true) {
		const statement_start = await_node.start ?? 0;
		const statement_end = await_node.end ?? statement_start;
		const statement_source = source.slice(statement_start, statement_end);
		const await_offset = statement_source.search(/\bawait\b/);

		if (await_offset !== -1) {
			return statement_start + await_offset;
		}
	}

	return await_node?.start ?? 0;
}
// =====================================================================
// Control flow → Solid JSX components
// =====================================================================

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function to_jsx_child(node, transform_context) {
	if (!node) return node;
	switch (node.type) {
		case 'Tsx':
			// We're inside a JSX child position by construction; keep `{expr}`
			// containers wrapped. See helpers.js.
			return tsx_node_to_jsx_expression(node, true);
		case 'Tsrx':
			return tsrx_node_to_jsx_expression(node, transform_context, true);
		case 'TsxCompat':
			return tsx_compat_node_to_jsx_expression(node, transform_context, true);
		case 'Element':
			return to_jsx_element(node, transform_context);
		case 'Text':
			return to_jsx_expression_container(to_text_expression(node.expression, node), node);
		case 'TSRXExpression':
			return to_jsx_expression_container(node.expression, node);
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
 * Lower a native TSRX fragment body to a Solid JSX expression.
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @param {boolean} [in_jsx_child]
 * @returns {any}
 */
function tsrx_node_to_jsx_expression(node, transform_context, in_jsx_child = false) {
	const children = (node.children || []).filter(
		(/** @type {any} */ child) =>
			child &&
			child.type !== 'EmptyStatement' &&
			(child.type !== 'JSXText' || child.value.trim() !== ''),
	);

	const returned_expression = return_value_body_to_expression(children, node, transform_context);
	if (returned_expression) {
		if (
			in_jsx_child &&
			returned_expression.type !== 'JSXElement' &&
			returned_expression.type !== 'JSXFragment' &&
			returned_expression.type !== 'JSXText' &&
			returned_expression.type !== 'JSXExpressionContainer'
		) {
			return to_jsx_expression_container(returned_expression, node);
		}
		return returned_expression;
	}

	let expression = body_to_jsx_child(children, transform_context);
	if (is_branch_arrow(expression)) {
		expression = b.call(expression);
	}

	if (
		in_jsx_child &&
		expression.type !== 'JSXElement' &&
		expression.type !== 'JSXFragment' &&
		expression.type !== 'JSXText' &&
		expression.type !== 'JSXExpressionContainer'
	) {
		return to_jsx_expression_container(expression, node);
	}

	return expression;
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
	// When non-JSX statements are interleaved with JSX children, preserve
	// source order by capturing each JSX child into a const at its textual
	// position. Otherwise all statements would run before any JSX is
	// constructed, so every JSX child would observe the final state of
	// mutable variables instead of the value at its point in the source.
	const interleaved = is_interleaved_body(body_nodes);

	/** @type {any[]} */
	const statements = [];
	/** @type {any[]} */
	const children = [];
	let has_terminal_return = false;
	let capture_index = 0;
	for (const child of body_nodes) {
		if (child?.type === 'ReturnStatement' && child.argument != null) {
			statements.push(child);
			has_terminal_return = true;
			continue;
		}

		if (is_jsx_child(child)) {
			const jsx = to_jsx_child(child, transform_context);
			statements.push(...extract_jsx_setup_declarations(jsx));
			if (interleaved && is_capturable_jsx_child(jsx)) {
				const { declaration, reference } = captureJsxChild(jsx, capture_index++);
				statements.push(declaration);
				children.push(reference);
			} else {
				children.push(jsx);
			}
		} else if (is_bare_render_expression(child)) {
			children.push(to_jsx_expression_container(child, child));
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
	if (children.length > 0 || !has_terminal_return) {
		block_body.push(
			b.return(children.length > 0 ? build_return_expression(children) : create_null_literal()),
		);
	}

	const arrow = b.arrow([], b.block(block_body));
	/** @type {any} */ (arrow.metadata).is_branch_arrow = true;
	return arrow;
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_bare_return_statement(node) {
	return (
		node?.type === 'ReturnStatement' &&
		node.argument == null &&
		node.metadata?.generated_loop_continue_return === true
	);
}

/**
 * @param {any} node
 * @returns {any[]}
 */
function get_if_consequent_body(node) {
	return node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
}

/**
 * @param {any[]} body_nodes
 * @returns {boolean}
 */
function body_has_loop_skip(body_nodes) {
	return body_nodes.some(
		(node) => is_bare_return_statement(node) || get_returning_if_info(node) !== null,
	);
}

/**
 * @param {any[]} body_nodes
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function loop_body_to_callback_statements(body_nodes, transform_context) {
	/** @type {any[]} */
	const statements = [];
	/** @type {any[]} */
	const children = [];

	/**
	 * @param {any} source_node
	 * @param {any[]} render_nodes
	 */
	const create_return_statement = (source_node, render_nodes) => {
		const cloned = render_nodes.map((node) => clone_expression_node(node));
		const argument = cloned.length > 0 ? build_return_expression(cloned) : create_null_literal();
		return set_loc(b.return(argument), source_node);
	};

	/** @param {any} source_node */
	const flush_children_to_return = (source_node) => {
		const statement = create_return_statement(source_node, children);
		children.length = 0;
		return statement;
	};

	let has_terminal_return = false;

	for (const child of body_nodes) {
		if (is_bare_return_statement(child)) {
			statements.push(flush_children_to_return(child));
			has_terminal_return = true;
			break;
		}

		const returning_if_info = get_returning_if_info(child);
		if (returning_if_info !== null) {
			const branch_statements = loop_body_to_callback_statements(
				returning_if_info.consequent_body,
				transform_context,
			);
			prepend_render_nodes_to_return_statements(branch_statements, children);
			statements.push(set_loc(b.if(child.test, b.block(branch_statements), null), child));
			continue;
		}

		if (is_jsx_child(child)) {
			const jsx = to_jsx_child(child, transform_context);
			statements.push(...extract_jsx_setup_declarations(jsx));
			children.push(jsx);
		} else if (is_bare_render_expression(child)) {
			children.push(to_jsx_expression_container(child, child));
		} else {
			statements.push(child);
		}
	}

	if (!has_terminal_return) {
		statements.push(flush_children_to_return(body_nodes.at(-1)));
	}
	return statements;
}

/**
 * @param {any[]} statements
 * @param {any[]} render_nodes
 * @returns {void}
 */
function prepend_render_nodes_to_return_statements(statements, render_nodes) {
	if (render_nodes.length === 0) {
		return;
	}

	for (const statement of statements) {
		prepend_render_nodes_to_return_statement(statement, render_nodes, false);
	}
}

/**
 * @param {any} node
 * @param {any[]} render_nodes
 * @param {boolean} inside_nested_function
 * @returns {void}
 */
function prepend_render_nodes_to_return_statement(node, render_nodes, inside_nested_function) {
	if (!node || typeof node !== 'object') {
		return;
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
	) {
		inside_nested_function = true;
	}

	if (!inside_nested_function && node.type === 'ReturnStatement') {
		node.argument = combine_render_return_argument(render_nodes, node.argument);
		return;
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			prepend_render_nodes_to_return_statement(child, render_nodes, inside_nested_function);
		}
		return;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}
		prepend_render_nodes_to_return_statement(node[key], render_nodes, inside_nested_function);
	}
}

/**
 * @param {any[]} render_nodes
 * @param {any} return_argument
 * @returns {any}
 */
function combine_render_return_argument(render_nodes, return_argument) {
	const combined = render_nodes.map((node) => clone_expression_node(node));

	if (return_argument != null && !is_null_literal(return_argument)) {
		combined.push(return_argument_to_render_node(return_argument));
	}

	return build_return_expression(combined) || create_null_literal();
}

/**
 * @param {any} argument
 * @returns {any}
 */
function return_argument_to_render_node(argument) {
	if (
		argument?.type === 'JSXElement' ||
		argument?.type === 'JSXFragment' ||
		argument?.type === 'JSXExpressionContainer'
	) {
		return argument;
	}

	return to_jsx_expression_container(argument);
}

/**
 * @param {any} node
 * @returns {boolean}
 */
function is_null_literal(node) {
	return node?.type === 'Literal' && node.value == null;
}

/**
 * Solid-specific binding of the core `isInterleavedBody` helper with this
 * target's `is_jsx_child` predicate.
 *
 * @param {any[]} body_nodes
 * @returns {boolean}
 */
function is_interleaved_body(body_nodes) {
	return is_interleaved_body_core(body_nodes, is_jsx_child);
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
 * Detect a top-level `if` branch with a bare `return` and no `else` branch.
 *
 * @param {any} node
 * @returns {{ consequent_body: any[], return_index: number } | null}
 */
function get_returning_if_info(node) {
	if (!node || node.type !== 'IfStatement' || node.alternate) return null;
	const consequent = node.consequent;
	if (!consequent) return null;

	if (is_bare_return_statement(consequent)) {
		return {
			consequent_body: [consequent],
			return_index: 0,
		};
	}

	if (consequent.type === 'BlockStatement') {
		const return_index = consequent.body.findIndex(is_bare_return_statement);
		if (return_index !== -1) {
			return {
				consequent_body: consequent.body,
				return_index,
			};
		}
	}

	return null;
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
	return b.call(node);
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
 * `for (const item of items; key item.id) { ... }` →
 * `<For each={items} keyed={(item) => item.id}>{(item) => ...}</For>`
 *
 * Solid 2.0's `<For>` accepts a `keyed` prop (`boolean | (item) => any`) that
 * switches reconciliation from reference identity to derived keys. The callback
 * only receives the item — not the index — so a `key` expression that depends
 * only on the index can't be translated cleanly and will surface as a
 * scope error in the generated TSX. Item-based keys (the common case, e.g.
 * `key item.id`) translate directly.
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function for_of_statement_to_jsx_child(node, transform_context) {
	transform_context.needs_for = true;

	const loop_params = get_for_of_iteration_params(node.left, node.index);
	const loop_body = /** @type {any[]} */ (
		rewrite_loop_continues_to_bare_returns(
			node.body.type === 'BlockStatement' ? node.body.body : [node.body],
		)
	);

	let arrow;

	if (body_has_loop_skip(loop_body)) {
		arrow = b.arrow(
			loop_params,
			b.block(loop_body_to_callback_statements(loop_body, transform_context)),
		);
	} else {
		// Placeholder body — merge_branch_body_into_arrow replaces it below.
		arrow = b.arrow(loop_params, b.literal(null));
		arrow = merge_branch_body_into_arrow(arrow, body_to_jsx_child(loop_body, transform_context));
	}

	const attributes = [b.jsx_attribute(b.jsx_id('each'), to_jsx_expression_container(node.right))];

	if (node.key) {
		const item_param = clone_expression_node(loop_params[0]);
		const keyed_arrow = b.arrow([item_param], node.key);
		attributes.push(
			b.jsx_attribute(b.jsx_id('keyed'), to_jsx_expression_container(keyed_arrow, node.key)),
		);
	}

	return create_jsx_element('For', attributes, [to_jsx_expression_container(arrow)]);
}

/**
 * Solid doesn't have a dedicated `<Switch>` statement — we reuse the
 * `<Switch>/<Match>` components pair that `if` chains use. A `switch`
 * statement with a discriminant `d` and cases `[c1, c2, default]` becomes:
 *   <Switch fallback={...default}><Match when={d === c1}>...</Match>...</Switch>
 *
 * Fall-through across cases reuses the shared `plan_switch_lift` pipeline
 * from `@tsrx/core`: each duplicated case body is hoisted into a
 * `StatementBodyHook` helper component that chains into the next helper, and
 * each `<Match>` body just renders the appropriate helper element. The
 * client transform hoists those helpers to module scope (Solid's platform
 * sets `moduleScopedHookComponents: true`); `compile_to_volar_mappings` opts
 * back out and emits the helpers locally inside the component body so Volar
 * still sees closure-captured bindings against the component scope.
 *
 * When any case is lifted in `typeOnly` mode the helper declarations have to
 * live somewhere local-scoped — we wrap the whole `<Switch>` in an IIFE that
 * declares them in order and returns the element. The client transform's
 * module-scoped helpers leave that IIFE empty, so we skip the wrapper.
 *
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function switch_statement_to_jsx_child(node, transform_context) {
	transform_context.needs_switch = true;
	transform_context.needs_match = true;

	const { case_info, case_helpers, find_next_helper_after, setup_statements } = plan_switch_lift(
		node,
		transform_context,
	);

	/** @type {any} */
	let fallback = null;
	/** @type {Array<{ test: any, body_jsx: any }>} */
	const match_entries = [];

	for (let i = 0; i < node.cases.length; i++) {
		const original_case = node.cases[i];
		const info = case_info[i];
		const helper = case_helpers[i];

		/** @type {any} */
		let body_jsx;
		if (helper) {
			// Lifted case: render the helper element directly. Use the
			// original `component_element` (not a clone) for this — its
			// definition's `loc` is what the case position should map to.
			body_jsx = helper.component_element;
		} else if (info.own_body.length === 0) {
			// Empty case in the source. If a downstream chain exists (alias
			// pattern like `case 1: case 2: body; break;`), the `<Match>` for
			// the empty label still has to render that downstream body —
			// Solid's `<Match>` arms are exclusive, so JS fall-through can't
			// rescue us here.
			const next_helper = find_next_helper_after(i);
			body_jsx = next_helper ? clone_switch_helper_invocation(next_helper) : create_null_literal();
		} else {
			// Inline case body: process JSX/non-JSX statements just like Solid
			// does for any other branch body, then append the chain helper if
			// this case falls through with no terminator.
			const inline_body = [...info.own_body];
			if (!info.has_terminator) {
				const next_helper = find_next_helper_after(i);
				if (next_helper) {
					inline_body.push(clone_switch_helper_invocation(next_helper));
				}
			}
			body_jsx = body_to_jsx_child(inline_body, transform_context);
		}

		if (original_case.test === null) {
			fallback = body_jsx;
			continue;
		}

		// Clone the discriminant per-case: every generated `<Match when={d === caseN}>`
		// would otherwise share the same AST node reference, so a downstream pass
		// (lazy transforms, printer metadata, source-map annotation) mutating it on
		// one case would corrupt the others. The right operand (`caseN`) is the
		// original source `test` node — unique per case, so we keep its real loc
		// for editor IntelliSense and don't clone it.
		const test = b.binary('===', clone_expression_node(node.discriminant), original_case.test);

		match_entries.push({ test, body_jsx });
	}

	const match_children = match_entries.map(({ test, body_jsx }) =>
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

	const switch_element = create_jsx_element('Switch', attributes, match_children);

	if (setup_statements.length === 0) {
		return switch_element;
	}

	// Local-scoped helpers (typeOnly mode): wrap the <Switch> in an IIFE that
	// declares the helpers in source order and returns the element.
	return to_jsx_expression_container(
		b.call(b.arrow([], b.block([...setup_statements, b.return(switch_element)]))),
	);
}

/**
 * Transform a `try { ... } pending { ... } catch (err, reset) { ... }` block
 * into Solid's `<Errored>` and/or `<Loading>` JSX elements.
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
		error(
			'Solid TSRX does not support JavaScript `try/finally` in component templates. `finally` is not part of TSRX control flow; move the try/finally into a function if you need cleanup logic.',
			transform_context.filename,
			finalizer,
			transform_context.errors,
			transform_context.comments,
		);
	}

	if (!pending && !handler) {
		error(
			'Solid try statements must have a `pending` or `catch` block.',
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
		return to_jsx_expression_container(create_null_literal());
	}

	const try_body_nodes = node.block.body || [];
	/** @type {any} */
	let result = jsx_child_wrap(iife_if_arrow(body_to_jsx_child(try_body_nodes, transform_context)));

	if (pending) {
		transform_context.needs_loading = true;
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
		transform_context.needs_errored = true;

		const catch_params = [];
		if (handler.param) catch_params.push(handler.param);
		else catch_params.push(create_generated_identifier('_error'));
		if (handler.resetParam) catch_params.push(handler.resetParam);
		else catch_params.push(create_generated_identifier('_reset'));

		const catch_body_nodes = handler.body.body || [];
		const catch_jsx = body_to_jsx_child(catch_body_nodes, transform_context);

		const fallback_fn = merge_branch_body_into_arrow(
			b.arrow(catch_params, b.literal(null)),
			catch_jsx,
		);

		result = create_jsx_element(
			'Errored',
			[b.jsx_attribute(b.jsx_id('fallback'), to_jsx_expression_container(fallback_fn))],
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

const TEMPLATE_FRAGMENT_ERROR =
	'JSX fragment syntax is not needed in TSRX templates. TSRX renders in immediate mode, so everything is already a fragment. Use `<>...</>` only within <tsx>...</tsx>.';

/**
 * Inject `import { Show, For, Switch, Match, Errored, Loading } from 'solid-js'`
 * specifiers for whichever control-flow primitives the transform emitted.
 *
 * @param {AST.Program} program
 * @param {TransformContext} transform_context
 */
function inject_solid_imports(program, transform_context) {
	if (transform_context.needs_normalize_spread_props) {
		program.body.unshift(
			b.import_declaration(
				[b.import_specifier('normalize_spread_props', NORMALIZE_SPREAD_PROPS_INTERNAL_NAME)],
				'@tsrx/solid/ref',
			),
		);
	}

	if (transform_context.needs_normalize_spread_props_for_ref_attr) {
		program.body.unshift(
			b.import_declaration(
				[
					b.import_specifier(
						'normalize_spread_props_for_ref_attr',
						NORMALIZE_SPREAD_PROPS_FOR_REF_ATTR_INTERNAL_NAME,
					),
				],
				'@tsrx/solid/ref',
			),
		);
	}

	const needed = [];
	if (transform_context.needs_show) needed.push('Show');
	if (transform_context.needs_for) needed.push('For');
	if (transform_context.needs_switch) needed.push('Switch');
	if (transform_context.needs_match) needed.push('Match');
	if (transform_context.needs_errored) needed.push('Errored');
	if (transform_context.needs_loading) needed.push('Loading');

	if (needed.length === 0) return;

	program.body.unshift(
		b.imports(
			needed.map((name) => [name, name]),
			'solid-js',
		),
	);
}

// =====================================================================
// Element → JSX (with Solid-specific attribute handling)
// =====================================================================

/**
 * @param {any} node
 * @param {any[]} walked_children
 * @param {any[]} raw_children
 * @param {any[]} attributes
 * @param {TransformContext} transform_context
 * @returns {{ children: any[], selfClosing?: boolean } | null}
 */
function rewrite_solid_host_children(
	node,
	walked_children,
	raw_children,
	attributes,
	transform_context,
) {
	const source_children = raw_children ?? walked_children;
	if (
		!is_component_like_element(node) &&
		source_children.length === 1 &&
		source_children[0]?.type === 'Text' &&
		!has_text_content_attribute(attributes)
	) {
		const text_child = source_children[0];
		attributes.push(
			set_loc(
				/** @type {any} */ ({
					type: 'JSXAttribute',
					name: {
						type: 'JSXIdentifier',
						name: 'textContent',
						metadata: { path: [] },
					},
					value:
						walked_children[0] && walked_children[0].type === 'JSXExpressionContainer'
							? walked_children[0]
							: to_jsx_expression_container(
									to_text_expression(text_child.expression, text_child),
									text_child,
								),
					shorthand: false,
					metadata: { path: [] },
				}),
				text_child,
			),
		);
		return { children: [], selfClosing: true };
	}

	return null;
}

/**
 * @param {any} node - walker-transformed Element whose `children` have
 *   already had `Style` / `TSRXExpression` / nested `Element`
 *   walker rewrites applied.
 * @param {TransformContext} transform_context
 * @param {any[]} [pre_walk_children] - optional pre-walk children list
 *   from the `transformElement` hook. Only used to detect the
 *   "single `Text` child" shape for the `textContent` optimization —
 *   once detected we build the attribute from the original `Text.expression`.
 *   The factory's `Text` walker lowers `Text` → `JSXExpressionContainer`, so
 *   without these we'd miss the optimization. For rendering non-textContent
 *   children we keep using `node.children` (walker-transformed).
 * @returns {any}
 */
function to_jsx_element(node, transform_context, pre_walk_children) {
	if (node.type === 'JSXElement') return node;

	const walked_children = node.children || [];
	const text_optimization_children = pre_walk_children ?? walked_children;

	if (!node.id) {
		error(
			TEMPLATE_FRAGMENT_ERROR,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
		return set_loc(
			/** @type {any} */ ({
				type: 'JSXFragment',
				openingFragment: { type: 'JSXOpeningFragment' },
				closingFragment: { type: 'JSXClosingFragment' },
				children: [],
			}),
			node,
		);
	}

	if (is_dynamic_element_id(node.id)) {
		return dynamic_element_to_jsx_child(node, transform_context);
	}

	const name = identifier_to_jsx_name(node.id);
	const is_composite = is_component_like_element(node);
	const attributes = transform_element_attributes(
		node.attributes || [],
		is_composite,
		transform_context,
		node,
	);

	// Optimization: `<el>"text"</el>` with a single direct text child on a host
	// (DOM) element lowers to `<el textContent={expr} />`. Solid
	// writes `textContent` as a direct DOM property, which is cheaper than
	// the `insert()`-based text node binding it would otherwise emit for
	// child expressions. Only safe when the direct text child is the sole child and
	// the parent is a host element (composite components receive
	// `textContent` as an opaque prop with no DOM semantics), and when the
	// user hasn't already set `textContent` themselves.
	//
	// We check `text_optimization_children` (pre-walk) rather than
	// `walked_children` because the factory's `Text` walker has already
	// lowered `Text` → `JSXExpressionContainer`, which wouldn't match.
	let selfClosing = !!node.selfClosing;
	let children;
	if (
		!is_composite &&
		text_optimization_children.length === 1 &&
		text_optimization_children[0] &&
		text_optimization_children[0].type === 'Text' &&
		!has_text_content_attribute(attributes)
	) {
		const text_child = text_optimization_children[0];
		attributes.push(
			set_loc(
				/** @type {any} */ ({
					type: 'JSXAttribute',
					name: {
						type: 'JSXIdentifier',
						name: 'textContent',
						metadata: { path: [] },
					},
					// preserves the walker's rewrites on the Text's inner expression
					value:
						walked_children[0] && walked_children[0].type === 'JSXExpressionContainer'
							? walked_children[0]
							: to_jsx_expression_container(
									to_text_expression(text_child.expression, text_child),
									text_child,
								),
					shorthand: false,
					metadata: { path: [] },
				}),
				text_child,
			),
		);
		children = [];
		selfClosing = true;
	} else {
		// Use walker-transformed children in the emitted JSX.
		children = create_element_children(walked_children, transform_context);
	}

	const openingElement = set_loc(
		b.jsx_opening_element(name, attributes, selfClosing, node.openingElement?.typeArguments),
		node.openingElement || node,
	);

	const closingElement = selfClosing
		? null
		: set_loc(
				/** @type {any} */ ({
					type: 'JSXClosingElement',
					// Forward the source *name* (not the JSXClosingElement wrapper)
					// so `clone_jsx_name` can propagate member-expression sub-part
					// locations from the closing tag. See the identical fix in
					// packages/tsrx/src/transform/jsx/index.js.
					name: clone_jsx_name(name, node.closingElement?.name || node.closingElement || node),
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

	// If any child is a plain statement (VariableDeclaration, ExpressionStatement,
	// DebuggerStatement, etc.) interleaved with JSX, we can't emit it as a JSX
	// child directly — Solid's JSX runtime would treat the node as an opaque
	// value and the source code would print as literal text. Wrap the whole
	// children list in an IIFE so the statements execute during render and
	// their locals scope to the block, matching the authored intent of
	// mid-template locals.
	const has_non_jsx_child = children.some(
		(/** @type {any} */ child) => child && !is_jsx_child(child),
	);
	if (has_non_jsx_child) {
		const body_jsx = body_to_jsx_child(children, transform_context);
		return [jsx_child_wrap(iife_if_arrow(body_jsx))];
	}

	return children.map((/** @type {any} */ child) => to_jsx_child(child, transform_context));
}

/**
 * Check if the user already supplied a `textContent` attribute on the
 * element, or if a spread attribute could supply one. If either is true the
 * compiler mustn't emit another `textContent` — the direct-text →
 * `textContent={...}` optimization bails out. Spreads are treated as
 * potentially setting `textContent` because the spread's runtime shape
 * isn't knowable at compile time; emitting a second `textContent` attribute
 * would produce a duplicate-key conflict at runtime.
 *
 * @param {any[]} attributes
 * @returns {boolean}
 */
function has_text_content_attribute(attributes) {
	return attributes.some(
		(/** @type {any} */ attr) =>
			attr &&
			((attr.type === 'JSXAttribute' &&
				attr.name &&
				attr.name.type === 'JSXIdentifier' &&
				attr.name.name === 'textContent') ||
				attr.type === 'JSXSpreadAttribute'),
	);
}

/**
 * Transform a list of raw attributes into JSX attributes.
 *
 * Per-attribute conversion (SpreadAttribute → `{...expr}`, plain Attribute →
 * JSXAttribute, JSXAttribute pass-through)
 * is delegated to `@tsrx/core`'s shared {@link toJsxAttribute}. The list
 * is then run through {@link mergeDuplicateRefs} so compiler-synthesized
 * host-spread refs can compose with an explicit `ref={...}`.
 *
 * @param {any[]} raw_attrs
 * @param {boolean} is_composite
 * @param {TransformContext} transform_context
 * @param {any} element
 * @returns {any[]}
 */
function transform_element_attributes(raw_attrs, is_composite, transform_context, element) {
	validateAtMostOneRefAttribute(raw_attrs, /** @type {any} */ (transform_context));
	/** @type {any[]} */
	const result = [];

	for (const attr of raw_attrs) {
		if (!attr) continue;
		result.push(toJsxAttribute(attr, /** @type {any} */ (transform_context)));
	}
	return mergeDuplicateRefs(
		normalize_solid_host_ref_spreads(result, !is_composite, transform_context),
		/** @type {any} */ (transform_context),
	);
}

/**
 * @param {any[]} attrs
 * @param {boolean} is_host
 * @param {TransformContext} transform_context
 * @returns {any[]}
 */
function normalize_solid_host_ref_spreads(attrs, is_host, transform_context) {
	if (!is_host) return attrs;

	const ref_exprs = attrs
		.filter((attr) => is_solid_jsx_ref_attribute(attr))
		.map((attr) => attr.value.expression);
	const needs_synthetic_spread_ref = ref_exprs.length > 0;

	return attrs.flatMap((attr) => {
		if (!attr || attr.type !== 'JSXSpreadAttribute') {
			return [attr];
		}

		transform_context.needs_normalize_spread_props = true;
		const normalized = b.call(NORMALIZE_SPREAD_PROPS_INTERNAL_NAME, attr.argument);

		if (needs_synthetic_spread_ref) {
			const normalized_id = create_generated_identifier(
				create_solid_spread_props_name(transform_context),
			);
			const spread = {
				...attr,
				argument: clone_identifier(normalized_id),
			};
			const ref_attr = b.jsx_attribute(
				b.jsx_id('ref'),
				b.jsx_expression_container(b.member(clone_identifier(normalized_id), 'ref'), attr),
				false,
				attr,
			);
			ref_attr.metadata = { ...(ref_attr.metadata || {}) };
			/** @type {any} */ (ref_attr.metadata).synthetic_ref = true;
			add_jsx_setup_declaration(spread, b.let(clone_identifier(normalized_id), normalized));

			return [spread, ref_attr];
		}

		return [
			{
				...attr,
				argument: normalized,
			},
		];
	});
}

/**
 * @param {TransformContext} transform_context
 * @returns {string}
 */
function create_solid_spread_props_name(transform_context) {
	if (transform_context.helper_state) {
		transform_context.helper_state.next_id += 1;
		return `${transform_context.helper_state.base_name}__spread_props${transform_context.helper_state.next_id}`;
	}

	transform_context.local_statement_component_index += 1;
	return `_tsrx_spread_props_${transform_context.local_statement_component_index}`;
}

/**
 * @param {any} attr
 * @returns {boolean}
 */
function is_solid_jsx_ref_attribute(attr) {
	return !!(
		attr &&
		attr.type === 'JSXAttribute' &&
		attr.name?.type === 'JSXIdentifier' &&
		attr.name.name === 'ref' &&
		attr.value?.type === 'JSXExpressionContainer' &&
		attr.value.expression &&
		attr.value.expression.type !== 'JSXEmptyExpression'
	);
}

/**
 * @param {any} node
 * @param {TransformContext} transform_context
 * @returns {any}
 */
function dynamic_element_to_jsx_child(node, transform_context) {
	const dynamic_id = set_loc(create_generated_identifier('DynamicElement'), node.id);
	const alias_declaration = set_loc(b.const(dynamic_id, clone_expression_node(node.id)), node);
	const jsx_element = create_dynamic_jsx_element(dynamic_id, node, transform_context);

	return to_jsx_expression_container(
		b.call(
			b.arrow(
				[],
				b.block([
					alias_declaration,
					b.return(b.conditional(clone_identifier(dynamic_id), jsx_element, create_null_literal())),
				]),
			),
		),
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
	const is_composite = is_component_like_element(node);
	const attributes = transform_element_attributes(
		node.attributes || [],
		is_composite,
		transform_context,
		null,
	);
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
	return set_loc(
		/** @type {any} */ ({
			type: 'JSXExpressionContainer',
			expression: /** @type {any} */ (expression),
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
 * @param {any} node
 * @param {TransformContext} transform_context
 * @param {boolean} [in_jsx_child]
 * @returns {any}
 */
function tsx_compat_node_to_jsx_expression(node, transform_context, in_jsx_child = false) {
	if (node.kind !== 'solid') {
		error(
			`Solid TSRX does not support <tsx:${node.kind}> blocks. Use <tsx> or <tsx:solid>.`,
			transform_context.filename,
			node,
			transform_context.errors,
			transform_context.comments,
		);
	}
	return tsx_node_to_jsx_expression(node, in_jsx_child);
}
