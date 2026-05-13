/** @import * as AST from 'estree' */

import * as b from '../utils/builders.js';
import { is_function_or_component_node } from '../utils/ast.js';

/**
 * Lazy destructuring transform — framework-agnostic.
 *
 * Shared between `@tsrx/react`, `@tsrx/preact`, `@tsrx/solid`, and `@tsrx/vue`.
 * Walks an AST and rewrites references to names introduced by `&{ ... }` /
 * `&[ ... ]` destructuring patterns into member-expression accesses on a
 * generated source identifier.
 *
 * Usage:
 *   1. Create a context with `createLazyContext()` (or provide any object with
 *      a `lazy_next_id: number` field).
 *   2. Run `preallocateLazyIds(root, context)` once over the full program to
 *      assign stable `metadata.lazy_id` values to every lazy pattern and to
 *      flag function-like nodes whose subtree contains any lazy pattern via
 *      `metadata.has_lazy_descendants`.
 *   3. After converting components to functions, call `applyLazyTransforms(fn,
 *      new Map())` on each top-level function. The function-handler walks the
 *      whole subtree, collects param + body bindings, replaces lazy patterns
 *      with their generated identifiers, and rewrites every reference.
 *
 * The transform is purely AST-to-AST and has no framework-specific knowledge.
 */

/**
 * @typedef {{ lazy_next_id: number }} LazyContext
 */

/**
 * @typedef {{ source_name: string, read: (reference?: any) => any }} LazyBinding
 */

/**
 * Create a fresh lazy-id allocation context.
 *
 * @returns {LazyContext}
 */
export function create_lazy_context() {
	return { lazy_next_id: 0 };
}

/**
 * @param {LazyContext} context
 * @returns {string}
 */
function generate_lazy_id(context) {
	return `__lazy${context.lazy_next_id++}`;
}

/**
 * @param {any} node
 * @param {any} [loc_info]
 * @returns {any}
 */
function set_source_location(node, loc_info) {
	if (loc_info?.loc) {
		node.start = loc_info.start;
		node.end = loc_info.end;
		node.loc = loc_info.loc;
	}
	return node;
}

/**
 * @param {string} name
 * @param {any} [loc_info]
 * @param {string} [source_name]
 * @param {number} [source_length]
 * @returns {any}
 */
function create_generated_identifier(name, loc_info, source_name, source_length) {
	const id = b.id(name);
	if (source_name && source_name !== name) id.metadata.source_name = source_name;
	if (source_length != null) id.metadata.source_length = source_length;
	return set_source_location(id, loc_info);
}

/**
 * @param {any} pattern
 * @returns {{ start: number, end: number, loc: any, source_length: number } | null}
 */
function get_lazy_pattern_mapping_range(pattern) {
	if (!pattern.loc) return null;

	const end = pattern.typeAnnotation?.start ?? pattern.end;
	const end_loc = pattern.typeAnnotation?.loc?.start ?? pattern.loc.end;
	return {
		start: pattern.start,
		end,
		loc: {
			start: pattern.loc.start,
			end: end_loc,
		},
		source_length: end - pattern.start,
	};
}

/**
 * Synthesize an object-shaped annotation for untyped lazy object params so the
 * virtual TSX can expose prop names to TypeScript completions.
 *
 * @param {any} pattern
 * @returns {any | null}
 */
function create_lazy_object_type_annotation(pattern) {
	if (pattern.type !== 'ObjectPattern') return null;

	const members = [];
	for (const prop of pattern.properties || []) {
		if (prop.type === 'RestElement' || prop.computed) continue;

		const key = prop.key;
		if (key.type !== 'Identifier' && key.type !== 'Literal') continue;

		const member_key =
			key.type === 'Identifier'
				? create_generated_identifier(key.name, key)
				: set_source_location({ ...key, metadata: { path: [] } }, key);

		members.push(
			b.ts_property_signature(member_key, b.ts_type_annotation(b.ts_keyword_type('any'))),
		);
	}

	if (members.length === 0) return null;

	return b.ts_type_annotation(b.ts_type_literal(members));
}

/**
 * @param {any} node
 * @returns {string | null}
 */
function get_static_property_name(node) {
	if (node.type === 'Identifier') return node.name;
	if (node.type === 'Literal') return String(node.value);
	return null;
}

