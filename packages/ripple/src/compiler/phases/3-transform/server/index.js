/** @import * as AST from 'estree'; */
/** @import { RawSourceMap } from 'source-map'; */
/**
@import {
	TransformServerContext,
	TransformServerState,
	Visitors,
	AnalysisResult,
	ScopeInterface,
} from '#compiler' */

import * as b from '../../../../utils/builders.js';
import { walk } from 'zimmerframe';
import ts from 'esrap/languages/ts';
import path from 'node:path';
import { print } from 'esrap';
import is_reference from 'is-reference';
import {
	determine_namespace_for_children,
	escape_html,
	is_boolean_attribute,
	is_element_dom_element,
	is_inside_component,
	is_void_element,
	normalize_children,
	is_children_template_expression,
	is_binding_function,
	is_element_dynamic,
	is_ripple_track_call,
	is_ripple_import,
	replace_lazy_param_pattern,
	hash,
	flatten_switch_consequent,
	get_ripple_namespace_call_name,
	jsx_to_ripple_node,
} from '../../../utils.js';
import { escape } from '../../../../utils/escaping.js';
import { is_event_attribute } from '../../../../utils/events.js';
import { render_stylesheets } from '../stylesheet.js';
import { createHash } from 'node:crypto';
import {
	STYLE_IDENTIFIER,
	CSS_HASH_IDENTIFIER,
	obfuscate_identifier,
} from '../../../identifier-utils.js';
import { BLOCK_CLOSE, BLOCK_OPEN } from '../../../../constants.js';

/**
 * Checks if a node is template or control-flow content that should be wrapped when return flags are active
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_template_or_control_flow(node) {
	return (
		node.type === 'Element' ||
		node.type === 'RippleExpression' ||
		node.type === 'Text' ||
		node.type === 'Html' ||
		node.type === 'Tsx' ||
		node.type === 'TsxCompat' ||
		node.type === 'IfStatement' ||
		node.type === 'ForOfStatement' ||
		node.type === 'TryStatement' ||
		node.type === 'SwitchStatement'
	);
}

/**
 * Builds a negated AND condition from return flag names: !__r_1 && !__r_2 && ...
 * @param {string[]} flags
 * @returns {AST.Expression}
 */
function build_return_guard(flags) {
	/** @type {AST.Expression} */
	let condition = b.unary('!', b.id(flags[0]));
	for (let i = 1; i < flags.length; i++) {
		condition = b.logical('&&', condition, b.unary('!', b.id(flags[i])));
	}
	return condition;
}

/**
 * @param {AST.ClassDeclaration | AST.ClassExpression} node
 * @param {TransformServerContext} context
 * @returns {void}
 */
function strip_class_typescript_syntax(node, context) {
	delete node.typeParameters;
	delete node.superTypeParameters;
	delete node.implements;

	if (node.superClass?.type === 'TSInstantiationExpression') {
		node.superClass = /** @type {AST.Expression} */ (context.visit(node.superClass.expression));
	} else if (node.superClass && 'typeArguments' in node.superClass) {
		delete node.superClass.typeArguments;
	}
}

/**
 * Collects all unique return statements from the direct children of a body
 * @param {AST.Node[]} children
 * @returns {AST.ReturnStatement[]}
 */
function collect_returns_from_children(children) {
	/** @type {AST.ReturnStatement[]} */
	const returns = [];
	const seen = new Set();
	for (const node of children) {
		if (node.type === 'ReturnStatement') {
			if (!seen.has(node)) {
				seen.add(node);
				returns.push(node);
			}
		}
		if (node.metadata?.returns) {
			for (const ret of node.metadata.returns) {
				if (!seen.has(ret)) {
					seen.add(ret);
					returns.push(ret);
				}
			}
		}
	}
	return returns;
}

/**
 * @param {AST.Node[]} children
 * @param {TransformServerContext} context
 */
function transform_children(children, context) {
	const { visit, state } = context;
	const normalized = normalize_children(children, context);

	const all_returns = collect_returns_from_children(normalized);
	/** @type {Map<AST.ReturnStatement, { name: string, tracked: boolean }>} */
	const return_flags = new Map([...(state.return_flags || [])]);
	/** @type {AST.ReturnStatement[]} */
	const new_returns = [];
	for (const ret of all_returns) {
		if (!return_flags.has(ret)) {
			return_flags.set(ret, { name: state.scope.generate('__r'), tracked: false });
			new_returns.push(ret);
		}
	}

	for (const ret of new_returns) {
		const info = /** @type {{ name: string, tracked: boolean }} */ (return_flags.get(ret));
		state.init?.push(b.var(b.id(info.name), b.false));
	}

	// Track accumulated return flags as we process children
	/** @type {string[]} */
	let accumulated_flags = [];

	/**
	 * @param {AST.ReturnStatement[] | undefined} returns
	 */
	const push_return_flags = (returns) => {
		if (!returns) return;
		for (const ret of returns) {
			const info = return_flags.get(ret);
			if (info && !accumulated_flags.includes(info.name)) {
				accumulated_flags.push(info.name);
			}
		}
	};

	/** @param {AST.Node} node */
	const process_node = (node) => {
		if (node.type === 'BreakStatement') {
			state.init?.push(b.break);
			return;
		}
		if (
			node.type === 'VariableDeclaration' ||
			node.type === 'ExpressionStatement' ||
			node.type === 'ThrowStatement' ||
			node.type === 'FunctionDeclaration' ||
			node.type === 'DebuggerStatement' ||
			node.type === 'ClassDeclaration' ||
			node.type === 'TSTypeAliasDeclaration' ||
			node.type === 'TSInterfaceDeclaration' ||
			node.type === 'ReturnStatement' ||
			node.type === 'Component'
		) {
			const metadata = { await: false };
			state.init?.push(
				/** @type {AST.Statement} */ (visit(node, { ...state, return_flags, metadata })),
			);
			if (metadata.await) {
				state.init?.push(b.if(b.call('_$_.aborted'), b.return(null)));
				if (state.metadata?.await === false) {
					state.metadata.await = true;
				}
			}
			if (node.type === 'ReturnStatement') {
				const info = return_flags.get(node);
				if (info && !accumulated_flags.includes(info.name)) {
					accumulated_flags.push(info.name);
				}
			}
		} else {
			visit(node, { ...state, return_flags, template_child: true });
		}
	};

	/** @type {AST.Node[]} */
	let pending_group = [];
	/** @type {string[]} */
	let pending_guard_flags = [];

	const flush_pending_group = () => {
		if (pending_group.length === 0) return;

		const group = pending_group;
		const guard_flags = pending_guard_flags;
		pending_group = [];
		pending_guard_flags = [];

		/** @type {AST.Statement[]} */
		const wrapped = [];
		const saved_init = state.init;
		state.init = wrapped;

		for (const group_node of group) {
			process_node(group_node);
		}

		state.init = saved_init;
		if (wrapped.length === 0) return;

		const guard = build_return_guard(guard_flags);
		state.init?.push(
			b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_OPEN))),
		);
		state.init?.push(b.if(guard, b.block(wrapped)));
		state.init?.push(
			b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_CLOSE))),
		);
	};

	for (let idx = 0; idx < normalized.length; idx++) {
		const node = normalized[idx];

		if (accumulated_flags.length > 0 && is_template_or_control_flow(node)) {
			if (pending_group.length === 0) {
				pending_guard_flags = [...accumulated_flags];
			}
			pending_group.push(node);

			if (node.metadata?.has_return && node.metadata.returns) {
				flush_pending_group();
				push_return_flags(node.metadata.returns);
			}
			continue;
		}

		flush_pending_group();
		process_node(node);
		push_return_flags(node.metadata?.has_return ? node.metadata.returns : undefined);
	}

	flush_pending_group();

	const head_elements = /** @type {AST.Element[]} */ (
		children.filter(
			(node) => node.type === 'Element' && node.id.type === 'Identifier' && node.id.name === 'head',
		)
	);

	if (head_elements.length) {
		state.init?.push(
			b.stmt(b.assignment('=', b.member(b.id('__output'), b.id('target')), b.literal('head'))),
		);
		for (let i = 0; i < head_elements.length; i++) {
			const head_element = head_elements[i];
			// Generate a hash for this head element to match client-side hydration
			// Use both filename and index to ensure uniqueness
			const hash_source = `${context.state.filename}:head:${i}:${head_element.start ?? 0}`;
			const hash_value = hash(hash_source);

			// Emit hydration marker comment with hash
			state.init?.push(
				b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(`<!--${hash_value}-->`))),
			);

			transform_children(head_element.children, context);

			// No closing marker needed for head elements - the hash is sufficient
		}
		state.init?.push(
			b.stmt(b.assignment('=', b.member(b.id('__output'), b.id('target')), b.literal(null))),
		);
	}
}

