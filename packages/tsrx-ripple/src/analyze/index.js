/** @import {AnalyzeOptions} from '../../types/index'  */
/**
@import {
	AnalysisResult,
	AnalysisState,
	AnalysisContext,
	Context,
	ScopeInterface,
	Visitors,
	Binding,
	TopScopedClasses,
} from '../../types/index';
 */
/**
@import * as AST from 'estree';
@import * as ESTreeJSX from 'estree-jsx';
*/

import {
	builders,
	createScopes,
	ScopeRoot,
	isVoidElement,
	extractPaths,
	analyzeCss,
	pruneCss,
	collectStyleRefAttributes,
	error,
	getReturnKeywordNode,
	isEventAttribute,
	isInsideComponent as is_inside_component,
	validateNesting,
	validateTsrxIfBreakStatement,
	validateTsrxIfContinueStatement,
	validateTsrxIfReturnStatement,
	validateTsrxLoopBreakStatement,
	validateTsrxLoopContinueStatement,
	validateTsrxLoopReturnStatement,
	validateTsrxReturnStatement,
	validateTsrxUnsupportedLoopStatement,
	isTemplateValuePosition,
} from '@tsrx/core';
const b = builders;
import { walk } from 'zimmerframe';
import {
	is_delegated_event,
	get_parent_block_node,
	is_element_dom_element,
	is_ripple_track_call,
	is_children_template_expression as is_children_template_expression_in_scope,
	normalize_children,
	is_binding_function,
	strong_hash,
	tracked_get,
	build_lazy_array_get,
	build_lazy_array_rest,
	build_lazy_array_set,
	build_lazy_array_update,
	collect_tsrx_stylesheet,
	get_native_tsrx_function_body,
	is_native_tsrx_template_node,
	is_native_tsrx_function_node,
	is_tsrx_component_function,
} from '../utils.js';
import is_reference from 'is-reference';

const valid_in_head = new Set(['title', 'base', 'link', 'meta', 'style', 'script', 'noscript']);

const TRACKED_INDEX_VALUE_ERROR =
	'Do not access tracked values with [0]. Use .value or &[] lazy destructuring instead. Numeric tracked access leads to degraded performance.';
const TRACKED_INDEX_REFERENCE_ERROR =
	'Do not access tracked values with [1]. Use the tracked value directly instead. Numeric tracked access leads to degraded performance.';

/**
 * Ripple analysis still works with internal Element nodes after parser
 * normalization. Keep that compatibility local by presenting those nodes to the
 * shared CSS pruner as native JSX only during pruning.
 *
 * @param {AST.Node[]} nodes
 * @returns {() => void}
 */
function prepare_legacy_nodes_for_css_pruning(nodes) {
	/** @type {{ node: any, type: string, native_tsrx: unknown, had_native_tsrx: boolean }[]} */
	const changed = [];
	const seen = new Set();

	/** @param {any} node */
	function visit(node) {
		if (!node || typeof node !== 'object' || seen.has(node)) {
			return;
		}
		seen.add(node);

		if (node.type === 'Element') {
			node.metadata ??= { path: [] };
			changed.push({
				node,
				type: node.type,
				native_tsrx: node.metadata.native_tsrx,
				had_native_tsrx: Object.prototype.hasOwnProperty.call(node.metadata, 'native_tsrx'),
			});
			node.type = 'JSXElement';
			node.metadata.native_tsrx = true;
		}

		if (Array.isArray(node.children)) {
			for (const child of node.children) {
				visit(child);
			}
		}
	}

	for (const node of nodes) {
		visit(node);
	}

	return () => {
		for (let i = changed.length - 1; i >= 0; i--) {
			const entry = changed[i];
			entry.node.type = entry.type;
			if (entry.had_native_tsrx) {
				entry.node.metadata.native_tsrx = entry.native_tsrx;
			} else {
				delete entry.node.metadata.native_tsrx;
			}
		}
	};
}

/**
 * Scope creation lives in @tsrx/core and only understands JSX-shaped native
 * TSRX nodes. Ripple still normalizes to internal Element/TsrxFragment nodes
 * before analysis, so present them as JSX only while scopes are created.
 *
 * @param {AST.Node} node
 * @returns {() => void}
 */
function prepare_legacy_nodes_for_core_scopes(node) {
	/** @type {{ node: any, type: string, native_tsrx: unknown, had_native_tsrx: boolean }[]} */
	const changed = [];
	const seen = new Set();

	/** @param {any} current */
	function visit(current) {
		if (!current || typeof current !== 'object' || seen.has(current)) {
			return;
		}
		seen.add(current);

		if (current.type === 'Element' || current.type === 'TsrxFragment') {
			current.metadata ??= { path: [] };
			changed.push({
				node: current,
				type: current.type,
				native_tsrx: current.metadata.native_tsrx,
				had_native_tsrx: Object.prototype.hasOwnProperty.call(current.metadata, 'native_tsrx'),
			});
			current.type = current.type === 'Element' ? 'JSXElement' : 'JSXFragment';
			current.metadata.native_tsrx = true;
		}

		for (const key in current) {
			if (key === 'parent' || key === 'loc' || key === 'range' || key === 'metadata') {
				continue;
			}
			const value = current[key];
			if (Array.isArray(value)) {
				for (const child of value) {
					visit(child);
				}
			} else if (value && typeof value === 'object') {
				visit(value);
			}
		}
	}

	visit(node);

	return () => {
		for (let i = changed.length - 1; i >= 0; i--) {
			const entry = changed[i];
			entry.node.type = entry.type;
			if (entry.had_native_tsrx) {
				entry.node.metadata.native_tsrx = entry.native_tsrx;
			} else {
				delete entry.node.metadata.native_tsrx;
			}
		}
	};
}

const mutating_method_names = new Set([
	'add',
	'append',
	'clear',
	'copyWithin',
	'delete',
	'fill',
	'pop',
	'push',
	'reverse',
	'set',
	'shift',
	'sort',
	'splice',
	'unshift',
]);

const TEMPLATE_FRAGMENT_ERROR =
	'JSX fragment syntax is not needed in TSRX templates. TSRX renders in immediate mode, so everything is already a fragment. Use `<>...</>` only in expression position.';

/**
 * @param {AST.MemberExpression} node
 * @returns {string | null}
 */
function get_member_name(node) {
	if (!node.computed && node.property.type === 'Identifier') {
		return node.property.name;
	}

	if (node.computed && node.property.type === 'Literal') {
		return typeof node.property.value === 'string' ? node.property.value : null;
	}

	return null;
}

/**
 * @param {AST.ImportDeclaration} node
 * @returns {string | null}
 */
function get_submodule_import_source_name(node) {
	const source = /** @type {AST.Literal | AST.Identifier} */ (node.source);
	return source.type === 'Identifier' ? source.name : null;
}

/**
 * @param {AST.Node} node
 * @returns {string | null}
 */
function get_module_declaration_name(node) {
	if (node.type !== 'TSModuleDeclaration') {
		return null;
	}
	const id = /** @type {AST.TSModuleDeclaration} */ (node).id;
	return id?.type === 'Identifier' ? id.name : null;
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_submodule_declaration(node) {
	return node.type === 'TSModuleDeclaration' && node.metadata?.module_keyword === 'module';
}

/**
 * @param {AST.ImportSpecifier} specifier
 * @returns {string | null}
 */
function get_imported_name(specifier) {
	const imported = specifier.imported;
	if (imported.type === 'Identifier') {
		return imported.name;
	}
	if (imported.type === 'Literal' && typeof imported.value === 'string') {
		return imported.value;
	}
	return null;
}

/**
 * @param {AST.CallExpression} node
 * @returns {boolean}
 */
function is_mutating_call_expression(node) {
	return (
		node.callee.type === 'MemberExpression' &&
		mutating_method_names.has(get_member_name(node.callee) ?? '')
	);
}

/**
 * Check if an expression contains side effects or other impure operations.
 * Template expressions should be pure reads.
 * @param {AST.Expression | AST.SpreadElement | AST.Super | AST.Pattern} node
 * @returns {boolean}
 */
function expression_has_side_effects(node) {
	switch (node.type) {
		case 'AssignmentExpression':
		case 'UpdateExpression':
			return true;
		case 'SequenceExpression':
			return node.expressions.some(expression_has_side_effects);
		case 'ConditionalExpression':
			return (
				expression_has_side_effects(node.test) ||
				expression_has_side_effects(node.consequent) ||
				expression_has_side_effects(node.alternate)
			);
		case 'LogicalExpression':
		case 'BinaryExpression':
			return (
				expression_has_side_effects(/** @type {AST.Expression} */ (node.left)) ||
				expression_has_side_effects(node.right)
			);
		case 'UnaryExpression':
			// delete operator has side effects (removes object properties)
			if (node.operator === 'delete') return true;
			return expression_has_side_effects(node.argument);
		case 'AwaitExpression':
			return expression_has_side_effects(node.argument);
		case 'ChainExpression':
			return expression_has_side_effects(node.expression);
		case 'MemberExpression':
			return (
				expression_has_side_effects(node.object) ||
				(node.computed &&
					expression_has_side_effects(/** @type {AST.Expression} */ (node.property)))
			);
		case 'CallExpression':
			return (
				is_mutating_call_expression(node) ||
				expression_has_side_effects(node.callee) ||
				node.arguments.some(expression_has_side_effects)
			);
		case 'NewExpression':
			return (
				expression_has_side_effects(node.callee) || node.arguments.some(expression_has_side_effects)
			);
		case 'TemplateLiteral':
			return node.expressions.some(expression_has_side_effects);
		case 'TaggedTemplateExpression':
			return (
				expression_has_side_effects(node.tag) ||
				node.quasi.expressions.some(expression_has_side_effects)
			);
		case 'ArrayExpression':
			return node.elements.some((el) => el !== null && expression_has_side_effects(el));
		case 'ObjectExpression':
			return node.properties.some((prop) =>
				prop.type === 'SpreadElement'
					? expression_has_side_effects(prop.argument)
					: expression_has_side_effects(prop.value) ||
						(prop.computed &&
							expression_has_side_effects(/** @type {AST.Expression} */ (prop.key))),
			);
		case 'SpreadElement':
			return expression_has_side_effects(node.argument);
		default:
			return false;
	}
}

/**
 * @param {AnalysisContext['path']} path
 * @param {AST.Node} node The visited template node (element/fragment/text/expression).
 */
function mark_control_flow_has_template(path, node) {
	let child = node;
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];

		// Once the chain crosses into a value slot, the originating template node
		// is captured as a value rather than rendered, so it must not propagate
		// `has_template` to any enclosing control-flow statement.
		if (isTemplateValuePosition(node, child)) {
			return;
		}

		if (
			node.type === 'FunctionExpression' ||
			node.type === 'ArrowFunctionExpression' ||
			node.type === 'FunctionDeclaration'
		) {
			break;
		}
		if (
			node.type === 'ForStatement' ||
			node.type === 'ForInStatement' ||
			node.type === 'ForOfStatement' ||
			node.type === 'TryStatement' ||
			node.type === 'IfStatement' ||
			node.type === 'SwitchStatement' ||
			node.type === 'TsrxFragment'
		) {
			node.metadata.has_template = true;
		}

		child = node;
	}
}