/**
 * @param {any} type_annotation
 * @returns {Map<string, any>}
 */
function get_type_property_keys(type_annotation) {
	const keys = new Map();
	const members = type_annotation?.typeAnnotation?.members;
	if (!Array.isArray(members)) return keys;

	for (const member of members) {
		if (member.type !== 'TSPropertySignature' || !member.key) continue;
		const name = get_static_property_name(member.key);
		if (name != null && !keys.has(name)) keys.set(name, member.key);
	}

	return keys;
}

/**
 * Store extra mappings from lazy object binding identifiers to generated type
 * property keys. Parser diagnostics for duplicate bindings point at the binding
 * names (`&{ a: value, value }`), while the virtual param only exposes object
 * properties (`__lazy0: { a: ...; value: ... }`).
 *
 * @param {any} lazy_id
 * @param {any} pattern
 */
function set_lazy_param_binding_mappings(lazy_id, pattern) {
	if (pattern.type !== 'ObjectPattern') return;

	const type_keys = get_type_property_keys(lazy_id.typeAnnotation);
	if (type_keys.size === 0) return;

	const mappings = [];
	for (const prop of pattern.properties || []) {
		if (prop.type === 'RestElement' || prop.computed) continue;

		const value = prop.value;
		const actual = value.type === 'AssignmentPattern' ? value.left : value;
		if (actual.type !== 'Identifier' || !actual.loc) continue;

		const key_name = get_static_property_name(prop.key);
		const generated = key_name == null ? null : type_keys.get(key_name);
		if (generated?.loc) {
			generated.metadata = { ...generated.metadata, disable_verification: true };
			mappings.push({ source: actual, generated });
		}
	}

	if (mappings.length > 0) {
		lazy_id.metadata.lazy_param_binding_mappings = mappings;
	}
}

/**
 * Collect lazy bindings from a destructuring pattern.
 *
 * For `&{ name, age }` on source `S`, maps `name` → `S.name`, `age` → `S.age`.
 * For `&[a, b]` on source `S`, maps `a` → `S[0]`, `b` → `S[1]`. Recurses into
 * nested `ObjectPattern` / `ArrayPattern` values so that `&{ outer: &{ inner } }`
 * on source `S` maps `inner` → `S.outer.inner`, and `&{ pair: &[first, second] }`
 * maps `first` → `S.pair[0]`. Handles `AssignmentPattern` (default values lost,
 * but the binding still resolves to the member chain). Skips `RestElement`.
 *
 * @param {any} pattern
 * @param {string} source_name
 * @param {Map<string, LazyBinding>} lazy_bindings
 */
export function collect_lazy_bindings(pattern, source_name, lazy_bindings) {
	collect_lazy_bindings_at(
		pattern,
		source_name,
		() => create_generated_identifier(source_name),
		lazy_bindings,
	);
}

/**
 * Walk a destructure pattern and register a `LazyBinding` for each leaf
 * `Identifier`, where `build_parent` produces the AST expression that reaches
 * this pattern's value from the synthesized source identifier. Each nested
 * level composes its accessor onto `build_parent`, so leaves get the full
 * member chain (e.g. `source.outer.inner` for `&{ outer: &{ inner } }`).
 *
 * @param {any} pattern
 * @param {string} source_name
 * @param {(reference?: any) => any} build_parent
 * @param {Map<string, LazyBinding>} lazy_bindings
 */
function collect_lazy_bindings_at(pattern, source_name, build_parent, lazy_bindings) {
	if (pattern.type === 'ObjectPattern') {
		for (const prop of pattern.properties || []) {
			if (prop.type === 'RestElement') continue;
			const value = prop.value;
			const actual = value.type === 'AssignmentPattern' ? value.left : value;
			const key = prop.key;
			const computed = prop.computed || key.type !== 'Identifier';

			/** @type {(reference?: any) => any} */
			const build_self = (reference) =>
				b.member(
					build_parent(),
					computed || key.type !== 'Identifier'
						? { ...key }
						: create_generated_identifier(key.name, reference, reference?.name),
					computed,
				);

			if (actual.type === 'Identifier') {
				lazy_bindings.set(actual.name, { source_name, read: build_self });
			} else if (actual.type === 'ObjectPattern' || actual.type === 'ArrayPattern') {
				collect_lazy_bindings_at(actual, source_name, build_self, lazy_bindings);
			}
		}
	} else if (pattern.type === 'ArrayPattern') {
		for (let i = 0; i < (pattern.elements || []).length; i++) {
			const element = pattern.elements[i];
			if (!element) continue;
			if (element.type === 'RestElement') continue;
			const actual = element.type === 'AssignmentPattern' ? element.left : element;
			const index = i;

			/** @type {() => any} */
			const build_self = () => b.member(build_parent(), b.literal(index), true);

			if (actual.type === 'Identifier') {
				lazy_bindings.set(actual.name, { source_name, read: build_self });
			} else if (actual.type === 'ObjectPattern' || actual.type === 'ArrayPattern') {
				collect_lazy_bindings_at(actual, source_name, build_self, lazy_bindings);
			}
		}
	}
}