/**
 * @param {AST.Node[]} body
 * @param {TransformServerContext} context
 * @returns {AST.Statement[]}
 */
function transform_body(body, context) {
	const { state } = context;
	/** @type {TransformServerState} */
	const body_state = {
		...state,
		init: [],
		metadata: state.metadata,
	};

	transform_children(body, { ...context, state: body_state });

	return /** @type {AST.Statement[]} */ (body_state.init);
}

/** @type {Visitors<AST.Node, TransformServerState>} */
const visitors = {
	_: (node, { next, state }) => {
		const scope = state.scopes.get(node);

		if (scope && scope !== state.scope) {
			return next({ ...state, scope });
		} else {
			return next();
		}
	},

	Identifier(node, context) {
		const parent = /** @type {AST.Node} */ (context.path.at(-1));

		if (is_reference(node, parent)) {
			// Apply lazy destructuring binding transforms only
			const binding = context.state.scope?.get(node.name);
			if (
				binding?.transform?.read &&
				binding.node !== node &&
				(binding.kind === 'lazy' || binding.kind === 'lazy_fallback')
			) {
				return binding.transform.read(node);
			}

			return node;
		}
	},

	Component(node, context) {
		let props_param_output;

		if (node.params.length > 0) {
			let props_param = node.params[0];

			if (props_param.type === 'Identifier') {
				delete props_param.typeAnnotation;
				props_param_output = props_param;
			} else if (props_param.type === 'ObjectPattern' || props_param.type === 'ArrayPattern') {
				delete props_param.typeAnnotation;
				if (props_param.lazy) {
					// Lazy destructuring: use __props identifier, bindings resolved via transforms
					props_param_output = b.id('__props');
				} else {
					props_param_output = replace_lazy_param_pattern(props_param);
				}
			} else {
				props_param_output = props_param;
			}
		}

		const metadata = { await: false };

		/** @type {AST.Statement[]} */
		const body_statements = [];

		if (node.css !== null) {
			const hash_id = b.id(CSS_HASH_IDENTIFIER);
			const hash = b.var(hash_id, b.literal(node.css.hash));
			context.state.stylesheets.push(node.css);

			// Register CSS hash during rendering
			body_statements.push(
				hash,
				b.stmt(b.call(b.member(b.id('__output'), b.id('register_css')), hash_id)),
			);

			if (node.metadata.styleIdentifierPresent) {
				/** @type {AST.Property[]} */
				const properties = [];
				if (node.metadata.topScopedClasses && node.metadata.topScopedClasses.size > 0) {
					for (const [className] of node.metadata.topScopedClasses) {
						properties.push(
							b.prop(
								'init',
								b.key(className),
								b.template([b.quasi('', false), b.quasi(` ${className}`, true)], [hash_id]),
							),
						);
					}
				}
				body_statements.push(b.var(b.id(STYLE_IDENTIFIER), b.object(properties)));
			}
		}

		body_statements.push(
			b.stmt(b.call('_$_.push_component')),
			...transform_body(node.body, {
				...context,
				state: { ...context.state, component: node, metadata },
			}),
			b.stmt(b.call('_$_.pop_component')),
		);

		let component_fn = b.function(
			node.id,
			node.params.length > 0
				? [b.id('__output'), /** @type {AST.Pattern} */ (props_param_output)]
				: [b.id('__output')],
			b.block([
				...(metadata.await
					? [b.return(b.call('_$_.async', b.thunk(b.block(body_statements), true)))]
					: body_statements),
			]),
		);

		// Mark function as async if needed
		if (metadata.await) {
			component_fn = b.async(component_fn);
		}

		// Anonymous components return a FunctionExpression
		if (!node.id) {
			// For async anonymous components, we need to set .async on the function
			if (metadata.await) {
				// Use IIFE pattern: (fn => (fn.async = true, fn))(function() { ... })
				return b.call(
					b.arrow(
						[b.id('fn')],
						b.sequence([
							b.assignment('=', b.member(b.id('fn'), b.id('async')), b.true),
							b.id('fn'),
						]),
					),
					component_fn,
				);
			}
			return component_fn;
		}

		// Named components return a FunctionDeclaration
		const declaration = b.function_declaration(
			node.id,
			component_fn.params,
			component_fn.body,
			component_fn.async,
		);

		if (metadata.await) {
			const parent = context.path.at(-1);
			/** @type {AST.RippleProgram['body'] | null} */
			let body = null;
			/** @type {AST.Component | AST.ExportNamedDeclaration} */
			let target_node = node;
			if (parent?.type === 'Program' || parent?.type === 'BlockStatement') {
				body = parent.body;
			} else if (parent?.type === 'ExportNamedDeclaration') {
				const grandparent = context.path.at(-2);
				if (grandparent?.type === 'Program' || grandparent?.type === 'BlockStatement') {
					body = grandparent.body;
					target_node = parent;
				}
			}
			if (body !== null) {
				const index = body.indexOf(target_node);
				if (index >= 0) {
					body.splice(
						index + 1,
						0,
						b.stmt(b.assignment('=', b.member(node.id, b.id('async')), b.true)),
					);
				}
			}
		}

		return declaration;
	},

	CallExpression(node, context) {
		if (!context.state.to_ts) {
			delete node.typeArguments;
		}

		const callee = node.callee;

		// Handle direct calls to ripple-imported functions: effect(), untrack(), RippleArray(), etc.
		if (callee.type === 'Identifier' && is_ripple_import(callee, context)) {
			const ripple_runtime_method = get_ripple_namespace_call_name(callee.name);
			if (ripple_runtime_method !== null) {
				return {
					...node,
					callee: b.member(b.id('_$_'), b.id(ripple_runtime_method)),
					arguments: /** @type {(AST.Expression | AST.SpreadElement)[]} */ ([
						...node.arguments.map((arg) => context.visit(arg)),
					]),
				};
			}
		}

		const track_call_name = is_ripple_track_call(callee, context);
		if (track_call_name) {
			const track_method_name = 'track';

			return {
				...node,
				callee: b.member(b.id('_$_'), b.id(track_method_name)),
				arguments: /** @type {(AST.Expression | AST.SpreadElement)[]} */ (
					node.arguments.map((arg) => context.visit(arg))
				),
			};
		}

		// Handle member calls on ripple imports, like RippleArray.from()
		if (
			callee.type === 'MemberExpression' &&
			callee.object.type === 'Identifier' &&
			callee.property.type === 'Identifier' &&
			is_ripple_import(callee, context)
		) {
			const object = callee.object;
			const property = callee.property;
			const method_name = get_ripple_namespace_call_name(object.name);
			if (method_name !== null) {
				return b.member(
					b.id('_$_'),
					b.member(
						b.id(method_name),
						b.call(
							b.id(property.name),
							.../** @type {(AST.Expression | AST.SpreadElement)[]} */ (
								node.arguments.map((arg) => context.visit(arg))
							),
						),
					),
				);
			}
		}

		return context.next();
	},

	NewExpression(node, context) {
		const callee = node.callee;

		if (!context.state.to_ts) {
			delete node.typeArguments;
		}

		// Transform `new RippleArray(...)`, `new RippleMap(...)`, etc. imported from 'ripple'
		if (callee.type === 'Identifier' && is_ripple_import(callee, context)) {
			const ripple_runtime_method = get_ripple_namespace_call_name(callee.name);
			if (ripple_runtime_method !== null) {
				return b.call(
					'_$_.' + ripple_runtime_method,
					.../** @type {(AST.Expression | AST.SpreadElement)[]} */ (
						node.arguments.map((arg) => context.visit(arg))
					),
				);
			}
		}

		return context.next();
	},

	PropertyDefinition(node, context) {
		if (!context.state.to_ts) {
			delete node.typeAnnotation;
		}
		return context.next();
	},

	ClassDeclaration(node, context) {
		if (!context.state.to_ts) {
			strip_class_typescript_syntax(node, context);
		}
		return context.next();
	},

	ClassExpression(node, context) {
		if (!context.state.to_ts) {
			strip_class_typescript_syntax(node, context);
		}
		return context.next();
	},

	FunctionDeclaration(node, context) {
		if (!context.state.to_ts) {
			delete node.returnType;
			delete node.typeParameters;
			for (let i = 0; i < node.params.length; i++) {
				const param = node.params[i];
				delete param.typeAnnotation;
				// Handle AssignmentPattern (parameters with default values)
				if (param.type === 'AssignmentPattern' && param.left) {
					delete param.left.typeAnnotation;
				}
				// Replace lazy destructuring params with generated identifiers
				const pattern = param.type === 'AssignmentPattern' ? param.left : param;
				if (pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') {
					const transformed_pattern = replace_lazy_param_pattern(pattern);
					node.params[i] =
						param.type === 'AssignmentPattern'
							? /** @type {AST.AssignmentPattern} */ ({ ...param, left: transformed_pattern })
							: transformed_pattern;
				}
			}
		}
		return context.next();
	},

	FunctionExpression(node, context) {
		if (!context.state.to_ts) {
			delete node.returnType;
			delete node.typeParameters;
			for (let i = 0; i < node.params.length; i++) {
				const param = node.params[i];
				delete param.typeAnnotation;
				// Handle AssignmentPattern (parameters with default values)
				if (param.type === 'AssignmentPattern' && param.left) {
					delete param.left.typeAnnotation;
				}
				// Replace lazy destructuring params with generated identifiers
				const pattern = param.type === 'AssignmentPattern' ? param.left : param;
				if (pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') {
					const transformed_pattern = replace_lazy_param_pattern(pattern);
					node.params[i] =
						param.type === 'AssignmentPattern'
							? /** @type {AST.AssignmentPattern} */ ({ ...param, left: transformed_pattern })
							: transformed_pattern;
				}
			}
		}
		return context.next();
	},

	BlockStatement(node, context) {
		/** @type {AST.Statement[]} */
		const statements = [];

		for (const statement of node.body) {
			statements.push(/** @type {AST.Statement} */ (context.visit(statement)));
		}

		return b.block(statements);
	},

	ArrowFunctionExpression(node, context) {
		delete node.returnType;
		delete node.typeParameters;
		for (let i = 0; i < node.params.length; i++) {
			const param = node.params[i];
			delete param.typeAnnotation;
			// Handle AssignmentPattern (parameters with default values)
			if (param.type === 'AssignmentPattern' && param.left) {
				delete param.left.typeAnnotation;
			}
			// Replace lazy destructuring params with generated identifiers
			const pattern = param.type === 'AssignmentPattern' ? param.left : param;
			if (pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') {
				const transformed_pattern = replace_lazy_param_pattern(pattern);
				node.params[i] =
					param.type === 'AssignmentPattern'
						? /** @type {AST.AssignmentPattern} */ ({ ...param, left: transformed_pattern })
						: transformed_pattern;
			}
		}

		return context.next();
	},

	TSAsExpression(node, context) {
		if (!context.state.to_ts) {
			return context.visit(node.expression);
		}
		return context.next();
	},

	TSInstantiationExpression(node, context) {
		if (!context.state.to_ts) {
			// In JavaScript, just return the expression wrapped in parentheses
			return b.sequence(/** @type {AST.Expression[]} */ ([context.visit(node.expression)]));
		}
		return context.next();
	},

	TSTypeAliasDeclaration(_, context) {
		if (!context.state.to_ts) {
			return b.empty;
		}
		context.next();
	},

	TSInterfaceDeclaration(_, context) {
		if (!context.state.to_ts) {
			return b.empty;
		}
		context.next();
	},

	ExportNamedDeclaration(node, context) {
		if (!context.state.to_ts && node.exportKind === 'type') {
			return b.empty;
		}
		if (!context.state.ancestor_server_block) {
			return context.next();
		}
		const declaration = node.declaration;
		/** @type {AST.Statement[]} */
		const statements = [];

		if (declaration && declaration.type === 'FunctionDeclaration') {
			const name = declaration.id.name;
			if (context.state.server_exported_names.includes(name)) {
				return b.empty;
			}
			context.state.server_exported_names.push(name);
			return b.stmt(
				b.assignment(
					'=',
					b.member(b.id('_$_server_$_'), b.id(name)),
					/** @type {AST.Expression} */
					(context.visit(declaration)),
				),
			);
		} else if (declaration && declaration.type === 'VariableDeclaration') {
			for (const decl of declaration.declarations) {
				if (decl.init !== undefined && decl.init !== null) {
					if (decl.id.type === 'Identifier') {
						const name = decl.id.name;
						if (
							decl.init.type === 'FunctionExpression' ||
							decl.init.type === 'ArrowFunctionExpression'
						) {
							if (context.state.server_exported_names.includes(name)) {
								continue;
							}
							context.state.server_exported_names.push(name);
							statements.push(
								b.stmt(
									b.assignment(
										'=',
										b.member(b.id('_$_server_$_'), b.id(name)),
										/** @type {AST.Expression} */
										(context.visit(decl.init)),
									),
								),
							);
						} else if (decl.init.type === 'Identifier') {
							if (context.state.server_exported_names.includes(name)) {
								continue;
							}
							context.state.server_exported_names.push(name);

							statements.push(
								b.stmt(
									b.assignment(
										'=',
										b.member(b.id('_$_server_$_'), b.id(name)),
										b.id(decl.init.name),
									),
								),
							);
						} else {
							// TODO allow exporting variables that are not functions
							throw new Error('Not implemented');
						}
					} else {
						// TODO allow exporting variables that are not functions
						throw new Error('Not implemented');
					}
				} else {
					// TODO allow exporting uninitialized variables
					throw new Error('Not implemented');
				}
				// TODO: allow exporting consts when hydration is supported
			}
		} else if (node.specifiers) {
			for (const specifier of node.specifiers) {
				const name = /** @type {AST.Identifier} */ (specifier.local).name;
				if (context.state.server_exported_names.includes(name)) {
					continue;
				}
				context.state.server_exported_names.push(name);

				const binding = context.state.scope.get(name);

				if (!binding || !is_binding_function(binding, context.state.scope)) {
					continue;
				}

				statements.push(
					b.stmt(b.assignment('=', b.member(b.id('_$_server_$_'), b.id(name)), specifier.local)),
				);
			}
		} else {
			// TODO
			throw new Error('Not implemented');
		}

		return statements.length ? b.block(statements) : b.empty;
	},

	ExpressionStatement(node, context) {
		// Handle standalone lazy destructuring: &[data] = track(0); → const lazy0 = track(0);
		if (
			node.expression.type === 'AssignmentExpression' &&
			(node.expression.left.type === 'ObjectPattern' ||
				node.expression.left.type === 'ArrayPattern') &&
			node.expression.left.lazy &&
			node.expression.left.metadata?.lazy_id
		) {
			const right = /** @type {AST.Expression} */ (context.visit(node.expression.right));
			return b.const(b.id(node.expression.left.metadata.lazy_id), right);
		}
		return context.next();
	},

	VariableDeclaration(node, context) {
		for (const declarator of node.declarations) {
			if (!context.state.to_ts) {
				delete declarator.id.typeAnnotation;

				// Replace lazy destructuring patterns with the generated identifier
				if (
					(declarator.id.type === 'ObjectPattern' || declarator.id.type === 'ArrayPattern') &&
					declarator.id.lazy &&
					declarator.id.metadata?.lazy_id
				) {
					declarator.id = b.id(declarator.id.metadata.lazy_id);
				}
			}
		}

		return context.next();
	},

	Element(node, context) {
		const { state, visit } = context;

		const dynamic_name = state.dynamicElementName;
		if (dynamic_name) {
			state.dynamicElementName = undefined;
		}

		const is_dom_element = !!dynamic_name || is_element_dom_element(node);
		const is_spreading = node.attributes.some((attr) => attr.type === 'SpreadAttribute');
		/** @type {(AST.Property | AST.SpreadElement)[] | null} */
		const spread_attributes = is_spreading ? [] : null;
		const child_namespace =
			!dynamic_name && is_dom_element
				? determine_namespace_for_children(
						/** @type {AST.Identifier} */ (node.id).name,
						state.namespace,
					)
				: state.namespace;

		if (is_dom_element) {
			const is_void = dynamic_name
				? false
				: is_void_element(/** @type {AST.Identifier} */ (node.id).name);
			const use_self_closing_syntax = node.selfClosing && (is_void || !!dynamic_name);
			const tag_name = dynamic_name
				? dynamic_name
				: b.literal(/** @type {AST.Identifier} */ (node.id).name);
			/** @type {AST.CSS.StyleSheet['hash'] | null} */
			const scoping_hash =
				state.applyParentCssScope ??
				(node.metadata.scoped && state.component?.css
					? /** @type {AST.CSS.StyleSheet} */ (state.component?.css).hash
					: null);

			state.init?.push(
				b.stmt(
					b.call(
						b.member(b.id('__output'), b.id('push')),
						dynamic_name
							? b.template([b.quasi('<', false), b.quasi('', false)], [tag_name])
							: b.literal('<' + /** @type {AST.Literal} */ (tag_name).value),
					),
				),
			);
			let class_attribute = null;

			/**
			 * @param {string} name
			 * @param {string | number | bigint | boolean | RegExp | null | undefined} value
			 * @param {'push' | 'unshift'} [spread_method]
			 */
			const handle_static_attr = (name, value, spread_method = 'push') => {
				if (is_spreading) {
					// For spread attributes, store just the actual value, not the full attribute string
					const actual_value =
						is_boolean_attribute(name) && value === true
							? b.literal(true)
							: b.literal(value === true ? '' : value);

					// spread_attributes cannot be null based on is_spreading === true
					/** @type {(AST.Property | AST.SpreadElement)[]} */ (spread_attributes)[spread_method](
						b.prop('init', b.literal(name), actual_value),
					);
				} else {
					const attr_str = ` ${name}${
						is_boolean_attribute(name) && value === true
							? ''
							: `="${value === true ? '' : escape_html(value, true)}"`
					}`;

					state.init?.push(
						b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(attr_str))),
					);
				}
			};

			for (const attr of node.attributes) {
				if (attr.type === 'Attribute') {
					if (attr.name.type === 'Identifier') {
						const name = attr.name.name;

						if (attr.value === null) {
							handle_static_attr(name, true);
							continue;
						}

						if (attr.value.type === 'Literal' && name !== 'class') {
							handle_static_attr(name, attr.value.value);
							continue;
						}

						if (name === 'class') {
							class_attribute = attr;

							continue;
						}

						if (is_event_attribute(name)) {
							continue;
						}
						const metadata = { tracking: false, await: false };
						const expression = /** @type {AST.Expression} */ (
							visit(attr.value, { ...state, metadata })
						);

						state.init?.push(
							b.stmt(
								b.call(
									b.member(b.id('__output'), b.id('push')),
									b.call(
										'_$_.attr',
										b.literal(name),
										expression,
										b.literal(is_boolean_attribute(name)),
									),
								),
							),
						);
					}
				} else if (attr.type === 'SpreadAttribute') {
					spread_attributes?.push(
						b.spread(/** @type {AST.Expression} */ (visit(attr.argument, state))),
					);
				}
			}

			if (class_attribute !== null) {
				const attr_value = /** @type {AST.Expression} */ (class_attribute.value);
				if (attr_value.type === 'Literal') {
					let value = attr_value.value;

					if (scoping_hash) {
						value = `${scoping_hash} ${value}`;
					}

					handle_static_attr(class_attribute.name.name, value);
				} else {
					const metadata = { tracking: false, await: false };
					let expression = /** @type {AST.Expression} */ (
						visit(attr_value, { ...state, metadata })
					);

					if (scoping_hash) {
						// Pass array to clsx so it can handle objects properly
						expression = b.array([expression, b.literal(scoping_hash)]);
					}

					state.init?.push(
						b.stmt(
							b.call(
								b.member(b.id('__output'), b.id('push')),
								b.call('_$_.attr', b.literal('class'), expression),
							),
						),
					);
				}
			} else if (scoping_hash) {
				handle_static_attr('class', scoping_hash, is_spreading ? 'unshift' : 'push');
			}

			if (spread_attributes !== null && spread_attributes.length > 0) {
				state.init?.push(
					b.stmt(
						b.call(
							b.member(b.id('__output'), b.id('push')),
							b.call(
								'_$_.spread_attrs',
								b.object(spread_attributes),
								scoping_hash ? b.literal(scoping_hash) : undefined,
							),
						),
					),
				);
			}

			state.init?.push(
				b.stmt(
					b.call(
						b.member(b.id('__output'), b.id('push')),
						b.literal(use_self_closing_syntax ? ' />' : '>'),
					),
				),
			);

			// In dev mode, emit push_element for runtime nesting validation
			if (state.dev && !dynamic_name) {
				const element_name = /** @type {AST.Identifier} */ (node.id).name;
				const loc = node.loc;
				state.init?.push(
					b.stmt(
						b.call(
							'_$_.push_element',
							b.literal(element_name),
							b.literal(state.filename),
							b.literal(loc?.start.line ?? 0),
							b.literal(loc?.start.column ?? 0),
						),
					),
				);
			}

			if (!is_void) {
				/** @type {AST.Statement[]} */
				const init = [];
				transform_children(
					node.children,
					/** @type {TransformServerContext} */ ({
						visit,
						state: {
							...state,
							init,
							...(state.applyParentCssScope ||
							(dynamic_name && node.metadata.scoped && state.component?.css)
								? {
										applyParentCssScope:
											state.applyParentCssScope ||
											/** @type {AST.CSS.StyleSheet} */ (state.component?.css).hash,
									}
								: {}),
						},
					}),
				);

				if (init.length > 0) {
					state.init?.push(b.block(init));
				}

				if (!use_self_closing_syntax) {
					state.init?.push(
						b.stmt(
							b.call(
								b.member(b.id('__output'), b.id('push')),
								dynamic_name
									? b.template([b.quasi('</', false), b.quasi('>', false)], [tag_name])
									: b.literal('</' + /** @type {AST.Literal} */ (tag_name).value + '>'),
							),
						),
					);
				}
			}

			// In dev mode, emit pop_element after the element is fully rendered
			if (state.dev && !dynamic_name) {
				state.init?.push(b.stmt(b.call('_$_.pop_element')));
			}
		} else {
			/** @type {(AST.Property | AST.SpreadElement)[]} */
			const props = [];
			/** @type {AST.Property | null} */
			let children_prop = null;

			const apply_parent_css_scope = state.applyParentCssScope;

			for (const attr of node.attributes) {
				if (attr.type === 'Attribute') {
					if (attr.name.type === 'Identifier') {
						const metadata = { tracking: false, await: false };
						let property =
							attr.value === null
								? b.literal(true)
								: /** @type {AST.Expression} */ (
										visit(/** @type {AST.Expression} */ (attr.value), {
											...state,
											metadata,
										})
									);

						if (attr.name.name === 'children') {
							children_prop = b.prop(
								'init',
								b.id('children'),
								b.call('_$_.normalize_children', property),
							);
							continue;
						}

						props.push(b.prop('init', b.key(attr.name.name), property));
					}
				} else if (attr.type === 'SpreadAttribute') {
					props.push(
						b.spread(
							/** @type {AST.Expression} */ (
								visit(attr.argument, { ...state, metadata: { ...state.metadata } })
							),
						),
					);
				}
			}

			const children_filtered = node.children.filter(
				(child) => child.type !== 'EmptyStatement' && child.type !== 'Component',
			);

			if (children_filtered.length > 0) {
				const component_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node));
				const children = b.call(
					'_$_.ripple_element',
					/** @type {AST.Expression} */ (
						visit(b.component(b.id('render_children'), [], children_filtered), {
							...context.state,
							...(apply_parent_css_scope ||
							(is_element_dynamic(node) && node.metadata.scoped && state.component?.css)
								? {
										applyParentCssScope:
											apply_parent_css_scope ||
											/** @type {AST.CSS.StyleSheet} */ (state.component?.css).hash,
									}
								: {}),
							scope: component_scope,
							namespace: child_namespace,
						})
					),
				);

				if (children_prop) {
					children_prop.value = b.logical(
						'??',
						/** @type {AST.Expression} */ (children_prop.value),
						children,
					);
				} else {
					children_prop = b.prop('init', b.id('children'), children);
				}
			}

			if (children_prop) {
				props.push(children_prop);
			}

			// For SSR, determine if we should await based on component metadata
			const args = [b.id('__output'), b.object(props)];

			// Check if this is a locally defined component and if it's async
			const component_name = node.id.type === 'Identifier' ? node.id.name : null;
			const local_metadata = component_name
				? state.component_metadata.find((m) => m.id === component_name)
				: null;
			const comp_id = b.id('comp');
			const args_id = b.id('args');
			const comp_call = b.call(comp_id, b.spread(args_id));
			const comp_call_regular = b.stmt(comp_call);
			const comp_call_await = b.stmt(b.await(comp_call));

			/** @type {AST.Statement[]} */
			const init = [];
			const visited_id = /** @type {AST.Expression} */ (visit(node.id, state));
			/** @type {AST.Statement[]} */
			const statements = [
				b.const(comp_id, is_element_dynamic(node) ? b.call('_$_.get', visited_id) : visited_id),
				b.const(args_id, b.array(args)),
			];

			if (local_metadata) {
				if (local_metadata?.async) {
					statements.push(comp_call_await);

					if (state.metadata?.await === false) {
						state.metadata.await = true;
					}
				} else {
					statements.push(comp_call_regular);
				}
			} else if (!is_element_dynamic(node)) {
				// it's imported element, so it could be async
				statements.push(
					b.if(
						b.member(comp_id, b.id('async'), false, true),
						b.block([comp_call_await]),
						b.if(comp_id, b.block([comp_call_regular])),
					),
				);

				if (state.metadata?.await === false) {
					state.metadata.await = true;
				}
			} else {
				// if it's a dynamic element, build the element output
				// and store the results in the `init` array
				visit(
					node,
					/** @type {TransformServerState} */ ({
						...state,
						dynamicElementName: b.template([b.quasi('', false), b.quasi('', false)], [comp_id]),
						init,
					}),
				);

				statements.push(
					b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_OPEN))),
				);

				statements.push(
					b.if(
						b.binary('===', b.unary('typeof', comp_id), b.literal('function')),
						b.block([
							b.if(
								b.member(comp_id, b.id('async')),
								b.block([comp_call_await]),
								b.block([comp_call_regular]),
							),
						]),
						// make sure that falsy values for dynamic element or component don't get rendered
						b.if(comp_id, b.block(init)),
					),
				);

				statements.push(
					b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_CLOSE))),
				);

				// Mark parent component as async since this child component could potentially be async
				if (state.metadata?.await === false) {
					state.metadata.await = true;
				}
			}

			state.init?.push(b.block(statements));
		}
	},

	SwitchStatement(node, context) {
		if (!is_inside_component(context)) {
			return context.next();
		}

		const cases = [];

		for (const switch_case of node.cases) {
			const case_body = [];

			if (switch_case.consequent.length !== 0) {
				const flattened_consequent = flatten_switch_consequent(switch_case.consequent);
				const consequent_scope =
					context.state.scopes.get(switch_case.consequent) || context.state.scope;
				const consequent = b.block(
					transform_body(flattened_consequent, {
						...context,
						state: { ...context.state, scope: consequent_scope },
					}),
				);
				case_body.push(...consequent.body);
			}

			cases.push(
				b.switch_case(
					switch_case.test ? /** @type {AST.Expression} */ (context.visit(switch_case.test)) : null,
					case_body,
				),
			);
		}

		context.state.init?.push(
			b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_OPEN))),
		);

		context.state.init?.push(
			b.switch(/** @type {AST.Expression} */ (context.visit(node.discriminant)), cases),
		);

		context.state.init?.push(
			b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_CLOSE))),
		);
	},

	ForOfStatement(node, context) {
		if (!is_inside_component(context)) {
			context.next();
			return;
		}
		const body_scope = context.state.scopes.get(node.body);

		context.state.init?.push(
			b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_OPEN))),
		);

		const body = transform_body(/** @type {AST.BlockStatement} */ (node.body).body, {
			...context,
			state: { ...context.state, scope: /** @type {ScopeInterface} */ (body_scope) },
		});

		if (node.index) {
			context.state.init?.push(b.var(node.index, b.literal(0)));
			body.push(b.stmt(b.update('++', node.index)));
		}

		context.state.init?.push(
			b.for_of(
				/** @type {AST.VariableDeclaration} */ (context.visit(node.left)),
				/** @type {AST.Expression} */
				(context.visit(node.right)),
				b.block(body),
			),
		);

		context.state.init?.push(
			b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_CLOSE))),
		);
	},

	IfStatement(node, context) {
		if (!is_inside_component(context)) {
			context.next();
			return;
		}

		const consequent_body =
			node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];

		const consequent = b.block(
			transform_body(consequent_body, {
				...context,
				state: {
					...context.state,
					scope: /** @type {ScopeInterface} */ (
						context.state.scopes.get(node.consequent) || context.state.scope
					),
				},
			}),
		);

		context.state.init?.push(
			b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_OPEN))),
		);

		/** @type {AST.BlockStatement | AST.IfStatement | null} */
		let alternate = null;
		if (node.alternate) {
			const alternate_scope = context.state.scopes.get(node.alternate) || context.state.scope;
			const alternate_body_nodes =
				node.alternate.type === 'IfStatement'
					? [node.alternate]
					: /** @type {AST.BlockStatement} */ (node.alternate).body;

			alternate = b.block(
				transform_body(alternate_body_nodes, {
					...context,
					state: { ...context.state, scope: alternate_scope },
				}),
			);
		}

		context.state.init?.push(
			b.if(/** @type {AST.Expression} */ (context.visit(node.test)), consequent, alternate),
		);

		context.state.init?.push(
			b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_CLOSE))),
		);
	},

	ReturnStatement(node, context) {
		if (!is_inside_component(context)) {
			return context.next();
		}
		const info = context.state.return_flags?.get(node);
		if (info) {
			return b.stmt(b.assignment('=', b.id(info.name), b.true));
		}
		return context.next();
	},

	AssignmentExpression(node, context) {
		const left = node.left;

		// Handle lazy binding assignments (e.g., a = 5 where a is from let &{a} = obj)
		if (left.type === 'Identifier') {
			const binding = context.state.scope?.get(left.name);
			if (binding?.transform?.assign && binding.node !== left) {
				let value = /** @type {AST.Expression} */ (context.visit(node.right));

				// For compound operators (+=, -=, *=, /=), expand to read + operation
				if (node.operator !== '=') {
					const operator = node.operator.slice(0, -1); // '+=' -> '+'
					const current = binding.transform.read(left);
					value = b.binary(/** @type {AST.BinaryOperator} */ (operator), current, value);
				}

				return binding.transform.assign(left, value);
			}
		}

		return context.next();
	},

	UpdateExpression(node, context) {
		const argument = node.argument;

		// Handle lazy binding updates (e.g., a++ where a is from let &{a} = obj)
		if (argument.type === 'Identifier') {
			const binding = context.state.scope?.get(argument.name);
			if (binding?.transform?.update && binding.node !== argument) {
				return binding.transform.update(node);
			}
		}
	},

	ServerIdentifier(node, context) {
		return b.id('_$_server_$_');
	},

	StyleIdentifier(node, context) {
		return b.id(STYLE_IDENTIFIER);
	},

	ImportDeclaration(node, context) {
		const { state } = context;

		if (!state.to_ts && node.importKind === 'type') {
			return b.empty;
		}

		if (state.ancestor_server_block) {
			if (!node.specifiers.length) {
				return b.empty;
			}

			/** @type {AST.VariableDeclaration[]} */
			const locals = state.server_block_locals;
			for (const spec of node.specifiers) {
				const original_name = spec.local.name;
				const name = obfuscate_identifier(original_name);
				spec.local = b.id(name);
				locals.push(b.const(original_name, b.id(name)));
			}
			state.imports.add(node);
			return b.empty;
		}

		return /** @type {AST.ImportDeclaration} */ ({
			...node,
			specifiers: node.specifiers
				.filter((spec) => /** @type {AST.ImportSpecifier} */ (spec).importKind !== 'type')
				.map((spec) => context.visit(spec)),
		});
	},

	TryStatement(node, context) {
		if (!is_inside_component(context)) {
			return context.next();
		}

		// If there's a pending block, this is an async operation
		const has_pending = node.pending !== null;
		if (has_pending && context.state.metadata?.await === false) {
			context.state.metadata.await = true;
		}

		const metadata = { await: false };
		const body = transform_body(node.block.body, {
			...context,
			state: { ...context.state, metadata },
		});

		// Check if the try block itself contains async operations
		const is_async = metadata.await || has_pending;

		if (is_async) {
			if (context.state.metadata?.await === false) {
				context.state.metadata.await = true;
			}

			const pending_position_name = node.pending
				? context.state.scope.generate('__pending_pos')
				: null;

			// Render pending block first, saving position so we can remove it after async resolves
			if (node.pending) {
				context.state.init?.push(
					b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_OPEN))),
				);
				const pending_body = transform_body(node.pending.body, {
					...context,
					state: {
						...context.state,
						scope: /** @type {ScopeInterface} */ (context.state.scopes.get(node.pending)),
					},
				});
				context.state.init?.push(
					b.var(
						b.id(/** @type {string} */ (pending_position_name)),
						b.member(b.member(b.id('__output'), b.id('body')), b.id('length')),
					),
				);
				context.state.init?.push(...pending_body);
			}

			// For SSR with pending block: render the resolved content wrapped in async
			// In a streaming SSR implementation, we'd render pending first, then stream resolved
			const handler = node.handler;
			/** @type {AST.Statement[]} */
			let try_statements = body;
			if (handler != null) {
				try_statements = [
					b.try(
						b.block(body),
						b.catch_clause(
							handler.param || b.id('error'),
							b.block(
								transform_body(handler.body.body, {
									...context,
									state: {
										...context.state,
										scope: /** @type {ScopeInterface} */ (context.state.scopes.get(handler.body)),
									},
								}),
							),
						),
					),
				];
			}

			// Remove pending content before rendering resolved/catch content
			if (node.pending) {
				try_statements = [
					b.stmt(
						b.assignment(
							'=',
							b.member(b.id('__output'), b.id('body')),
							b.call(
								b.member(b.member(b.id('__output'), b.id('body')), b.id('slice')),
								b.literal(0),
								b.id(/** @type {string} */ (pending_position_name)),
							),
						),
					),
					...try_statements,
				];
			}

			context.state.init?.push(
				b.stmt(b.await(b.call('_$_.async', b.thunk(b.block(try_statements), true)))),
			);

			if (node.pending) {
				context.state.init?.push(
					b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(BLOCK_CLOSE))),
				);
			}
		} else {
			// No async, just regular try/catch
			if (node.handler != null) {
				const handler_body = transform_body(node.handler.body.body, {
					...context,
					state: {
						...context.state,
						scope: /** @type {ScopeInterface} */ (context.state.scopes.get(node.handler.body)),
					},
				});

				context.state.init?.push(
					b.try(
						b.block(body),
						b.catch_clause(node.handler.param || b.id('error'), b.block(handler_body)),
					),
				);
			} else {
				context.state.init?.push(...body);
			}
		}
	},

	AwaitExpression(node, context) {
		const { state } = context;

		if (state.to_ts) {
			return context.next();
		}

		if (state.metadata?.await === false) {
			state.metadata.await = true;
		}

		return b.await(/** @type {AST.AwaitExpression} */ (context.visit(node.argument)));
	},

	MemberExpression(node, context) {
		return context.next();
	},

	RippleExpression(node, { visit, state }) {
		const metadata = { await: false };
		let expression = /** @type {AST.Expression} */ (visit(node.expression, { ...state, metadata }));
		const is_children_expression = is_children_template_expression(node.expression, state.scope);

		if (expression.type === 'Literal') {
			state.init?.push(
				b.stmt(
					b.call(b.member(b.id('__output'), b.id('push')), b.literal(escape(expression.value))),
				),
			);
		} else if (is_children_expression) {
			state.init?.push(b.stmt(b.call('_$_.render_expression', b.id('__output'), expression)));
		} else {
			state.init?.push(
				b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.call('_$_.escape', expression))),
			);
		}
	},

	Text(node, context) {
		const metadata = { await: false };
		let expression = /** @type {AST.Expression} */ (
			context.visit(node.expression, { ...context.state, metadata })
		);

		if (expression.type === 'Literal') {
			context.state.init?.push(
				b.stmt(
					b.call(b.member(b.id('__output'), b.id('push')), b.literal(escape(expression.value))),
				),
			);
		} else {
			context.state.init?.push(
				b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.call('_$_.escape', expression))),
			);
		}
	},

	Tsx(node, { visit, state }) {
		const converted_children = node.children
			.map((child) => jsx_to_ripple_node(/** @type {AST.Node} */ (child)))
			.flat()
			.filter((child) => child != null);

		/** @type {AST.Statement[]} */
		const init = [];
		transform_children(
			converted_children,
			/** @type {TransformServerContext} */ ({
				visit,
				state: {
					...state,
					init,
				},
			}),
		);

		if (state.template_child) {
			// Template body: push children statements inline
			if (init.length > 0) {
				state.init?.push(b.block(init));
			}
		} else {
			// Expression context: return ripple_element(render_fn)
			const render_fn = b.function(b.id('render_children'), [b.id('__output')], b.block(init));
			return b.call('_$_.ripple_element', render_fn);
		}
	},

	Html(node, { visit, state }) {
		const metadata = { await: false };
		const expression = /** @type {AST.Expression} */ (
			visit(node.expression, { ...state, metadata })
		);

		// For literal values, compute hash at build time
		if (expression.type === 'Literal') {
			const value = String(expression.value ?? '');
			const hash_value = hash(value);
			// Push hash comment
			state.init?.push(
				b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(`<!--${hash_value}-->`))),
			);
			// Push the HTML content
			state.init?.push(b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(value))));
			// Push empty comment as end marker
			state.init?.push(
				b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal('<!---->'))),
			);
		} else {
			// For dynamic values, compute hash at runtime
			// Create a variable to store the value
			const value_id = state.scope?.generate('html_value');
			if (value_id) {
				state.init?.push(
					b.const(value_id, b.call(b.id('String'), b.logical('??', expression, b.literal('')))),
				);
				// Compute hash at runtime using _$_.hash and push as comment
				state.init?.push(
					b.stmt(
						b.call(
							b.member(b.id('__output'), b.id('push')),
							b.binary(
								'+',
								b.binary('+', b.literal('<!--'), b.call('_$_.hash', b.id(value_id))),
								b.literal('-->'),
							),
						),
					),
				);
				// Push the HTML content
				state.init?.push(b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.id(value_id))));
				// Push empty comment as end marker
				state.init?.push(
					b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal('<!---->'))),
				);
			}
		}
	},

	ScriptContent(node, context) {
		context.state.init?.push(
			b.stmt(b.call(b.member(b.id('__output'), b.id('push')), b.literal(node.content))),
		);
	},

	ServerBlock(node, context) {
		const exports = node.metadata.exports;

		// Convert Imports inside ServerBlock to local variables
		// ImportDeclaration() visitor will add imports to the top of the module
		/** @type {AST.VariableDeclaration[]} */
		const server_block_locals = [];

		const block = /** @type {AST.BlockStatement} */ (
			context.visit(node.body, {
				...context.state,
				ancestor_server_block: node,
				server_block_locals,
				server_exported_names: [],
			})
		);

		if (exports.size === 0) {
			return {
				...block,
				body: [...server_block_locals, ...block.body],
			};
		}

		const file_path = context.state.filename;
		const rpc_modules = globalThis.rpc_modules;

		if (rpc_modules) {
			for (const name of exports) {
				const func_path = file_path + '#' + name;
				// needs to be a sha256 hash of func_path, to avoid leaking file structure
				const hash = createHash('sha256').update(func_path).digest('hex').slice(0, 8);
				rpc_modules.set(hash, [file_path, name]);
			}
		}

		return b.export(
			b.const(
				'_$_server_$_',
				b.call(
					b.thunk(
						b.block([
							b.var('_$_server_$_', b.object([])),
							...server_block_locals,
							...block.body,
							b.return(b.id('_$_server_$_')),
						]),
					),
				),
			),
		);
	},

	Program(node, context) {
		// We need a Program visitor to make sure all top level entities are visited
		// Without it, and without at least one export component
		// other components are not visited
		/** @type {Array<AST.Statement | AST.Directive | AST.ModuleDeclaration>} */
		const statements = [];

		for (const statement of node.body) {
			statements.push(
				/** @type {AST.Statement | AST.Directive | AST.ModuleDeclaration} */ (
					context.visit(statement)
				),
			);
		}

		return { ...node, body: statements };
	},
};