/**
 * @param {AST.Node | null | undefined} node
 * @returns {boolean}
 */
function is_script_only_control_flow_body(node) {
	return node?.metadata?.script_only === true;
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_function_or_class_boundary(node) {
	return (
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression' ||
		node.type === 'FunctionDeclaration' ||
		node.type === 'ClassExpression' ||
		node.type === 'ClassDeclaration'
	);
}

/**
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_loop_statement(node) {
	return (
		node.type === 'ForOfStatement' ||
		node.type === 'ForStatement' ||
		node.type === 'ForInStatement' ||
		node.type === 'WhileStatement' ||
		node.type === 'DoWhileStatement'
	);
}

/**
 * @param {AnalysisContext['path']} path
 * @returns {boolean}
 */
function is_inside_component_for_of(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node)) {
			return false;
		}
		if (node.type === 'ForOfStatement' || node.type === 'JSXForExpression') {
			return true;
		}
	}
	return false;
}

/**
 * @param {AnalysisContext['path']} path
 * @returns {boolean}
 */
function is_inside_template_if(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node)) {
			return false;
		}
		if (node.type === 'IfStatement' && node.metadata?.tsrxDirective === 'if') {
			return true;
		}
		if (node.type === 'IfStatement' && /** @type {any} */ (node).statementType === 'IfStatement') {
			return true;
		}
		if (node.type === 'JSXIfExpression') {
			return true;
		}
	}
	return false;
}

/**
 * @param {AnalysisContext['path']} path
 * @returns {boolean}
 */
function is_inside_template_child(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node)) {
			return false;
		}
		if (node.type === 'Element' || node.type === 'TsrxFragment') {
			return true;
		}
	}
	return false;
}

/**
 * @param {AnalysisContext['path']} path
 * @returns {boolean}
 */
function break_targets_component_loop(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node)) {
			return false;
		}
		if (node.type === 'SwitchStatement') {
			return false;
		}
		if (is_loop_statement(node)) {
			return true;
		}
	}
	return false;
}

/**
 * @param {AnalysisContext['path']} path
 */
function mark_control_flow_has_continue(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];
		if (is_function_or_class_boundary(node)) {
			break;
		}
		if (is_loop_statement(node)) {
			break;
		}
		if (node.type === 'IfStatement' || node.type === 'SwitchStatement') {
			node.metadata.has_continue = true;
		}
	}
}

/**
 * Set up lazy destructuring transforms for bindings extracted from a lazy pattern.
 * Converts each destructured identifier into a binding that lazily accesses properties
 * on the source identifier (e.g., `a` → `source.a` for object, `a` → `source[0]` for array).
 * @param {AST.ObjectPattern | AST.ArrayPattern} pattern - The destructuring pattern with lazy: true
 * @param {AST.Identifier} source_id - The identifier to access properties on
 * @param {AnalysisState} state - The analysis state
 * @param {boolean} writable - Whether assignments/updates should be supported (let vs const)
 * @param {boolean} is_track_call - Whether the RHS is a Ripple track() call
 */
function setup_lazy_transforms(pattern, source_id, state, writable, is_track_call) {
	// For ArrayPattern from track() calls, use direct get/set calls as a fast path
	// instead of going through prototype getters source[0]/source[1]
	if (pattern.type === 'ArrayPattern' && is_track_call) {
		setup_tracked_lazy_array_transforms(pattern, source_id, state, writable);
		return;
	}

	if (pattern.type === 'ArrayPattern') {
		setup_lazy_array_transforms(pattern, source_id, state, writable);
		return;
	}

	const paths = extractPaths(pattern);

	for (const path of paths) {
		const name = /** @type {AST.Identifier} */ (path.node).name;
		const binding = state.scope.get(name);

		if (binding !== null) {
			const has_fallback = path.has_default_value;
			binding.kind = has_fallback ? 'lazy_fallback' : 'lazy';

			binding.transform = {
				read: (_) => {
					return path.expression(source_id);
				},
			};

			if (writable) {
				binding.transform.assign = (node, value) => {
					return b.assignment(
						'=',
						/** @type {AST.MemberExpression} */ (path.update_expression(source_id)),
						value,
					);
				};

				if (has_fallback) {
					// For bindings with default values, generate proper fallback-aware update
					// e.g., count++ with default 0 becomes:
					// (() => { var _v = _$_.fallback(obj.count, 0); obj.count = _v + 1; return _v; })() for postfix
					// (obj.count = _$_.fallback(obj.count, 0) + 1) for prefix
					binding.transform.update = (node) => {
						const member = path.update_expression(source_id);
						const fallback_read = path.expression(source_id);
						const delta = node.operator === '++' ? b.literal(1) : b.literal(-1);

						if (node.prefix) {
							// ++count: return new value
							return b.assignment(
								'=',
								/** @type {AST.Pattern} */ (member),
								b.binary('+', fallback_read, delta),
							);
						} else {
							// count++: return old value, write new value
							// Use IIFE to declare temp variable
							const temp = b.id('_v');
							return b.call(
								b.arrow(
									[],
									b.block([
										b.var(temp, fallback_read),
										b.stmt(
											b.assignment(
												'=',
												/** @type {AST.Pattern} */ (member),
												b.binary('+', temp, delta),
											),
										),
										b.return(temp),
									]),
								),
							);
						}
					};
				} else {
					binding.transform.update = (node) =>
						b.update(node.operator, path.update_expression(source_id), node.prefix);
				}
			}
		}
	}
}

/**
 * @param {AST.RestElement} element
 * @param {AST.Identifier} source_id
 * @param {number} index
 * @param {AnalysisState} state
 */
function setup_lazy_array_rest_transform(element, source_id, index, state) {
	const rest_source = build_lazy_array_rest(source_id, index);

	if (element.argument.type === 'Identifier') {
		const binding = state.scope.get(element.argument.name);
		if (binding !== null) {
			binding.kind = 'lazy';
			binding.metadata = {
				...binding.metadata,
				lazy_array_rest: true,
			};
			binding.transform = {
				read: (_) => rest_source,
			};
		}
		return;
	}

	const rest_paths = extractPaths(element.argument);
	for (const path of rest_paths) {
		const name = /** @type {AST.Identifier} */ (path.node).name;
		const binding = state.scope.get(name);
		if (binding !== null) {
			binding.kind = path.has_default_value ? 'lazy_fallback' : 'lazy';
			binding.transform = {
				read: (_) => path.expression(/** @type {AST.CallExpression} */ (rest_source)),
			};
		}
	}
}

/**
 * Set up fast-path transforms for lazy array destructuring of tracked values.
 * For index 0 (the value): uses direct tracked get/set/update helpers instead of source[0] getters.
 * For index 1 (the tracked ref): returns source directly instead of source[1].
 * @param {AST.ArrayPattern} pattern - The array destructuring pattern
 * @param {AST.Identifier} source_id - The identifier for the tracked value
 * @param {AnalysisState} state - The analysis state
 * @param {boolean} writable - Whether assignments/updates should be supported
 */