/**
 * Collect lazy bindings from statements at the top level of a block. Reads
 * already-allocated `lazy_id` values from pattern metadata. Handles both
 * `let &[x] = ...` variable declarations and statement-level `&[x] = expr;`
 * assignment expressions.
 *
 * @param {any[]} statements
 * @param {Map<string, LazyBinding>} lazy_bindings
 */
export function collect_lazy_bindings_from_statements(statements, lazy_bindings) {
	for (const stmt of statements || []) {
		if (stmt.type === 'VariableDeclaration') {
			for (const declarator of stmt.declarations || []) {
				visit_topmost_lazy_patterns(declarator.id, (lazy) => {
					if (!lazy.metadata?.lazy_id) return;
					collect_lazy_bindings(lazy, lazy.metadata.lazy_id, lazy_bindings);
				});
			}
		} else if (
			stmt.type === 'ExpressionStatement' &&
			stmt.expression?.type === 'AssignmentExpression' &&
			stmt.expression.operator === '='
		) {
			visit_topmost_lazy_patterns(stmt.expression.left, (lazy) => {
				if (!lazy.metadata?.lazy_id) return;
				collect_lazy_bindings(lazy, lazy.metadata.lazy_id, lazy_bindings);
			});
		}
	}
}

/**
 * Walk a destructure pattern tree, calling `visit` on every *topmost-lazy*
 * descendant — a lazy `ObjectPattern` / `ArrayPattern` with no lazy ancestor
 * within the same pattern tree. Descends through `AssignmentPattern`,
 * `RestElement`, and non-lazy `ObjectPattern` / `ArrayPattern`. Stops at lazy
 * patterns: their inner leaves are reached via accessor chains rooted at the
 * lazy pattern's synthesized id, not by further descent here.
 *
 * @param {any} pattern
 * @param {(node: any) => void} visit
 */
function visit_topmost_lazy_patterns(pattern, visit) {
	if (!pattern || typeof pattern !== 'object') return;
	if (pattern.type === 'AssignmentPattern') {
		visit_topmost_lazy_patterns(pattern.left, visit);
		return;
	}
	if (pattern.type === 'RestElement') {
		visit_topmost_lazy_patterns(pattern.argument, visit);
		return;
	}
	if (pattern.type !== 'ObjectPattern' && pattern.type !== 'ArrayPattern') return;

	if (pattern.lazy) {
		visit(pattern);
		return;
	}

	if (pattern.type === 'ObjectPattern') {
		for (const prop of pattern.properties || []) {
			if (prop.type === 'RestElement') visit_topmost_lazy_patterns(prop.argument, visit);
			else visit_topmost_lazy_patterns(prop.value, visit);
		}
	} else {
		for (const element of pattern.elements || []) {
			if (element) visit_topmost_lazy_patterns(element, visit);
		}
	}
}

/**
 * Build the replacement identifier for a lazy pattern. When `is_top` is true
 * (the pattern is itself a function parameter) we attach the original
 * `typeAnnotation`, synthesize an object-shaped annotation for untyped object
 * params so TypeScript sees prop names, and register source-mapping info.
 * Nested replacements (inside a non-lazy outer destructure) can't carry an
 * inline type annotation — that's not valid syntax — so they get a plain
 * identifier with just source-range info.
 *
 * @param {any} pattern
 * @param {boolean} is_top
 * @returns {any}
 */
