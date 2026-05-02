/**
@import * as AST from 'estree';
@import * as ESTreeJSX from 'estree-jsx';
@import { RawSourceMap } from 'source-map';
@import {
	AnalysisResult,
	TransformClientContext,
	VisitorClientContext,
	TransformClientState,
	ScopeInterface,
	Visitors,
	Binding,
}	from '../../../types/index';
@import { CompileError } from '../../../types/index';
@import { RequiredPresent } from '../../helpers';
 */

/**
@typedef {Map<number, {offset: number, delta: number}>} PostProcessingChanges;
@typedef {number[]} LineOffsets;
*/

import { walk } from 'zimmerframe';
import path from 'node:path';
import { print } from 'esrap';
import tsx from 'esrap/languages/tsx';
import {
	builders,
	clone_expression_node,
	IS_CONTROLLED,
	IS_INDEXED,
	TEMPLATE_FRAGMENT,
	TEMPLATE_SVG_NAMESPACE,
	TEMPLATE_MATHML_NAMESPACE,
	DEFAULT_NAMESPACE,
	sanitizeTemplateString,
	SERVER_IDENTIFIER,
	obfuscateIdentifier,
	object,
	renderStylesheets,
	getOriginalEventName,
	isEventAttribute,
	isInsideComponent as is_inside_component,
	normalizeEventName,
	shouldPreserveComment,
	formatComment,
	setLocation,
} from '@tsrx/core';
const b = builders;
import {
	build_assignment,
	visit_assignment_expression,
	escape_html,
	is_boolean_attribute,
	is_dom_property,
	is_declared_function_within_component,
	is_inside_call_expression,
	is_value_static,
	is_void_element,
	is_element_dom_element,
	is_ripple_track_call,
	normalize_children,
	build_getter,
	determine_namespace_for_children,
	index_to_key,
	is_element_dynamic,
	is_children_template_expression,
	is_inside_left_side_assignment,
	strong_hash,
	flatten_switch_consequent,
	get_ripple_namespace_call_name,
	is_ripple_import,
	replace_lazy_param_pattern,
	ripple_import_requires_block,
	strip_class_typescript_syntax,
	jsx_to_ripple_node,
} from '../../utils.js';
import { prune_css } from '../../analyze/prune.js';
import is_reference from 'is-reference';

/**
 * Re-run CSS pruning on JSX converted from a `<tsx>` block so it receives the
 * same scoped metadata as normal Ripple template elements before codegen.
 *
 * @param {AST.Node[]} nodes
 * @param {TransformClientState} state
 * @returns {void}
 */
function apply_tsrx_css_scoping(nodes, state) {
	const component = state.component;
	if (!component?.css) {
		return;
	}
	const css = /** @type {AST.CSS.StyleSheet} */ (component.css);

	const style_classes = component.metadata.styleClasses ?? new Map();
	const top_scoped_classes = component.metadata.topScopedClasses ?? new Map();

	/**
	 * @param {AST.Node} node
	 * @returns {void}
	 */
	function visit_node(node) {
		if (node.type === 'Element') {
			prune_css(css, node, style_classes, top_scoped_classes);
			for (const child of node.children) {
				visit_node(child);
			}
			return;
		}

		if ('children' in node && Array.isArray(node.children)) {
			for (const child of node.children) {
				visit_node(/** @type {AST.Node} */ (child));
			}
		}
	}

	for (const node of nodes) {
		visit_node(node);
	}
}

/**
 *
 * @param {AST.FunctionDeclaration | AST.FunctionExpression | AST.ArrowFunctionExpression} node
 * @param {TransformClientContext} context
 */
function visit_function(node, context) {
	// Function overload signatures don't have a body - they're TypeScript-only
	// Remove them when compiling to JavaScript
	if (!context.state.to_ts && !node.body) {
		return b.empty;
	}

	const state = context.state;
	const metadata = /** @type {AST.FunctionExpression['metadata']} */ (node.metadata);

	if (context.state.to_ts) {
		return context.next(state);
	}

	delete node.returnType;
	delete node.typeParameters;

	for (const param of node.params) {
		delete param.typeAnnotation;
		// Handle AssignmentPattern (parameters with default values)
		if (param.type === 'AssignmentPattern' && param.left) {
			delete param.left.typeAnnotation;
		}
	}

	// Replace lazy destructuring params with generated identifiers
	const transformed_params = node.params.map((param) => {
		const pattern = param.type === 'AssignmentPattern' ? param.left : param;
		if (pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') {
			const transformed_pattern = replace_lazy_param_pattern(pattern);
			if (param.type === 'AssignmentPattern') {
				return /** @type {AST.AssignmentPattern} */ ({ ...param, left: transformed_pattern });
			}
			return transformed_pattern;
		}
		return param;
	});

	let body = /** @type {AST.BlockStatement | AST.Expression} */ (
		context.visit(node.body, {
			...state,
			// we are new context so tracking no longer applies
			metadata: { ...state.metadata, tracking: false },
		})
	);

	if (
		metadata?.tracked === true &&
		!is_inside_component(context, true) &&
		body.type === 'BlockStatement'
	) {
		body = { ...body, body: [b.var('__block', b.call('_$_.scope')), ...body.body] };
	}

	return {
		...node,
		params: transformed_params.map((param) => context.visit(param, state)),
		body,
	};
}

/**
 * @param {AST.Element} node
 * @param {number} index
 * @param {TransformClientContext} context
 */
function visit_head_element(node, index, context) {
	const { state, visit } = context;

	/** @type {TransformClientState['init']} */
	const init = [];
	/** @type {TransformClientState['update']} */
	const update = [];
	/** @type {TransformClientState['final']} */
	const final = [];
	/** @type {TransformClientState['template']} */
	const template = [];

	transform_children(
		node.children,
		/** @type {VisitorClientContext} */ ({
			visit,
			state: { ...state, init, update, final, template, inside_head: true },
			root: true,
		}),
	);

	if (init.length > 0 || update.length > 0 || final.length > 0) {
		// Generate a hash for this head element based on filename and index
		// Use both filename and index to ensure uniqueness across multiple head blocks
		const hash_source = `${state.filename}:head:${index}:${node.start ?? 0}`;
		const hash_value = strong_hash(hash_source);

		context.state.init?.push(
			b.stmt(
				b.call(
					'_$_.head',
					b.literal(hash_value),
					b.arrow(
						[b.id('__anchor')],
						b.block([
							...init,
							.../** @type {AST.Statement[]} */ (update.map((u) => u.operation())),
							...final,
						]),
					),
				),
			),
		);
	}
}

/**
 * @param {NonNullable<TransformClientState['init']>} init
 * @param {NonNullable<TransformClientState['update']>} update
 * @param {TransformClientState} state
 */
function apply_updates(init, update, state) {
	if (update.length === 1 && !update[0].needsPrevTracking) {
		init.push(
			b.stmt(
				b.call(
					'_$_.render',
					b.thunk(
						b.block(
							update.map((u) => {
								if (u.initial) {
									return u.operation(u.expression);
								}
								return u.operation();
							}),
						),
					),
				),
			),
		);
	} else {
		/** @type {AST.Property[]} */
		const initial = [];
		/** @type {AST.Statement[]} */
		const render_statements = [];
		let index = 0;

		/**
			@type {
				Map<
					AST.Identifier | AST.Expression,
					RequiredPresent<
						NonNullable<TransformClientState['update']>[number],
						'initial' | 'identity' | 'expression'
					>[]
				>
			}
		 */
		const grouped_updates = new Map();

		for (const u of update) {
			if (u.initial) {
				const id = /** @type {AST.Identifier | AST.Expression} */ (
					u.identity.type === 'Identifier'
						? /** @type {Binding} */ (state.scope.get(u.identity.name)).node
						: u.identity
				);
				let updates = grouped_updates.get(id);

				if (updates === undefined) {
					updates = [];
					grouped_updates.set(id, updates);
				}
				updates.push(u);
			}
		}

		for (const [, updates] of grouped_updates) {
			if (updates.length === 1) {
				const u = updates[0];
				const key = index_to_key(index);
				initial.push(b.prop('init', b.id(key), u.initial));
				render_statements.push(
					b.var('__' + key, u.expression),
					b.if(
						b.binary('!==', b.member(b.id('__prev'), b.id(key)), b.id('__' + key)),
						b.block(
							u.needsPrevTracking
								? [
										u.operation(b.id('__' + key), b.member(b.id('__prev'), b.id(key))),
										b.stmt(
											b.assignment('=', b.member(b.id('__prev'), b.id(key)), b.id('__' + key)),
										),
									]
								: [
										u.operation(
											b.assignment('=', b.member(b.id('__prev'), b.id(key)), b.id('__' + key)),
										),
									],
						),
					),
				);
				index++;
			} else {
				const key = index_to_key(index);
				/** @type {Array<AST.Statement>} */
				const if_body = [];
				initial.push(b.prop('init', b.id(key), updates[0].initial));
				render_statements.push(
					b.var('__' + key, updates[0].expression),
					b.if(
						b.binary('!==', b.member(b.id('__prev'), b.id(key)), b.id('__' + key)),
						b.block(if_body),
					),
				);
				for (const u of updates) {
					if_body.push(
						u.needsPrevTracking
							? u.operation(b.id('__' + key), b.member(b.id('__prev'), b.id(key)))
							: u.operation(b.id('__' + key)),
					);
					index++;
				}
				// Update prev after all operations
				if_body.push(
					b.stmt(b.assignment('=', b.member(b.id('__prev'), b.id(key)), b.id('__' + key))),
				);
			}
		}

		for (const u of update) {
			if (!u.initial && !u.needsPrevTracking) {
				render_statements.push(u.operation());
			}
		}

		init.push(
			b.stmt(
				b.call(
					'_$_.render',
					b.arrow([b.id('__prev')], b.block(render_statements)),
					b.object(initial),
				),
			),
		);
	}
}

/**
 * @param {AST.Element} node
 * @param {TransformClientContext} context
 */
function visit_title_element(node, context) {
	const normalized = normalize_children(node.children, context);
	const content = normalized[0];

	const metadata = { tracking: false };
	const visited = context.visit(content, { ...context.state, metadata });
	const result = /** @type {AST.Expression} */ (
		/** @type {{expression?: AST.Expression}} */ (visited).expression
	);

	if (metadata.tracking) {
		context.state.init?.push(
			b.stmt(
				b.call(
					'_$_.render',
					b.thunk(b.block([b.stmt(b.assignment('=', b.id('_$_.document.title'), result))])),
				),
			),
		);
	} else {
		context.state.init?.push(b.stmt(b.assignment('=', b.id('_$_.document.title'), result)));
	}
}

/**
 * @param {string} name
 * @param {TransformClientContext} context
 * @param {boolean} [is_obfuscated]
 * @returns {string}
 */
function set_hidden_import_from_ripple(name, context, is_obfuscated = false) {
	if (!is_obfuscated) {
		name = obfuscateIdentifier(name);
	}
	if (!context.state.imports.has(`import { ${name} } from 'ripple/compiler/internal/import'`)) {
		context.state.imports.add(`import { ${name} } from 'ripple/compiler/internal/import'`);
	}

	return name;
}

/**
 * @param {AST.NodeWithLocation} loc_info
 * @param {number} [start_offset]
 * @param {number} [length]
 * @returns {AST.NodeWithLocation}
 */
function slice_loc_info(loc_info, start_offset = 0, length) {
	if (length === undefined) {
		length = loc_info.end - loc_info.start - start_offset;
	}
	return {
		start: loc_info.start + start_offset,
		end: loc_info.start + start_offset + length,
		loc: {
			start: {
				line: loc_info.loc.start.line,
				column: loc_info.loc.start.column + start_offset,
			},
			end: {
				line: loc_info.loc.start.line,
				column: loc_info.loc.start.column + start_offset + length,
			},
		},
	};
}

/**
 * @param {string | undefined} name
 * @returns {boolean}
 */
function ripple_namespace_requires_block(name) {
	return name !== undefined && ripple_import_requires_block(name);
}

/**
 * @param {TransformClientContext} context
 * @param {Partial<TransformClientState>} [more_state]
 * @return TransformClientContext
 */
function SetContextForOutsideComponent(context, more_state = {}) {
	return /** @type {TransformClientContext} */ ({
		...context,
		state: SetStateForOutsideComponent(context.state, more_state),
	});
}

/**
 * @param {TransformClientState} state
 * @param {Partial<TransformClientState>} [more_state]
 * @return TransformClientState
 */
function SetStateForOutsideComponent(state, more_state = {}) {
	return /** @type {TransformClientState} */ ({
		...state,
		...more_state,
		init: null,
		update: null,
		final: null,
	});
}

