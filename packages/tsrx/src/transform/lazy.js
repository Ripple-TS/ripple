/** @import * as AST from 'estree' */

/**
 * Lazy destructuring transform — framework-agnostic.
 *
 * Shared between `@tsrx/react` and `@tsrx/solid`. Walks an AST and rewrites
 * references to names introduced by `&{ ... }` / `&[ ... ]` destructuring
 * patterns into member-expression accesses on a generated source identifier.
 *
 * Usage:
 *   1. Create a context with `createLazyContext()` (or provide any object with
 *      a `lazy_next_id: number` field).
 *   2. Run `preallocateLazyIds(root, context)` once over the full program to
 *      assign stable `metadata.lazy_id` values to every lazy pattern.
 *   3. For each function/component scope, collect bindings with
 *      `collectLazyBindingsFromComponent(params, body, context)` and pass the
 *      resulting map into `applyLazyTransforms(body, map)`.
 *   4. If a component declares lazy params, pass its params through
 *      `replaceLazyParams(params)` before emitting.
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
	const id = /** @type {any} */ ({ type: 'Identifier', name, metadata: { path: [] } });
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

		members.push({
			type: 'TSPropertySignature',
			key:
				key.type === 'Identifier'
					? create_generated_identifier(key.name, key)
					: set_source_location({ ...key, metadata: { path: [] } }, key),
			computed: false,
			optional: false,
			readonly: false,
			static: false,
			kind: 'init',
			typeAnnotation: {
				type: 'TSTypeAnnotation',
				typeAnnotation: {
					type: 'TSAnyKeyword',
					metadata: { path: [] },
				},
				metadata: { path: [] },
			},
			metadata: { path: [] },
		});
	}

	if (members.length === 0) return null;

	return {
		type: 'TSTypeAnnotation',
		typeAnnotation: {
			type: 'TSTypeLiteral',
			members,
			metadata: { path: [] },
		},
		metadata: { path: [] },
	};
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
 * For `&[a, b]` on source `S`, maps `a` → `S[0]`, `b` → `S[1]`. Handles nested
 * `AssignmentPattern` (default values); skips `RestElement`.
 *
 * @param {any} pattern
 * @param {string} source_name
 * @param {Map<string, LazyBinding>} lazy_bindings
 */
export function collect_lazy_bindings(pattern, source_name, lazy_bindings) {
	if (pattern.type === 'ObjectPattern') {
		for (const prop of pattern.properties || []) {
			if (prop.type === 'RestElement') continue;
			const value = prop.value;
			const actual = value.type === 'AssignmentPattern' ? value.left : value;
			if (actual.type === 'Identifier') {
				const key = prop.key;
				const computed = prop.computed || key.type !== 'Identifier';
				lazy_bindings.set(actual.name, {
					source_name,
					read: (reference) => ({
						type: 'MemberExpression',
						object: create_generated_identifier(source_name),
						property:
							computed || key.type !== 'Identifier'
								? { ...key }
								: create_generated_identifier(key.name, reference, reference?.name),
						computed,
						optional: false,
						metadata: { path: [] },
					}),
				});
			}
		}
	} else if (pattern.type === 'ArrayPattern') {
		for (let i = 0; i < (pattern.elements || []).length; i++) {
			const element = pattern.elements[i];
			if (!element) continue;
			if (element.type === 'RestElement') continue;
			const actual = element.type === 'AssignmentPattern' ? element.left : element;
			if (actual.type === 'Identifier') {
				const index = i;
				lazy_bindings.set(actual.name, {
					source_name,
					read: () => ({
						type: 'MemberExpression',
						object: create_generated_identifier(source_name),
						property: { type: 'Literal', value: index, raw: String(index), metadata: { path: [] } },
						computed: true,
						optional: false,
						metadata: { path: [] },
					}),
				});
			}
		}
	}
}

/**
 * Collect lazy bindings from a component's params and top-level body declarations.
 * Mutates each lazy pattern's `metadata.lazy_id` in place (idempotent if already set).
 *
 * @param {any[]} params
 * @param {any[]} body
 * @param {LazyContext} context
 * @returns {Map<string, LazyBinding>}
 */
export function collect_lazy_bindings_from_component(params, body, context) {
	/** @type {Map<string, LazyBinding>} */
	const lazy_bindings = new Map();

	for (const param of params) {
		const pattern = param.type === 'AssignmentPattern' ? param.left : param;
		if ((pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') && pattern.lazy) {
			const lazy_name = pattern.metadata?.lazy_id || generate_lazy_id(context);
			if (!pattern.metadata?.lazy_id) {
				pattern.metadata = { ...pattern.metadata, lazy_id: lazy_name };
			}
			collect_lazy_bindings(pattern, lazy_name, lazy_bindings);
		}
	}

	// VariableDeclaration lazy patterns already have their `lazy_id` assigned
	// by `preallocate_lazy_ids` (run once over the whole program by the target
	// transforms), so `collect_lazy_bindings_from_statements` handles them
	// alongside the expression-statement assignment form.
	collect_lazy_bindings_from_statements(body, lazy_bindings);

	return lazy_bindings;
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
				const pattern = declarator.id;
				if (
					(pattern?.type === 'ObjectPattern' || pattern?.type === 'ArrayPattern') &&
					pattern.lazy &&
					pattern.metadata?.lazy_id &&
					!lazy_bindings_contains(lazy_bindings, pattern)
				) {
					collect_lazy_bindings(pattern, pattern.metadata.lazy_id, lazy_bindings);
				}
			}
		} else if (
			stmt.type === 'ExpressionStatement' &&
			stmt.expression?.type === 'AssignmentExpression' &&
			stmt.expression.operator === '=' &&
			(stmt.expression.left?.type === 'ObjectPattern' ||
				stmt.expression.left?.type === 'ArrayPattern') &&
			stmt.expression.left.lazy &&
			stmt.expression.left.metadata?.lazy_id
		) {
			collect_lazy_bindings(
				stmt.expression.left,
				stmt.expression.left.metadata.lazy_id,
				lazy_bindings,
			);
		}
	}
}