function build_lazy_id_for_pattern(pattern, is_top) {
	const pattern_range = get_lazy_pattern_mapping_range(pattern);
	const lazy_id = pattern_range
		? create_generated_identifier(
				pattern.metadata.lazy_id,
				pattern_range,
				undefined,
				pattern_range.source_length,
			)
		: create_generated_identifier(pattern.metadata.lazy_id);
	if (!is_top) return lazy_id;
	if (pattern.typeAnnotation) {
		lazy_id.typeAnnotation = pattern.typeAnnotation;
	} else {
		const type_annotation = create_lazy_object_type_annotation(pattern);
		if (type_annotation) lazy_id.typeAnnotation = type_annotation;
	}
	set_lazy_param_binding_mappings(lazy_id, pattern);
	return lazy_id;
}

/**
 * Walk a destructure pattern tree and replace every topmost-lazy pattern with
 * its synthesized id identifier. Non-lazy outer patterns are preserved so a
 * source like `{ pair: &[a, b] }` becomes `{ pair: __lazy0 }`. The `is_top`
 * flag is true only when the caller is invoking on a position that itself
 * binds a single param (so a directly-lazy pattern can carry param-level type
 * info); recursive descent into child patterns passes `false`.
 *
 * @param {any} pattern
 * @param {boolean} [is_top]
 * @returns {any}
 */
function replace_lazy_in_pattern(pattern, is_top = true) {
	if (!pattern || typeof pattern !== 'object') return pattern;

	if (pattern.type === 'AssignmentPattern') {
		const new_left = replace_lazy_in_pattern(pattern.left, is_top);
		return new_left === pattern.left ? pattern : { ...pattern, left: new_left };
	}
	if (pattern.type === 'RestElement') {
		const new_arg = replace_lazy_in_pattern(pattern.argument, false);
		return new_arg === pattern.argument ? pattern : { ...pattern, argument: new_arg };
	}
	if (pattern.type !== 'ObjectPattern' && pattern.type !== 'ArrayPattern') return pattern;

	if (pattern.lazy && pattern.metadata?.lazy_id) {
		return build_lazy_id_for_pattern(pattern, is_top);
	}

	if (pattern.type === 'ObjectPattern') {
		let changed = false;
		const new_properties = (pattern.properties || []).map((/** @type {any} */ prop) => {
			if (prop.type === 'RestElement') {
				const new_arg = replace_lazy_in_pattern(prop.argument, false);
				if (new_arg === prop.argument) return prop;
				changed = true;
				return { ...prop, argument: new_arg };
			}
			const new_value = replace_lazy_in_pattern(prop.value, false);
			if (new_value === prop.value) return prop;
			changed = true;
			return { ...prop, value: new_value };
		});
		return changed ? { ...pattern, properties: new_properties } : pattern;
	}

	let changed = false;
	const new_elements = (pattern.elements || []).map((/** @type {any} */ element) => {
		if (!element) return element;
		const new_element = replace_lazy_in_pattern(element, false);
		if (new_element !== element) changed = true;
		return new_element;
	});
	return changed ? { ...pattern, elements: new_elements } : pattern;
}

/**
 * Walk the AST and pre-allocate `lazy_id` metadata on every lazy destructuring
 * pattern: function/component params, variable declarator ids, and statement-level
 * assignment LHS. Walks into non-lazy outer patterns to find nested lazy ones,
 * e.g. `{ pair: &[a, b] }` allocates an id for the inner `&[a, b]`. Idempotent:
 * skips patterns that already have a `lazy_id`.
 *
 * Also stamps `metadata.has_lazy_descendants = true` on every function-like
 * node whose subtree contains any lazy pattern, so `apply_lazy_transforms`
 * can take a constant-time early-return path for purely non-lazy functions.
 *
 * @param {any} root
 * @param {LazyContext} context
 */