/** @type {Visitors<AST.Node, TransformClientState>} */
const visitors = {
	_(node, { next, state, path }) {
		if (!node.metadata) {
			node.metadata = { path: [...path] };
		} else {
			node.metadata.path = [...path];
		}

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
			if (context.state.to_ts) {
				if (node.tracked) {
					// Check if this identifier is used as a dynamic component/element
					// by checking if it has a capitalized name in metadata
					const binding = context.state.scope.get(node.name);
					if (binding?.metadata?.is_dynamic_component) {
						// Capitalize the identifier for TypeScript
						const capitalized_name = node.name.charAt(0).toUpperCase() + node.name.slice(1);
						const capitalized_node = {
							...node,
							name: capitalized_name,
							metadata: {
								...node.metadata,
								is_capitalized: true,
							},
						};
						const member = b.member(
							capitalized_node,
							b.literal('#v'),
							true,
							!is_inside_left_side_assignment(node),
							/** @type {AST.NodeWithLocation} */ (node),
						);
						member.tracked = true;
						return member;
					}
					const member = b.member(
						node,
						b.literal('#v'),
						true,
						!is_inside_left_side_assignment(node),
						/** @type {AST.NodeWithLocation} */ (node),
					);
					member.tracked = true;
					return member;
				}
			} else {
				const binding = context.state.scope.get(node.name);
				const is_right_side_of_assignment =
					parent.type === 'AssignmentExpression' && parent.right === node;
				if (
					(context.state.metadata?.tracking === false ||
						(parent.type !== 'AssignmentExpression' && parent.type !== 'UpdateExpression') ||
						is_right_side_of_assignment) &&
					(node.tracked ||
						binding?.kind === 'prop' ||
						binding?.kind === 'index' ||
						binding?.kind === 'prop_fallback' ||
						binding?.kind === 'lazy' ||
						binding?.kind === 'lazy_fallback' ||
						binding?.kind === 'for_pattern') &&
					binding?.node !== node
				) {
					if (context.state.metadata?.tracking === false) {
						context.state.metadata.tracking = true;
					}
				}
				return build_getter(node, context);
			}
		}
	},

	ServerIdentifier(node, context) {
		const id = b.id(SERVER_IDENTIFIER, /** @type {AST.NodeWithLocation} */ (node));
		id.metadata.source_name = '#server';
		return id;
	},

	Style(node, context) {
		const class_name = typeof node.value.value === 'string' ? node.value.value : '';
		const hash = context.state.component?.css?.hash;
		const value = hash ? `${hash} ${class_name}` : class_name;
		return b.literal(value);
	},

	ImportDeclaration(node, context) {
		const { state } = context;

		if (!state.to_ts && node.importKind === 'type') {
			return b.empty;
		}

		if (state.to_ts && state.ancestor_server_block) {
			/** @type {AST.VariableDeclaration[]} */
			const locals = state.server_block_locals;
			for (const spec of node.specifiers) {
				const original_name = spec.local.name;
				const name = obfuscateIdentifier(original_name);
				if (
					spec.type !== 'ImportSpecifier' ||
					(spec.imported && /** @type {AST.Identifier} */ (spec.imported).name !== spec.local.name)
				) {
					spec.local.name = name;
				} else {
					spec.local = b.id(name);
				}
				spec.local.metadata.source_name = original_name;
				locals.push(b.const(original_name, b.id(name)));
			}
			state.imports.add(node);
			return b.empty;
		}

		return /** @type {AST.ImportDeclaration} */ ({
			...node,
			specifiers: node.specifiers
				.filter(
					(spec) => state.to_ts || /** @type {AST.ImportSpecifier} */ (spec).importKind !== 'type',
				)
				.map((spec) => context.visit(spec)),
		});
	},

	TSNonNullExpression(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}
		return context.visit(/** @type {AST.Expression} */ (node.expression));
	},

	CallExpression(node, context) {
		if (!context.state.to_ts) {
			delete node.typeArguments;
		}
		const callee = node.callee;
		const parent = context.path.at(-1);

		if (context.state.metadata?.tracking === false) {
			context.state.metadata.tracking = true;
		}

		// Handle direct calls to ripple-imported functions: effect(), untrack(), RippleArray(), etc.
		if (!context.state.to_ts && callee.type === 'Identifier' && is_ripple_import(callee, context)) {
			const ripple_runtime_method = get_ripple_namespace_call_name(callee.name);
			if (ripple_runtime_method !== null) {
				const requires_block = ripple_namespace_requires_block(callee.name);
				return {
					...node,
					callee: b.member(b.id('_$_'), b.id(ripple_runtime_method)),
					arguments: /** @type {(AST.Expression | AST.SpreadElement)[]} */ ([
						...(requires_block ? [b.id('__block')] : []),
						...node.arguments.map((arg) => context.visit(arg)),
					]),
				};
			}
		}

		const matched_track_call = !context.state.to_ts ? is_ripple_track_call(callee, context) : null;
		if (matched_track_call) {
			const track_method_name = matched_track_call === 'trackAsync' ? 'track_async' : 'track';
			/** @type {(AST.Expression | AST.SpreadElement)[]} */
			const call_args = [];
			if (node.arguments.length === 0) {
				node.arguments.push(b.void0);
			}

			for (let i = 0; i < node.arguments.length; i++) {
				const arg = node.arguments[i];
				call_args.push(/** @type {(AST.Expression | AST.SpreadElement)} */ (context.visit(arg)));
				if (i === 0) {
					call_args.push(b.id('__block'));
					call_args.push(b.literal(node.metadata.hash));
				}
			}

			return /** @type {AST.CallExpression} */ ({
				...node,
				callee: b.member(b.id('_$_'), b.id(track_method_name)),
				arguments: call_args,
			});
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

			if (!context.state.to_ts && method_name !== null) {
				const requires_block = ripple_namespace_requires_block(object.name);
				return b.member(
					b.id('_$_'),
					b.member(
						b.id(method_name),
						b.call(
							b.id(property.name),
							.../** @type {(AST.Expression | AST.SpreadElement)[]} */ ([
								...(requires_block ? [b.id('__block')] : []),
								...node.arguments.map((arg) => context.visit(arg)),
							]),
						),
					),
				);
			}
		}

		if (
			!is_inside_component(context, true) ||
			context.state.to_ts ||
			(parent?.type === 'MemberExpression' && parent.property === node) ||
			is_inside_call_expression(context) ||
			!context.path.some((node) => node.type === 'Component') ||
			is_declared_function_within_component(callee, context)
		) {
			return context.next();
		}

		// Handle array methods that access the array
		if (callee.type === 'MemberExpression') {
			const property = callee.property;

			if (callee.computed) {
				return b.call(
					'_$_.with_scope',
					b.id('__block'),
					b.thunk(
						b.call(
							'_$_.call_property',
							/** @type {AST.Expression} */ (context.visit(callee.object)),
							/** @type {AST.Expression} */ (context.visit(property)),
							callee.optional ? b.true : undefined,
							/** @type {AST.SimpleCallExpression} */ (node).optional ? b.true : undefined,
							.../** @type {AST.Expression[]} */ (node.arguments.map((arg) => context.visit(arg))),
						),
					),
				);
			}
		}

		return b.call(
			'_$_.with_scope',
			b.id('__block'),
			b.thunk({
				...node,
				callee: /** @type {AST.Expression} */ (context.visit(callee)),
				arguments: /** @type {(AST.Expression | AST.SpreadElement)[]} */ (
					node.arguments.map((arg) => context.visit(arg))
				),
			}),
		);
	},

	TSTypeAliasDeclaration(_, context) {
		if (!context.state.to_ts) {
			return b.empty;
		}
		return context.next();
	},

	TSInterfaceDeclaration(_, context) {
		if (!context.state.to_ts) {
			return b.empty;
		}
		return context.next();
	},

	TSMappedType(_, context) {
		if (!context.state.to_ts) {
			return b.empty;
		}
		return context.next();
	},

	NewExpression(node, context) {
		const callee = node.callee;

		if (context.state.metadata?.tracking === false) {
			context.state.metadata.tracking = true;
		}

		// Transform `new RippleArray(...)`, `new RippleMap(...)`, etc. imported from 'ripple'
		if (!context.state.to_ts && callee.type === 'Identifier' && is_ripple_import(callee, context)) {
			const ripple_runtime_method = get_ripple_namespace_call_name(callee.name);
			if (ripple_runtime_method !== null) {
				const requires_block = ripple_namespace_requires_block(callee.name);
				return b.call(
					'_$_.' + ripple_runtime_method,
					...(requires_block ? [b.id('__block')] : []),
					.../** @type {(AST.Expression | AST.SpreadElement)[]} */ (
						node.arguments.map((arg) => context.visit(arg))
					),
				);
			}
		}

		if (
			context.state.to_ts ||
			!is_inside_component(context, true) ||
			is_inside_call_expression(context) ||
			is_value_static(node)
		) {
			if (!context.state.to_ts) {
				delete node.typeArguments;
			}

			return context.next();
		}

		/** @type {AST.NewExpression} */
		const new_node = {
			...node,
			callee: /** @type {AST.Expression} */ (context.visit(callee)),
			arguments: /** @type {(AST.Expression | AST.SpreadElement)[]} */ (
				node.arguments.map((arg) => context.visit(arg))
			),
		};
		if (!context.state.to_ts) {
			delete new_node.typeArguments;
		}

		return b.call('_$_.with_scope', b.id('__block'), b.thunk(new_node));
	},

	MemberExpression(node, context) {
		if (context.state.metadata?.tracking === false) {
			context.state.metadata.tracking = true;
		}

		if (node.object.type === 'MemberExpression' && node.object.optional) {
			const metadata = { tracking: false };

			const object = context.visit(node.object, { ...context.state, metadata });

			if (metadata.tracking) {
				if (/** @type {boolean | undefined} */ (context.state.metadata?.tracking) === false) {
					context.state.metadata.tracking = true;
				}

				return {
					...node,
					optional: true,
					object: /** @type {AST.Expression} */ (object),
					property: /** @type {AST.Expression} */ (context.visit(node.property)),
				};
			}
		} else {
			return context.next();
		}
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

	ExpressionStatement(node, context) {
		// Handle standalone lazy destructuring: &[data] = track(0); → const lazy0 = track(0);
		if (
			node.expression.type === 'AssignmentExpression' &&
			(node.expression.left.type === 'ObjectPattern' ||
				node.expression.left.type === 'ArrayPattern') &&
			node.expression.left.lazy &&
			node.expression.left.metadata?.lazy_id
		) {
			if (context.state.to_ts) {
				// In TypeScript mode, convert to a regular assignment (drop the pattern)
				node.expression.left.lazy = false;
				delete node.expression.left.metadata.lazy_id;
				return context.next();
			}
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

		if (context.state.to_ts) {
			for (const declarator of node.declarations) {
				if (
					(declarator.id.type === 'ObjectPattern' || declarator.id.type === 'ArrayPattern') &&
					declarator.id.lazy
				) {
					declarator.id.lazy = false;
					if (declarator.id.metadata?.lazy_id) {
						delete declarator.id.metadata.lazy_id;
					}
				}
			}
		}

		return context.next();
	},

	VariableDeclarator(node, context) {
		// In TypeScript mode, capitalize identifiers that are used as dynamic components
		if (context.state.to_ts) {
			/**
			 * Recursively capitalize identifiers in patterns (ArrayPattern, ObjectPattern)
			 * @param {AST.Pattern} pattern - The pattern node to process
			 * @returns {AST.Pattern} The transformed pattern
			 */
			const capitalize_pattern = (pattern) => {
				if (pattern.type === 'Identifier') {
					const binding = context.state.scope.get(pattern.name);
					if (binding?.metadata?.is_dynamic_component) {
						const capitalized_name = pattern.name.charAt(0).toUpperCase() + pattern.name.slice(1);
						// Add metadata to track the original name for Volar mappings
						return {
							...pattern,
							name: capitalized_name,
							metadata: {
								...pattern.metadata,
								is_capitalized: true,
							},
						};
					}
					return pattern;
				} else if (pattern.type === 'ArrayPattern') {
					return {
						...pattern,
						elements: pattern.elements.map((element) =>
							element ? capitalize_pattern(element) : element,
						),
					};
				} else if (pattern.type === 'ObjectPattern') {
					return {
						...pattern,
						properties: pattern.properties.map((prop) => {
							if (prop.type === 'Property') {
								return {
									...prop,
									value: capitalize_pattern(prop.value),
								};
							} else if (prop.type === 'RestElement') {
								return {
									...prop,
									argument: capitalize_pattern(prop.argument),
								};
							}
							return prop;
						}),
					};
				} else if (pattern.type === 'RestElement') {
					return {
						...pattern,
						argument: capitalize_pattern(pattern.argument),
					};
				} else if (pattern.type === 'AssignmentPattern') {
					return {
						...pattern,
						left: capitalize_pattern(pattern.left),
						right: /** @type {AST.Expression} */ (context.visit(pattern.right)),
					};
				}
				return pattern;
			};

			const transformed_id = capitalize_pattern(node.id);
			if (transformed_id !== node.id) {
				return {
					...node,
					id: transformed_id,
					init: node.init ? /** @type {AST.Expression} */ (context.visit(node.init)) : null,
				};
			}
		}
		return context.next();
	},

	FunctionDeclaration(node, context) {
		return /** @type AST.FunctionDeclaration | AST.EmptyStatement */ (
			visit_function(node, context)
		);
	},

	ArrowFunctionExpression(node, context) {
		return /** @type AST.ArrowFunctionExpression | AST.EmptyStatement */ (
			visit_function(node, context)
		);
	},

	FunctionExpression(node, context) {
		return /** @type AST.FunctionExpression | AST.EmptyStatement */ (visit_function(node, context));
	},

	JSXText(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}
		return b.literal(node.value + '');
	},

	JSXIdentifier(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}
		return b.id(node.name);
	},

	JSXExpressionContainer(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}
		return context.visit(node.expression);
	},

	JSXEmptyExpression(node, context) {
		// JSX comments like {/* ... */} are represented as JSXEmptyExpression
		// In TypeScript mode, preserve them as-is for prettier
		// In JavaScript mode, they're removed (which is correct since they're comments)
		if (context.state.to_ts) {
			return context.next();
		}
		// In JS mode, return empty - comments are stripped
		return b.empty;
	},

	JSXFragment(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}
		const attributes = node.openingFragment.attributes;
		const normalized_children = node.children.filter((child) => {
			return child.type !== 'JSXText' || child.value.trim() !== '';
		});

		const props = b.object(
			attributes.map((attr) => {
				if (attr.type === 'JSXAttribute') {
					return b.prop(
						'init',
						/** @type {AST.Expression} */ (context.visit(attr.name)),
						attr.value
							? /** @type {AST.Expression} */ (context.visit(attr.value))
							: b.literal(true),
					);
				} else {
					// attr.type === 'JSXSpreadAttribute'
					return b.spread(/** @type {AST.Expression} */ (context.visit(attr.argument)));
				}
			}),
		);

		if (normalized_children.length > 0) {
			props.properties.push(
				b.prop(
					'init',
					b.id('children'),
					normalized_children.length === 1
						? /** @type {AST.Expression} */ (
								context.visit(/** @type {AST.Node} */ (normalized_children[0]))
							)
						: b.array(
								normalized_children.map(
									(child) =>
										/** @type {AST.Expression} */ (context.visit(/** @type {AST.Node} */ (child))),
								),
							),
				),
			);
		}

		return b.call(
			normalized_children.length > 1 ? '__compat.jsxs' : '__compat.jsx',
			b.id('__compat.Fragment'),
			props,
		);
	},

	JSXElement(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}
		const name = node.openingElement.name;
		const attributes = node.openingElement.attributes;
		const normalized_children = node.children.filter((child) => {
			return child.type !== 'JSXText' || child.value.trim() !== '';
		});

		const props = b.object(
			attributes.map((attr) => {
				if (attr.type === 'JSXAttribute') {
					return b.prop(
						'init',
						/** @type {AST.Expression} */ (context.visit(attr.name)),
						attr.value
							? /** @type {AST.Expression} */ (context.visit(attr.value))
							: b.literal(true),
					);
				} else {
					// attr.type === 'JSXSpreadAttribute'
					return b.spread(/** @type {AST.Expression} */ (context.visit(attr.argument)));
				}
			}),
		);

		if (normalized_children.length > 0) {
			props.properties.push(
				b.prop(
					'init',
					b.id('children'),
					normalized_children.length === 1
						? /** @type {AST.Expression} */ (
								context.visit(/** @type {AST.Node} */ (normalized_children[0]))
							)
						: b.array(
								normalized_children.map(
									(child) =>
										/** @type {AST.Expression} */ (context.visit(/** @type {AST.Node} */ (child))),
								),
							),
				),
			);
		}

		return b.call(
			normalized_children.length > 1 ? '__compat.jsxs' : '__compat.jsx',
			name.type === 'JSXIdentifier' && name.name[0].toLowerCase() === name.name[0]
				? b.literal(name.name)
				: /** @type {AST.Expression} */ (context.visit(name)),
			props,
		);
	},

	TsxCompat(node, context) {
		const { state, visit } = context;

		// to_ts mode: produce a JSX fragment
		if (state.to_ts) {
			const children = /** @type {AST.TsxCompat['children']} */ (
				node.children
					.map((child) => visit(/** @type {AST.Node} */ (child), state))
					.filter((child) => child.type !== 'JSXText' || child.value.trim() !== '')
			);
			return b.jsx_fragment(children);
		}

		state.template?.push('<!>');

		const normalized_children = node.children.filter((child) => {
			return child.type !== 'JSXText' || child.value.trim() !== '';
		});
		const needs_fragment = normalized_children.length !== 1;
		const id = state.flush_node?.();
		const children_fn = b.arrow(
			[b.id('__compat')],
			needs_fragment
				? b.call(
						'__compat.jsxs',
						b.id('__compat.Fragment'),
						b.object([
							b.prop(
								'init',
								b.id('children'),
								b.array(
									/** @type {(AST.Expression | AST.SpreadElement | null)[]} */ (
										normalized_children.map((child) =>
											visit(/** @type {AST.Node} */ (child), state),
										)
									),
								),
							),
						]),
					)
				: /** @type {AST.Expression} */ (
						visit(/** @type {AST.Node} */ (normalized_children[0]), state)
					),
		);

		context.state.init?.push(
			b.stmt(b.call('_$_.tsx_compat', b.literal(node.kind), id, children_fn)),
		);
	},

	Tsx(node, context) {
		const { state, visit, path } = context;

		// to_ts mode: produce a JSX fragment
		if (state.to_ts) {
			const children = /** @type {AST.Tsx['children']} */ (
				node.children
					.map((child) => visit(/** @type {AST.Node} */ (child), state))
					.filter((child) => child.type !== 'JSXText' || child.value.trim() !== '')
			);
			return b.jsx_fragment(children);
		}

		/** @type {AST.Node[]} */
		const children_filtered = [];
		for (const raw_child of node.children) {
			const result = jsx_to_ripple_node(/** @type {AST.Node} */ (raw_child), path);
			const items = Array.isArray(result) ? result : [result];
			for (const child of items) {
				if (child == null || child.type === 'EmptyStatement') continue;
				if (child.type === 'Component') {
					state.init?.push(/** @type {AST.Statement} */ (visit(child, state)));
				} else {
					children_filtered.push(child);
				}
			}
		}
		apply_tsrx_css_scoping(children_filtered, state);

		const children_component = b.component(b.id('render_children'), [], children_filtered);

		const element = b.call(
			'_$_.tsrx_element',
			/** @type {AST.Expression} */ (
				visit(children_component, {
					...state,
					namespace: state.namespace,
					is_tsrx_element: true,
				})
			),
		);

		// Template body context: push to template and schedule init
		if (state.flush_node) {
			state.template?.push('<!>');

			const id = state.flush_node(false);

			const call = b.call('_$_.expression', id, b.thunk(element));
			state.init?.push(
				state.namespace !== DEFAULT_NAMESPACE
					? b.stmt(b.call('_$_.with_ns', b.literal(state.namespace), b.thunk(call)))
					: b.stmt(call),
			);
			return;
		}

		// Expression context: return the tsrx_element directly as an expression value
		return element;
	},

	Element(node, context) {
		const { state, visit } = context;

		if (context.state.inside_head) {
			if (node.id.type === 'Identifier' && node.id.name === 'style') {
				state.template?.push(`<style>${sanitizeTemplateString(node.css)}</style>`);
				return;
			}
			if (node.id.type === 'Identifier' && node.id.name === 'script') {
				const id = state.flush_node?.();
				state.template?.push('<!>');
				context.state.init?.push(
					b.stmt(
						b.call('_$_.script', id, /** @type {AST.Literal} */ (visit(node.children[0], state))),
					),
				);
				return;
			}
		}

		const is_dom_element = is_element_dom_element(node);
		const is_spreading = node.attributes.some((attr) => attr.type === 'SpreadAttribute');
		/** @type {(AST.Property | AST.SpreadElement)[] | null} */
		const spread_attributes = is_spreading ? [] : null;
		const child_namespace = is_dom_element
			? determine_namespace_for_children(
					/** @type {AST.Identifier} */ (node.id).name,
					state.namespace,
				)
			: state.namespace;

		/**
		 * @param {string} name
		 *  @param {string | number | bigint | boolean | RegExp | null | undefined} value
		 */
		const handle_static_attr = (name, value) => {
			const attr_value = b.literal(
				` ${name}${
					is_boolean_attribute(name) && value === true
						? ''
						: `="${value === true ? '' : escape_html(/** @type {string} */ (value), true)}"`
				}`,
			);

			if (is_spreading) {
				// For spread attributes, store just the actual value, not the full attribute string
				const actual_value =
					is_boolean_attribute(name) && value === true
						? b.literal(true)
						: b.literal(value === true ? '' : value);
				spread_attributes?.push(b.prop('init', b.literal(name), actual_value));
			} else {
				state.template?.push(attr_value);
			}
		};

		if (is_dom_element) {
			/** @type {AST.Attribute | null} */
			let class_attribute = null;
			/** @type {AST.Attribute | null} */
			let style_attribute = null;
			/** @type {TransformClientState['update']} */
			const local_updates = [];
			const element_name = /** @type {AST.Identifier} */ (node.id).name;
			const is_void = is_void_element(element_name);
			/** @type {AST.CSS.StyleSheet['hash'] | null} */
			const scoping_hash =
				state.applyParentCssScope ??
				(node.metadata.scoped && state.component?.css
					? /** @type {AST.CSS.StyleSheet} */ (state.component?.css).hash
					: null);

			state.template?.push(`<${element_name}`);

			for (const attr of node.attributes) {
				if (attr.type === 'Attribute') {
					if (attr.name.type === 'Identifier') {
						const name = attr.name.name;

						if (attr.value === null) {
							handle_static_attr(name, true);
							continue;
						}

						if (
							attr.value.type === 'Literal' &&
							name !== 'class' &&
							name !== 'style' &&
							!(name === 'value' && element_name === 'option')
						) {
							handle_static_attr(name, attr.value.value);
							continue;
						}

						if (name === 'value') {
							const id = state.flush_node?.();
							const metadata = { tracking: false };
							const expression = /** @type {AST.Expression} */ (
								visit(attr.value, { ...state, metadata })
							);

							if (metadata.tracking) {
								local_updates.push({
									operation: (key) => b.stmt(b.call('_$_.set_value', id, key)),
									expression,
									identity: attr.value,
									initial: b.void0,
								});
							} else {
								state.init?.push(b.stmt(b.call('_$_.set_value', id, expression)));
							}

							continue;
						}

						if (name === 'class') {
							class_attribute = attr;

							continue;
						}

						if (name === 'style') {
							style_attribute = attr;

							continue;
						}

						if (name === 'checked') {
							const id = state.flush_node?.();
							const metadata = { tracking: false };
							const expression = /** @type {AST.Expression} */ (
								visit(attr.value, { ...state, metadata })
							);

							if (metadata.tracking) {
								local_updates.push({
									operation: (key) => b.stmt(b.call('_$_.set_checked', id, key)),
									expression,
									identity: attr.value,
									initial: b.void0,
								});
							} else {
								state.init?.push(b.stmt(b.call('_$_.set_checked', id, expression)));
							}
							continue;
						}

						if (name === 'selected') {
							const id = state.flush_node?.();
							const metadata = { tracking: false };
							const expression = /** @type {AST.Expression} */ (
								visit(attr.value, { ...state, metadata })
							);

							if (metadata.tracking) {
								local_updates.push({
									operation: (key) => b.stmt(b.call('_$_.set_selected', id, key)),
									expression,
									identity: attr.value,
									initial: b.void0,
								});
							} else {
								state.init?.push(b.stmt(b.call('_$_.set_selected', id, expression)));
							}
							continue;
						}

						if (isEventAttribute(name)) {
							const metadata = { tracking: false };
							let handler = /** @type {AST.Expression} */ (
								visit(attr.value, { ...state, metadata })
							);
							const id = state.flush_node?.();

							if (attr.metadata?.delegated) {
								const event_name = normalizeEventName(name);

								if (!state.events.has(event_name)) {
									state.events.add(event_name);
								}

								state.init?.push(
									b.stmt(
										b.assignment(
											'=',
											b.member(/** @type {AST.Identifier} */ (id), '__' + event_name),
											handler,
										),
									),
								);
							} else {
								const event_name = getOriginalEventName(name);
								// Check if handler is reactive (contains tracking)
								if (metadata.tracking) {
									// Use reactive_event with a thunk to re-evaluate when dependencies change
									state.init?.push(
										b.stmt(b.call('_$_.render_event', b.literal(event_name), id, b.thunk(handler))),
									);
								} else {
									state.init?.push(b.stmt(b.call('_$_.event', b.literal(event_name), id, handler)));
								}
							}

							continue;
						}
						const metadata = { tracking: false };
						const expression = /** @type {AST.Expression} */ (
							visit(attr.value, { ...state, metadata })
						);
						// All other attributes
						if (metadata.tracking) {
							const attribute = name;
							const id = state.flush_node?.();

							if (is_dom_property(attribute)) {
								local_updates.push({
									operation: () =>
										b.stmt(
											b.assignment(
												'=',
												b.member(/** @type {AST.Identifier} */ (id), attribute),
												expression,
											),
										),
								});
							} else {
								local_updates.push({
									operation: (key) =>
										b.stmt(b.call('_$_.set_attribute', id, b.literal(attribute), key)),
									expression,
									identity: attr.value,
									initial: b.void0,
								});
							}
						} else {
							const id = state.flush_node?.();

							if (is_dom_property(name)) {
								state.init?.push(
									b.stmt(
										b.assignment(
											'=',
											b.member(/** @type {AST.Identifier} */ (id), name),
											expression,
										),
									),
								);
							} else {
								state.init?.push(
									b.stmt(b.call('_$_.set_attribute', id, b.literal(name), expression)),
								);
							}
						}
					}
				} else if (attr.type === 'SpreadAttribute') {
					spread_attributes?.push(
						b.spread(/** @type {AST.Expression} */ (visit(attr.argument, state))),
					);
				} else if (attr.type === 'RefAttribute') {
					const id = state.flush_node?.();
					const metadata = { tracking: false };
					const argument = /** @type {AST.Expression} */ (
						visit(attr.argument, { ...state, metadata })
					);

					/** @type {AST.Expression[]} */
					const ref_args = [/** @type {AST.Expression} */ (id), b.thunk(argument)];

					// Emit a setter only when the argument is a syntactically
					// valid assignment target — `Identifier` or
					// `MemberExpression`. The runtime value of either shape
					// can be a function, a Tracked, or a plain value; `ref()`
					// decides at mount which path to take (function → call;
					// Tracked → assign `.value`; plain → call setter). Other
					// argument shapes (callbacks, call results,
					// literals) can't be assignment targets — even though
					// the setter would never be invoked at runtime for
					// those (function/Tracked dispatch wins), strict module
					// parsers like rolldown still reject `(v) => (foo() = v)`
					// at parse time.
					const arg_type = attr.argument.type;
					if (arg_type === 'Identifier' || arg_type === 'MemberExpression') {
						ref_args.push(
							b.arrow(
								[b.id('v')],
								b.assignment(
									'=',
									/** @type {AST.Pattern} */ (clone_expression_node(argument)),
									b.id('v'),
								),
							),
						);
					}

					state.init?.push(b.stmt(b.call('_$_.ref', ...ref_args)));
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
					const id = state.flush_node?.();
					const metadata = { tracking: false };
					const expression = /** @type {AST.Expression} */ (
						visit(attr_value, { ...state, metadata })
					);

					const hash_arg = scoping_hash ? b.literal(scoping_hash) : undefined;
					const is_html =
						context.state.namespace === 'html' &&
						/** @type {AST.Identifier} */ (node.id).name !== 'svg';

					if (metadata.tracking) {
						local_updates.push({
							operation: (key) =>
								b.stmt(b.call('_$_.set_class', id, key, hash_arg, b.literal(is_html))),
							expression,
							identity: attr_value,
							initial: b.call(b.id('Symbol')),
						});
					} else {
						state.init?.push(
							b.stmt(b.call('_$_.set_class', id, expression, hash_arg, b.literal(is_html))),
						);
					}
				}
			} else if (scoping_hash) {
				handle_static_attr(is_spreading ? '#class' : 'class', scoping_hash);
			}

			if (style_attribute !== null) {
				const attr_value = /** @type {AST.Expression} */ (style_attribute.value);
				if (attr_value.type === 'Literal') {
					handle_static_attr(style_attribute.name.name, attr_value.value);
				} else {
					const id = state.flush_node?.();
					const metadata = { tracking: false };
					const expression = /** @type {AST.Expression} */ (
						visit(attr_value, { ...state, metadata })
					);

					if (metadata.tracking) {
						if (attr_value.type === 'TemplateLiteral') {
							// Doesn't need prev tracking
							local_updates.push({
								operation: () => b.stmt(b.call('_$_.set_style', id, expression, b.void0)),
							});
						} else {
							// Object or unknown - needs prev tracking
							local_updates.push({
								operation: (new_value, prev_value) =>
									b.stmt(b.call('_$_.set_style', id, new_value, prev_value)),
								identity: attr_value,
								expression,
								initial: b.void0,
								needsPrevTracking: true,
							});
						}
					} else {
						state.init?.push(b.stmt(b.call('_$_.set_style', id, expression, b.void0)));
					}
				}
			}

			state.template?.push('>');

			if (spread_attributes !== null && spread_attributes.length > 0) {
				const id = state.flush_node?.();
				state.init?.push(
					b.stmt(b.call('_$_.render_spread', id, b.thunk(b.object(spread_attributes)))),
				);
			}

			/** @type {TransformClientState['init']} */
			const init = [];
			/** @type {TransformClientState['update']} */
			const update = [];

			if (!is_void) {
				const element_name = /** @type {AST.Identifier} */ (node.id).name;
				// Special handling for <template> elements
				if (element_name === 'template' && node.children.length > 0) {
					transform_template_element(node, state, visit, child_namespace, init, update);
				} else {
					transform_children(
						node.children,
						/** @type {VisitorClientContext} */ ({
							visit,
							state: {
								...state,
								init,
								update,
								namespace: child_namespace,
								skip_children_traversal: true,
							},
							root: false,
						}),
					);
				}
				state.template?.push(`</${element_name}>`);

				// We need to check if any child nodes are dynamic to determine
				// if we need to pop the hydration stack to the parent node
				// Template elements never need pop() since we don't traverse into them
				const needs_pop =
					element_name !== 'template' &&
					node.children.some(
						(child) =>
							child.type === 'IfStatement' ||
							child.type === 'TryStatement' ||
							child.type === 'ForOfStatement' ||
							child.type === 'SwitchStatement' ||
							child.type === 'Tsx' ||
							child.type === 'TsxCompat' ||
							child.type === 'Html' ||
							(child.type === 'Element' &&
								(child.id.type !== 'Identifier' || !is_element_dom_element(child))) ||
							((child.type === 'TSRXExpression' || child.type === 'Text') &&
								child.expression.type !== 'Literal'),
					);

				if (needs_pop) {
					const id = state.flush_node?.();

					init.push(b.stmt(b.call('_$_.pop', id)));
				}
			}

			update.push(...local_updates);

			if (update.length > 0) {
				if (state.scope.declarations.size > 0) {
					apply_updates(init, update, state);
				} else {
					state.update?.push(...update);
				}
			}

			if (init.length > 0) {
				state.init?.push(b.block(init));
			}
		} else {
			const id = state.flush_node?.();

			state.template?.push('<!>');

			const apply_parent_css_scope = state.applyParentCssScope;

			const is_dynamic_element = is_element_dynamic(node);
			const is_spreading = node.attributes.some((attr) => attr.type === 'SpreadAttribute');
			/** @type {(AST.Property | AST.SpreadElement)[]} */
			const props = [];
			/** @type {AST.Property | null} */
			let children_prop = null;

			for (const attr of node.attributes) {
				if (attr.type === 'Attribute') {
					if (attr.name.type === 'Identifier') {
						const metadata = { tracking: false };
						let property =
							attr.value === null
								? b.literal(true)
								: /** @type {AST.Expression} */ (
										visit(attr.value, { ...state, flush_node: null, metadata })
									);

						if (attr.name.name === 'class' && node.metadata.scoped && state.component?.css) {
							if (property.type === 'Literal') {
								property = b.literal(`${state.component.css.hash} ${property.value}`);
							} else {
								property = b.array([property, b.literal(state.component.css.hash)]);
							}
						}

						if (metadata.tracking || attr.name.tracked) {
							if (attr.name.name === 'children') {
								children_prop = b.prop(
									'get',
									b.id('children'),
									b.function(
										null,
										[],
										b.block([b.return(b.call('_$_.normalize_children', property))]),
									),
								);
								props.push(children_prop);
								continue;
							}

							props.push(
								b.prop(
									'get',
									b.key(attr.name.name),
									b.function(null, [], b.block([b.return(property)])),
								),
							);
						} else {
							if (attr.name.name === 'children') {
								children_prop = b.prop(
									'init',
									b.id('children'),
									b.call('_$_.normalize_children', property),
								);
								props.push(children_prop);
								continue;
							}

							props.push(b.prop('init', b.key(attr.name.name), property));
						}
					} else {
						props.push(
							b.prop(
								'init',
								b.key(attr.name.name),
								/** @type {AST.Expression} */ (
									visit(/** @type {AST.Node} */ (attr.value), { ...state, flush_node: null })
								),
							),
						);
					}
				} else if (attr.type === 'SpreadAttribute') {
					props.push(
						b.spread(
							/** @type {AST.Expression} */
							(
								visit(attr.argument, {
									...state,
									flush_node: null,
									metadata: { ...state.metadata },
								})
							),
						),
					);
				} else if (attr.type === 'RefAttribute') {
					const ref_id = state.scope.generate('ref');
					const metadata = { tracking: false };
					state.init?.push(b.var(ref_id, b.call('_$_.ref_prop')));
					props.push(
						b.prop(
							'init',
							b.id(ref_id),
							/** @type {AST.Expression} */ (
								visit(attr.argument, { ...state, flush_node: null, metadata })
							),
							true,
						),
					);
				} else {
					throw new Error('TODO');
				}
			}

			if (node.metadata.scoped && state.component?.css) {
				const hasClassAttr = node.attributes.some(
					(attr) =>
						attr.type === 'Attribute' &&
						attr.name.type === 'Identifier' &&
						attr.name.name === 'class',
				);
				if (!hasClassAttr) {
					const name = is_spreading ? '#class' : 'class';
					const value = state.component.css.hash;
					props.push(b.prop('init', b.key(name), b.literal(value)));
				}
			}

			for (const child of node.children) {
				if (child.type === 'Component') {
					state.init?.push(/** @type {AST.Statement} */ (visit(child, state)));
				}
			}

			const children_filtered = node.children.filter(
				(child) => child.type !== 'EmptyStatement' && child.type !== 'Component',
			);

			if (children_filtered.length > 0) {
				const component_scope = state.scopes.get(node);
				const children_component = b.component(b.id('render_children'), [], children_filtered);

				const children = b.call(
					'_$_.tsrx_element',
					/** @type {AST.Expression} */ (
						visit(children_component, {
							...state,
							...(apply_parent_css_scope ||
							(is_dynamic_element && node.metadata.scoped && state.component?.css)
								? {
										applyParentCssScope:
											apply_parent_css_scope ||
											/** @type {AST.CSS.StyleSheet} */ (state.component?.css).hash,
									}
								: {}),
							scope: /** @type {ScopeInterface} */ (component_scope),
							namespace: child_namespace,
							is_tsrx_element: true,
						})
					),
				);

				// Template children take precedence over explicit children prop
				if (children_prop) {
					const idx = props.indexOf(children_prop);
					if (idx !== -1) props.splice(idx, 1);
				}
				children_prop = b.prop('init', b.id('children'), children);
				props.push(children_prop);
			}

			const metadata = { tracking: false };
			// We visit, but only to gather metadata
			b.call(/** @type {AST.Expression} */ (visit(node.id, { ...state, metadata })));

			// We're calling a component from within svg/mathml context
			const is_with_ns = state.namespace !== DEFAULT_NAMESPACE;

			let object_props;
			if (is_spreading) {
				// Optimization: if only one spread with no other props, pass it directly
				if (props.length === 1 && props[0].type === 'SpreadElement') {
					object_props = b.call('_$_.spread_props', b.thunk(props[0].argument));
				} else {
					// Multiple items: build array of objects/spreads for proper merge order
					const items = [];
					let current_obj_props = [];

					for (const prop of props) {
						if (prop.type === 'SpreadElement') {
							// Flush accumulated regular props as an object
							if (current_obj_props.length > 0) {
								items.push(b.object(current_obj_props));
								current_obj_props = [];
							}
							// Add the spread argument directly
							items.push(prop.argument);
						} else {
							// Accumulate regular properties
							current_obj_props.push(prop);
						}
					}

					// Flush any remaining regular props
					if (current_obj_props.length > 0) {
						items.push(b.object(current_obj_props));
					}

					object_props = b.call('_$_.spread_props', b.thunk(b.array(items)));
				}
			} else {
				object_props = b.object(props);
			}
			if (metadata.tracking) {
				const shared = b.call(
					'_$_.composite',
					b.thunk(/** @type {AST.Expression} */ (visit(node.id, state))),
					id,
					object_props,
				);
				state.init?.push(
					is_with_ns
						? b.stmt(b.call('_$_.with_ns', b.literal(state.namespace), b.thunk(shared)))
						: b.stmt(shared),
				);
			} else {
				const shared = b.call(
					/** @type {AST.Expression} */ (visit(node.id, state)),
					id,
					object_props,
					b.id('_$_.active_block'),
				);
				state.init?.push(
					is_with_ns
						? b.stmt(b.call('_$_.with_ns', b.literal(state.namespace), b.thunk(shared)))
						: b.stmt(shared),
				);
			}
		}
	},

	Component(node, context) {
		let prop_statements;
		const metadata = {};

		if (context.state.to_ts) {
			const body_statements = [
				...transform_body(node.body, {
					...context,
					state: { ...context.state, component: node, metadata },
				}),
			];

			const func = b.function(
				node.id,
				node.params.map(
					(param) =>
						/** @type {AST.Pattern} */ (context.visit(param, { ...context.state, metadata })),
				),
				b.block(body_statements),
				false,
				/** @type {AST.NodeWithLocation} */ (node),
			);
			func.typeParameters = node.typeParameters;
			// Mark that this function was originally a component
			func.metadata = /** @type {AST.FunctionExpression['metadata']} */ ({
				...node.metadata,
				is_component: true,
			});

			if (func.id) {
				// metadata should be there as func.id === node.id
				func.id.metadata = /** @type {AST.Identifier['metadata']} */ ({
					...func.id.metadata,
					is_component: true,
				});
			}

			return func;
		}

		/** @type {AST.Identifier | AST.ObjectPattern | AST.ArrayPattern} */
		let props = b.id('__props');

		if (node.params.length > 0) {
			let props_param = node.params[0];

			if (props_param.type === 'Identifier') {
				delete props_param.typeAnnotation;
				props = props_param;
			} else if (props_param.type === 'ObjectPattern' || props_param.type === 'ArrayPattern') {
				delete props_param.typeAnnotation;
				if (!props_param.lazy) {
					// Non-lazy destructuring: use the pattern directly as the function param
					props = /** @type {AST.ObjectPattern | AST.ArrayPattern} */ (
						replace_lazy_param_pattern(props_param)
					);
				}
				// Lazy destructuring: props stays as __props, bindings resolved via transforms
			}
		}

		const component_scope = context.state.scopes.get(node) || context.state.scope;
		const is_tsrx_element = context.state.is_tsrx_element;
		const is_synthetic_children = node.id?.name === 'render_children';
		const transformed_body = transform_body(node.body, {
			...context,
			state: {
				...context.state,
				flush_node: null,
				component: is_synthetic_children ? context.state.component : node,
				metadata,
				scope: component_scope,
				is_tsrx_element: false,
				applyParentCssScope: is_synthetic_children ? context.state.applyParentCssScope : undefined,
			},
		});

		// TSRXElement render functions don't need push/pop component context
		// since they inherit context from where they're used
		const body_statements = is_tsrx_element
			? transformed_body
			: [
					b.stmt(b.call('_$_.push_component')),
					...transformed_body,
					b.stmt(b.call('_$_.pop_component')),
				];

		if (node.css !== null && node.css) {
			context.state.stylesheets.push(node.css);
		}

		// TSRXElement render functions use simpler params: [__anchor, __block]
		// Regular components use: [__anchor, props, __block] or [__anchor, _, __block]
		const params = is_tsrx_element
			? [b.id('__anchor'), b.id('__block')]
			: node.params.length > 0
				? [b.id('__anchor'), props, b.id('__block')]
				: [b.id('__anchor'), b.id('_'), b.id('__block')];

		const func = b.function(
			node.id,
			params,
			b.block([...(prop_statements ?? []), ...body_statements]),
		);

		func.metadata = {
			...func.metadata,
			is_component: true,
		};

		return func;
	},

	AssignmentExpression(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}

		const left = node.left;

		// Handle lazy binding assignments (e.g., value = 5 where value is from let &[value] = track(0))
		// Must come before the left.tracked check to use the binding's transform
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

		return visit_assignment_expression(node, context, build_assignment) ?? context.next();
	},

	UpdateExpression(node, context) {
		if (context.state.to_ts) {
			return context.next();
		}
		const argument = node.argument;

		// Handle lazy binding updates (e.g., a++ where a is from let &{a} = obj)
		if (argument.type === 'Identifier') {
			const binding = context.state.scope?.get(argument.name);
			if (binding?.transform?.update && binding.node !== argument) {
				return binding.transform.update(node);
			}
		}

		const left = object(/** @type {AST.MemberExpression | AST.Identifier} */ (argument));
		const binding = left && context.state.scope.get(left.name);
		const transformers = left && binding?.transform;

		if (left === argument) {
			const update_fn = transformers?.update;
			if (update_fn) {
				return update_fn(node);
			}
		}

		context.next();
	},

	ForOfStatement(node, context) {
		if (!is_inside_component(context)) {
			return context.next();
		}
		const is_controlled = node.is_controlled;
		const index = node.index;
		const key = node.key;
		let flags = is_controlled ? IS_CONTROLLED : 0;

		if (index != null) {
			flags |= IS_INDEXED;
		}

		// do only if not controller
		if (!is_controlled) {
			context.state.template?.push('<!>');
		}

		const id = context.state.flush_node?.(false, is_controlled);
		const pattern = /** @type {AST.VariableDeclaration} */ (node.left).declarations[0].id;
		const body_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node.body));

		context.state.init?.push(
			b.stmt(
				b.call(
					key != null ? '_$_.for_keyed' : '_$_.for',
					id,
					b.thunk(/** @type {AST.Expression} */ (context.visit(node.right))),
					b.arrow(
						index ? [b.id('__anchor'), pattern, index] : [b.id('__anchor'), pattern],
						b.block(
							transform_body(/** @type {AST.BlockStatement} */ (node.body).body, {
								...context,
								state: {
									...context.state,
									scope: body_scope,
									namespace: context.state.namespace,
									flush_node: null,
								},
							}),
						),
					),
					b.literal(flags),
					key != null
						? b.arrow(
								index ? [pattern, index] : [pattern],
								/** @type {AST.Expression} */ (context.visit(key)),
							)
						: undefined,
				),
			),
		);
	},

	SwitchStatement(node, context) {
		if (!is_inside_component(context)) {
			if (context.state.to_ts) {
				return transform_ts_child(node, SetContextForOutsideComponent(context));
			}

			return context.next();
		}
		context.state.template?.push('<!>');

		const id = context.state.flush_node?.();
		const statements = [];
		const cases = [];

		let id_gen = 0;
		let counter = 0;
		for (const switch_case of node.cases) {
			const case_body = [];
			const consequent = switch_case.consequent;

			if (consequent.length !== 0) {
				// Flatten top-level BlockStatements so BreakStatements and elements inside
				// block-scoped cases (e.g. `case 1: { ... break; }`) are properly handled
				const flattened_consequent = flatten_switch_consequent(consequent);
				const consequent_scope = context.state.scopes.get(consequent) || context.state.scope;

				const block = transform_body(flattened_consequent, {
					...context,
					state: { ...context.state, scope: consequent_scope, flush_node: null },
				});
				const has_break = consequent_has_break(consequent);
				const is_last = counter === node.cases.length - 1;
				const is_default = switch_case.test == null;
				const consequent_id = context.state.scope.generate(
					'switch_case_' + (is_default ? 'default' : id_gen),
				);

				statements.push(b.var(b.id(consequent_id), b.arrow([b.id('__anchor')], b.block(block))));
				case_body.push(
					b.stmt(b.call(b.member(b.id('result'), b.id('push'), false), b.id(consequent_id))),
				);

				// in js, `default:` can be in the middle without a break
				// so we only add return for the last case or cases with a break
				if (has_break || is_last) {
					case_body.push(b.return(b.id('result')));
				}
				id_gen++;
			}

			counter++;

			cases.push(
				b.switch_case(
					switch_case.test ? /** @type {AST.Expression} */ (context.visit(switch_case.test)) : null,
					case_body,
				),
			);
		}

		statements.push(
			b.stmt(
				b.call(
					'_$_.switch',
					id,
					b.thunk(
						b.block([
							b.var(b.id('result'), b.array([])),
							b.switch(/** @type {AST.Expression} */ (context.visit(node.discriminant)), cases),
						]),
					),
				),
			),
		);

		context.state.init?.push(b.block(statements));
	},

	IfStatement(node, context) {
		if (!is_inside_component(context)) {
			if (context.state.to_ts) {
				return transform_ts_child(node, SetContextForOutsideComponent(context));
			}

			return context.next();
		}
		context.state.template?.push('<!>');

		const id = context.state.flush_node?.();
		const statements = [];

		// Optimize lone return: if (cond) { return; } with no alternate
		if (node.metadata?.lone_return && context.state.return_flags) {
			const consequent_body =
				node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
			const ret = /** @type {AST.ReturnStatement} */ (consequent_body[0]);
			const info = context.state.return_flags.get(ret);

			if (info) {
				/** @type {AST.Statement[]} */
				const callback_body = [];

				if (info.tracked) {
					callback_body.push(b.stmt(b.call('_$_.set', b.id(info.name), b.false)));
					callback_body.push(
						b.if(
							/** @type {AST.Expression} */ (
								context.visit(node.test, {
									...context.state,
									metadata: { ...context.state.metadata },
								})
							),
							b.stmt(b.call('_$_.set', b.id(info.name), b.true)),
						),
					);
				} else {
					callback_body.push(b.stmt(b.assignment('=', b.id(info.name), b.false)));
					callback_body.push(
						b.if(
							/** @type {AST.Expression} */ (
								context.visit(node.test, {
									...context.state,
									metadata: { ...context.state.metadata },
								})
							),
							b.stmt(b.assignment('=', b.id(info.name), b.true)),
						),
					);
				}

				statements.push(
					b.stmt(b.call('_$_.if', id, b.arrow([b.id('__render')], b.block(callback_body)))),
				);

				context.state.init?.push(b.block(statements));
				return;
			}
		}

		const consequent_scope =
			/** @type {ScopeInterface} */ (context.state.scopes.get(node.consequent)) ||
			context.state.scope;
		const consequent_body =
			node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
		const consequent = b.block(
			transform_body(consequent_body, {
				...context,
				state: { ...context.state, flush_node: null, scope: consequent_scope },
			}),
		);
		const consequent_id = context.state.scope.generate('consequent');

		statements.push(b.var(b.id(consequent_id), b.arrow([b.id('__anchor')], consequent)));

		let alternate_id;

		if (node.alternate !== null) {
			const alternate = /** @type {AST.Statement} */ (node.alternate);
			const alternate_scope = context.state.scopes.get(alternate) || context.state.scope;
			/** @type {AST.Node[]} */
			let alternate_body =
				alternate.type === 'IfStatement'
					? [alternate]
					: alternate.type === 'BlockStatement'
						? alternate.body
						: [alternate];
			const alternate_block = b.block(
				transform_body(alternate_body, {
					...context,
					state: { ...context.state, flush_node: null, scope: alternate_scope },
				}),
			);
			alternate_id = context.state.scope.generate('alternate');
			statements.push(b.var(b.id(alternate_id), b.arrow([b.id('__anchor')], alternate_block)));
		}

		// Collect return flag resets for IfStatements that contain returns
		/** @type {AST.Statement[]} */
		const callback_body = [];

		if (node.metadata?.has_return && context.state.return_flags) {
			const returns = node.metadata.returns || [];
			for (const ret of returns) {
				const info = context.state.return_flags.get(ret);
				if (info) {
					if (info.tracked) {
						callback_body.push(b.stmt(b.call('_$_.set', b.id(info.name), b.false)));
					} else {
						callback_body.push(b.stmt(b.assignment('=', b.id(info.name), b.false)));
					}
				}
			}
		}

		callback_body.push(
			b.if(
				/** @type {AST.Expression} */ (
					context.visit(node.test, {
						...context.state,
						metadata: { ...context.state.metadata },
					})
				),
				b.stmt(b.call(b.id('__render'), b.id(consequent_id))),
				alternate_id
					? b.stmt(
							b.call(
								b.id('__render'),
								b.id(alternate_id),
								node.alternate ? b.literal(false) : undefined,
							),
						)
					: undefined,
			),
		);

		statements.push(
			b.stmt(b.call('_$_.if', id, b.arrow([b.id('__render')], b.block(callback_body)))),
		);

		context.state.init?.push(b.block(statements));
	},

	ReturnStatement(node, context) {
		if (!is_inside_component(context)) {
			return context.next();
		}
		if (context.state.to_ts) {
			return context.next();
		}
		const info = context.state.return_flags?.get(node);
		if (info) {
			if (info.tracked) {
				return b.stmt(b.call('_$_.set', b.id(info.name), b.true));
			} else {
				return b.stmt(b.assignment('=', b.id(info.name), b.true));
			}
		}
		return context.next();
	},

	TSAsExpression(node, context) {
		if (!context.state.to_ts) {
			return context.visit(/** @type {AST.Expression} */ (node.expression));
		}
		return context.next();
	},

	TSInstantiationExpression(node, context) {
		if (!context.state.to_ts) {
			// In JavaScript, just return the expression wrapped in parentheses
			return b.sequence([
				/** @type {AST.Expression} */ (
					context.visit(/** @type {AST.Expression} */ (node.expression))
				),
			]);
		}
		return context.next();
	},

	ExportNamedDeclaration(node, context) {
		if (!context.state.to_ts && node.exportKind === 'type') {
			return b.empty;
		}

		// Remove TSDeclareFunction nodes (function overload signatures) in JavaScript mode
		if (
			!context.state.to_ts &&
			/** @type {AST.TSRXDeclaration} */ (node.declaration)?.type === 'TSDeclareFunction'
		) {
			return b.empty;
		}

		if (context.state.to_ts && context.state.ancestor_server_block) {
			// All validation errors will be handled in the analysis phase
			// So we can safely print these
			if (node.declaration) {
				return context.visit(node.declaration);
			} else if (node.specifiers) {
				for (const specifier of node.specifiers) {
					context.visit(specifier);
				}
				return;
			}
		}

		return context.next();
	},

	TSDeclareFunction(node, context) {
		// TSDeclareFunction nodes are TypeScript overload signatures - remove in JavaScript mode
		if (!context.state.to_ts) {
			return b.empty;
		}

		// In TypeScript mode, keep as TSDeclareFunction - esrap will print it with 'declare'
		// We'll remove the 'declare' keyword in post-processing
		return context.next();
	},

	TryStatement(node, context) {
		if (!is_inside_component(context)) {
			if (context.state.to_ts) {
				return transform_ts_child(node, SetContextForOutsideComponent(context));
			}

			return context.next();
		}

		if (context.state.to_ts) {
			return transform_ts_child(node, context);
		}
		context.state.template?.push('<!>');

		const id = context.state.flush_node?.();
		const handler = /** @type {AST.CatchClause | null} */ (node.handler);
		const pending = /** @type {AST.BlockStatement | null} */ (node.pending);
		let body = transform_body(node.block.body, {
			...context,
			state: {
				...context.state,
				scope: /** @type {ScopeInterface} */ (context.state.scopes.get(node.block)),
			},
		});

		if (handler?.param) {
			delete handler.param.typeAnnotation;
		}
		if (handler?.resetParam) {
			delete handler.resetParam.typeAnnotation;
		}

		context.state.init?.push(
			b.stmt(
				b.call(
					'_$_.try',
					id,
					b.arrow([b.id('__anchor')], b.block(body)),
					handler === null
						? b.literal(null)
						: b.arrow(
								[
									b.id('__anchor'),
									...(handler.param && handler.resetParam
										? [handler.param, handler.resetParam]
										: handler.param
											? [handler.param]
											: []),
								],
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
					pending === null
						? undefined
						: b.arrow(
								[b.id('__anchor')],
								b.block(
									transform_body(pending.body, {
										...context,
										state: {
											...context.state,
											scope: /** @type {ScopeInterface} */ (context.state.scopes.get(pending)),
										},
									}),
								),
							),
				),
			),
		);
	},

	BinaryExpression(node, context) {
		return b.binary(
			node.operator,
			/** @type {AST.Expression} */ (context.visit(node.left)),
			/** @type {AST.Expression} */ (context.visit(node.right)),
		);
	},

	TemplateLiteral(node, context) {
		const parent = context.path.at(-1);

		if (
			!context.state.to_ts &&
			node.expressions.length === 0 &&
			parent?.type !== 'TaggedTemplateExpression'
		) {
			const literal = b.literal(
				node.quasis[0].value.cooked,
				/** @type {AST.NodeWithLocation} */ (node),
			);
			literal.metadata.source_name = '`' + node.quasis[0].value.raw + '`';
			return literal;
		}

		const expressions = /** @type {AST.Expression[]} */ (
			node.expressions.map((expr) => context.visit(expr))
		);
		return b.template(node.quasis, expressions, /** @type {AST.NodeWithLocation} */ (node));
	},

	BlockStatement(node, context) {
		/** @type {AST.Statement[]} */
		const statements = [];

		for (const statement of node.body) {
			statements.push(/** @type {AST.Statement} */ (context.visit(statement)));
		}

		return b.block(statements);
	},

	ServerBlock(node, context) {
		if (context.state.to_ts) {
			// Convert Imports inside ServerBlock to local variables
			// ImportDeclaration() visitor will add imports to the top of the module
			/** @type {AST.VariableDeclaration[]} */
			const server_block_locals = [];

			const block = /** @type {AST.BlockStatement} */ (
				context.visit(node.body, {
					...context.state,
					ancestor_server_block: node,
					server_block_locals,
				})
			);

			/** @type {AST.Property[]} */
			const properties = [];
			for (const name of node.metadata.exports) {
				const id = b.id(name);
				properties.push(b.prop('init', id, id, false, true));
			}

			const value = b.call(
				b.thunk(b.block([...server_block_locals, ...block.body, b.return(b.object(properties))])),
			);
			value.loc = node.loc;

			const server_identifier = b.id(
				SERVER_IDENTIFIER,
				slice_loc_info(/** @type {AST.NodeWithLocation} */ (node), 0, '#server'.length),
			);
			// Add source_name to properly map longer generated back to '#server'
			server_identifier.metadata.source_name = '#server';

			const server_const = b.const(server_identifier, value);
			server_const.loc = node.loc;

			return server_const;
		}

		if (!context.state.serverIdentifierPresent) {
			// no point printing the client-side block if #server.func is not used
			return b.empty;
		}

		const file_path = context.state.filename;
		/** @type {AST.Property[]} */
		const props = [];
		for (const name of node.metadata.exports) {
			const func_path = file_path + '#' + name;
			// needs to be a sha256 hash of func_path, to avoid leaking file structure
			const func_hash = strong_hash(func_path);
			props.push(
				b.prop(
					'init',
					b.id(name),
					b.function(
						null,
						[b.rest(b.id('args'))],
						b.block([b.return(b.call('_$_.rpc', b.literal(func_hash), b.id('args')))]),
					),
				),
			);
		}
		return b.var(SERVER_IDENTIFIER, b.object(props));
	},

	ScriptContent(node, context) {
		return b.literal(sanitizeTemplateString(node.content));
	},

	Program(node, context) {
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
 * @param {Array<string | AST.Expression>} items
 */
function join_template(items) {
	let quasi = b.quasi('');
	const template = b.template([quasi], []);

	/**
	 * @param {AST.Expression} expression
	 */
	function push(expression) {
		if (expression.type === 'TemplateLiteral') {
			for (let i = 0; i < expression.expressions.length; i += 1) {
				const q = expression.quasis[i];
				const e = expression.expressions[i];

				quasi.value.cooked += /** @type {string} */ (q.value.cooked);
				push(e);
			}

			const last = expression.quasis.at(-1);
			quasi.value.cooked += /** @type {string} */ (last?.value.cooked);
		} else if (expression.type === 'Literal') {
			/** @type {string} */ (quasi.value.cooked) += expression.value;
		} else {
			template.expressions.push(expression);
			template.quasis.push((quasi = b.quasi('')));
		}
	}

	for (const item of items) {
		if (typeof item === 'string') {
			quasi.value.cooked += item;
		} else {
			push(item);
		}
	}

	for (const quasi of template.quasis) {
		quasi.value.raw = sanitizeTemplateString(/** @type {string} */ (quasi.value.cooked));
	}

	quasi.tail = true;

	return template;
}

/**
 * @param {AST.Node} node
 * @param {TransformClientContext} context
 */
function transform_ts_child(node, context) {
	const { state, visit } = context;

	if (node.type === 'TSRXExpression' || node.type === 'Text') {
		state.init?.push(b.stmt(/** @type {AST.Expression} */ (visit(node.expression, { ...state }))));
	} else if (node.type === 'Html') {
		// Do we need to do something special here?
		state.init?.push(b.stmt(/** @type {AST.Expression} */ (visit(node.expression, { ...state }))));
	} else if (node.type === 'Element') {
		/** @type {ESTreeJSX.JSXElement['children']} */
		const children = [];
		let has_children_props = false;

		const attributes = node.attributes.map((attr) => {
			if (attr.type === 'Attribute') {
				const name = visit(attr.name, state);
				const attr_value = /** @type { AST.Expression & AST.NodeWithLocation | null} */ (
					attr.value
				);
				const value =
					attr_value === null
						? // <div attr>, not adding `name` for loc because `jsx_name` below
							// will take care of the mapping JSXAttribute's JSXIdentifier
							b.literal(true)
						: // reset init, update, final to avoid adding attr value to the component body
							visit(attr_value, SetStateForOutsideComponent(state));

				// Handle both regular identifiers and tracked identifiers
				/** @type {string} */
				let prop_name;
				/** @type {AST.Identifier} */
				let name_node;
				if (name.type === 'Identifier') {
					name_node = name;
					prop_name = name.name;
				} else if (name.type === 'MemberExpression' && name.object.type === 'Identifier') {
					// For tracked attributes like {@count}, use the original name
					name_node = name.object;
					prop_name = name.object.name;
				} else {
					name_node = attr.name;
					prop_name = attr.name.name || 'unknown';
				}

				const jsx_name = b.jsx_id(prop_name, /** @type {AST.NodeWithLocation} */ (name_node));
				if (prop_name === 'children') {
					has_children_props = true;
				}

				const jsx_attr = b.jsx_attribute(
					jsx_name,
					// match the source code usage of expressions for literals
					// for proper source mapping to avoid turning strings into expressions
					attr_value?.type === 'Literal' && !attr_value.was_expression
						? /** @type {AST.Literal} */ (value)
						: b.jsx_expression_container(
								/** @type {AST.Expression} */ (value),
								attr_value === null
									? /** @type {AST.NodeWithLocation} */ (value)
									: // account location for opening and closing braces around the expression
										/** @type {AST.NodeWithLocation} */ ({
											start: attr_value.start - 1,
											end: attr_value.end + 1,
											loc: {
												start: {
													line: attr_value.loc.start.line,
													column: attr_value.loc.start.column - 1,
												},
												end: {
													line: attr_value.loc.end.line,
													column: attr_value.loc.end.column + 1,
												},
											},
										}),
							),
					attr.shorthand ?? false,
					/** @type {AST.NodeWithLocation} */ (attr),
				);
				return jsx_attr;
			} else if (attr.type === 'SpreadAttribute') {
				const argument = visit(attr.argument, state);
				return b.jsx_spread_attribute(
					/** @type {AST.Expression} */ (argument),
					/** @type {AST.NodeWithLocation} */ (attr),
				);
			} else if (attr.type === 'RefAttribute') {
				const createRefKeyAlias = set_hidden_import_from_ripple('createRefKey', context);
				const argument = visit(attr.argument, state);
				const wrapper = b.object([
					b.prop('init', b.call(createRefKeyAlias), /** @type {AST.Expression} */ (argument), true),
				]);
				// This ensures @ts-expect-error comments stay on the correct line
				wrapper.metadata.printInline = true;
				return b.jsx_spread_attribute(wrapper, /** @type {AST.NodeWithLocation} */ (attr));
			} else {
				// Should not happen
				throw new Error(`Unexpected attribute type: ${/** @type {AST.Attribute} */ (attr).type}`);
			}
		});

		if (!node.selfClosing && !node.unclosed && !has_children_props && node.children.length > 0) {
			const is_dom_element = is_element_dom_element(node);
			const component_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node));
			const thunk =
				/** @type {AST.Identifier} */ (node.id).name === 'style'
					? null
					: b.thunk(
							b.block(
								transform_body(node.children, {
									...context,
									state: {
										...state,
										scope: component_scope,
										inside_head:
											/** @type {AST.Identifier} */ (node.id).name === 'head'
												? true
												: state.inside_head,
										skip_children_traversal: is_dom_element,
									},
								}),
							),
						);

			if (thunk !== null) {
				if (is_dom_element) {
					children.push(b.jsx_expression_container(b.call(thunk)));
				} else {
					attributes.push(b.jsx_attribute(b.jsx_id('children'), b.jsx_expression_container(thunk)));
				}
			}
		}

		if (
			/** @type {AST.Node} */ (node.id).type !== 'MemberExpression' &&
			/** @type {AST.Identifier} */ (node.id).tracked
		) {
			// This is just temporary until we remove capitalization
			// The `is_capitalized` was never handled for MemberExpression
			// but it should've been for the `object` part because it starts the tag
			// But the plan is to only rely on source_name and creating a const for the tag with ['#v']
			const source_name = /** @type {AST.Identifier} */ (node.id).name;
			const capitalized_name = source_name.charAt(0).toUpperCase() + source_name.slice(1);

			// node.id and node.openingElement.name are the SAME object (convert_from_jsx mutates
			// the JSXIdentifier to an Identifier in-place). Capitalize the name directly so that
			// the generated JSX uses <Tag> (uppercase) matching the capitalized variable declaration,
			// preventing the TypeScript "declared but never read" false-negative (ts6133).
			/** @type {AST.Identifier} */ (node.id).name = capitalized_name;
			if (!node.id.metadata) {
				node.id.metadata = { path: [] };
			}
			node.id.metadata.is_capitalized = true;
			node.id.metadata.source_name = source_name;

			node.openingElement.metadata = {
				...node.openingElement.metadata,
				is_capitalized: true,
			};

			if (!node.selfClosing && !node.unclosed) {
				// closingElement.name is a separate JSXIdentifier (not the same object as node.id)
				// so we need to capitalize it separately
				if (node.closingElement.name && 'name' in node.closingElement.name) {
					/** @type {{ name: string }} */ (node.closingElement.name).name = capitalized_name;
				}
				node.closingElement.metadata = {
					...node.closingElement.metadata,
					is_capitalized: true,
				};
			}
		}

		if (node.id.type === 'MemberExpression') {
			const member = /** @type {AST.MemberExpression} */ (visit(node.id, { ...state }));

			node.id = member;
			/** @type {ESTreeJSX.TSRXJSXOpeningElement} */ (node.openingElement).name = member;
			if (node.closingElement) {
				/** @type {ESTreeJSX.TSRXJSXClosingElement} */ (node.closingElement).name = setLocation(
					{ ...member },
					/** @type {AST.NodeWithLocation} */ (node.closingElement.name),
					true,
				);
			}
		}

		/** @type {ESTreeJSX.JSXElement} */
		const jsxElement = b.jsx_element(node, attributes, children);

		// For unclosed elements, push the JSXElement directly without wrapping in ExpressionStatement
		// This keeps it in the AST for mappings but avoids adding a semicolon
		if (node.unclosed) {
			state.init?.push(/** @type {AST.Statement} */ (/** @type {unknown} */ (jsxElement)));
		} else {
			state.init?.push(b.stmt(jsxElement));
		}
	} else if (node.type === 'IfStatement') {
		const consequent_scope =
			/** @type {ScopeInterface} */ (context.state.scopes.get(node.consequent)) ||
			context.state.scope;
		const consequent_body =
			node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
		const consequent = b.block(
			transform_body(consequent_body, {
				...context,
				state: { ...context.state, scope: consequent_scope },
			}),
			/** @type {AST.NodeWithLocation} */ (node.consequent),
		);

		let alternate;

		if (node.alternate !== null) {
			const alternate_node = /** @type {AST.Statement} */ (node.alternate);
			const alternate_scope = context.state.scopes.get(alternate_node) || context.state.scope;
			const alternate_body =
				alternate_node.type === 'IfStatement'
					? [alternate_node]
					: alternate_node.type === 'BlockStatement'
						? alternate_node.body
						: [alternate_node];
			alternate = b.block(
				transform_body(alternate_body, {
					...context,
					state: { ...context.state, scope: alternate_scope },
				}),
				/** @type {AST.NodeWithLocation} */ (alternate_node),
			);
		}

		const result = b.if(
			/** @type {AST.Expression} */ (visit(node.test)),
			consequent,
			alternate,
			/** @type {AST.NodeWithLocation} */ (node),
		);
		if (!state.init) {
			return result;
		}
		state.init.push(result);
	} else if (node.type === 'SwitchStatement') {
		const cases = [];

		for (const switch_case of node.cases) {
			const consequent_scope =
				context.state.scopes.get(switch_case.consequent) || context.state.scope;
			const consequent_body = transform_body(flatten_switch_consequent(switch_case.consequent), {
				...context,
				state: { ...context.state, scope: consequent_scope },
			});

			cases.push(
				b.switch_case(
					switch_case.test ? /** @type {AST.Expression} */ (context.visit(switch_case.test)) : null,
					switch_case.consequent.length && switch_case.consequent[0].type === 'BlockStatement'
						? [
								b.block(
									consequent_body,
									/** @type {AST.NodeWithLocation} */ (switch_case.consequent[0]),
								),
							]
						: consequent_body,
				),
			);
		}

		const result = b.switch(
			/** @type {AST.Expression} */ (context.visit(node.discriminant)),
			cases,
			/** @type {AST.NodeWithLocation} */ (node),
		);

		if (!state.init) {
			return result;
		}
		state.init.push(result);
	} else if (node.type === 'ForOfStatement') {
		const body_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node.body));
		const block_body = transform_body(/** @type {AST.BlockStatement} */ (node.body).body, {
			...context,
			state: { ...context.state, scope: body_scope },
		});
		if (node.key) {
			block_body.unshift(b.stmt(/** @type {AST.Expression} */ (visit(node.key))));
		}
		if (node.index) {
			block_body.unshift(b.let(/** @type {AST.Identifier} */ (visit(node.index)), b.literal(0)));
		}
		const body = b.block(block_body);

		const result = b.for_of(
			/** @type {AST.Pattern} */ (visit(node.left)),
			/** @type {AST.Expression} */ (visit(node.right)),
			body,
			node.await,
			/** @type {AST.NodeWithLocation} */ (node),
		);

		if (!state.init) {
			return result;
		}
		state.init.push(result);
	} else if (node.type === 'TryStatement') {
		const try_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node.block));
		const try_body = b.block(
			transform_body(node.block.body, {
				...context,
				state: { ...context.state, scope: try_scope },
			}),
			/** @type {AST.NodeWithLocation} */ (node.block),
		);

		let catch_handler = null;
		if (node.handler) {
			const catch_scope = /** @type {ScopeInterface} */ (
				context.state.scopes.get(node.handler.body)
			);
			const catch_body = b.block(
				transform_body(node.handler.body.body, {
					...context,
					state: { ...context.state, scope: catch_scope },
				}),
				/** @type {AST.NodeWithLocation} */ (node.handler),
			);
			catch_handler = b.catch_clause(
				node.handler.param || null,
				node.handler.resetParam || null,
				catch_body,
				/** @type {AST.NodeWithLocation} */ (node.handler),
			);
		}

		let pending_block = null;
		if (node.pending) {
			const pending_scope = /** @type {ScopeInterface} */ (context.state.scopes.get(node.pending));
			pending_block = b.block(
				transform_body(node.pending.body, {
					...context,
					state: { ...context.state, scope: pending_scope },
				}),
				/** @type {AST.NodeWithLocation} */ (node.pending),
			);
		}

		let finally_block = null;
		if (node.finalizer) {
			const finally_scope = /** @type {ScopeInterface} */ (
				context.state.scopes.get(node.finalizer)
			);
			finally_block = b.block(
				transform_body(node.finalizer.body, {
					...context,
					state: { ...context.state, scope: finally_scope },
				}),
				/** @type {AST.NodeWithLocation} */ (node.finalizer),
			);
		}
		const result = b.try(try_body, catch_handler, finally_block, pending_block);
		if (!state.init) {
			return result;
		}
		state.init.push(result);
	} else if (node.type === 'Component') {
		const component = visit(node, state);

		state.init?.push(/** @type {AST.Statement} */ (component));
	} else if (node.type === 'BreakStatement') {
		const result = b.break;

		if (!state.init) {
			return result;
		}
		state.init.push(/** @type {AST.Statement} */ (result));
	} else if (node.type === 'TsxCompat') {
		const children = /** @type {AST.TsxCompat['children']} */ (
			node.children
				.map((child) => visit(/** @type {AST.Node} */ (child), state))
				.filter((child) => child.type !== 'JSXText' || child.value.trim() !== '')
		);

		state.init?.push(b.stmt(b.jsx_fragment(children)));
	} else if (node.type === 'Tsx') {
		const children = /** @type {AST.Tsx['children']} */ (
			node.children
				.map((child) => visit(/** @type {AST.Node} */ (child), state))
				.filter((child) => child.type !== 'JSXText' || child.value.trim() !== '')
		);

		const result = b.jsx_fragment(children);
		if (!state.init) {
			return result;
		}
		state.init.push(b.stmt(result));
	} else if (node.type === 'JSXExpressionContainer') {
		// JSX comments {/* ... */} are JSXExpressionContainer with JSXEmptyExpression
		// These should be preserved in the output as-is for prettier to handle
		const result = b.jsx_expression_container(
			/** @type {AST.Expression} */ (visit(node.expression, state)),
		);
		if (!state.init) {
			return result;
		}
		state.init.push(/** @type {AST.Statement} */ (/** @type {unknown} */ (result)));
	} else if (node.type === 'ReturnStatement') {
		const result = b.return(
			node.argument ? /** @type {AST.Expression} */ (visit(node.argument, state)) : undefined,
			/** @type {AST.NodeWithLocation} */ (node),
		);
		if (!state.init) {
			return result;
		}
		state.init.push(result);
	} else if (node.type === 'ScriptContent') {
		state.init?.push(
			/** @type {AST.Statement} */ (
				/** @type {unknown} */ (b.jsx_text(node.content, node.content))
			),
		);
	} else {
		throw new Error('TODO');
	}
}