function setup_tracked_lazy_array_transforms(pattern, source_id, state, writable) {
	for (let i = 0; i < pattern.elements.length; i++) {
		const element = pattern.elements[i];
		if (!element) continue;

		if (element.type === 'RestElement') {
			setup_lazy_array_rest_transform(element, source_id, i, state);
			continue;
		}

		const actual = element.type === 'AssignmentPattern' ? element.left : element;
		const has_fallback = element.type === 'AssignmentPattern';
		/** @type {AST.Expression | null}	 */
		const fallback_value = has_fallback
			? /** @type {AST.AssignmentPattern} */ (element).right
			: null;

		if (actual.type === 'Identifier' && i <= 1) {
			const name = actual.name;
			const binding = state.scope.get(name);
			if (binding === null) continue;

			binding.kind = has_fallback ? 'lazy_fallback' : 'lazy';
			binding.metadata = {
				...binding.metadata,
				lazy_array_source: source_id.name,
				lazy_array_index: i,
				lazy_array_source_tracked: true,
			};

			if (i === 0) {
				// Fast path for index 0: use source.value instead of source[0]
				const read_expr = has_fallback
					? () =>
							b.call(
								'_$_.fallback',
								tracked_get(source_id),
								/** @type {AST.Expression} */ (fallback_value),
							)
					: () => tracked_get(source_id);

				// Signal that read already produces an unwrapped value.
				binding.read_unwraps = true;

				binding.transform = {
					read: (_) => read_expr(),
				};

				if (writable) {
					binding.transform.assign = (_, value) => {
						return b.call('_$_.set', source_id, value);
					};

					if (has_fallback) {
						binding.transform.update = (node) => {
							const delta = node.operator === '++' ? b.literal(1) : b.literal(-1);
							const temp = b.id('_v');

							if (node.prefix) {
								// ++count: compute new value and set it, return new value
								return b.call(
									b.arrow(
										[],
										b.block([
											b.var(temp, b.binary('+', read_expr(), delta)),
											b.stmt(b.call('_$_.set', source_id, temp)),
											b.return(temp),
										]),
									),
								);
							} else {
								// count++: read old value, set new value, return old value
								return b.call(
									b.arrow(
										[],
										b.block([
											b.var(temp, read_expr()),
											b.stmt(b.call('_$_.set', source_id, b.binary('+', temp, delta))),
											b.return(temp),
										]),
									),
								);
							}
						};
					} else {
						binding.transform.update = (node) => {
							const fn_name = node.prefix ? '_$_.update_pre' : '_$_.update';
							/** @type {AST.Expression[]} */
							const args = [source_id];
							if (node.operator === '--') {
								args.push(b.literal(-1));
							}
							return b.call(fn_name, ...args);
						};
					}
				}
			} else {
				// Fast path for index 1: source itself is the tracked ref
				binding.transform = {
					read: (_) => source_id,
				};
			}
		} else {
			// Nested patterns or indices > 1: fall back to generic source[i] access via extract_paths
			/** @type {(object: AST.Expression) => AST.Expression} */
			const base_expression =
				i === 0
					? (object) => tracked_get(object)
					: i === 1
						? (object) => object
						: (object) => b.member(object, b.literal(i), true);

			const inner_paths = extractPaths(element);
			for (const path of inner_paths) {
				const name = /** @type {AST.Identifier} */ (path.node).name;
				const binding = state.scope.get(name);
				if (binding === null) continue;

				binding.kind = path.has_default_value ? 'lazy_fallback' : 'lazy';

				binding.transform = {
					read: (_) =>
						path.expression(
							/** @type {AST.Identifier | AST.CallExpression} */ (base_expression(source_id)),
						),
				};

				if (writable) {
					binding.transform.assign = (node, value) => {
						return b.assignment(
							'=',
							/** @type {AST.MemberExpression} */ (
								path.update_expression(/** @type {AST.Identifier} */ (base_expression(source_id)))
							),
							value,
						);
					};

					if (path.has_default_value) {
						binding.transform.update = (node) => {
							const member = path.update_expression(
								/** @type {AST.Identifier} */ (base_expression(source_id)),
							);
							const fallback_read = path.expression(
								/** @type {AST.Identifier | AST.CallExpression} */ (base_expression(source_id)),
							);
							const delta = node.operator === '++' ? b.literal(1) : b.literal(-1);

							if (node.prefix) {
								return b.assignment(
									'=',
									/** @type {AST.Pattern} */ (member),
									b.binary('+', fallback_read, delta),
								);
							} else {
								const temp = b.id('_v');
								return b.call(
									b.arrow(
										[],
										b.block([
											b.var(temp, fallback_read),
											b.stmt(
												b.assignment(
													'=',
													/** @type {AST.Pattern} */ (member),
													b.binary('+', temp, delta),
												),
											),
											b.return(temp),
										]),
									),
								);
							}
						};
					} else {
						binding.transform.update = (node) =>
							b.update(
								node.operator,
								path.update_expression(/** @type {AST.Identifier} */ (base_expression(source_id))),
								node.prefix,
							);
					}
				}
			}
		}
	}
}

/**
 * Set up lazy array destructuring transforms when the source may be either a
 * plain lazy array or a tracked value.
 * @param {AST.ArrayPattern} pattern
 * @param {AST.Identifier} source_id
 * @param {AnalysisState} state
 * @param {boolean} writable
 */
function setup_lazy_array_transforms(pattern, source_id, state, writable) {
	for (let i = 0; i < pattern.elements.length; i++) {
		const element = pattern.elements[i];
		if (!element) continue;

		if (element.type === 'RestElement') {
			setup_lazy_array_rest_transform(element, source_id, i, state);
			continue;
		}

		const actual = element.type === 'AssignmentPattern' ? element.left : element;
		const has_fallback = element.type === 'AssignmentPattern';
		/** @type {AST.Expression | null} */
		const fallback_value = has_fallback
			? /** @type {AST.AssignmentPattern} */ (element).right
			: null;

		if (actual.type === 'Identifier') {
			const binding = state.scope.get(actual.name);
			if (binding === null) continue;

			const read_expr = has_fallback
				? () =>
						b.call(
							'_$_.fallback',
							build_lazy_array_get(source_id, i),
							/** @type {AST.Expression} */ (fallback_value),
						)
				: () => build_lazy_array_get(source_id, i);

			binding.kind = has_fallback ? 'lazy_fallback' : 'lazy';
			binding.read_unwraps = true;
			binding.metadata = {
				...binding.metadata,
				lazy_array_source: source_id.name,
				lazy_array_index: i,
				lazy_array_source_tracked: false,
			};
			binding.transform = {
				read: (_) => read_expr(),
			};

			if (writable) {
				binding.transform.assign = (_, value) => build_lazy_array_set(source_id, value, i);
				binding.transform.update = (node) =>
					build_lazy_array_update(source_id, i, node.prefix, node.operator === '--' ? -1 : 1);
			}
			continue;
		}

		const base_expression = /** @type {(object: AST.Expression) => AST.Expression} */ (
			(object) => build_lazy_array_get(object, i)
		);
		const inner_paths = extractPaths(element);
		for (const path of inner_paths) {
			const name = /** @type {AST.Identifier} */ (path.node).name;
			const binding = state.scope.get(name);
			if (binding === null) continue;

			binding.kind = path.has_default_value ? 'lazy_fallback' : 'lazy';
			binding.transform = {
				read: (_) =>
					path.expression(
						/** @type {AST.Identifier | AST.CallExpression} */ (base_expression(source_id)),
					),
			};
		}
	}
}

/**
 * @param {AST.MemberExpression} node
 * @returns {0 | 1 | null}
 */
function get_tracked_numeric_index(node) {
	return node.computed &&
		node.property.type === 'Literal' &&
		(node.property.value === 0 || node.property.value === 1)
		? /** @type {0 | 1} */ (node.property.value)
		: null;
}

/**
 * @param {0 | 1} index
 * @returns {string}
 */
function get_tracked_numeric_index_error(index) {
	return index === 0 ? TRACKED_INDEX_VALUE_ERROR : TRACKED_INDEX_REFERENCE_ERROR;
}

/**
 * @param {Binding | null} binding
 * @param {AnalysisContext} context
 * @returns {boolean}
 */
function is_known_tracked_binding(binding, context) {
	return (
		binding !== null &&
		binding.kind !== 'lazy' &&
		binding.kind !== 'lazy_fallback' &&
		binding.initial?.type === 'CallExpression' &&
		is_ripple_track_call(binding.initial.callee, context) !== null
	);
}

/**
 * @param {Binding | null} binding
 * @returns {boolean}
 */
function is_known_tracked_lazy_ref_binding(binding) {
	return (
		binding !== null &&
		(binding.kind === 'lazy' || binding.kind === 'lazy_fallback') &&
		binding.metadata?.lazy_array_source_tracked === true &&
		binding.metadata.lazy_array_index === 1
	);
}

/**
 * @param {AST.Pattern} pattern
 * @returns {AST.TypeNode | undefined}
 */
function get_pattern_type_annotation(pattern) {
	return pattern.typeAnnotation?.typeAnnotation;
}

/**
 * @param {AST.TypeNode | undefined} type_annotation
 * @returns {AST.TypeNode | undefined}
 */
function unwrap_type_annotation(type_annotation) {
	/** @type {AST.TypeNode | undefined} */
	let annotation = type_annotation;

	while (annotation) {
		if (annotation.type === 'TSParenthesizedType') {
			annotation = /** @type {AST.TypeNode | undefined} */ (annotation.typeAnnotation);
			continue;
		}
		if (annotation.type === 'TSOptionalType') {
			annotation = /** @type {AST.TypeNode | undefined} */ (annotation.typeAnnotation);
			continue;
		}
		break;
	}

	return annotation;
}

/**
 * @param {AST.TypeNode} type_annotation
 * @returns {AST.TypeNode}
 */
function normalize_tuple_element_type(type_annotation) {
	/** @type {AST.TypeNode} */
	let annotation = type_annotation;

	while (true) {
		if (annotation.type === 'TSNamedTupleMember') {
			annotation = annotation.elementType;
			continue;
		}
		if (annotation.type === 'TSParenthesizedType') {
			annotation = /** @type {AST.TypeNode} */ (annotation.typeAnnotation);
			continue;
		}
		if (annotation.type === 'TSOptionalType') {
			annotation = /** @type {AST.TypeNode} */ (annotation.typeAnnotation);
			continue;
		}
		break;
	}

	return annotation;
}

/**
 * @param {AST.Expression} key
 * @returns {string | null}
 */
function get_object_pattern_key_name(key) {
	if (key.type === 'Identifier') {
		return key.name;
	}
	if (key.type === 'Literal' && (typeof key.value === 'string' || typeof key.value === 'number')) {
		return String(key.value);
	}
	return null;
}