export function preallocate_lazy_ids(root, context) {
	/** @param {any} pattern */
	const assign_id = (pattern) => {
		visit_topmost_lazy_patterns(pattern, (lazy) => {
			if (lazy.metadata?.lazy_id) return;
			lazy.metadata = { ...lazy.metadata, lazy_id: generate_lazy_id(context) };
		});
	};

	/**
	 * @param {any} node
	 * @returns {boolean} true if `node`'s subtree contains any lazy pattern.
	 */
	const visit = (node) => {
		if (!node || typeof node !== 'object') return false;
		if (Array.isArray(node)) {
			let found = false;
			for (const child of node) {
				if (visit(child)) found = true;
			}
			return found;
		}

		const is_function_like = is_function_or_component_node(node);

		if (is_function_like) {
			for (const param of node.params || []) {
				assign_id(param?.type === 'AssignmentPattern' ? param.left : param);
			}
		}

		if (node.type === 'VariableDeclarator') {
			assign_id(node.id);
		}

		if (
			node.type === 'ExpressionStatement' &&
			node.expression?.type === 'AssignmentExpression' &&
			node.expression.operator === '='
		) {
			assign_id(node.expression.left);
		}

		let found =
			(node.type === 'ObjectPattern' || node.type === 'ArrayPattern') && node.lazy === true;

		for (const key of Object.keys(node)) {
			if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') continue;
			if (visit(node[key])) found = true;
		}

		if (is_function_like && found) {
			node.metadata = { ...node.metadata, has_lazy_descendants: true };
		}

		return found;
	};

	visit(root);
}

/**
 * Recursively rewrite lazy-binding references in `node`.
 *
 * @param {any} node
 * @param {Map<string, LazyBinding>} lazy_bindings
 * @returns {any}
 */