/**
 * @param {Map<string, LazyBinding>} lazy_bindings
 * @param {any} pattern
 * @returns {boolean}
 */
function lazy_bindings_contains(lazy_bindings, pattern) {
	if (pattern.type === 'ObjectPattern') {
		for (const prop of pattern.properties || []) {
			if (prop.type === 'RestElement') continue;
			const value = prop.value;
			const actual = value?.type === 'AssignmentPattern' ? value.left : value;
			if (actual?.type === 'Identifier' && lazy_bindings.has(actual.name)) return true;
		}
	} else if (pattern.type === 'ArrayPattern') {
		for (const element of pattern.elements || []) {
			if (!element || element.type === 'RestElement') continue;
			const actual = element.type === 'AssignmentPattern' ? element.left : element;
			if (actual?.type === 'Identifier' && lazy_bindings.has(actual.name)) return true;
		}
	}
	return false;
}

/**
 * Walk the AST and pre-allocate `lazy_id` metadata on every lazy destructuring
 * pattern: function/component params, variable declarator ids, and statement-level
 * assignment LHS. Idempotent: skips patterns that already have a `lazy_id`.
 *
 * @param {any} root
 * @param {LazyContext} context
 */
export function preallocate_lazy_ids(root, context) {
	/** @param {any} pattern */
	const assign_id = (pattern) => {
		if (
			(pattern?.type === 'ObjectPattern' || pattern?.type === 'ArrayPattern') &&
			pattern.lazy &&
			!pattern.metadata?.lazy_id
		) {
			pattern.metadata = {
				...pattern.metadata,
				lazy_id: generate_lazy_id(context),
			};
		}
	};

	/** @param {any} node */
	const visit = (node) => {
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			for (const child of node) visit(child);
			return;
		}

		if (
			node.type === 'FunctionDeclaration' ||
			node.type === 'FunctionExpression' ||
			node.type === 'ArrowFunctionExpression' ||
			node.type === 'Component'
		) {
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

		for (const key of Object.keys(node)) {
			if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') continue;
			visit(node[key]);
		}
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
			const pattern = param?.type === 'AssignmentPattern' ? param.left : param;
			if (
				(pattern?.type === 'ObjectPattern' || pattern?.type === 'ArrayPattern') &&
				pattern.lazy &&
				pattern.metadata?.lazy_id
			) {
				had_lazy_param = true;
				collect_lazy_bindings(pattern, pattern.metadata.lazy_id, own_bindings);
			}
		}

		// Own bindings override any outer binding with the same name.
		const inner_bindings =
			own_bindings.size > 0
				? new Map([...outer_minus_shadow, ...own_bindings])
				: outer_minus_shadow;

		if (inner_bindings.size === 0 && !params_changed && !had_lazy_param) return node;

		const new_body =
			inner_bindings.size > 0 ? apply_lazy_transforms(node.body, inner_bindings) : node.body;

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
		return /** @type {any} */ ({
			type: 'VariableDeclaration',
			kind: 'const',
			declarations: [
				{
					type: 'VariableDeclarator',
					id: lazy_id,
					init,
					metadata: { path: [] },
				},
			],
			metadata: { path: [] },
		});
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
 * generated lazy identifiers. Leaves non-lazy params untouched.
 *
 * @param {any[]} params
 * @returns {any[]}
 */
export function replace_lazy_params(params) {
	return params.map((param) => {
		const pattern = param.type === 'AssignmentPattern' ? param.left : param;
		if (
			(pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') &&
			pattern.lazy &&
			pattern.metadata?.lazy_id
		) {
			const pattern_range = get_lazy_pattern_mapping_range(pattern);
			const lazy_id = pattern_range
				? create_generated_identifier(
						pattern.metadata.lazy_id,
						pattern_range,
						undefined,
						pattern_range.source_length,
					)
				: create_generated_identifier(pattern.metadata.lazy_id);
			if (pattern.typeAnnotation) {
				lazy_id.typeAnnotation = pattern.typeAnnotation;
			} else {
				const type_annotation = create_lazy_object_type_annotation(pattern);
				if (type_annotation) lazy_id.typeAnnotation = type_annotation;
			}
			set_lazy_param_binding_mappings(lazy_id, pattern);
			if (param.type === 'AssignmentPattern') return { ...param, left: lazy_id };
			return lazy_id;
		}
		return param;
	});
}