/**
 * @param {string} filename
 * @param {string} source
 * @param {AnalysisResult} analysis
 * @param {boolean} minify_css
 * @param {boolean} [dev]
 * @returns {{ ast: AST.Program; js: { code: string; map: RawSourceMap | null }; css: string; }}
 */
export function transform_server(filename, source, analysis, minify_css, dev = false) {
	// Use component metadata collected during the analyze phase
	const component_metadata = analysis.component_metadata || [];

	/** @type {TransformServerState} */
	const state = {
		imports: new Set(),
		init: null,
		scope: analysis.scope,
		scopes: analysis.scopes,
		serverIdentifierPresent: analysis.metadata.serverIdentifierPresent,
		stylesheets: [],
		component_metadata,
		ancestor_server_block: undefined,
		server_block_locals: [],
		server_exported_names: [],
		filename,
		namespace: 'html',
		// TODO: should we remove all `to_ts` usages we use the client rendering for that?
		to_ts: false,
		metadata: {},
		dev,
	};

	state.imports.add(`import * as _$_ from 'ripple/internal/server'`);

	const program = /** @type {AST.Program} */ (walk(analysis.ast, { ...state }, visitors));

	const css = render_stylesheets(state.stylesheets, minify_css);

	// Add CSS registration if there are stylesheets
	if (state.stylesheets.length > 0 && css) {
		// Register each stylesheet's CSS
		for (const stylesheet of state.stylesheets) {
			const css_for_component = render_stylesheets([stylesheet]);
			/** @type {AST.Program} */ (program).body.push(
				b.stmt(
					b.call('_$_.register_css', b.literal(stylesheet.hash), b.literal(css_for_component)),
				),
			);
		}
	}

	// Add async property to component functions
	for (const import_node of state.imports) {
		if (typeof import_node === 'string') {
			program.body.unshift(b.stmt(b.id(import_node)));
		} else {
			program.body.unshift(import_node);
		}
	}

	const js = print(program, /** @type {Visitors<AST.Node, TransformServerState>} */ (ts()), {
		sourceMapContent: source,
		sourceMapSource: path.basename(filename),
	});

	return {
		ast: /** @type {AST.Program} */ (program),
		js,
		css,
	};
}