export function apply_lazy_transforms(node, lazy_bindings) {
	if (!node || typeof node !== 'object') return node;
	if (Array.isArray(node)) return node.map((child) => apply_lazy_transforms(child, lazy_bindings));

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
	) {
		// Default parameter values are evaluated in the outer scope — transform them first.
		let params_changed = false;
		const new_params = (node.params || []).map((/** @type {any} */ param) => {
			const transformed = transform_param_defaults(param, lazy_bindings);
			if (transformed !== param) params_changed = true;
			return transformed;
		});

		/** @type {Set<string>} */
		const shadowed = new Set();
		for (const param of node.params || []) {
			collect_shadowed_names(param, lazy_bindings, shadowed);
		}

		const outer_minus_shadow =
			shadowed.size > 0 ? remove_shadowed(lazy_bindings, shadowed) : lazy_bindings;

		/** @type {Map<string, LazyBinding>} */
		const own_bindings = new Map();
		let had_lazy_param = false;
		for (const param of node.params || []) {
			visit_topmost_lazy_patterns(param, (lazy) => {
				if (!lazy.metadata?.lazy_id) return;
				had_lazy_param = true;
				collect_lazy_bindings(lazy, lazy.metadata.lazy_id, own_bindings);
			});
		}

		// Own bindings override any outer binding with the same name.
		const inner_bindings =
			own_bindings.size > 0
				? new Map([...outer_minus_shadow, ...own_bindings])
				: outer_minus_shadow;

		if (
			inner_bindings.size === 0 &&
			!params_changed &&
			!had_lazy_param &&
			!node.metadata?.has_lazy_descendants
		) {
			return node;
		}

		// Past the early-return: either we have active lazy bindings, lazy
		// params to replace, defaults referencing outer lazy, or the body
		// contains lazy descendants the BlockStatement handler will collect.
		// In every case the body needs to be walked.
		const new_body = apply_lazy_transforms(node.body, inner_bindings);

		const final_params_src = params_changed ? new_params : node.params;
		const final_params = had_lazy_param ? replace_lazy_params(final_params_src) : final_params_src;

		if (new_body !== node.body || final_params !== node.params) {
			return { ...node, params: final_params, body: new_body };
		}
		return node;
	}

	if (node.type === 'BlockStatement' || node.type === 'Program') {
		const block_bindings = collect_block_shadowed_names(node.body, lazy_bindings);
		const after_shadow =
			block_bindings.size > 0 ? remove_shadowed(lazy_bindings, block_bindings) : lazy_bindings;

		/** @type {Map<string, LazyBinding>} */
		const block_lazy = new Map();
		collect_lazy_bindings_from_statements(node.body, block_lazy);

		const effective_bindings =
			block_lazy.size > 0 ? new Map([...after_shadow, ...block_lazy]) : after_shadow;

		let changed = false;
		const new_body = node.body.map((/** @type {any} */ stmt) => {
			const transformed = apply_lazy_transforms(stmt, effective_bindings);
			if (transformed !== stmt) changed = true;
			return transformed;
		});
		return changed ? { ...node, body: new_body } : node;
	}

	if (node.type === 'CatchClause') {
		/** @type {Set<string>} */
		const shadowed = new Set();
		if (node.param) collect_shadowed_names(node.param, lazy_bindings, shadowed);
		const effective_bindings =
			shadowed.size > 0 ? remove_shadowed(lazy_bindings, shadowed) : lazy_bindings;
		const new_body = apply_lazy_transforms(node.body, effective_bindings);
		if (new_body !== node.body) return { ...node, body: new_body };
		return node;
	}

	if (node.type === 'ForStatement') {
		/** @type {Set<string>} */
		const shadowed = new Set();
		if (node.init?.type === 'VariableDeclaration') {
			for (const decl of node.init.declarations) {
				if (decl.id) collect_shadowed_names(decl.id, lazy_bindings, shadowed);
			}
		}
		const effective_bindings =
			shadowed.size > 0 ? remove_shadowed(lazy_bindings, shadowed) : lazy_bindings;
		let changed = false;
		const new_init = apply_lazy_transforms(node.init, effective_bindings);
		if (new_init !== node.init) changed = true;
		const new_test = apply_lazy_transforms(node.test, effective_bindings);
		if (new_test !== node.test) changed = true;
		const new_update = apply_lazy_transforms(node.update, effective_bindings);
		if (new_update !== node.update) changed = true;
		const new_body = apply_lazy_transforms(node.body, effective_bindings);
		if (new_body !== node.body) changed = true;
		return changed
			? { ...node, init: new_init, test: new_test, update: new_update, body: new_body }
			: node;
	}

	if (node.type === 'ForOfStatement' || node.type === 'ForInStatement') {
		/** @type {Set<string>} */
		const shadowed = new Set();
		if (node.left?.type === 'VariableDeclaration') {
			for (const decl of node.left.declarations) {
				if (decl.id) collect_shadowed_names(decl.id, lazy_bindings, shadowed);
			}
		}
		const effective_bindings =
			shadowed.size > 0 ? remove_shadowed(lazy_bindings, shadowed) : lazy_bindings;
		// `node.left` is a binding site, not an expression context: a declaration
		// like `const x` or `const [a, b]` has no outer references to rewrite,
		// and recursing here would hit the VariableDeclarator handler and
		// rewrite a lazy declarator id that `preallocate_lazy_ids` already
		// tagged — double-processing the loop variable. Leave `node.left`
		// untouched; the body and right-hand side are the only scopes with
		// live references.
		let changed = false;
		// The right-hand side is evaluated in the outer scope (before the loop
		// variable is bound), so use the unshadowed bindings there.
		const new_right = apply_lazy_transforms(node.right, lazy_bindings);
		if (new_right !== node.right) changed = true;
		const new_body = apply_lazy_transforms(node.body, effective_bindings);
		if (new_body !== node.body) changed = true;
		return changed ? { ...node, right: new_right, body: new_body } : node;
	}

	if (node.type === 'SwitchStatement') {
		let changed = false;
		const new_discriminant = apply_lazy_transforms(node.discriminant, lazy_bindings);
		if (new_discriminant !== node.discriminant) changed = true;
		const new_cases = node.cases.map((/** @type {any} */ switch_case) => {
			const case_bindings = collect_block_shadowed_names(switch_case.consequent, lazy_bindings);
			const effective_bindings =
				case_bindings.size > 0 ? remove_shadowed(lazy_bindings, case_bindings) : lazy_bindings;
			let case_changed = false;
			const new_test = switch_case.test
				? apply_lazy_transforms(switch_case.test, lazy_bindings)
				: null;
			if (new_test !== switch_case.test) case_changed = true;
			const new_consequent = switch_case.consequent.map((/** @type {any} */ stmt) => {
				const transformed = apply_lazy_transforms(stmt, effective_bindings);
				if (transformed !== stmt) case_changed = true;
				return transformed;
			});
			if (case_changed) {
				changed = true;
				return { ...switch_case, test: new_test, consequent: new_consequent };
			}
			return switch_case;
		});
		return changed ? { ...node, discriminant: new_discriminant, cases: new_cases } : node;
	}

	// Standalone lazy destructuring assignment: `&[data] = track(0);` becomes
	// `const __lazy0 = track(0);`. Individual name bindings are already in scope
	// via the enclosing BlockStatement handler.
	if (
		node.type === 'ExpressionStatement' &&
		node.expression?.type === 'AssignmentExpression' &&
		node.expression.operator === '=' &&
		(node.expression.left?.type === 'ObjectPattern' ||
			node.expression.left?.type === 'ArrayPattern') &&
		node.expression.left.lazy &&
		node.expression.left.metadata?.lazy_id
	) {
		const pattern = node.expression.left;
		const lazy_id = create_generated_identifier(pattern.metadata.lazy_id);
		if (pattern.typeAnnotation) lazy_id.typeAnnotation = pattern.typeAnnotation;
		const init = apply_lazy_transforms(node.expression.right, lazy_bindings);
		return b.const(lazy_id, init);
	}

	// Non-lazy outer assignment whose LHS contains nested lazy patterns:
	// `{ pair: &[a, b] } = obj` → `{ pair: __lazy0 } = obj`. JS reference
	// semantics carry writes from `__lazy0[0] = x` back into `obj.pair[0]`.
	if (
		node.type === 'ExpressionStatement' &&
		node.expression?.type === 'AssignmentExpression' &&
		node.expression.operator === '=' &&
		(node.expression.left?.type === 'ObjectPattern' ||
			node.expression.left?.type === 'ArrayPattern') &&
		!node.expression.left.lazy
	) {
		const new_left = replace_lazy_in_pattern(node.expression.left);
		if (new_left !== node.expression.left) {
			return {
				...node,
				expression: {
					...node.expression,
					left: new_left,
					right: apply_lazy_transforms(node.expression.right, lazy_bindings),
				},
			};
		}
	}

	// AssignmentExpression / UpdateExpression whose target is a lazy identifier.
	if (
		node.type === 'AssignmentExpression' &&
		node.left?.type === 'Identifier' &&
		lazy_bindings.has(node.left.name)
	) {
		const binding = /** @type {LazyBinding} */ (lazy_bindings.get(node.left.name));
		return {
			...node,
			left: binding.read(node.left),
			right: apply_lazy_transforms(node.right, lazy_bindings),
		};
	}

	if (
		node.type === 'UpdateExpression' &&
		node.argument?.type === 'Identifier' &&
		lazy_bindings.has(node.argument.name)
	) {
		const binding = /** @type {LazyBinding} */ (lazy_bindings.get(node.argument.name));
		return { ...node, argument: binding.read(node.argument) };
	}

	// Replace lazy variable declaration patterns with generated identifiers.
	if (node.type === 'VariableDeclarator' && node.id?.metadata?.lazy_id) {
		const lazy_id = create_generated_identifier(node.id.metadata.lazy_id);
		if (node.id.typeAnnotation) lazy_id.typeAnnotation = node.id.typeAnnotation;
		return {
			...node,
			id: lazy_id,
			init: apply_lazy_transforms(node.init, lazy_bindings),
		};
	}

	// Non-lazy outer declarator whose id contains nested lazy patterns:
	// `let { pair: &[a, b] } = data` → `let { pair: __lazy0 } = data`.
	if (
		node.type === 'VariableDeclarator' &&
		(node.id?.type === 'ObjectPattern' || node.id?.type === 'ArrayPattern') &&
		!node.id.lazy
	) {
		const new_id = replace_lazy_in_pattern(node.id);
		if (new_id !== node.id) {
			return {
				...node,
				id: new_id,
				init: apply_lazy_transforms(node.init, lazy_bindings),
			};
		}
	}

	// Shorthand object properties `{ name }` → `{ name: __lazy0.name }`.
	if (node.type === 'Property' && node.shorthand && node.value?.type === 'Identifier') {
		const binding = lazy_bindings.get(node.value.name);
		if (binding) {
			return { ...node, shorthand: false, value: binding.read(node.value) };
		}
	}

	// Bare identifier reference.
	if (node.type === 'Identifier' && lazy_bindings.has(node.name)) {
		const binding = /** @type {LazyBinding} */ (lazy_bindings.get(node.name));
		return binding.read(node);
	}

	// JSXIdentifier is a label (component/element name), never a reference.
	if (node.type === 'JSXIdentifier') return node;

	let changed = false;
	/** @type {any} */
	const clone = { ...node };
	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') continue;

		// Skip non-computed, non-shorthand property keys (they are labels).
		if (key === 'key' && node.type === 'Property' && !node.computed && !node.shorthand) continue;
		// Skip non-computed member expression property access.
		if (key === 'property' && node.type === 'MemberExpression' && !node.computed) continue;
		// Skip JSXMemberExpression property (label, not reference).
		if (key === 'property' && node.type === 'JSXMemberExpression') continue;
		// Skip JSXAttribute names (labels).
		if (key === 'name' && node.type === 'JSXAttribute') continue;
		// Skip VariableDeclarator id (already handled above).
		if (key === 'id' && node.type === 'VariableDeclarator') continue;

		const new_value = apply_lazy_transforms(node[key], lazy_bindings);
		if (new_value !== node[key]) {
			clone[key] = new_value;
			changed = true;
		}
	}
	return changed ? clone : node;
}

