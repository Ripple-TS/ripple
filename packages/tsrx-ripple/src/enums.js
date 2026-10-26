// @ts-check

/** @import * as AST from 'estree' */

import { builders, setLocation } from '@tsrx/core';
import { walk } from 'zimmerframe';

const b = builders;
const RUNTIME_ENUM = 'tsrx_runtime_enum';
const RUNTIME_ENUM_MEMBER = 'tsrx_runtime_enum_member';

/** @typedef {{ kind: 'number' | 'string' | 'computed', value?: number | string }} EnumValue */

/**
 * @param {any} node
 * @param {AST.Node[]} path
 */
function is_ambient_enum(node, path) {
	return (
		node.declare ||
		path.some(
			(ancestor) =>
				ancestor.type === 'TSModuleDeclaration' && /** @type {any} */ (ancestor).declare,
		)
	);
}

/**
 * @param {any} node
 * @returns {string | null}
 */
function get_declaration_name(node) {
	if (!node) return null;
	if (node.type === 'ExportNamedDeclaration') return get_declaration_name(node.declaration);
	if (
		(node.type === 'TSEnumDeclaration' || node.type === 'TSModuleDeclaration') &&
		node.id?.type === 'Identifier'
	) {
		return node.id.name;
	}
	return null;
}

/**
 * @param {AST.Node[]} path
 * @returns {any[]}
 */
function get_statement_siblings(path) {
	for (let i = path.length - 1; i >= 0; i--) {
		const ancestor = /** @type {any} */ (path[i]);
		if (Array.isArray(ancestor.body)) return ancestor.body;
		if (Array.isArray(ancestor.consequent)) return ancestor.consequent;
	}
	return [];
}

/**
 * @param {any} node
 * @param {AST.Node[]} path
 */
function is_merged_enum(node, path) {
	return get_statement_siblings(path).some((sibling) => {
		const declaration = sibling.type === 'ExportNamedDeclaration' ? sibling.declaration : sibling;
		return declaration !== node && get_declaration_name(declaration) === node.id.name;
	});
}

/**
 * Return the unsupported reason for a runtime enum, or null when it can be lowered.
 * Ambient enums are handled by the existing TypeScript erasure visitors.
 * @param {any} node
 * @param {AST.Node[]} path
 * @returns {string | null}
 */
export function get_runtime_enum_diagnostic(node, path) {
	if (is_ambient_enum(node, path)) return null;
	if (node.const) {
		return 'Ripple does not support runtime TypeScript const enums in .tsrx files. Move the const enum to a .ts module, use a non-const enum, or use an object with `as const` instead.';
	}
	if (
		path.some(
			(ancestor) =>
				ancestor.type === 'TSModuleDeclaration' && !(/** @type {any} */ (ancestor).declare),
		)
	) {
		return 'Ripple does not support TypeScript enums inside runtime namespaces or modules in .tsrx files. Move the enum outside the namespace or into a .ts module.';
	}
	if (is_merged_enum(node, path)) {
		return 'Ripple does not support merged TypeScript enum declarations in .tsrx files. Move the merged declarations to a .ts module or combine them into one enum.';
	}
	return null;
}

/** @param {any} node */
export function is_lowered_enum_declaration(node) {
	return node.metadata?.[RUNTIME_ENUM] === true;
}

/**
 * @param {any} node
 * @param {AST.Node[]} path
 * @param {Map<AST.Node, any>} scopes
 */
function find_nearest_scope(node, path, scopes) {
	const direct = scopes.get(node);
	if (direct) return direct;
	for (let i = path.length - 1; i >= 0; i--) {
		const scope = scopes.get(path[i]);
		if (scope) return scope;
	}
	return null;
}

/**
 * @param {any} scope
 * @param {string} name
 * @param {AST.Expression} initializer
 */
function is_shadowed(scope, name, initializer) {
	const binding = scope?.get(name);
	if (!binding?.node) return false;
	if (typeof initializer.start !== 'number' || typeof initializer.end !== 'number') return false;
	return (
		typeof binding.node.start === 'number' &&
		typeof binding.node.end === 'number' &&
		binding.node.start >= initializer.start &&
		binding.node.end <= initializer.end
	);
}

/**
 * @param {AST.Identifier} node
 * @param {AST.Node | null | undefined} parent
 */
function is_identifier_reference(node, parent) {
	if (!parent) return true;
	if (parent.type.startsWith('TS')) {
		return 'expression' in parent && parent.expression === node;
	}
	switch (parent.type) {
		case 'MemberExpression':
			return parent.computed || parent.object === node;
		case 'MethodDefinition':
		case 'PropertyDefinition':
			return parent.computed || parent.value === node;
		case 'Property':
			return parent.computed || parent.value === node;
		case 'ExportSpecifier':
		case 'ImportSpecifier':
			return parent.local === node;
		case 'MetaProperty':
			return parent.meta === node;
		case 'LabeledStatement':
		case 'BreakStatement':
		case 'ContinueStatement':
		case 'JSXOpeningElement':
		case 'JSXClosingElement':
			return false;
		default:
			return true;
	}
}