/**
 * @param {AST.PropertyNameNonComputed} key
 * @returns {string | null}
 */
function get_type_property_key_name(key) {
	if (key.type === 'Identifier') {
		return key.name;
	}
	if (key.type === 'Literal' && (typeof key.value === 'string' || typeof key.value === 'number')) {
		return String(key.value);
	}
	return null;
}

/**
 * @param {AST.TypeNode | undefined} type_annotation
 * @param {AST.Property | AST.RestElement} property
 * @returns {AST.TypeNode | undefined}
 */
function get_object_property_type_annotation(type_annotation, property) {
	if (property.type === 'RestElement' || property.computed) {
		return undefined;
	}

	const object_type_annotation = unwrap_type_annotation(type_annotation);
	if (object_type_annotation?.type !== 'TSTypeLiteral') {
		return undefined;
	}

	const key_name = get_object_pattern_key_name(/** @type {AST.Expression} */ (property.key));
	if (key_name === null) {
		return undefined;
	}

	for (const member of object_type_annotation.members) {
		if (member.type !== 'TSPropertySignature' || member.computed) {
			continue;
		}
		const member_key_name = get_type_property_key_name(member.key);
		if (member_key_name === key_name) {
			return member.typeAnnotation?.typeAnnotation;
		}
	}

	return undefined;
}

/**
 * @param {AST.TypeNode | undefined} type_annotation
 * @param {number} index
 * @param {boolean} is_rest
 * @returns {AST.TypeNode | undefined}
 */
function get_array_element_type_annotation(type_annotation, index, is_rest) {
	const array_type_annotation = unwrap_type_annotation(type_annotation);

	if (array_type_annotation?.type === 'TSArrayType') {
		return array_type_annotation.elementType;
	}
	if (array_type_annotation?.type !== 'TSTupleType') {
		return undefined;
	}

	if (is_rest) {
		for (let i = array_type_annotation.elementTypes.length - 1; i >= 0; i -= 1) {
			const element_type = normalize_tuple_element_type(array_type_annotation.elementTypes[i]);
			if (element_type.type === 'TSRestType') {
				return element_type.typeAnnotation;
			}
		}
		return undefined;
	}

	if (index < array_type_annotation.elementTypes.length) {
		const element_type = normalize_tuple_element_type(array_type_annotation.elementTypes[index]);
		if (element_type.type === 'TSRestType') {
			const rest_type_annotation = unwrap_type_annotation(element_type.typeAnnotation);
			return rest_type_annotation?.type === 'TSArrayType'
				? rest_type_annotation.elementType
				: element_type.typeAnnotation;
		}
		return element_type;
	}

	const last_element = array_type_annotation.elementTypes.at(-1);
	if (!last_element) {
		return undefined;
	}
	const normalized_last_element = normalize_tuple_element_type(last_element);
	if (normalized_last_element.type === 'TSRestType') {
		const rest_type_annotation = unwrap_type_annotation(normalized_last_element.typeAnnotation);
		return rest_type_annotation?.type === 'TSArrayType'
			? rest_type_annotation.elementType
			: normalized_last_element.typeAnnotation;
	}

	return undefined;
}

/**
 * Checks if a parameter source has a Tracked<T> type annotation imported from ripple.
 * This is used to determine if lazy array destructuring should use the track tuple fast path.
 * @param {AST.TypeNode | undefined} type_annotation - The source type annotation
 * @param {AnalysisContext} context - The analysis context
 * @returns {boolean}
 */
function is_param_tracked_type(type_annotation, context) {
	const annotation = unwrap_type_annotation(type_annotation);

	if (
		annotation?.type === 'TSTypeReference' &&
		annotation.typeName?.type === 'Identifier' &&
		annotation.typeName.name === 'Tracked'
	) {
		const binding = context.state.scope.get('Tracked');

		return (
			binding?.declaration_kind === 'import' &&
			binding.initial !== null &&
			binding.initial.type === 'ImportDeclaration' &&
			binding.initial.source.type === 'Literal' &&
			binding.initial.source.value === 'ripple'
		);
	}

	return false;
}

/**
 * Sets up lazy transforms for any lazy subpatterns nested inside a function or component param.
 * @param {AST.Pattern} pattern
 * @param {AnalysisContext} context
 * @param {AST.TypeNode | undefined} [type_annotation]
 */
function setup_nested_lazy_param_transforms(pattern, context, type_annotation = undefined) {
	const pattern_type_annotation = get_pattern_type_annotation(pattern) ?? type_annotation;

	switch (pattern.type) {
		case 'Identifier': {
			if (pattern_type_annotation) {
				const binding = context.state.scope.get(pattern.name);
				if (binding?.node === pattern) {
					binding.metadata = {
						...(binding.metadata ?? {}),
						typeAnnotation: pattern_type_annotation,
					};
				}
			}
			return;
		}

		case 'AssignmentPattern':
			setup_nested_lazy_param_transforms(pattern.left, context, pattern_type_annotation);
			return;

		case 'RestElement':
			setup_nested_lazy_param_transforms(pattern.argument, context, pattern_type_annotation);
			return;

		case 'ObjectPattern':
		case 'ArrayPattern': {
			if (pattern.lazy) {
				const param_id = b.id(context.state.scope.generate('lazy'));
				const is_tracked_type =
					pattern.type === 'ArrayPattern' &&
					is_param_tracked_type(pattern_type_annotation, context);

				setup_lazy_transforms(pattern, param_id, context.state, true, is_tracked_type);
				pattern.metadata = { ...pattern.metadata, lazy_id: param_id.name };
				return;
			}

			if (pattern.type === 'ObjectPattern') {
				for (const property of pattern.properties) {
					const property_type_annotation = get_object_property_type_annotation(
						pattern_type_annotation,
						property,
					);
					if (property.type === 'RestElement') {
						setup_nested_lazy_param_transforms(
							property.argument,
							context,
							property_type_annotation,
						);
					} else {
						setup_nested_lazy_param_transforms(property.value, context, property_type_annotation);
					}
				}
			} else {
				for (let i = 0; i < pattern.elements.length; i += 1) {
					const element = pattern.elements[i];
					if (element !== null) {
						setup_nested_lazy_param_transforms(
							element,
							context,
							get_array_element_type_annotation(
								pattern_type_annotation,
								i,
								element.type === 'RestElement',
							),
						);
					}
				}
			}

			return;
		}
	}
}

/**
 * @param {AST.Function} node
 * @param {AnalysisContext} context
 */