/**
 * Checks if a node is template or control-flow content
 * @param {AST.Node} node
 * @returns {boolean}
 */
function is_template_or_control_flow(node) {
	return (
		node.type === 'Element' ||
		node.type === 'TSRXExpression' ||
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
 * Builds a negated AND condition from return flag info: !flag1 && !flag2 && ...
 * Uses _$_.get() for tracked flags and direct reference for plain booleans.
 * @param {{ name: string, tracked: boolean }[]} flags
 * @returns {AST.Expression}
 */
function build_return_guard(flags) {
	/** @param {{ name: string, tracked: boolean }} flag */
	const negate_flag = (flag) =>
		flag.tracked ? b.unary('!', b.call('_$_.get', b.id(flag.name))) : b.unary('!', b.id(flag.name));

	/** @type {AST.Expression} */
	let condition = negate_flag(flags[0]);
	for (let i = 1; i < flags.length; i++) {
		condition = b.logical('&&', condition, negate_flag(flags[i]));
	}
	return condition;
}

/**
 * Collects all unique return statements from direct children
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
 * Check if an Element has any dynamic content that would trigger flush_node().
 * An Element has dynamic content if it has:
 * - Dynamic attributes (tracked expressions in attribute values)
 * - Control flow children (IfStatement, ForOfStatement, etc.)
 * - Dynamic text children (non-Literal Text nodes)
 * - Non-DOM element children (components)
 * - Html children
 * - Dynamic descendants (recursive)
 * @param {AST.Element} element
 * @returns {boolean}
 */
function element_has_dynamic_content(element) {
	// Check for dynamic attributes
	for (const attr of element.attributes) {
		if (attr.type === 'Attribute') {
			// Dynamic value expression (not null, not Literal)
			if (attr.value !== null && attr.value.type !== 'Literal') {
				return true;
			}
			// Tracked attribute name
			if (attr.name.tracked) {
				return true;
			}
		} else if (attr.type === 'SpreadAttribute' || attr.type === 'RefAttribute') {
			return true;
		}
	}

	// Check children for dynamic content
	for (const child of element.children) {
		if (
			child.type === 'IfStatement' ||
			child.type === 'TryStatement' ||
			child.type === 'ForOfStatement' ||
			child.type === 'SwitchStatement' ||
			child.type === 'Tsx' ||
			child.type === 'TsxCompat' ||
			child.type === 'Html'
		) {
			return true;
		}
		if (
			(child.type === 'TSRXExpression' || child.type === 'Text') &&
			child.expression.type !== 'Literal'
		) {
			return true;
		}
		// Non-DOM element (component)
		if (
			child.type === 'Element' &&
			(child.id.type !== 'Identifier' || !is_element_dom_element(child))
		) {
			return true;
		}
		// Recursively check DOM element children
		if (
			child.type === 'Element' &&
			child.id.type === 'Identifier' &&
			is_element_dom_element(child)
		) {
			if (element_has_dynamic_content(child)) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Transform a template element's children into innerHTML assignment.
 * Template elements don't render children in the normal DOM tree - their content
 * goes into template.content (a DocumentFragment). We handle them like textarea
 * elements where children become innerHTML content.
 *
 * @param {AST.Element} node - The template element node
 * @param {TransformClientState} state - The transform state
 * @param {(node: AST.Node, state?: TransformClientState) => AST.Node} visit - The visitor function
 * @param {'html' | 'svg' | 'mathml'} child_namespace - The namespace for child elements
 * @param {Array<AST.Statement>} init - Array to push initialization statements
 * @param {import('../../../types/index').UpdateList} update - Array to push update statements
 */
function transform_template_element(node, state, visit, child_namespace, init, update) {
	// For template elements, check if children contain {html} expressions
	const has_html_child = node.children.some((child) => child.type === 'Html');

	if (has_html_child && node.children.length === 1 && node.children[0].type === 'Html') {
		// Single {html} expression - set innerHTML reactively
		const html_node = /** @type {AST.Html} */ (node.children[0]);
		const id = state.flush_node?.();
		const metadata = { tracking: false };
		const expression = /** @type {AST.Expression} */ (
			visit(html_node.expression, { ...state, metadata })
		);

		if (metadata.tracking) {
			update.push({
				operation: (/** @type {AST.Expression | undefined} */ key) =>
					b.stmt(
						b.assignment(
							'=',
							b.member(/** @type {AST.Identifier} */ (id), 'innerHTML'),
							/** @type {AST.Expression} */ (key),
						),
					),
				expression,
				identity: html_node.expression,
				initial: b.literal(''),
			});
		} else {
			state.init?.push(
				b.stmt(
					b.assignment('=', b.member(/** @type {AST.Identifier} */ (id), 'innerHTML'), expression),
				),
			);
		}
	} else {
		// Static or mixed content - serialize to string and set innerHTML once
		const child_state = /** @type {TransformClientState} */ ({
			...state,
			template: [],
			init: [],
			update: [],
			namespace: child_namespace,
			skip_children_traversal: true,
		});

		transform_children(
			node.children,
			/** @type {VisitorClientContext} */ ({
				visit,
				state: child_state,
				root: false,
			}),
		);

		const template_array = /** @type {NonNullable<TransformClientState['template']>} */ (
			child_state.template
		);

		if (template_array.length > 0) {
			const content_html = join_template(template_array);
			const id = state.flush_node?.();
			state.init?.push(
				b.stmt(
					b.assignment(
						'=',
						b.member(/** @type {AST.Identifier} */ (id), 'innerHTML'),
						content_html,
					),
				),
			);
		}
	}
}

/**
 *
 * @param {AST.Node[]} children
 * @param {VisitorClientContext} context
 */
function transform_children(children, context) {
	const { visit, state, root } = context;
	const normalized = normalize_children(children, {
		...context,
		state: { ...state, keep_component_style: state.to_ts ? true : state.keep_component_style },
	});

	const head_elements = /** @type {AST.Element[]} */ (
		children.filter(
			(node) => node.type === 'Element' && node.id.type === 'Identifier' && node.id.name === 'head',
		)
	);

	const all_returns = collect_returns_from_children(normalized);
	/** @type {Map<AST.ReturnStatement, { name: string, tracked: boolean }>} */
	const return_flags = new Map([...(state.return_flags || [])]);
	/** @type {AST.ReturnStatement[]} */
	const new_returns = [];
	for (const ret of all_returns) {
		if (!return_flags.has(ret)) {
			return_flags.set(ret, {
				name: state.scope.generate('__r'),
				tracked: ret.metadata?.is_reactive ?? false,
			});
			new_returns.push(ret);
		}
	}

	if (!state.to_ts) {
		for (const ret of new_returns) {
			const info = /** @type {{ name: string, tracked: boolean }} */ (return_flags.get(ret));
			if (info.tracked) {
				state.init?.unshift(b.var(b.id(info.name), b.call('_$_.track', b.false, b.id('__block'))));
			} else {
				state.init?.unshift(b.var(b.id(info.name), b.false));
			}
		}
	}

	/** @type {{ name: string, tracked: boolean }[]} */
	const accumulated_return_flags = [];
	const has_returns = all_returns.length > 0;

	const is_fragment =
		normalized.some(
			(node) =>
				node.type === 'IfStatement' ||
				node.type === 'TryStatement' ||
				node.type === 'ForOfStatement' ||
				node.type === 'SwitchStatement' ||
				node.type === 'Tsx' ||
				node.type === 'TsxCompat' ||
				node.type === 'Html' ||
				(node.type === 'Element' &&
					(node.id.type !== 'Identifier' || !is_element_dom_element(node))),
		) ||
		(normalized.filter(
			(node) => node.type !== 'VariableDeclaration' && node.type !== 'EmptyStatement',
		).length === 1 &&
			normalized.some(
				(node) =>
					node.type === 'TSRXExpression' &&
					is_children_template_expression(node.expression, state.scope),
			)) ||
		// At root level, non-literal expressions need a fragment template so the
		// anchor has a parent node. Without a parent, expression()'s .before() call
		// is a no-op when the value is a TSRXElement.
		(root &&
			normalized.some(
				(node) =>
					node.type === 'TSRXExpression' &&
					/** @type {AST.TSRXExpression} */ (node).expression.type !== 'Literal',
			)) ||
		normalized.filter(
			(node) => node.type !== 'VariableDeclaration' && node.type !== 'EmptyStatement',
		).length > 1;
	/** @type {AST.Identifier | null} */
	let initial = null;
	/** @type {(() => AST.Identifier) | null} */
	let prev = null;
	let template_id = null;

	/** @param {AST.Node} node */
	const get_id = (node) => {
		return b.id(
			node.type == 'Element' && is_element_dom_element(node)
				? state.scope.generate(/** @type {AST.Identifier} */ (node.id).name)
				: node.type == 'TSRXExpression'
					? state.scope.generate('expression')
					: node.type == 'Text'
						? state.scope.generate('text')
						: state.scope.generate('node'),
			/** @type {AST.NodeWithLocation} */ (node.type === 'Element' ? node.openingElement : node),
		);
	};

	/** @param {AST.Node} node */
	const create_initial = (node) => {
		const id = is_fragment
			? b.id(
					state.scope.generate('fragment'),
					/** @type {AST.NodeWithLocation} */ (
						node.type === 'Element' ? node.openingElement : node
					),
				)
			: get_id(node);
		initial = id;
		template_id = state.scope.generate('root');
		state.init?.push(b.var(id, b.call(template_id)));
	};

	/** @type {AST.Node[]} */
	let pending_group = [];
	/** @type {{ name: string, tracked: boolean }[]} */
	let pending_guard_flags = [];
	let fragment_hop_count = 0;

	let skipped = 0;

	const flush_pending_group = () => {
		if (pending_group.length === 0) return;

		const guard_flags = pending_guard_flags;
		const group_nodes = pending_group;
		pending_group = [];
		pending_guard_flags = [];

		// Push <!> placeholder for the _$_.if anchor
		state.template?.push('<!>');
		if (is_fragment) {
			fragment_hop_count += 1;
		}

		if (initial === null && root) {
			create_initial(group_nodes[0]);
		}

		const current_prev = prev;
		/** @type {AST.Identifier | null} */
		let cached_anchor = null;
		const group_flush_node = () => {
			if (cached_anchor) return cached_anchor;
			const id = b.id(state.scope.generate('node'));
			if (current_prev !== null) {
				state.init?.push(b.var(id, b.call('_$_.sibling', current_prev())));
			} else if (initial !== null) {
				if (is_fragment) {
					state.init?.push(b.var(id, b.call('_$_.first_child_frag', initial)));
				} else {
					cached_anchor = initial;
					return initial;
				}
			} else if (state.flush_node !== null) {
				state.init?.push(b.var(id, b.call('_$_.child', state.flush_node?.())));
			}
			cached_anchor = id;
			return id;
		};

		prev = group_flush_node;

		const anchor = group_flush_node();

		// Process group nodes through transform_body
		const body = transform_body(group_nodes, {
			...context,
			state: { ...context.state, flush_node: null, return_flags },
		});

		const content_id = state.scope.generate('content');
		const guard_condition = build_return_guard(guard_flags);

		/** @type {AST.Statement[]} */
		const callback_body = [
			b.if(guard_condition, b.stmt(b.call(b.id('__render'), b.id(content_id)))),
		];

		state.init?.push(b.var(b.id(content_id), b.arrow([b.id('__anchor')], b.block(body))));
		state.init?.push(
			b.stmt(b.call('_$_.if', anchor, b.arrow([b.id('__render')], b.block(callback_body)))),
		);
	};

	for (let node_idx = 0; node_idx < normalized.length; node_idx++) {
		const node = normalized[node_idx];

		if (accumulated_return_flags.length > 0 && is_template_or_control_flow(node) && !state.to_ts) {
			if (pending_group.length === 0) {
				pending_guard_flags = [...accumulated_return_flags];
			}
			pending_group.push(node);

			if (node.metadata?.has_return && node.metadata.returns) {
				flush_pending_group();
				for (const ret of node.metadata.returns) {
					const info = return_flags.get(ret);
					if (info && !accumulated_return_flags.some((f) => f.name === info.name)) {
						accumulated_return_flags.push(info);
					}
				}
			}
			continue;
		}

		flush_pending_group();

		if (is_fragment && is_template_or_control_flow(node)) {
			fragment_hop_count += 1;
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
			state.init?.push(/** @type {AST.Statement} */ (visit(node, { ...state, return_flags })));
			if (!state.to_ts) {
				if (node.type === 'ReturnStatement') {
					const info = return_flags.get(node);
					if (info && !accumulated_return_flags.some((f) => f.name === info.name)) {
						accumulated_return_flags.push(info);
					}
				}
			}
		} else if (state.to_ts) {
			transform_ts_child(node, /** @type {VisitorClientContext} */ ({ visit, state }));
		} else {
			let metadata;
			/** @type {AST.Expression | undefined} */
			let expression = undefined;
			let is_create_text_only = false;
			if (node.type === 'TSRXExpression' || node.type === 'Text' || node.type === 'Html') {
				metadata = { tracking: false };
				expression = /** @type {AST.Expression} */ (visit(node.expression, { ...state, metadata }));
				is_create_text_only =
					node.type !== 'Html' && normalized.length === 1 && expression.type === 'Literal';
			}

			if (initial === null && root && !is_create_text_only) {
				create_initial(node);
			}

			const current_prev = prev;
			/** @type {AST.Identifier | null} */
			let cached = null;
			/**
			 * @param {boolean} [is_text]
			 * @param {boolean} [is_controlled]
			 * */
			const flush_node = (is_text, is_controlled) => {
				if (cached && !is_controlled) {
					return cached;
				} else if (current_prev !== null) {
					const id = get_id(node);
					state.init?.push(b.var(id, b.call('_$_.sibling', current_prev(), is_text && b.true)));
					cached = id;
					return id;
				} else if (initial !== null) {
					if (is_fragment) {
						const id = get_id(node);
						state.init?.push(b.var(id, b.call('_$_.first_child_frag', initial, is_text && b.true)));
						cached = id;
						return id;
					}
					return initial;
				} else if (state.flush_node !== null) {
					if (is_controlled) {
						return state.flush_node?.(is_text);
					}

					const id = get_id(node);
					state.init?.push(b.var(id, b.call('_$_.child', state.flush_node?.(), is_text && b.true)));
					cached = id;
					return id;
				} else {
					return get_id(node);
				}
			};

			prev = flush_node;

			const is_controlled = normalized.length === 1 && !root;

			if (node.type === 'Element') {
				if (is_element_dom_element(node)) {
					skipped++;
				} else {
					skipped = 0;
				}

				visit(node, {
					...state,
					return_flags,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});

				// After processing an element's children via child()/sibling() navigation,
				// hydrate_node is left deep inside the element. If there's a next sibling,
				// we need to restore hydrate_node so sibling() navigation works correctly.
				//
				// We only need pop() when we actually DESCEND into the element, which happens when:
				// - There are Element children (including DOM elements like <button>)
				// - There are non-literal Text children (we navigate to set text content)
				// - There are control flow / Html / component children
				//
				// The Element visitor already adds pop() for non-literal text, control flow,
				// Html, and component (non-DOM element) children. We need to ALSO add pop()
				// when there are DOM element children, which the Element visitor doesn't cover.
				const next_node = normalized[node_idx + 1];
				if (next_node && is_element_dom_element(node) && node.children.length > 0) {
					// Check if any child is a DOM element - this causes navigation but
					// the Element visitor doesn't add pop() for it
					const has_dom_element_children = node.children.some(
						(child) =>
							child.type === 'Element' &&
							child.id.type === 'Identifier' &&
							is_element_dom_element(child),
					);

					// Check if the Element visitor already added pop()
					const element_visitor_adds_pop = node.children.some(
						(child) =>
							child.type === 'IfStatement' ||
							child.type === 'TryStatement' ||
							child.type === 'ForOfStatement' ||
							child.type === 'SwitchStatement' ||
							child.type === 'Tsx' ||
							child.type === 'TsxCompat' ||
							child.type === 'Html' ||
							(child.type === 'Element' &&
								(child.id.type !== 'Identifier' || !is_element_dom_element(child))) ||
							((child.type === 'TSRXExpression' || child.type === 'Text') &&
								child.expression.type !== 'Literal'),
					);

					const has_following_renderable_sibling = normalized
						.slice(node_idx + 1)
						.some(
							(sibling) =>
								sibling.type !== 'VariableDeclaration' && sibling.type !== 'EmptyStatement',
						);

					// Add pop() if we have DOM element children, the Element visitor didn't already
					// add one, and there is another renderable sibling afterward. This keeps
					// hydrate_node anchored at the current element before sibling() traversal.
					if (
						has_dom_element_children &&
						!element_visitor_adds_pop &&
						has_following_renderable_sibling
					) {
						const id = cached ?? flush_node();
						state.init?.push(b.stmt(b.call('_$_.pop', id)));
					}
				}
			} else if (node.type === 'TsxCompat' || node.type === 'Tsx') {
				skipped = 0;

				visit(node, {
					...state,
					return_flags,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});
			} else if (node.type === 'Html') {
				context.state.template?.push('<!>');
				skipped = 0;

				const id = flush_node(false);
				state.update?.push({
					operation: () =>
						b.stmt(
							b.call(
								'_$_.html',
								id,
								b.thunk(/** @type {AST.Expression} */ (expression)),
								state.namespace === 'svg' && b.true,
								state.namespace === 'mathml' && b.true,
							),
						),
				});
			} else if (node.type === 'TSRXExpression') {
				const expr = /** @type {AST.Expression} */ (expression);

				if (expr.type === 'Literal') {
					if (normalized.length === 1) {
						skipped++;
						if (
							/** @type {NonNullable<TransformClientState['template']>} */ (state.template).length >
							0
						) {
							state.template?.push(escape_html(expr.value));
						} else {
							const id = flush_node(true);
							state.init?.push(b.var(/** @type {AST.Identifier} */ (id), b.call('_$_.text', expr)));
							state.final?.push(b.stmt(b.call('_$_.append', b.id('__anchor'), id)));
						}
					} else {
						skipped++;
						state.template?.push(escape_html(expr.value));
					}
				} else if (
					normalized.length === 1 &&
					!is_children_template_expression(node.expression, state.scope)
				) {
					skipped++;
					state.template?.push(' ');
					const id = flush_node(true);
					const call = b.call('_$_.expression', id, b.thunk(expr));
					state.init?.push(
						state.namespace !== DEFAULT_NAMESPACE
							? b.stmt(b.call('_$_.with_ns', b.literal(state.namespace), b.thunk(call)))
							: b.stmt(call),
					);
				} else {
					skipped = 0;
					state.template?.push('<!>');
					const id = flush_node(false);
					const call = b.call('_$_.expression', id, b.thunk(expr));
					state.init?.push(
						state.namespace !== DEFAULT_NAMESPACE
							? b.stmt(b.call('_$_.with_ns', b.literal(state.namespace), b.thunk(call)))
							: b.stmt(call),
					);
				}
			} else if (node.type === 'Text') {
				if (metadata?.tracking) {
					skipped = 0;
					state.template?.push(' ');
					const id = flush_node(true);
					state.update?.push({
						operation: (key) => b.stmt(b.call('_$_.set_text', id, key)),
						expression: /** @type {AST.Expression} */ (expression),
						identity: node.expression,
						initial: b.literal(' '),
					});
				} else if (normalized.length === 1) {
					skipped++;
					const expr = /** @type {AST.Expression} */ (expression);
					if (expr.type === 'Literal') {
						if (
							/** @type {NonNullable<TransformClientState['template']>} */ (state.template).length >
							0
						) {
							state.template?.push(escape_html(expr.value));
						} else {
							const id = flush_node(true);
							state.init?.push(b.var(/** @type {AST.Identifier} */ (id), b.call('_$_.text', expr)));
							state.final?.push(b.stmt(b.call('_$_.append', b.id('__anchor'), id)));
						}
					} else {
						const id = flush_node(true);
						state.template?.push(' ');
						// avoid set_text overhead for single text nodes
						state.init?.push(
							b.stmt(
								b.assignment(
									'=',
									b.member(/** @type {AST.Identifier} */ (id), b.id('nodeValue')),
									expr,
								),
							),
						);
					}
				} else {
					skipped++;
					// Handle Text nodes in fragments
					const expr = /** @type {AST.Expression} */ (expression);
					if (expr.type === 'Literal') {
						state.template?.push(escape_html(expr.value));
					} else {
						state.template?.push(' ');
						const id = flush_node(true);
						state.update?.push({
							operation: (key) => b.stmt(b.call('_$_.set_text', id, key)),
							expression: /** @type {AST.Expression} */ (expression),
							identity: node.expression,
							initial: b.literal(' '),
						});
					}
				}
			} else if (node.type === 'ForOfStatement') {
				skipped = 0;
				node.is_controlled = is_controlled;
				visit(node, {
					...state,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});
			} else if (node.type === 'IfStatement') {
				skipped = 0;
				node.is_controlled = is_controlled;
				visit(node, {
					...state,
					return_flags,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});
			} else if (node.type === 'TryStatement') {
				skipped = 0;
				node.is_controlled = is_controlled;
				visit(node, {
					...state,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});
			} else if (node.type === 'SwitchStatement') {
				skipped = 0;
				node.is_controlled = is_controlled;
				visit(node, {
					...state,
					flush_node: /** @type {TransformClientState['flush_node']} */ (flush_node),
					namespace: state.namespace,
				});
			} else if (node.type === 'BreakStatement') {
				// do nothing
			} else {
				debugger;
			}
		}

		if (has_returns && node.metadata?.has_return && node.metadata.returns) {
			for (const ret of node.metadata.returns) {
				const info = return_flags.get(ret);
				if (info && !accumulated_return_flags.some((f) => f.name === info.name)) {
					accumulated_return_flags.push(info);
				}
			}
		}
	}

	flush_pending_group();

	for (let i = 0; i < head_elements.length; i++) {
		const head_element = head_elements[i];
		if (state.to_ts) {
			transform_ts_child(head_element, /** @type {VisitorClientContext} */ ({ visit, state }));
		} else {
			visit_head_element(head_element, i, context);
		}
	}

	if (context.state.inside_head) {
		const title_element = /** @type {AST.Element} */ (
			children.find(
				(node) =>
					node.type === 'Element' && node.id.type === 'Identifier' && node.id.name === 'title',
			)
		);

		if (title_element) {
			visit_title_element(title_element, context);
		}
	}

	let emitted_next = false;
	if (is_fragment && skipped > 1 && !state.skip_children_traversal) {
		skipped--;
		state.init?.push(b.stmt(b.call('_$_.next', skipped !== 1 && b.literal(skipped))));
		emitted_next = true;
	}

	const template_namespace = state.namespace || 'html';

	if (root && initial !== null && template_id !== null) {
		let flags = is_fragment ? TEMPLATE_FRAGMENT : 0;
		if (template_namespace === 'svg') {
			flags |= TEMPLATE_SVG_NAMESPACE;
		} else if (template_namespace === 'mathml') {
			flags |= TEMPLATE_MATHML_NAMESPACE;
		}
		state.final?.push(
			b.stmt(b.call('_$_.append', b.id('__anchor'), initial, emitted_next && b.true)),
		);
		const template_array = /** @type {NonNullable<TransformClientState['template']>} */ (
			state.template
		);
		const template_args = [join_template(template_array), b.literal(flags)];

		// For fragments, add the pre-calculated hop count as a third argument.
		// This count reflects emitted top-level positions after return-guard grouping.
		if (is_fragment) {
			const node_count = fragment_hop_count || 1;
			template_args.push(b.literal(node_count));
		}

		state.hoisted.push(b.var(template_id, b.call('_$_.template', ...template_args)));
	}
}

/**
 * Checks if a switch case consequent contains a BreakStatement,
 * including inside BlockStatements.
 * @param {AST.Node[]} consequent
 * @returns {boolean}
 */
function consequent_has_break(consequent) {
	for (const stmt of consequent) {
		if (stmt.type === 'BreakStatement') return true;
		if (stmt.type === 'BlockStatement') {
			if (consequent_has_break(/** @type {AST.BlockStatement} */ (stmt).body)) return true;
		}
	}
	return false;
}

/**
 * @param {AST.Node[]} body
 * @param {TransformClientContext} context
 * @returns {AST.Statement[]}
 */
function transform_body(body, { visit, state }) {
	/** @type {TransformClientState} */
	const body_state = {
		...state,
		template: [],
		init: [],
		update: [],
		final: [],
		metadata: state.metadata,
		namespace: state.namespace || 'html', // Preserve namespace context
		inside_head: state.inside_head || false,
	};

	transform_children(
		body,
		/** @type {VisitorClientContext} */ ({ visit, state: body_state, root: true }),
	);

	if (/** @type {NonNullable<TransformClientState['update']>} */ (body_state.update).length > 0) {
		if (!state.to_ts) {
			apply_updates(
				/** @type {NonNullable<TransformClientState['init']>} */ (body_state.init),
				/** @type {NonNullable<TransformClientState['update']>} */ (body_state.update),
				state,
			);
		}

		// NOTE: transform_children in `to_ts` mode does NOT add to body_state.update
		// So, we skip adding any actions with body_state.update
	}

	return [
		.../** @type {AST.Statement[]} */ (body_state.init),
		.../** @type {NonNullable<TransformClientState['final']>} */ (body_state.final),
	];
}

/**
 * Create a TSX language handler with enhanced TypeScript support
 * @param {AST.CommentWithLocation[]} [comments] - Comments to pass to esrap's built-in comment handling
 * @returns {Visitors<AST.Node, TransformClientState>} TSX language handler with TypeScript return type support
 */
function create_tsx_with_typescript_support(comments) {
	const preserved_comments = comments?.filter(shouldPreserveComment) ?? [];
	// Don't pass comments to esrap - we handle them manually via flush_comments_before
	// because esrap's built-in comment handling requires all intermediate nodes to have loc
	const base_tsx = /** @type {Visitors<AST.Node, TransformClientState>} */ (tsx());

	// Track which comments have been written (by index)
	let comment_index = 0;
	// Track the previous node's line to see if need to
	// insert a new line before the comment
	let prev_line = -1;

	/**
	 * Flush all preserved comments that appear before the given position
	 * @param {TransformClientContext} context
	 * @param {{ line: number, column: number }} position
	 */
	const flush_comments_before = (context, position) => {
		while (comment_index < preserved_comments.length) {
			const comment = preserved_comments[comment_index];
			if (!comment.loc) {
				comment_index++;
				continue;
			}
			// Check if comment is before the current position
			if (
				comment.loc.start.line < position.line ||
				(comment.loc.start.line === position.line && comment.loc.start.column < position.column)
			) {
				if (prev_line > 0 && comment.loc.start.line > prev_line) {
					context.newline();
				}
				// Write the comment
				context.write(formatComment(comment));
				context.newline();
				comment_index++;
			} else {
				// Comment is at or after position, stop
				break;
			}
		}
		prev_line = position.line;
	};

	/**
	 * Shared handler for function-like nodes to support component->function mapping
	 * Creates source maps for 'function' keyword by passing node to context.write()
	 * @param {AST.Function} node
	 * @param {TransformClientContext} context
	 */
	const handle_function = (node, context) => {
		const loc = /** @type {AST.SourceLocation} */ (node.loc);
		const start_pos = /** @type {AST.Position} */ ({
			line: loc.start.line,
			column: loc.start.column,
		});

		if (node.async) {
			context.location(loc.start.line, loc.start.column);
			context.write('async ');
			context.location(loc.start.line, loc.start.column + 'async '.length);
			start_pos.column += 'async '.length;
		}

		context.location(start_pos.line, start_pos.column);
		context.write('function');
		context.location(start_pos.line, start_pos.column + 'function'.length);

		if (node.generator) {
			context.write('*');
		}

		const id = /** @type {AST.FunctionExpression | AST.FunctionDeclaration} */ (node).id;

		// FunctionDeclaration always has a space before id, FunctionExpression only if id exists
		if (node.type === 'FunctionDeclaration' || id) {
			context.write(' ');
		}
		if (id) {
			context.visit(id);
		}
		if (node.typeParameters) {
			context.visit(node.typeParameters);
		}
		context.write('(');
		for (let i = 0; i < node.params.length; i++) {
			if (i > 0) context.write(', ');
			context.visit(node.params[i]);
		}
		context.write(')');
		if (node.returnType) {
			context.visit(node.returnType);
		}
		context.write(' ');
		if (node.body) {
			context.visit(node.body);
		}
	};

	return /** @type {Visitors<AST.Node, TransformClientState>} */ ({
		...base_tsx,
		_(node, context, visit) {
			if (node.loc) {
				flush_comments_before(context, node.loc.start);
			}

			visit(node);
		},
		TSExpressionWithTypeArguments(node, context) {
			context.visit(node.expression);
			if (node.typeParameters) {
				context.visit(node.typeParameters);
			}
		},
		AssignmentPattern(node, context) {
			// We need to make sure that the whole AssignmentPattern has a start and end mapping
			// Acorn only maps pieces but not the whole thing
			// So we need to cover the start and end source positions manually
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// node.left already covers the start
			base_tsx.AssignmentPattern?.(node, context);
			// cover the end
			context.location(loc.end.line, loc.end.column);
		},
		ExpressionStatement(node, context) {
			if (!node.loc) {
				base_tsx.ExpressionStatement?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.ExpressionStatement?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		UpdateExpression(node, context) {
			if (!node.loc) {
				base_tsx.UpdateExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.UpdateExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		UnaryExpression(node, context) {
			if (!node.loc) {
				base_tsx.UnaryExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.UnaryExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		YieldExpression(node, context) {
			if (!node.loc) {
				base_tsx.YieldExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.YieldExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		CallExpression(node, context) {
			if (!node.loc) {
				base_tsx.CallExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.CallExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		Literal(node, context) {
			if (!node.loc || node.raw === undefined) {
				base_tsx.Literal?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			context.write(node.raw);
			context.location(loc.end.line, loc.end.column);
		},
		MemberExpression(node, context) {
			if (!node.loc) {
				base_tsx.MemberExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.MemberExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		ObjectExpression(node, context) {
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}

			if (node.metadata?.printInline) {
				// Check if this object should be printed inline (e.g., ref attribute spread)
				context.write('{ ');
				for (let i = 0; i < node.properties.length; i++) {
					if (i > 0) context.write(', ');
					context.visit(node.properties[i]);
				}
				context.write(' }');
			} else {
				base_tsx.ObjectExpression?.(node, context);
			}

			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		NewExpression(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc) ?? null;

			if (loc && !node?.metadata?.skipNewMapping) {
				context.location(loc.start.line, loc.start.column);
			}
			context.write('new ');

			if (loc && node?.metadata?.skipNewMapping) {
				context.location(loc.start.line, loc.start.column);
			}

			context.visit(node.callee);
			if (node.typeArguments) {
				context.visit(node.typeArguments);
			}
			context.write('(');
			for (let i = 0; i < node.arguments.length; i++) {
				if (i > 0) context.write(', ');
				context.visit(node.arguments[i]);
			}
			context.write(')');
			if (loc) {
				context.location(loc.end.line, loc.end.column);
			}
		},
		TemplateLiteral(node, context) {
			if (!node.loc) {
				base_tsx.TemplateLiteral?.(node, context);
				return;
			}

			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.TemplateLiteral?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		SwitchStatement(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// the start needs to be covered as we don't cover it in visitors
			context.location(loc.start.line, loc.start.column);
			base_tsx.SwitchStatement?.(node, context);
			// cover the end
			context.location(loc.end.line, loc.end.column);
		},
		ForOfStatement(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// the start needs to be covered as we don't cover it in visitors
			context.location(loc.start.line, loc.start.column);
			base_tsx.ForOfStatement?.(node, context);
			// cover the end
			context.location(loc.end.line, loc.end.column);
		},
		ForStatement(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// the start needs to be covered as we don't cover it in visitors
			context.location(loc.start.line, loc.start.column);
			base_tsx.ForStatement?.(node, context);
			// cover the end
			context.location(loc.end.line, loc.end.column);
		},
		ForInStatement(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// the start needs to be covered as we don't cover it in visitors
			context.location(loc.start.line, loc.start.column);
			base_tsx.ForInStatement?.(node, context);
			// cover the end
			context.location(loc.end.line, loc.end.column);
		},
		ReturnStatement(node, context) {
			if (!node.loc) {
				base_tsx.ReturnStatement?.(node, context);
				return;
			}

			const { start, end } = node.loc;

			context.location(start.line, start.column);
			base_tsx.ReturnStatement?.(node, context);
			context.location(end.line, end.column);
		},
		AwaitExpression(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// the start needs to be covered as we don't cover it in visitors
			context.location(loc.start.line, loc.start.column);
			context.write('await');
			// cover the 'await' end
			context.location(loc.start.line, loc.start.column + 'await'.length);
			context.write(' ');
			context.visit(node.argument);
			// cover the end of the expression
			context.location(loc.end.line, loc.end.column);
		},
		Property(node, context) {
			let start_pos = node.loc?.start;
			if (node.loc) {
				start_pos = /** @type {AST.Position} */ ({
					line: node.loc.start.line,
					column: node.loc.start.column,
				});
			}

			const is_method = node.method || node.kind === 'get' || node.kind === 'set';

			// Handle getters/setters
			if (node.kind === 'get') {
				context.write('get ');
				if (start_pos) {
					start_pos.column += 'get '.length;
				}
			} else if (node.kind === 'set') {
				if (start_pos) {
					start_pos.column += 'set '.length;
				}
				context.write('set ');
			}

			// Write async keyword (before *)
			if (is_method && /** @type {AST.FunctionExpression} */ (node.value).async) {
				// If not a method, async should be a part of the value e.g. { prop: async function }
				if (start_pos) {
					context.location(start_pos.line, start_pos.column);
				}
				context.write('async ');
				if (start_pos) {
					context.location(start_pos.line, start_pos.column + 'async '.length);
					start_pos.column += 'async '.length;
				}
			}

			// Write * for generator methods
			if (/** @type {AST.FunctionExpression} */ (node.value).generator) {
				context.write('*');
			}

			// Write the key
			if (node.computed) {
				if (node.key.loc) {
					context.location(node.key.loc.start.line, node.key.loc.start.column - 1);
				}
				context.write('[');
				context.visit(node.key);
				context.write(']');
				if (node.key.loc) {
					context.location(node.key.loc.end.line, node.key.loc.end.column + 1);
				}
			} else {
				if (node.shorthand) {
					// Shorthand object properties require an Identifier value. When the
					// transformed value is a tracked MemberExpression (for example
					// @value), emit longhand to keep valid output.
					if (
						node.value.type === 'MemberExpression' &&
						/** @type {AST.MemberExpression & { tracked?: boolean }} */ (node.value).tracked
					) {
						context.visit(node.key);
						context.write(': ');
						context.visit(node.value);
						return;
					}
					// only visit value since key and value are the same
					// or the value will contain the key like in AssignmentPattern: { foo = 1 }
					context.visit(node.value);
					return;
				}

				context.visit(node.key);
			}

			// Method shorthand: { foo() {} } or getters/setters - print params and body directly
			if (is_method) {
				const fn = /** @type {AST.FunctionExpression} */ (node.value);

				fn.metadata.is_method = true;

				// Type parameters: { foo<T>() {} }
				if (fn.typeParameters) {
					context.visit(fn.typeParameters);
				}

				context.write('(');
				for (let i = 0; i < fn.params.length; i++) {
					if (i > 0) context.write(', ');
					context.visit(fn.params[i]);
				}
				context.write(')');

				if (fn.returnType) {
					context.visit(fn.returnType);
				}

				context.write(' ');
				context.visit(fn.body);
				return;
			}

			// Regular property: { key: value }
			context.write(': ');
			context.visit(node.value);
		},
		JSXOpeningElement(node, context) {
			// Set location for '<'
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			context.write('<');

			context.visit(node.name);

			if (node.typeArguments) {
				context.visit(node.typeArguments);
			}

			for (const attr of node.attributes || []) {
				context.write(' ');
				context.visit(attr);
			}

			if (node.selfClosing) {
				context.write(' />');
			} else {
				// Set the source location for the '>'
				// node.loc.end points AFTER the '>', so subtract 1 to get the position OF the '>'
				if (node.loc) {
					context.location(node.loc.end.line, node.loc.end.column - 1);
				}
				context.write('>');
			}

			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		JSXClosingElement(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.JSXClosingElement?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		JSXIdentifier(node, context) {
			if (!node.loc) {
				base_tsx.JSXIdentifier?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			context.write(node.name);
			context.location(loc.end.line, loc.end.column);
		},
		Identifier(node, context) {
			context.write(node.name, node);
			if (node.optional) {
				context.write('?');
			}
			if (node.typeAnnotation) {
				context.visit(node.typeAnnotation);
			}
		},
		JSXExpressionContainer(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			if (!loc) {
				base_tsx.JSXExpressionContainer?.(node, context);
				return;
			}
			context.location(loc.start.line, loc.start.column);
			base_tsx.JSXExpressionContainer?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		MethodDefinition(node, context) {
			node.value.metadata.is_method = true;
			/** @type {AST.Position | undefined} */
			let start_pos;
			if (node.loc) {
				start_pos = /** @type {AST.Position} */ ({
					line: node.loc.start.line,
					column: node.loc.start.column,
				});
			}

			// Write modifiers (static, async, etc.)
			if (node.static) {
				context.write('static ');
				if (start_pos) {
					start_pos.column += 'static '.length;
				}
			}

			if (node.kind === 'get') {
				context.write('get ');
				if (start_pos) {
					start_pos.column += 'get '.length;
				}
			} else if (node.kind === 'set') {
				if (start_pos) {
					start_pos.column += 'set '.length;
				}
				context.write('set ');
			} else if (node.kind === 'constructor') {
				// skip as it's covered by the key
			}

			// Write async keyword (before *)
			if (/** @type {AST.FunctionExpression} */ (node.value).async) {
				if (start_pos) {
					context.location(start_pos.line, start_pos.column);
				}
				context.write('async ');
				if (start_pos) {
					context.location(start_pos.line, start_pos.column + 'async '.length);
					start_pos.column += 'async '.length;
				}
			}

			// Write * for generator methods
			if (node.value.generator) {
				context.write('*');
			}

			// Write the method key
			if (node.computed) {
				if (node.key.loc) {
					context.location(node.key.loc.start.line, node.key.loc.start.column - 1);
				}
				context.write('[');
				context.visit(node.key);
				context.write(']');
				if (node.key.loc) {
					context.location(node.key.loc.end.line, node.key.loc.end.column + 1);
				}
			} else {
				context.visit(node.key);
			}

			// Visit typeParameters
			// TypeParameters can be on either the MethodDefinition or its value (FunctionExpression)
			if (node.typeParameters) {
				context.visit(node.typeParameters);
			} else if (node.value?.typeParameters) {
				context.visit(node.value.typeParameters);
			}

			// Write parameters - set location for opening '('
			if (node.value?.loc) {
				context.location(node.value.loc.start.line, node.value.loc.start.column);
			}
			context.write('(');
			if (node.value?.params) {
				for (let i = 0; i < node.value.params.length; i++) {
					if (i > 0) context.write(', ');
					context.visit(node.value.params[i]);
				}
			}
			context.write(')');

			// Write return type if present
			if (node.value?.returnType) {
				context.visit(node.value.returnType);
			}

			// Write method body
			if (node.value?.body) {
				context.write(' ');
				context.visit(node.value.body);
			}
		},
		ParenthesizedExpression(node, context) {
			if (!node.loc) {
				base_tsx.ParenthesizedExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.ParenthesizedExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		TSAsExpression(node, context) {
			if (!node.loc) {
				base_tsx.TSAsExpression?.(node, context);
				return;
			}
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			context.location(loc.start.line, loc.start.column);
			base_tsx.TSAsExpression?.(node, context);
			context.location(loc.end.line, loc.end.column);
		},
		TSObjectKeyword(node, context) {
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			context.write('object');
			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		TSTypeParameterDeclaration(node, context) {
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			context.write('<');
			for (let i = 0; i < node.params.length; i++) {
				if (i > 0) {
					context.write(', ');
				}
				context.visit(node.params[i]);
			}
			if (node.params.length === 1 && node.extra?.trailingComma !== undefined) {
				context.write(',');
			}
			context.write('>');
			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		TSTypeParameterInstantiation(node, context) {
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			base_tsx.TSTypeParameterInstantiation?.(node, context);
			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		TSTypeParameter(node, context) {
			// Set location for the type parameter name
			if (node.loc) {
				context.location(node.loc.start.line, node.loc.start.column);
			}
			context.write(node.name);
			if (node.constraint) {
				context.write(' extends ');
				context.visit(node.constraint);
			}
			if (node.default) {
				context.write(' = ');
				context.visit(node.default);
			}
			if (node.loc) {
				context.location(node.loc.end.line, node.loc.end.column);
			}
		},
		ArrayPattern(node, context) {
			context.write('[');
			for (let i = 0; i < node.elements.length; i++) {
				if (i > 0) context.write(', ');
				if (node.elements[i]) {
					context.visit(/** @type {AST.Pattern} */ (node.elements[i]));
				}
			}
			context.write(']');
			// Visit type annotation if present
			if (node.typeAnnotation) {
				context.visit(node.typeAnnotation);
			}
		},
		FunctionDeclaration(node, context) {
			handle_function(node, context);
		},
		FunctionExpression(node, context) {
			handle_function(node, context);
		},
		ImportDeclaration(node, context) {
			const loc = /** @type {AST.SourceLocation} */ (node.loc);
			// Write 'import' keyword with source location
			// to mark the beginning of the import statement for a full import mapping
			// The semicolon at the end with location will mark the end of the import statement
			context.location(loc.start.line, loc.start.column);
			context.write('import');

			// Handle 'import type' syntax (importKind on the declaration itself)
			if (node.importKind === 'type') {
				context.write(' type');
			}

			context.write(' ');

			// Write specifiers - handle default, namespace, and named imports
			if (node.specifiers && node.specifiers.length > 0) {
				let default_specifier = null;
				let namespace_specifier = null;
				const named_specifiers = [];

				for (const spec of node.specifiers) {
					if (spec.type === 'ImportDefaultSpecifier') {
						default_specifier = spec;
					} else if (spec.type === 'ImportNamespaceSpecifier') {
						namespace_specifier = spec;
					} else if (spec.type === 'ImportSpecifier') {
						named_specifiers.push(spec);
					}
				}

				// Write default import
				if (default_specifier) {
					context.visit(default_specifier);
					if (namespace_specifier || named_specifiers.length > 0) {
						context.write(', ');
					}
				}

				// Write namespace import
				if (namespace_specifier) {
					context.visit(namespace_specifier);
					if (named_specifiers.length > 0) {
						context.write(', ');
					}
				}

				// Write named imports
				if (named_specifiers.length > 0) {
					context.write('{ ');
					for (let i = 0; i < named_specifiers.length; i++) {
						if (i > 0) context.write(', ');
						context.visit(named_specifiers[i]);
					}
					context.write(' }');
				}

				context.write(' from ');
			}

			// Write source
			context.visit(node.source);
			// Write semicolon at the end
			// and record its position to mark the end of the import statement
			// This should work regardless of whether the source has a semi or not
			context.location(loc.end.line, loc.end.column - 1);
			context.write(';');
		},
		ImportDefaultSpecifier(node, context) {
			context.visit(node.local);
		},
		ImportNamespaceSpecifier(node, context) {
			context.write('* as ');
			context.visit(node.local);
		},
		ImportSpecifier(node, context) {
			if (node.importKind === 'type') {
				context.write('type ');
			}
			context.visit(node.imported);
			// Only write 'as local' if imported !== local
			if (/** @type {AST.Identifier} */ (node.imported).name !== node.local.name) {
				context.write(' as ');
				context.visit(node.local);
			}
		},
		TSParenthesizedType(node, context) {
			context.write('(');
			context.visit(/** @type {AST.TSTypeAnnotation} */ (node.typeAnnotation));
			context.write(')');
		},
		TSNamedTupleMember(node, context) {
			context.visit(node.label);
			if (node.optional) {
				context.write('?');
			}
			context.write(': ');
			context.visit(node.elementType);
		},
		TSMappedType(node, context) {
			context.write('{ ');
			if (node.readonly) {
				if (node.readonly === '+' || node.readonly === true) {
					context.write('readonly ');
				} else if (node.readonly === '-') {
					context.write('-readonly ');
				}
			}
			context.write('[');
			// Handle TSTypeParameter inline - mapped types use 'in' not 'extends'
			if (node.typeParameter) {
				const tp = node.typeParameter;
				if (tp.loc) {
					context.location(tp.loc.start.line, tp.loc.start.column);
				}
				// Write the parameter name
				context.write(tp.name);
				// In mapped types, constraint uses 'in' instead of 'extends'
				if (tp.constraint) {
					context.write(' in ');
					context.visit(tp.constraint);
				}
				// Handle 'as' clause for key remapping (e.g., { [K in Keys as NewKey]: V })
				if (node.nameType) {
					context.write(' as ');
					context.visit(node.nameType);
				}
			}
			context.write(']');
			if (node.optional) {
				if (node.optional === '+' || node.optional === true) {
					context.write('?');
				} else if (node.optional === '-') {
					context.write('-?');
				}
			}
			context.write(': ');
			// Visit the value type
			if (node.typeAnnotation) {
				context.visit(node.typeAnnotation);
			}
			context.write(' }');
		},
		TSTypeOperator(node, context) {
			context.write(node.operator);
			context.write(' ');
			context.visit(/** @type {AST.TSTypeAnnotation} */ (node.typeAnnotation));
		},
		TSInstantiationExpression(node, context) {
			// e.g., identity<string>, Array<number> when used as expressions
			context.visit(node.expression);
			if (node.typeArguments) {
				context.visit(node.typeArguments);
			}
		},
		// esrap's ArrowFunctionExpression printer ignores `typeParameters` and
		// `returnType`, so an annotated arrow like `(): Record<...> => ...`
		// prints as `() => ...` and segments.js can't resolve the return-type
		// nodes' positions in the generated output.
		ArrowFunctionExpression(node, context) {
			if (node.async) context.write('async ');

			if (node.typeParameters) {
				context.visit(node.typeParameters);
			}

			context.write('(');
			// Visit each parameter
			for (let i = 0; i < node.params.length; i++) {
				if (i > 0) context.write(', ');
				context.visit(node.params[i]);
			}
			context.write(')');

			// Add TypeScript return type annotation if present
			if (node.returnType) {
				context.visit(node.returnType);
			}

			context.write(' => ');

			if (
				node.body.type === 'ObjectExpression' ||
				(node.body.type === 'AssignmentExpression' && node.body.left.type === 'ObjectPattern') ||
				(node.body.type === 'LogicalExpression' && node.body.left.type === 'ObjectExpression') ||
				(node.body.type === 'ConditionalExpression' && node.body.test.type === 'ObjectExpression')
			) {
				context.write('(');
				context.visit(node.body);
				context.write(')');
			} else {
				context.visit(node.body);
			}
		},
		ClassDeclaration(node, context) {
			context.write('class ');
			if (node.id) {
				context.visit(node.id);
			}
			if (node.typeParameters) {
				context.visit(node.typeParameters);
			}
			if (node.superClass) {
				context.write(' extends ');
				context.visit(node.superClass);
				if (node.superTypeParameters) {
					context.visit(node.superTypeParameters);
				}
			}
			if (node.implements && node.implements.length > 0) {
				context.write(' implements ');
				for (let i = 0; i < node.implements.length; i++) {
					if (i > 0) context.write(', ');
					context.visit(node.implements[i]);
				}
			}
			context.write(' ');
			context.visit(node.body);
		},
		ClassExpression(node, context) {
			context.write('class');
			if (node.id) {
				context.write(' ');
				context.visit(node.id);
			}
			if (node.typeParameters) {
				context.visit(node.typeParameters);
			}
			if (node.superClass) {
				context.write(' extends ');
				context.visit(node.superClass);
				if (node.superTypeParameters) {
					context.visit(node.superTypeParameters);
				}
			}
			if (node.implements && node.implements.length > 0) {
				context.write(' implements ');
				for (let i = 0; i < node.implements.length; i++) {
					if (i > 0) context.write(', ');
					context.visit(node.implements[i]);
				}
			}
			context.write(' ');
			context.visit(node.body);
		},
		TryStatement(node, context) {
			context.write('try ');
			context.visit(node.block);

			if (node.pending) {
				// Output the pending block with source mapping for the 'pending' keyword
				context.write(' ');
				context.location(
					/** @type {AST.SourceLocation} */
					(node.pending.loc).start.line,
					/** @type {AST.SourceLocation} */
					(node.pending.loc).start.column - 'pending '.length,
				);
				context.write('pending ');
				context.visit(node.pending);
			}

			if (node.handler) {
				context.write(' catch');
				if (node.handler.param && !node.handler.resetParam) {
					context.write(' (');
					context.visit(node.handler.param);
					context.write(')');
				}
				context.write(' ');
				if (node.handler.param && node.handler.resetParam) {
					// Emit as IIFE so both params are valid TS arrow function parameters
					context.write('{\n');
					context.indent();
					context.write('((');
					context.visit(node.handler.param);
					if (!node.handler.param.typeAnnotation) {
						context.write(': unknown');
					}
					context.write(', ');
					context.visit(node.handler.resetParam);
					if (!node.handler.resetParam.typeAnnotation) {
						context.write(': () => void');
					}
					context.write(') => ');
					context.visit(node.handler.body);
					context.write(')({}, () => {})\n');
					context.dedent();
					context.write('}');
				} else {
					context.visit(node.handler.body);
				}
			}

			if (node.finalizer) {
				context.write(' finally ');
				context.visit(node.finalizer);
			}
		},
	});
}

/**
 * Transform Ripple AST to JavaScript/TypeScript
 * @param {string} filename - Source filename
 * @param {string} source - Original source code
 * @param {AnalysisResult} analysis - Analysis result
 * @param {boolean} to_ts - Whether to generate TypeScript output
 * @param {boolean} minify_css - Whether to minify CSS output
 * @param {boolean} hmr - Whether to emit HMR wrapper code
 * @returns {{ ast: AST.Program, js: { code: string, map: RawSourceMap, post_processing_changes?: PostProcessingChanges, line_offsets?: LineOffsets }, css: string, errors:  CompileError[]}}
 */
export function transform_client(filename, source, analysis, to_ts, minify_css, hmr = false) {
	/** @type {TransformClientState} */
	const state = {
		imports: new Set(),
		events: new Set(),
		template: null,
		hoisted: [],
		init: null,
		inside_head: false,
		update: null,
		final: null,
		flush_node: null,
		scope: analysis.scope,
		scopes: analysis.scopes,
		ancestor_server_block: undefined,
		serverIdentifierPresent: analysis.metadata.serverIdentifierPresent,
		server_block_locals: [],
		stylesheets: [],
		to_ts,
		filename,
		namespace: 'html',
		metadata: {},
		errors: analysis.errors,
		skip_children_traversal: false,
	};

	// Add ripple internal import once for the entire module
	// Whatever is unused will be tree-shaken later, including a rare case
	// where nothing from ripple/internal/client is used
	if (!to_ts) {
		state.imports.add(`import * as _$_ from 'ripple/internal/client'`);
	}

	const program = /** @type {AST.Program} */ (walk(analysis.ast, { ...state }, visitors));

	/** @type {AST.TSRXProgram['body']} */
	let body = [];

	for (const import_node of state.imports) {
		if (typeof import_node === 'string') {
			body.push(b.stmt(b.id(import_node)));
		} else {
			body.push(import_node);
		}
	}

	for (const hoisted of state.hoisted) {
		body.push(hoisted);
	}

	body.push(...program.body);

	if (state.events.size > 0) {
		body.push(
			b.stmt(
				b.call('_$_.delegate', b.array(Array.from(state.events).map((name) => b.literal(name)))),
			),
		);
	}

	// HMR: wrap all named components with _$_.hmr() and emit import.meta.hot.accept()
	if (hmr && !to_ts) {
		const component_names = new Set(analysis.component_metadata.map((c) => c.id));

		// Track which components are exported and how
		/** @type {{ name: string, export_type: 'default' | 'named' }[]} */
		const exported_components = [];

		// Walk the body to find components and inject HMR wrapping.
		// After the walk, Component nodes become FunctionExpression nodes
		// (via b.function() which creates FunctionExpression).
		/** @type {AST.TSRXProgram['body']} */
		const hmr_body = [];

		for (const node of body) {
			hmr_body.push(node);

			if (node.type === 'ExportDefaultDeclaration') {
				const decl = /** @type {AST.FunctionExpression} */ (node.declaration);
				if (decl.metadata?.is_component && decl.id && component_names.has(decl.id.name)) {
					const name = decl.id.name;
					exported_components.push({ name, export_type: 'default' });
					// Replace ExportDefaultDeclaration with plain FunctionExpression (printed as function declaration)
					hmr_body[hmr_body.length - 1] = decl;
					// Add: ComponentName = _$_.hmr(ComponentName);
					hmr_body.push(b.stmt(b.assignment('=', b.id(name), b.call('_$_.hmr', b.id(name)))));
					// Re-export as default
					hmr_body.push(b.export_default(b.id(name)));
				}
			} else if (node.type === 'ExportNamedDeclaration') {
				const decl = /** @type {AST.FunctionExpression | null | undefined} */ (node.declaration);
				if (decl && decl.metadata?.is_component && decl.id && component_names.has(decl.id.name)) {
					const name = decl.id.name;
					exported_components.push({ name, export_type: 'named' });
					// Replace ExportNamedDeclaration with plain FunctionExpression (printed as function declaration)
					hmr_body[hmr_body.length - 1] = decl;
					// Add: ComponentName = _$_.hmr(ComponentName);
					hmr_body.push(b.stmt(b.assignment('=', b.id(name), b.call('_$_.hmr', b.id(name)))));
					// Re-export as named export
					hmr_body.push(
						b.export_builder(null, [
							{
								type: 'ExportSpecifier',
								local: b.id(name),
								exported: b.id(name),
								metadata: { path: [] },
							},
						]),
					);
				}
			} else if (
				node.type === 'FunctionExpression' &&
				node.metadata?.is_component &&
				node.id &&
				component_names.has(node.id.name)
			) {
				const name = node.id.name;
				// Local (non-exported) component — wrap with HMR
				hmr_body.push(b.stmt(b.assignment('=', b.id(name), b.call('_$_.hmr', b.id(name)))));
			}
		}

		// Emit import.meta.hot.accept() block if there are exported components
		if (exported_components.length > 0) {
			const update_lines = exported_components.map(({ name, export_type }) => {
				const accessor = export_type === 'default' ? 'module.default' : `module.${name}`;
				return `${name}[_$_.HMR].update(${accessor});`;
			});

			const hmr_block_code =
				`if (import.meta.hot) {\n` +
				`  import.meta.hot.accept((module) => {\n` +
				update_lines.map((line) => `    ${line}`).join('\n') +
				`\n  });\n` +
				`}`;

			hmr_body.push(b.stmt(b.id(hmr_block_code)));
		}

		body = hmr_body;
	}

	/** @type {AST.TSRXProgram['body']} */ (program.body) = body;

	const language_handler = to_ts
		? create_tsx_with_typescript_support(analysis.comments)
		: /** @type {Visitors<AST.Node, TransformClientState>} */ (tsx());

	const js =
		/** @type {ReturnType<typeof print> & { post_processing_changes?: PostProcessingChanges, line_offsets?: number[] }} */ (
			print(program, language_handler, {
				sourceMapContent: source,
				sourceMapSource: path.basename(filename),
			})
		);

	// Post-process TypeScript output to remove 'declare' from function overload signatures
	// Function overload signatures in regular .ts files should not have 'declare' keyword
	// Track changes for source map adjustment - organize them for efficient lookup
	/** @type {PostProcessingChanges | null} */
	let post_processing_changes = null;
	/** @type {LineOffsets} */
	let line_offsets = [];

	if (to_ts) {
		// Build line offset map for converting byte offset to line:column
		line_offsets = [0];
		for (let i = 0; i < js.code.length; i++) {
			if (js.code[i] === '\n') {
				line_offsets.push(i + 1);
			}
		}

		/**
		 * Convert byte offset to line number (1-based)
		 * @param {number} offset
		 * @returns {number}
		 */
		const offset_to_line = (offset) => {
			for (let i = 0; i < line_offsets.length; i++) {
				if (
					offset >= line_offsets[i] &&
					(i === line_offsets.length - 1 || offset < line_offsets[i + 1])
				) {
					return i + 1;
				}
			}
			return 1;
		};

		/** @type {Map<number, {offset: number, delta: number}>} */
		const line_deltas = new Map(); // line -> {offset: first change offset, delta: total delta for line}

		// Remove 'export declare function' -> 'export function' (for overloads only, not implementations)
		// Match: export declare function name(...): type;
		// Don't match: export declare function name(...): type { (has body)
		js.code = js.code.replace(
			/^(export\s+)declare\s+(function\s+\w+[^{\n]*;)$/gm,
			(match, p1, p2, offset) => {
				const replacement = p1 + p2;
				const line = offset_to_line(offset);
				const delta = replacement.length - match.length; // negative (removing 'declare ')

				// Track first change offset and total delta per line
				if (!line_deltas.has(line)) {
					line_deltas.set(line, { offset, delta });
				} else {
					// Additional change on same line - accumulate delta
					// @ts-ignore
					line_deltas.get(line).delta += delta;
				}

				return replacement;
			},
		);

		post_processing_changes = line_deltas;
	}

	if (post_processing_changes) {
		js.post_processing_changes = post_processing_changes;
	}

	if (line_offsets.length > 0) {
		js.line_offsets = line_offsets;
	}

	const css = renderStylesheets(state.stylesheets, minify_css);

	return {
		ast: program,
		js,
		css,
		errors: state.errors,
	};
}