/**
 * @param {any} param
 * @param {Map<string, LazyBinding>} lazy_bindings
 */
function transform_param_defaults(param, lazy_bindings) {
	if (param?.type === 'AssignmentPattern') {
		const new_right = apply_lazy_transforms(param.right, lazy_bindings);
		if (new_right !== param.right) return { ...param, right: new_right };
	}
	return param;
}

/**
 * @param {any} pattern
 * @param {Map<string, LazyBinding>} lazy_bindings
 * @param {Set<string>} shadowed
 */
function collect_shadowed_names(pattern, lazy_bindings, shadowed) {
	if (!pattern || typeof pattern !== 'object') return;
	if (pattern.type === 'Identifier' && lazy_bindings.has(pattern.name)) {
		shadowed.add(pattern.name);
		return;
	}
	if (pattern.type === 'AssignmentPattern') {
		collect_shadowed_names(pattern.left, lazy_bindings, shadowed);
		return;
	}
	if (pattern.type === 'RestElement') {
		collect_shadowed_names(pattern.argument, lazy_bindings, shadowed);
		return;
	}
	if (pattern.type === 'ObjectPattern') {
		for (const prop of pattern.properties || []) {
			if (prop.type === 'RestElement') {
				collect_shadowed_names(prop.argument, lazy_bindings, shadowed);
			} else {
				collect_shadowed_names(prop.value, lazy_bindings, shadowed);
			}
		}
		return;
	}
	if (pattern.type === 'ArrayPattern') {
		for (const element of pattern.elements || []) {
			if (element) collect_shadowed_names(element, lazy_bindings, shadowed);
		}
	}
}