/**
 * @param {any} node
 * @returns {string | null}
 */
function get_member_name(node) {
	if (node.type !== 'MemberExpression') return null;
	if (!node.computed && node.property.type === 'Identifier') return node.property.name;
	if (
		node.computed &&
		node.property.type === 'Literal' &&
		typeof node.property.value === 'string'
	) {
		return node.property.value;
	}
	return null;
}

/**
 * @param {string} enum_name
 * @param {string} member_name
 * @param {any} loc_info
 * @param {boolean} [reference]
 */
function enum_member(enum_name, member_name, loc_info, reference = false) {
	const node = b.member(
		b.id(enum_name, loc_info),
		b.literal(member_name, undefined, loc_info),
		true,
		false,
		loc_info,
	);
	if (reference)
		node.metadata = /** @type {any} */ ({ ...node.metadata, [RUNTIME_ENUM_MEMBER]: true });
	return node;
}

/**
 * Rewrite previous-member reads to E.Member. The original core scopes tell us
 * whether an identifier is declared inside this initializer; outer same-name
 * bindings deliberately do not win over enum member resolution.
 * @param {AST.Expression} initializer
 * @param {string} enum_name
 * @param {Map<string, EnumValue>} members
 * @param {any} outer_scope
 * @param {Map<AST.Node, any>} scopes
 * @returns {AST.Expression}
 */
function rewrite_initializer(initializer, enum_name, members, outer_scope, scopes) {
	return /** @type {AST.Expression} */ (
		walk(
			initializer,
			{ scope: outer_scope },
			{
				_(node, { state, next }) {
					return next({ scope: scopes.get(node) ?? state.scope });
				},
				Identifier(node, context) {
					const parent = context.path.at(-1);
					if (!is_identifier_reference(node, parent)) return context.next();
					if (
						parent?.type === 'MemberExpression' &&
						parent.object === node &&
						node.name === enum_name
					) {
						return context.next();
					}
					if (!members.has(node.name) || is_shadowed(context.state.scope, node.name, initializer)) {
						return context.next();
					}
					return enum_member(enum_name, node.name, node, true);
				},
				MemberExpression(node, context) {
					const result = /** @type {AST.MemberExpression} */ (context.next() ?? node);
					const name = get_member_name(result);
					if (
						result.object.type === 'Identifier' &&
						result.object.name === enum_name &&
						name !== null &&
						members.has(name) &&
						!is_shadowed(context.state.scope, enum_name, initializer)
					) {
						return {
							...result,
							metadata: /** @type {any} */ ({ ...result.metadata, [RUNTIME_ENUM_MEMBER]: true }),
						};
					}
					return result;
				},
				Property(node, context) {
					const result = /** @type {AST.Property} */ (context.next() ?? node);
					if (result.shorthand && result.value.type !== 'Identifier') {
						return { ...result, shorthand: false };
					}
					return result;
				},
			},
		)
	);
}

/** @returns {EnumValue} */
function computed() {
	return { kind: 'computed' };
}

/**
 * @param {number | string} value
 * @returns {EnumValue}
 */
function constant(value) {
	return { kind: typeof value === 'number' ? 'number' : 'string', value };
}

/**
 * @param {string} operator
 * @param {any} left
 * @param {any} right
 * @returns {EnumValue}
 */
function evaluate_binary(operator, left, right) {
	if (operator === '+') return constant(left + right);
	switch (operator) {
		case '-':
			return constant(left - right);
		case '*':
			return constant(left * right);
		case '/':
			return constant(left / right);
		case '%':
			return constant(left % right);
		case '**':
			return constant(left ** right);
		case '<<':
			return constant(left << right);
		case '>>':
			return constant(left >> right);
		case '>>>':
			return constant(left >>> right);
		case '|':
			return constant(left | right);
		case '&':
			return constant(left & right);
		case '^':
			return constant(left ^ right);
		default:
			return computed();
	}
}

/**
 * A deliberately small constant evaluator. It classifies string members and
 * finite numeric values for auto-increment; it never executes user calls.
 * @param {any} node
 * @param {Map<string, EnumValue>} members
 * @returns {EnumValue}
 */