function visit_function(node, context) {
	node.metadata = {
		...node.metadata,
		tracked: false,
		path: [...context.path],
	};

	if (is_tsrx_component_function(node, context)) {
		node.metadata.native_tsrx_function = true;
		context.state.component = node;

		if (node.params.length > 0) {
			const props = node.params[0];

			if (props.type === 'ObjectPattern' || props.type === 'ArrayPattern') {
				if (props.lazy) {
					setup_lazy_transforms(props, b.id('__props'), context.state, true, false);
				} else {
					setup_nested_lazy_param_transforms(props, context, get_pattern_type_annotation(props));
				}
			} else if (props.type === 'AssignmentPattern') {
				error(
					'Props are always an object, use destructured props with default values instead',
					context.state.analysis.module.filename,
					props,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		}

		/** @type {AST.Element[]} */
		const elements = [];
		const metadata = {};
		const styleClasses = new Map();
		/** @type {TopScopedClasses} */
		const topScopedClasses = new Map();
		const render_body = get_native_tsrx_function_body(node);
		const component_state = {
			...context.state,
			component: node,
			elements,
			function_depth: (context.state.function_depth ?? 0) + 1,
			metadata,
		};

		context.next(component_state);

		const css = collect_tsrx_stylesheet(render_body);
		/** @type {any} */ (node).css = css;
		/** @type {any} */ (node.metadata).css = css;

		if (css !== null) {
			analyzeCss(css);
			const prune = () => {
				const restore_nodes = prepare_legacy_nodes_for_css_pruning(elements);
				try {
					for (const element of elements) {
						pruneCss(css, element, styleClasses, topScopedClasses);
					}
				} finally {
					restore_nodes();
				}
			};
			prune();
			if (collectStyleRefAttributes(render_body).length > 0) {
				for (const [className, classInfo] of topScopedClasses) {
					styleClasses.set(className, classInfo.selector ?? classInfo);
				}
				prune();
			}
			if (topScopedClasses.size > 0) {
				/** @type {any} */ (node.metadata).topScopedClasses = topScopedClasses;
			}
		}

		if (node.type !== 'ArrowFunctionExpression' && node.id) {
			context.state.analysis.component_metadata.push({
				id: node.id.name,
			});
		}

		if (node.metadata.tracked) {
			mark_as_tracked(context.path);
		}
		return;
	}

	// Set up lazy transforms for any lazy destructured parameters
	for (let i = 0; i < node.params.length; i++) {
		const param_node = node.params[i];
		const param = param_node.type === 'AssignmentPattern' ? param_node.left : param_node;
		const param_type_annotation =
			get_pattern_type_annotation(param) ?? param_node.typeAnnotation?.typeAnnotation;

		if (param.type === 'ObjectPattern' || param.type === 'ArrayPattern') {
			setup_nested_lazy_param_transforms(param, context, param_type_annotation);
		}
	}

	context.next({
		...context.state,
		function_depth: (context.state.function_depth ?? 0) + 1,
	});

	if (node.metadata.tracked) {
		mark_as_tracked(context.path);
	}
}

/**
 * @param {AnalysisContext['path']} path
 */
function mark_as_tracked(path) {
	for (let i = path.length - 1; i >= 0; i -= 1) {
		const node = path[i];

		if (is_native_tsrx_function_node(node)) {
			break;
		}
		if (
			node.type === 'FunctionExpression' ||
			node.type === 'ArrowFunctionExpression' ||
			node.type === 'FunctionDeclaration'
		) {
			node.metadata.tracked = true;
			break;
		}
	}
}

/**
 * @param {AST.ReturnStatement} node
 * @param {AnalysisContext} context
 * @param {string} message
 */
function error_return_keyword(node, context, message) {
	const return_keyword_node = getReturnKeywordNode(node);

	error(
		message,
		context.state.analysis.module.filename,
		return_keyword_node,
		context.state.collect ? context.state.analysis.errors : undefined,
		context.state.analysis.comments,
	);
}

/**
 * @param {AST.Expression} expression
 * @param {Context<AST.Node, AnalysisState>} context
 * @returns {boolean}
 */
function is_children_template_expression(expression, context) {
	const component = context.path.findLast((node) => is_native_tsrx_function_node(node));
	const component_scope = component ? context.state.scopes.get(component) : null;
	return is_children_template_expression_in_scope(expression, context.state.scope, component_scope);
}

/** @type {Visitors<AST.Node, AnalysisState>} */
const visitors = {
	_(node, { state, next, path }) {
		// Set up metadata.path for each node (needed for CSS pruning)
		if (!node.metadata) {
			node.metadata = { path: [...path] };
		} else {
			node.metadata.path = [...path];
		}

		const scope = state.scopes.get(node);
		next(scope !== undefined && scope !== state.scope ? { ...state, scope } : state);
	},

	Program(_, context) {
		return context.next({ ...context.state, function_depth: 0 });
	},

	TSModuleDeclaration(node, context) {
		if (!is_submodule_declaration(node)) {
			return context.next();
		}

		const name = get_module_declaration_name(node);
		if (name === null) {
			return context.next();
		}

		const parent = context.path.at(-1);
		if (parent?.type !== 'Program') {
			// fatal since we don't have a transformation defined for this case
			error(
				'`module server` can only be declared at the module level.',
				context.state.analysis.module.filename,
				node,
			);
		}
		if (name !== 'server') {
			error(
				`Ripple only supports \`module server\` submodules, found \`module ${name}\`.`,
				context.state.analysis.module.filename,
				node.id,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return context.next();
		}
		if (context.state.analysis.metadata.serverModule) {
			error(
				'Only one `module server` declaration is allowed per file.',
				context.state.analysis.module.filename,
				node.id,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}
		node.metadata = {
			...node.metadata,
			exports: new Set(),
		};
		context.state.analysis.metadata.serverModule = node;
		context.visit(node.body, {
			...context.state,
			ancestor_server_block: node,
		});
	},

	Identifier(node, context) {
		const binding = context.state.scope.get(node.name);
		const parent = context.path.at(-1);
		const is_import_source =
			parent?.type === 'ImportDeclaration' && /** @type {any} */ (parent).source === node;

		if (
			!is_import_source &&
			is_reference(node, /** @type {AST.Node} */ (parent)) &&
			binding?.declaration_kind === 'module' &&
			binding.node !== node
		) {
			error(
				'Import submodule exports before using them, e.g. `import { foo } from server; foo()`.',
				context.state.analysis.module.filename,
				node,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		if (
			is_reference(node, /** @type {AST.Node} */ (parent)) &&
			binding &&
			context.state.ancestor_server_block &&
			binding.node !== node // Don't check the declaration itself
		) {
			/** @type {ScopeInterface | null} */
			let current_scope = binding.scope;
			let found_server_block = false;

			while (current_scope !== null) {
				if (current_scope.server_block) {
					found_server_block = true;
					break;
				}
				current_scope = current_scope.parent;
			}

			if (!found_server_block) {
				error(
					`Cannot reference client-side "${node.name}" from a server module. Server modules can only access variables and imports declared inside them.`,
					context.state.analysis.module.filename,
					node,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		}

		if (node.tracked && binding) {
			if (
				binding.kind === 'prop' ||
				binding.kind === 'prop_fallback' ||
				binding.kind === 'lazy' ||
				binding.kind === 'lazy_fallback' ||
				binding.kind === 'for_pattern' ||
				(is_reference(node, /** @type {AST.Node} */ (parent)) &&
					node.tracked &&
					binding.node !== node)
			) {
				mark_as_tracked(context.path);
				if (context.state.metadata?.tracking === false) {
					context.state.metadata.tracking = true;
				}
			}
		}

		// Lazy bindings from track() calls (read_unwraps) are inherently reactive —
		// propagate tracking so that control flow (if/for/switch)
		// and template control flow can create reactive blocks
		if (
			!node.tracked &&
			binding?.read_unwraps &&
			is_reference(node, /** @type {AST.Node} */ (parent)) &&
			binding.node !== node
		) {
			mark_as_tracked(context.path);
			if (context.state.metadata?.tracking === false) {
				context.state.metadata.tracking = true;
			}
		}

		context.next();
	},

	MemberExpression(node, context) {
		if (node.object.type === 'Identifier' && node.object.name === 'server') {
			const binding = context.state.scope.get('server');
			if (binding?.declaration_kind === 'module') {
				error(
					'Import server exports before using them, e.g. `import { foo } from server; foo()`.',
					context.state.analysis.module.filename,
					node,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		}

		if (node.object.type === 'Identifier' && !node.object.tracked) {
			const binding = context.state.scope.get(node.object.name);
			const tracked_numeric_index = get_tracked_numeric_index(node);

			if (binding && binding.metadata?.is_ripple_object) {
				const internalProperties = new Set(['__v', 'a', 'b', 'c', 'f']);

				let propertyName = null;
				if (node.property.type === 'Identifier' && !node.computed) {
					propertyName = node.property.name;
				} else if (node.property.type === 'Literal' && typeof node.property.value === 'string') {
					propertyName = node.property.value;
				}

				if (propertyName && internalProperties.has(propertyName)) {
					error(
						`Directly accessing internal property "${propertyName}" of a tracked object is not allowed. Use \`${node.object.name}.value\` or \`&[]\` lazy destructuring instead.`,
						context.state.analysis.module.filename,
						node.property,
						context.state.collect ? context.state.analysis.errors : undefined,
						context.state.analysis.comments,
					);
				}
			}

			if (is_known_tracked_binding(binding, context)) {
				if (tracked_numeric_index !== null) {
					error(
						get_tracked_numeric_index_error(tracked_numeric_index),
						context.state.analysis.module.filename,
						node.property,
						context.state.collect ? context.state.analysis.errors : undefined,
						context.state.analysis.comments,
					);
					context.next();
					return;
				}

				const is_allowed_tracked_access =
					!node.computed &&
					node.property.type === 'Identifier' &&
					(node.property.name === 'value' || node.property.name === 'length');

				if (is_allowed_tracked_access) {
					// pass through
				} else {
					error(
						`Accessing a tracked object directly is not allowed, use \`.value\` or \`&[]\` lazy destructuring to read the value inside a tracked object - for example \`${node.object.name}.value\``,
						context.state.analysis.module.filename,
						node.object,
						context.state.collect ? context.state.analysis.errors : undefined,
						context.state.analysis.comments,
					);
				}
			}

			if (is_known_tracked_lazy_ref_binding(binding) && tracked_numeric_index !== null) {
				error(
					get_tracked_numeric_index_error(tracked_numeric_index),
					context.state.analysis.module.filename,
					node.property,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		}

		context.next();
	},

	CallExpression(node, context) {
		// bug in our acorn [parser]: it uses typeParameters instead of typeArguments
		// @ts-expect-error
		if (node.typeParameters) {
			// @ts-expect-error
			node.typeArguments = node.typeParameters;
			// @ts-expect-error
			delete node.typeParameters;
		}

		const callee = node.callee;

		if (is_children_template_expression(/** @type {AST.Expression} */ (callee), context)) {
			error(
				'`children` cannot be called like a regular function. Render it with `{children}` or `{props.children}` instead.',
				context.state.analysis.module.filename,
				callee,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		if (context.state.function_depth === 0 && is_ripple_track_call(callee, context)) {
			error(
				'`track` can only be used within a reactive context, such as a component, function or class that is used or created from a component',
				context.state.analysis.module.filename,
				node.callee,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		// Generate unique hash for track/trackAsync calls. trackAsync uses the
		// hash for SSR serialization/hydration; track uses it so trackAsync can
		// look up its serialized dependencies during hydration.
		const track_call_name = is_ripple_track_call(callee, context);
		if (track_call_name !== null) {
			const id = ++context.state.module.track_id;
			const padded_id = String(id).padStart(6, '0');
			node.metadata = {
				...node.metadata,
				hash: strong_hash(context.state.analysis.module.filename + '__' + padded_id),
			};
		}

		if (!is_inside_component(context, true)) {
			mark_as_tracked(context.path);
		}

		context.next();
	},

	NewExpression(node, context) {
		context.next();
	},

	VariableDeclaration(node, context) {
		const { state, visit } = context;

		for (const declarator of node.declarations) {
			if (is_inside_component(context) && node.kind === 'var') {
				error(
					'`var` declarations are not allowed in components, use let or const instead',
					state.analysis.module.filename,
					declarator.id,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
			const metadata = { tracking: false };

			if (declarator.id.type === 'Identifier') {
				const binding = state.scope.get(declarator.id.name);
				if (binding && declarator.init && declarator.init.type === 'CallExpression') {
					const callee = declarator.init.callee;
					// Check if it's a call to `track` or `tracked`
					if (
						(callee.type === 'Identifier' &&
							(callee.name === 'track' ||
								callee.name === 'trackAsync' ||
								callee.name === 'tracked')) ||
						(callee.type === 'MemberExpression' &&
							callee.property.type === 'Identifier' &&
							(callee.property.name === 'track' ||
								callee.property.name === 'trackAsync' ||
								callee.property.name === 'tracked'))
					) {
						binding.metadata = { ...binding.metadata, is_ripple_object: true };
					}
				}
				visit(declarator, state);
			} else {
				// Handle lazy destructuring patterns
				if (
					(declarator.id.type === 'ObjectPattern' || declarator.id.type === 'ArrayPattern') &&
					declarator.id.lazy
				) {
					const lazy_id = b.id(state.scope.generate('lazy'));
					const writable = node.kind !== 'const';
					const call_name =
						declarator.init?.type === 'CallExpression' &&
						is_ripple_track_call(declarator.init.callee, context);
					const init_is_track = call_name === 'track' || call_name === 'trackAsync';
					setup_lazy_transforms(declarator.id, lazy_id, state, writable, !!init_is_track);
					// Store the generated identifier name on the pattern for the transform phase
					declarator.id.metadata = { ...declarator.id.metadata, lazy_id: lazy_id.name };
				}

				visit(declarator, state);
			}

			declarator.metadata = { ...metadata, path: [...context.path] };
		}
	},

	ExpressionStatement(node, context) {
		const { state, visit } = context;

		// Handle standalone lazy destructuring assignment: &[data] = track(0);
		if (
			node.expression.type === 'AssignmentExpression' &&
			node.expression.operator === '=' &&
			(node.expression.left.type === 'ObjectPattern' ||
				node.expression.left.type === 'ArrayPattern') &&
			node.expression.left.lazy
		) {
			const pattern = /** @type {AST.ObjectPattern | AST.ArrayPattern} */ (node.expression.left);
			const lazy_id = b.id(state.scope.generate('lazy'));
			const init = /** @type {AST.Expression} */ (node.expression.right);
			const init_is_track =
				init?.type === 'CallExpression' && is_ripple_track_call(init.callee, context) === 'track';
			setup_lazy_transforms(pattern, lazy_id, state, true, !!init_is_track);
			// Store the generated identifier name on the pattern for the transform phase
			pattern.metadata = { ...pattern.metadata, lazy_id: lazy_id.name };
		}

		context.next();
	},

	ImportDeclaration(node, context) {
		const source_name = get_submodule_import_source_name(node);
		if (source_name === null) {
			return context.next();
		}

		if (source_name !== 'server') {
			error(
				`Ripple only supports imports from \`server\` submodules, found \`${source_name}\`.`,
				context.state.analysis.module.filename,
				node.source,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return context.next();
		}

		context.state.analysis.metadata.serverImportsPresent = true;
		context.state.analysis.metadata.serverImportDeclarations.push(node);

		for (const specifier of node.specifiers) {
			if (specifier.type !== 'ImportSpecifier') {
				error(
					'Only named imports are supported from `module server`.',
					context.state.analysis.module.filename,
					specifier,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		}

		context.next();
	},

	ArrowFunctionExpression(node, context) {
		visit_function(node, context);
	},
	FunctionExpression(node, context) {
		visit_function(node, context);
	},
	FunctionDeclaration(node, context) {
		visit_function(node, context);
	},

	ClassBody(node, context) {
		context.next();
	},

	ForStatement(node, context) {
		if (is_inside_component(context) && !context.state.regular_js && !node.metadata?.regular_js) {
			validateTsrxUnsupportedLoopStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		context.next();
	},

	SwitchStatement(node, context) {
		if (context.state.regular_js || node.metadata?.regular_js) {
			return context.next({ ...context.state, regular_js: true, component: undefined });
		}

		if (!is_inside_component(context)) {
			return context.next();
		}

		context.visit(node.discriminant, context.state);

		for (const switch_case of node.cases) {
			// Skip empty cases
			if (switch_case.consequent.length === 0) {
				continue;
			}

			node.metadata = {
				...node.metadata,
				has_template: false,
			};

			context.visit(switch_case, context.state);
		}
	},

	ForOfStatement(node, context) {
		if (context.state.regular_js || node.metadata?.regular_js) {
			return context.next({ ...context.state, regular_js: true, component: undefined });
		}

		if (!is_inside_component(context)) {
			return context.next();
		}

		const is_template_directive = node.metadata?.tsrxDirective === 'for';
		if (!is_template_directive) {
			node.metadata = {
				...node.metadata,
				has_template: false,
			};
			context.next();
			if (node.metadata.has_template) {
				error(
					'TSRX elements and text inside JavaScript control flow blocks must use template directives. Use `@if`, `@for`, `@switch`, or `@try` for template control flow.',
					context.state.analysis.module.filename,
					node,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			} else {
				node.metadata.regular_js = true;
			}
			return;
		}

		if (node.index) {
			const state = context.state;
			const scope = /** @type {ScopeInterface} */ (state.scopes.get(node));
			const binding = scope.get(/** @type {AST.Identifier} */ (node.index).name);

			if (binding !== null) {
				binding.kind = 'index';
				binding.transform = {
					read: (node) => {
						return tracked_get(node ?? binding.node);
					},
				};
			}
		}

		if (node.key) {
			const state = context.state;
			const pattern = /** @type {AST.VariableDeclaration} */ (node.left).declarations[0].id;
			const paths = extractPaths(pattern);
			const scope = /** @type {ScopeInterface} */ (state.scopes.get(node));
			/** @type {AST.Identifier | AST.Pattern} */
			let pattern_id;
			if (state.to_ts || state.mode === 'server') {
				pattern_id = pattern;
			} else {
				pattern_id = b.id(scope.generate('pattern'));
				/** @type {AST.VariableDeclaration} */ (node.left).declarations[0].id = pattern_id;
			}

			for (const path of paths) {
				const name = /** @type {AST.Identifier} */ (path.node).name;
				const binding = context.state.scope.get(name);

				if (binding !== null) {
					binding.kind = 'for_pattern';
					if (!binding.metadata) {
						binding.metadata = {
							pattern: /** @type {AST.Identifier} */ (pattern_id),
						};
					}

					binding.transform = {
						read: () => {
							return path.expression(b.call('_$_.get', /** @type {AST.Identifier} */ (pattern_id)));
						},
					};
				}
			}
		}

		node.metadata = {
			...node.metadata,
			has_template: false,
		};
		context.next();

		if (!node.metadata.has_template && is_script_only_control_flow_body(node.body)) {
			node.metadata.script_only = true;
		}
	},

	ExportNamedDeclaration(node, context) {
		const server_block = context.state.ancestor_server_block;

		if (!server_block) {
			return context.next();
		}

		const exports = server_block.metadata.exports ?? (server_block.metadata.exports = new Set());
		const declaration = /** @type {AST.TSRXExportNamedDeclaration} */ (node).declaration;

		if (declaration && declaration.type === 'FunctionDeclaration') {
			exports.add(declaration.id.name);
		} else if (declaration && declaration.type === 'VariableDeclaration') {
			for (const decl of declaration.declarations) {
				if (decl.init !== undefined && decl.init !== null) {
					if (decl.id.type === 'Identifier') {
						if (
							decl.init.type === 'FunctionExpression' ||
							decl.init.type === 'ArrowFunctionExpression'
						) {
							exports.add(decl.id.name);
							continue;
						} else if (decl.init.type === 'Identifier') {
							const name = decl.init.name;
							const binding = context.state.scope.get(name);
							if (binding && is_binding_function(binding, context.state.scope)) {
								exports.add(decl.id.name);
								continue;
							}
						} else if (decl.init.type === 'MemberExpression') {
							error(
								'Not implemented: Exported member expressions are not supported in server modules.',
								context.state.analysis.module.filename,
								decl.init,
								context.state.collect ? context.state.analysis.errors : undefined,
								context.state.analysis.comments,
							);
							continue;
						}
					} else if (decl.id.type === 'ObjectPattern' || decl.id.type === 'ArrayPattern') {
						const paths = extractPaths(decl.id);
						for (const path of paths) {
							error(
								'Not implemented: Exported object or array patterns are not supported in server modules.',
								context.state.analysis.module.filename,
								path.node,
								context.state.collect ? context.state.analysis.errors : undefined,
								context.state.analysis.comments,
							);
						}
					}
				}
				// TODO: allow exporting consts when hydration is supported
				error(
					`Not implemented: Exported '${decl.id.type}' type is not supported in server modules.`,
					context.state.analysis.module.filename,
					decl,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		} else if (node.specifiers) {
			for (const specifier of node.specifiers) {
				const name = /** @type {AST.Identifier} */ (specifier.local).name;
				const binding = context.state.scope.get(name);
				const is_function = binding && is_binding_function(binding, context.state.scope);

				if (is_function) {
					exports.add(name);
					continue;
				}

				error(
					`Not implemented: Exported specifier type not supported in server modules.`,
					context.state.analysis.module.filename,
					specifier,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		} else {
			error(
				'Not implemented: Exported declaration type not supported in server modules.',
				context.state.analysis.module.filename,
				node,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		return context.next();
	},

	TSTypeReference(node, context) {
		// bug in our acorn parser: it uses typeParameters instead of typeArguments
		// @ts-expect-error
		if (node.typeParameters) {
			// @ts-expect-error
			node.typeArguments = node.typeParameters;
			// @ts-expect-error
			delete node.typeParameters;
		}
		context.next();
	},

	IfStatement(node, context) {
		if (context.state.regular_js || node.metadata?.regular_js) {
			return context.next({ ...context.state, regular_js: true, component: undefined });
		}

		if (!is_inside_component(context)) {
			return context.next();
		}

		const is_template_directive = node.metadata?.tsrxDirective === 'if';

		node.metadata = {
			...node.metadata,
			has_template: false,
			has_throw: false,
			has_continue: false,
		};

		const test_metadata = { tracking: false };
		context.visit(node.test, { ...context.state, metadata: test_metadata });
		if (test_metadata.tracking) {
			/** @type {AST.TrackedNode} */ (node.test).tracked = true;
		}

		context.visit(node.consequent, context.state);

		const consequent_body =
			node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];

		if (
			consequent_body.length === 1 &&
			consequent_body[0].type === 'ReturnStatement' &&
			!node.alternate
		) {
			node.metadata.lone_return = true;
		}

		const consequent_script_only = is_script_only_control_flow_body(node.consequent);

		let alternate_script_only = false;
		if (node.alternate) {
			const saved_has_return = node.metadata.has_return;
			const saved_returns = node.metadata.returns;
			const saved_has_continue = node.metadata.has_continue;
			node.metadata.has_template = false;
			node.metadata.has_throw = false;
			node.metadata.has_continue = false;
			context.visit(node.alternate, context.state);

			alternate_script_only = is_script_only_control_flow_body(node.alternate);

			if (saved_has_return) {
				node.metadata.has_return = true;
				if (saved_returns) {
					node.metadata.returns = [...saved_returns, ...(node.metadata.returns || [])];
				}
			}
			if (saved_has_continue) {
				node.metadata.has_continue = true;
			}
		}

		if (!is_template_directive) {
			if (node.metadata.has_template && !node.metadata.has_return) {
				error(
					'TSRX elements and text inside JavaScript control flow blocks must use template directives. Use `@if`, `@for`, `@switch`, or `@try` for template control flow.',
					context.state.analysis.module.filename,
					node,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			} else if (!node.metadata.has_template && !node.metadata.has_continue) {
				node.metadata.regular_js = true;
			}
			return;
		}

		if (
			!node.metadata.has_template &&
			!node.metadata.has_return &&
			!node.metadata.has_throw &&
			!node.metadata.has_continue &&
			consequent_script_only &&
			(!node.alternate || alternate_script_only)
		) {
			node.metadata.script_only = true;
		}
	},

	ReturnStatement(node, context) {
		const parent = context.path.at(-1);

		if (!is_inside_component(context)) {
			if (parent?.type === 'Program') {
				error_return_keyword(
					node,
					context,
					'Return statements are not allowed at the top level of a module.',
				);
			}

			return context.next();
		}

		if (is_native_tsrx_template_node(node.argument)) {
			context.visit(/** @type {AST.Node} */ (node.argument), context.state);
		}

		if (is_inside_template_if(context.path)) {
			validateTsrxIfReturnStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return;
		}

		if (is_inside_component_for_of(context.path)) {
			validateTsrxLoopReturnStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return;
		}

		if (is_inside_template_child(context.path)) {
			if (node.metadata?.invalid_tsrx_template_return) {
				validateTsrxReturnStatement(
					node,
					context.state.analysis.module.filename,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
				return;
			}
		}

		for (let i = context.path.length - 1; i >= 0; i--) {
			const ancestor = context.path[i];

			if (
				ancestor.type === 'FunctionExpression' ||
				ancestor.type === 'ArrowFunctionExpression' ||
				ancestor.type === 'FunctionDeclaration'
			) {
				break;
			}

			if (
				ancestor.type === 'IfStatement' &&
				/** @type {AST.TrackedNode} */ (ancestor.test).tracked
			) {
				node.metadata.is_reactive = true;
			}

			if (!ancestor.metadata.returns) {
				ancestor.metadata.returns = [];
			}
			ancestor.metadata.returns.push(node);
			ancestor.metadata.has_return = true;
		}
	},

	BreakStatement(node, context) {
		if (is_inside_component(context) && is_inside_template_if(context.path)) {
			validateTsrxIfBreakStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return;
		}

		if (is_inside_component(context) && break_targets_component_loop(context.path)) {
			validateTsrxLoopBreakStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		context.next();
	},

	ContinueStatement(node, context) {
		if (is_inside_component(context) && is_inside_template_if(context.path)) {
			validateTsrxIfContinueStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return;
		}

		if (is_inside_component(context) && is_inside_component_for_of(context.path)) {
			validateTsrxLoopContinueStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
			return;
		}

		context.next();
	},

	ThrowStatement(node, context) {
		if (!is_inside_component(context)) {
			return context.next();
		}

		for (let i = context.path.length - 1; i >= 0; i--) {
			const ancestor = context.path[i];

			if (
				ancestor.type === 'FunctionExpression' ||
				ancestor.type === 'ArrowFunctionExpression' ||
				ancestor.type === 'FunctionDeclaration'
			) {
				break;
			}

			if (ancestor.type === 'IfStatement') {
				if (!ancestor.metadata.has_throw) {
					ancestor.metadata.has_throw = true;
				}
			}
		}

		context.next();
	},

	TryStatement(node, context) {
		const { state } = context;
		if (state.regular_js || node.metadata?.regular_js) {
			return context.next({ ...state, regular_js: true, component: undefined });
		}

		if (!is_inside_component(context)) {
			return context.next();
		}

		if (node.pending) {
			node.metadata = {
				...node.metadata,
				has_template: false,
			};

			context.visit(node.block, state);

			if (!node.metadata.has_template && is_script_only_control_flow_body(node.block)) {
				node.metadata.script_only = true;
			}

			node.metadata = {
				...node.metadata,
				has_template: false,
			};

			context.visit(node.pending, state);

			if (
				(node.pending.body || []).length > 0 &&
				!node.metadata.has_template &&
				is_script_only_control_flow_body(node.pending)
			) {
				node.metadata.script_only = true;
			}
		} else {
			context.visit(node.block, state);
		}

		if (node.handler) {
			context.visit(node.handler, state);
		}

		if (node.finalizer) {
			context.visit(node.finalizer, state);
		}
	},

	ForInStatement(node, context) {
		if (is_inside_component(context) && !context.state.regular_js && !node.metadata?.regular_js) {
			validateTsrxUnsupportedLoopStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		context.next();
	},

	WhileStatement(node, context) {
		if (is_inside_component(context) && !context.state.regular_js && !node.metadata?.regular_js) {
			validateTsrxUnsupportedLoopStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		context.next();
	},

	DoWhileStatement(node, context) {
		if (is_inside_component(context) && !context.state.regular_js && !node.metadata?.regular_js) {
			validateTsrxUnsupportedLoopStatement(
				node,
				context.state.analysis.module.filename,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		context.next();
	},

	JSXElement(node, context) {
		return context.next();
	},

	JSXFragment(node, context) {
		if (!node.metadata?.native_tsrx) {
			return context.next();
		}

		error(TEMPLATE_FRAGMENT_ERROR, context.state.analysis.module.filename, node);
	},

	/**
	 * @param {any} node
	 * @param {AnalysisContext} context
	 */
	TsrxFragment(node, context) {
		if (context.state.regular_js) {
			return context.next();
		}

		mark_control_flow_has_template(context.path, node);
		return context.next();
	},

	Element(node, context) {
		if (context.state.regular_js || node.metadata?.regular_js) {
			return context.next({ ...context.state, regular_js: true, component: undefined });
		}

		if (!node.id) {
			error(TEMPLATE_FRAGMENT_ERROR, context.state.analysis.module.filename, node);
		}

		const { state, visit, path } = context;
		const is_dom_element = is_element_dom_element(node);
		/** @type {Set<AST.Identifier>} */
		const attribute_names = new Set();

		mark_control_flow_has_template(path, node);

		if (
			!is_dom_element &&
			is_children_template_expression(/** @type {AST.Expression} */ (node.id), context)
		) {
			error(
				'`children` cannot be rendered as a component. Render it with `{children}` or `{props.children}` instead.',
				state.analysis.module.filename,
				node.id,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		validateNesting(node, context);

		// Store capitalized name for dynamic components/elements
		// TODO: this is not quite right as the node.id could be a member expression
		// so, we'd need to identify dynamic based on that too
		// However, we're going to get rid of capitalization in favor of jsx()
		// so, this will be need to be redone.
		if (node.id.type === 'Identifier' && node.id.tracked) {
			const source_name = node.id.name;
			const capitalized_name = source_name.charAt(0).toUpperCase() + source_name.slice(1);
			node.metadata.ts_name = capitalized_name;
			node.metadata.source_name = source_name;

			// Mark the binding as a dynamic component so we can capitalize it everywhere
			const binding = context.state.scope.get(source_name);
			if (binding) {
				if (!binding.metadata) {
					binding.metadata = {};
				}
				binding.metadata.is_dynamic_component = true;
			}

			if (!is_dom_element && state.elements) {
				state.elements.push(node);
				// Mark dynamic elements as scoped by default since we can't match CSS at compile time
				if (/** @type {any} */ (state.component)?.metadata?.css) {
					node.metadata.scoped = true;
				}
			}
		}

		if (is_dom_element) {
			if (/** @type {AST.Identifier} */ (node.id).name === 'head') {
				// head validation
				if (node.attributes.length > 0) {
					// TODO: could transform attributes as something, e.g. Text Node, and avoid a fatal error
					error('<head> cannot have any attributes', state.analysis.module.filename, node);
				}
				if (node.children.length === 0) {
					// TODO: could transform children as something, e.g. Text Node, and avoid a fatal error
					error('<head> must have children', state.analysis.module.filename, node);
				}

				for (const child of node.children) {
					context.visit(child, { ...state, inside_head: true });
				}

				return;
			}
			if (state.inside_head) {
				if (/** @type {AST.Identifier} */ (node.id).name === 'title') {
					const children = normalize_children(node.children, context);

					if (
						children.length !== 1 ||
						(children[0].type !== 'TSRXExpression' && children[0].type !== 'Text')
					) {
						// TODO: could transform children as something, e.g. Text Node, and avoid a fatal error
						error(
							'<title> must have only contain text nodes',
							state.analysis.module.filename,
							node,
						);
					}
				}

				// check for invalid elements in head
				if (!valid_in_head.has(/** @type {AST.Identifier} */ (node.id).name)) {
					// TODO: could transform invalid elements as something, e.g. Text Node, and avoid a fatal error
					error(
						`<${/** @type {AST.Identifier} */ (node.id).name}> cannot be used in <head>`,
						state.analysis.module.filename,
						node,
					);
				}
			} else {
				if (/** @type {AST.Identifier} */ (node.id).name === 'script') {
					const err_msg = '<script> cannot be used outside of <head>.';
					error(
						err_msg,
						state.analysis.module.filename,
						node.openingElement,
						state.collect ? state.analysis.errors : undefined,
					);

					if (node.closingElement) {
						error(
							err_msg,
							state.analysis.module.filename,
							node.closingElement,
							state.collect ? state.analysis.errors : undefined,
						);
					}
				}
			}

			const is_void = isVoidElement(/** @type {AST.Identifier} */ (node.id).name);

			if (state.elements) {
				state.elements.push(node);
			}

			for (const attr of node.attributes) {
				if (attr.type === 'Attribute') {
					if (attr.value && attr.value.type === 'JSXEmptyExpression') {
						const value = /** @type {ESTreeJSX.JSXEmptyExpression & AST.NodeWithLocation} */ (
							attr.value
						);
						error(
							'attributes must only be assigned a non-empty expression',
							state.analysis.module.filename,
							{
								...value,
								start: value.start - 1,
								end: value.end + 1,
								loc: {
									start: {
										line: value.loc.start.line,
										column: value.loc.start.column - 1,
									},
									end: {
										line: value.loc.end.line,
										column: value.loc.end.column + 1,
									},
								},
							},
							context.state.collect ? context.state.analysis.errors : undefined,
							context.state.analysis.comments,
						);
					}
					if (attr.name.type === 'Identifier') {
						attribute_names.add(attr.name);

						if (attr.name.name === 'key') {
							error(
								'The `key` attribute is not a thing in Ripple, and cannot be used on DOM elements. If you are using a for loop, then use the `for (let item of items; key item.id)` syntax.',
								state.analysis.module.filename,
								attr,
								context.state.collect ? context.state.analysis.errors : undefined,
								context.state.analysis.comments,
							);
						}

						if (isEventAttribute(attr.name.name)) {
							const handler = visit(/** @type {AST.Expression} */ (attr.value), state);
							const is_delegated = is_delegated_event(attr.name.name, handler, context);

							if (is_delegated) {
								if (attr.metadata === undefined) {
									attr.metadata = { path: [...path] };
								}

								attr.metadata.delegated = is_delegated;
							}
						} else if (attr.value !== null) {
							visit(attr.value, state);
						}
					}
				}
			}

			if (is_void && node.children.length > 0) {
				error(
					`The <${/** @type {AST.Identifier} */ (node.id).name}> element is a void element and cannot have children`,
					state.analysis.module.filename,
					node,
					context.state.collect ? context.state.analysis.errors : undefined,
					context.state.analysis.comments,
				);
			}
		} else {
			for (const attr of node.attributes) {
				if (attr.type === 'Attribute') {
					if (attr.name.type === 'Identifier') {
						attribute_names.add(attr.name);
					}
					if (attr.value !== null) {
						visit(attr.value, state);
					}
				} else if (attr.type === 'SpreadAttribute') {
					visit(attr.argument, state);
				}
			}
			/** @type {(AST.Node | AST.Expression)[]} */
			let implicit_children = [];

			// Collect names of components declared in children
			/** @type {Set<string>} */
			const child_component_names = new Set();
			for (const child of node.children) {
				if (
					(child.type === 'FunctionDeclaration' || child.type === 'FunctionExpression') &&
					is_native_tsrx_function_node(child) &&
					child.id
				) {
					child_component_names.add(child.id.name);
				}
			}

			// Validate that parent element attributes don't reference child-declared components
			if (child_component_names.size > 0) {
				for (const attr of node.attributes) {
					if (
						attr.type === 'Attribute' &&
						attr.value !== null &&
						attr.value.type === 'Identifier'
					) {
						if (child_component_names.has(attr.value.name)) {
							error(
								`Cannot use component '${attr.value.name}' as a prop on its parent element. Component declarations inside children are not in scope for the parent element's attributes.`,
								state.analysis.module.filename,
								attr.value,
								context.state.collect ? context.state.analysis.errors : undefined,
								context.state.analysis.comments,
							);
						}
					} else if (attr.type === 'SpreadAttribute' && attr.argument.type === 'Identifier') {
						if (child_component_names.has(attr.argument.name)) {
							error(
								`Cannot use component '${attr.argument.name}' as a prop on its parent element. Component declarations inside children are not in scope for the parent element's attributes.`,
								state.analysis.module.filename,
								attr.argument,
								context.state.collect ? context.state.analysis.errors : undefined,
								context.state.analysis.comments,
							);
						}
					}
				}
			}

			for (const child of node.children) {
				if (is_native_tsrx_function_node(child)) {
					visit(child, state);
				} else if (child.type !== 'EmptyStatement') {
					implicit_children.push(
						child.type === 'TSRXExpression' || child.type === 'Text' ? child.expression : child,
					);
				}
			}
		}

		// Validation
		for (const attribute of attribute_names) {
			const name = attribute.name;
			if (name === 'children') {
				if (is_dom_element) {
					error(
						'Cannot have a `children` prop on an element',
						state.analysis.module.filename,
						attribute,
						context.state.collect ? context.state.analysis.errors : undefined,
						context.state.analysis.comments,
					);
				}
			}
		}

		return {
			...node,
			children: node.children.map((child) => visit(child)),
		};
	},

	TSRXExpression(node, context) {
		if (context.state.regular_js) {
			return context.next();
		}

		mark_control_flow_has_template(context.path, node);

		context.next();
	},

	Text(node, context) {
		if (context.state.regular_js) {
			return context.next();
		}

		mark_control_flow_has_template(context.path, node);

		if (is_children_template_expression(/** @type {AST.Expression} */ (node.expression), context)) {
			error(
				'`children` cannot be rendered using explicit text interpolation. Use `{children}` or `{props.children}` instead.',
				context.state.analysis.module.filename,
				node.expression,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		context.next();
	},

	AwaitExpression(node, context) {
		const parent_block = get_parent_block_node(context);

		if (is_inside_component(context)) {
			const adjusted_node /** @type {AST.AwaitExpression} */ = {
				...node,
				end: /** @type {AST.NodeWithLocation} */ (node).start + 'await'.length,
			};
			error(
				'`await` is not allowed inside components. Use `trackAsync(() => ...)` with an upstream `@try { ... } @pending { ... }` boundary instead.',
				context.state.analysis.module.filename,
				adjusted_node,
				context.state.collect ? context.state.analysis.errors : undefined,
				context.state.analysis.comments,
			);
		}

		if (parent_block) {
			if (!parent_block.metadata) {
				parent_block.metadata = { path: [...context.path] };
			}
		}

		context.next();
	},
};

/**
 * @param {AnalysisResult} analysis
 * @param {string} filename
 * @param {boolean} collect
 */
function validate_server_module_imports(analysis, filename, collect) {
	const server_module = analysis.metadata.serverModule;

	for (const declaration of analysis.metadata.serverImportDeclarations) {
		if (!server_module) {
			error(
				'Cannot import from `server` because this file has no `module server` declaration.',
				filename,
				declaration.source,
				collect ? analysis.errors : undefined,
				analysis.comments,
			);
			continue;
		}

		const exports = server_module.metadata?.exports;
		for (const specifier of declaration.specifiers) {
			if (specifier.type !== 'ImportSpecifier') {
				continue;
			}
			const imported_name = get_imported_name(specifier);
			if (imported_name !== null && !exports?.has(imported_name)) {
				error(
					`Module \`server\` does not export \`${imported_name}\`.`,
					filename,
					specifier.imported,
					collect ? analysis.errors : undefined,
					analysis.comments,
				);
			}
		}
	}
}

/**
 *
 * @param {AST.Program} ast
 * @param {string} filename
 * @param {AnalyzeOptions} options
 * @returns {AnalysisResult}
 */
export function analyze(ast, filename, options = {}) {
	const scope_root = new ScopeRoot();
	const errors = options.errors ?? [];
	const comments = options.comments ?? [];
	const collect = !!(options.collect || options.loose);

	const restore_scope_nodes = prepare_legacy_nodes_for_core_scopes(ast);
	let scope;
	let scopes;
	try {
		({ scope, scopes } = createScopes(ast, scope_root, null, {
			collect,
			errors,
			filename,
			comments,
		}));
	} finally {
		restore_scope_nodes();
	}

	const analysis = /** @type {AnalysisResult} */ ({
		module: { ast, scope, scopes, filename },
		ast,
		scope,
		scopes,
		component_metadata: [],
		metadata: {
			serverImportsPresent: false,
			serverImportDeclarations: [],
			serverModule: null,
		},
		errors,
		comments,
	});

	walk(
		ast,
		/** @type {AnalysisState} */
		{
			scope,
			scopes,
			analysis,
			inside_head: false,
			ancestor_server_block: undefined,
			to_ts: options.to_ts ?? false,
			collect,
			metadata: {},
			mode: options.mode,
			module: {
				track_id: 0,
			},
		},
		visitors,
	);

	validate_server_module_imports(analysis, filename, collect);

	return analysis;
}