/**
 * @param {any[]} statements
 * @param {Map<string, LazyBinding>} lazy_bindings
 * @returns {Set<string>}
 */
function collect_block_shadowed_names(statements, lazy_bindings) {
	/** @type {Set<string>} */
	const shadowed = new Set();
	for (const stmt of statements) {
		if (stmt.type === 'VariableDeclaration') {
			for (const decl of stmt.declarations) {
				if (decl.id?.metadata?.lazy_id) continue;
				if (decl.id) collect_shadowed_names(decl.id, lazy_bindings, shadowed);
			}
		} else if (stmt.type === 'FunctionDeclaration' && stmt.id) {
			if (lazy_bindings.has(stmt.id.name)) shadowed.add(stmt.id.name);
		}
	}
	return shadowed;
}

/**
 * @param {Map<string, LazyBinding>} lazy_bindings
 * @param {Set<string>} shadowed
 * @returns {Map<string, LazyBinding>}
 */
function remove_shadowed(lazy_bindings, shadowed) {
	const result = new Map(lazy_bindings);
	for (const name of shadowed) result.delete(name);
	return result;
}

/**
 * Replace any lazy `&{}` / `&[]` patterns in a parameter list with their
 * generated lazy identifiers, including patterns nested inside non-lazy outer
 * patterns. For `({ pair: &[a, b] })` returns `({ pair: __lazy0 })`. Leaves
 * params without any lazy descendants untouched.
 *
 * @param {any[]} params
 * @returns {any[]}
 */
export function replace_lazy_params(params) {
	return params.map((param) => {
		if (param.type === 'AssignmentPattern') {
			const new_left = replace_lazy_in_pattern(param.left);
			return new_left === param.left ? param : { ...param, left: new_left };
		}
		return replace_lazy_in_pattern(param);
	});
}