function evaluate_constant(node, members) {
	switch (node.type) {
		case 'Literal':
			return typeof node.value === 'number' || typeof node.value === 'string'
				? constant(node.value)
				: computed();
		case 'TemplateLiteral': {
			let value = '';
			for (let i = 0; i < node.quasis.length; i++) {
				value += node.quasis[i].value.cooked ?? node.quasis[i].value.raw;
				if (i < node.expressions.length) {
					const expression = evaluate_constant(node.expressions[i], members);
					if (expression.kind === 'computed') return computed();
					value += String(expression.value);
				}
			}
			return constant(value);
		}
		case 'ParenthesizedExpression':
		case 'ChainExpression':
		case 'TSAsExpression':
		case 'TSSatisfiesExpression':
		case 'TSTypeAssertion':
		case 'TSNonNullExpression':
		case 'TSInstantiationExpression':
			return evaluate_constant(node.expression, members);
		case 'MemberExpression': {
			if (!node.metadata?.[RUNTIME_ENUM_MEMBER]) return computed();
			const name = get_member_name(node);
			return (name !== null && members.get(name)) || computed();
		}
		case 'UnaryExpression': {
			const argument = evaluate_constant(node.argument, members);
			if (argument.kind !== 'number') return computed();
			const value = Number(argument.value);
			if (node.operator === '+') return constant(+value);
			if (node.operator === '-') return constant(-value);
			if (node.operator === '~') return constant(~value);
			return computed();
		}
		case 'BinaryExpression': {
			const left = evaluate_constant(node.left, members);
			const right = evaluate_constant(node.right, members);
			if (left.kind === 'computed' || right.kind === 'computed') return computed();
			if (node.operator !== '+' && (left.kind !== 'number' || right.kind !== 'number'))
				return computed();
			return evaluate_binary(node.operator, left.value, right.value);
		}
		case 'LogicalExpression': {
			const left = evaluate_constant(node.left, members);
			if (left.kind === 'computed') return computed();
			if (node.operator === '&&') return left.value ? evaluate_constant(node.right, members) : left;
			if (node.operator === '||') return left.value ? left : evaluate_constant(node.right, members);
			if (node.operator === '??') return left;
			return computed();
		}
		case 'ConditionalExpression': {
			const test = evaluate_constant(node.test, members);
			if (test.kind === 'computed') return computed();
			return evaluate_constant(test.value ? node.consequent : node.alternate, members);
		}
		default:
			return computed();
	}
}

/**
 * @param {any} node
 * @param {any} outer_scope
 * @param {Map<AST.Node, any>} scopes
 */
function lower_enum(node, outer_scope, scopes) {
	const enum_name = node.id.name;
	/** @type {Map<string, EnumValue>} */
	const members = new Map();
	/** @type {AST.Statement[]} */
	const statements = [];
	let previous = /** @type {EnumValue | null} */ (null);

	for (const member of node.members) {
		const member_name = member.id.type === 'Identifier' ? member.id.name : String(member.id.value);
		let initializer;
		let value;

		if (member.initializer) {
			initializer = rewrite_initializer(
				member.initializer,
				enum_name,
				members,
				outer_scope,
				scopes,
			);
			value = evaluate_constant(initializer, members);
		} else if (previous === null) {
			value = constant(0);
			initializer = b.literal(0, undefined, member);
		} else if (
			previous.kind === 'number' &&
			typeof previous.value === 'number' &&
			Number.isFinite(previous.value)
		) {
			value = constant(previous.value + 1);
			initializer = b.literal(previous.value + 1, undefined, member);
		} else {
			value = computed();
			initializer = b.unary('void', b.literal(0, undefined, member));
		}

		const read = enum_member(enum_name, member_name, member.id);
		const assignment =
			value.kind === 'string'
				? b.assignment('=', read, initializer)
				: b.assignment(
						'=',
						b.member(b.id(enum_name, member.id), b.assignment('=', read, initializer), true),
						b.literal(member_name, undefined, member.id),
					);
		statements.push(setLocation(b.stmt(assignment), member));
		members.set(member_name, value);
		previous = value;
	}

	const iife = b.call(
		b.function(
			null,
			[b.id(enum_name, node.id)],
			b.block([...statements, b.return(b.id(enum_name, node.id))], node),
			false,
			undefined,
			node,
		),
		b.logical(
			'||',
			b.id(enum_name, node.id),
			b.assignment('=', b.id(enum_name, node.id), b.object([], node)),
		),
	);
	const declaration = setLocation(b.var(b.id(enum_name, node.id), iife), node);
	declaration.metadata = /** @type {any} */ ({ ...declaration.metadata, [RUNTIME_ENUM]: true });
	return declaration;
}

/**
 * Lower supported runtime enums before Ripple analysis, sharing one implementation
 * between client and server. Unsupported and ambient declarations stay in place
 * for the analyzer and existing TypeScript erasure visitors.
 * @param {AST.Program} ast
 * @param {{ scopes: Map<AST.Node, any> }} options
 * @returns {AST.Program}
 */
export function lower_runtime_enums(ast, { scopes }) {
	return /** @type {AST.Program} */ (
		walk(
			ast,
			{ scopes },
			{
				TSEnumDeclaration(node, context) {
					if (
						is_ambient_enum(node, context.path) ||
						get_runtime_enum_diagnostic(node, context.path)
					) {
						return context.next();
					}
					const result = context.next() ?? node;
					const scope = find_nearest_scope(node, context.path, scopes);
					return lower_enum(result, scope, scopes);
				},
			},
		)
	);
}
