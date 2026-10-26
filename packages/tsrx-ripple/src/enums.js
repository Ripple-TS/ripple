// @ts-check
/** @import * as AST from 'estree' */
/** @import { ScopeInterface, Binding, AnalysisContext, RuntimeEnumContext } from '../types/index' */
import { builders as b, setLocation, error } from '@tsrx/core';
import is_reference from 'is-reference';

/** @typedef {{ kind: 'number' | 'string' | 'computed', value?: number | string }} EnumValue */
/** @typedef {{ node: AST.TSEnumDeclaration, scope: ScopeInterface, parameter?: string, values: Map<string, EnumValue>, names: Map<string, number>, module: boolean }} EnumInfo */
/** @type {WeakMap<AST.TSEnumDeclaration, EnumInfo>} */
const enums = new WeakMap();
/** @type {WeakMap<Binding, EnumInfo>} */
const enum_bindings = new WeakMap();
/** @type {WeakMap<AST.Identifier, { context: RuntimeEnumContext, path: AST.Node[] }>} */
const references = new WeakMap();

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
		if (ancestor.type === 'SwitchCase' && path[i - 1]?.type === 'SwitchStatement') {
			return /** @type {AST.SwitchStatement} */ (path[i - 1]).cases.flatMap(
				(arm) => arm.consequent,
			);
		}
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
	if (path.some((ancestor) => ancestor.type === 'StaticBlock')) {
		return 'Ripple does not support TypeScript enums in class static blocks yet. Move the enum to an enclosing block or a .ts module.';
	}
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

/**
 * @param {AST.Identifier} node
 * @param {AST.Node | null | undefined} parent
 */
function is_identifier_reference(node, parent) {
	if (!parent) return true;
	if (parent.type.startsWith('TS')) {
		return (
			('expression' in parent && parent.expression === node) ||
			(parent.type === 'TSEnumMember' && parent.initializer === node)
		);
	}
	return is_reference(node, parent);
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

/** Register enum metadata in Ripple's existing analysis visit. No AST pass is added.
 * @param {AST.TSEnumDeclaration} node
 * @param {AnalysisContext} context
 */
export function analyze_enum(node, context) {
	const { state, path } = context;
	const diagnostic = get_runtime_enum_diagnostic(node, path);
	if (diagnostic) {
		error(
			diagnostic,
			state.analysis.module.filename,
			node.id,
			state.collect ? state.analysis.errors : undefined,
			state.analysis.comments,
		);
	}
	if (diagnostic || state.to_ts || is_ambient_enum(node, path)) return context.next();
	const info = {
		node,
		scope: state.scope,
		values: new Map(),
		names: new Map(
			node.members.map((member, index) => [
				member.id.type === 'Identifier' ? member.id.name : String(member.id.value),
				index,
			]),
		),
		module:
			path.filter((ancestor) => ancestor.type !== 'ExportNamedDeclaration').at(-1)?.type ===
			'Program',
	};
	enums.set(node, info);
	enum_bindings.set(state.scope.declare(node.id, 'normal', 'let'), info);
	for (const member of node.members) {
		if (member.initializer)
			context.visit(member, {
				...state,
				runtime_enum: {
					declaration: node,
					initializer: member.initializer,
					parent: state.runtime_enum,
				},
			});
	}
}

/** @param {AST.Identifier} node @param {AnalysisContext} context */
export function analyze_enum_reference(node, context) {
	if (!context.state.runtime_enum) return false;
	// The shared scope pass deliberately skips identifiers directly under TS
	// nodes. Reserve these too before choosing the generated IIFE parameter.
	context.state.scope.root.conflicts.add(node.name);
	if (!is_identifier_reference(node, context.path.at(-1))) return false;
	references.set(node, { context: context.state.runtime_enum, path: [...context.path] });
	return resolve_enum_reference(node, context.state.scope) !== null;
}

/** @param {AST.Identifier} node @param {ScopeInterface} scope */
function resolve_enum_reference(node, scope) {
	const reference = references.get(node);
	if (!reference) return null;
	const { path } = reference;
	// Named class expressions bind their own name inside the class.
	if (
		path.some((ancestor) => ancestor.type === 'ClassExpression' && ancestor.id?.name === node.name)
	)
		return null;
	let binding = scope.get(node.name);
	// A static block's declarations do not escape into other fields or methods.
	// The published core scope model does not yet give StaticBlock its own scope.
	const declaration_path = binding?.references.find(
		(reference) => reference.node === binding?.node,
	)?.path;
	const static_block = declaration_path?.findLast((ancestor) => ancestor.type === 'StaticBlock');
	if (static_block && !path.includes(static_block)) binding = null;
	for (
		let current = /** @type {RuntimeEnumContext | undefined} */ (reference.context);
		current;
		current = current.parent
	) {
		const info = enums.get(current.declaration);
		if (!info?.names.has(node.name)) continue;
		const declaration = binding?.node;
		if (
			declaration &&
			typeof declaration.start === 'number' &&
			typeof declaration.end === 'number' &&
			typeof current.initializer.start === 'number' &&
			typeof current.initializer.end === 'number' &&
			declaration.start >= current.initializer.start &&
			declaration.end <= current.initializer.end
		)
			return null;
		return { info };
	}
	return null;
}

/** @param {AST.Identifier} node @param {ScopeInterface} scope */
export function transform_enum_reference(node, scope) {
	const reference = resolve_enum_reference(node, scope);
	if (!reference) return null;
	const origin = /** @type {AST.NodeWithLocation} */ (node);
	return b.member(
		b.id((reference.info.parameter ??= reference.info.scope.generate('enum_value')), origin),
		b.literal(node.name, undefined, origin),
		true,
		false,
		origin,
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
 * @param {any} scope
 * @param {Set<any>} [seen]
 * @returns {EnumValue}
 */
function evaluate_constant(node, scope, seen = new Set()) {
	/** @param {any} expression */
	const evaluate = (expression) => evaluate_constant(expression, scope, seen);

	switch (node.type) {
		case 'Identifier': {
			const reference = resolve_enum_reference(node, scope);
			if (reference) return enum_value(reference.info, node.name);
			const binding = scope.get(node.name);
			if (binding?.declaration_kind !== 'const' || !binding.initial || seen.has(binding))
				return computed();
			return evaluate_constant(binding.initial, binding.scope, new Set([...seen, binding]));
		}
		case 'Literal':
			return typeof node.value === 'number' || typeof node.value === 'string'
				? constant(node.value)
				: computed();
		case 'TemplateLiteral': {
			let value = '';
			for (let i = 0; i < node.quasis.length; i++) {
				value += node.quasis[i].value.cooked ?? node.quasis[i].value.raw;
				if (i < node.expressions.length) {
					const expression = evaluate(node.expressions[i]);
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
			return evaluate(node.expression);
		case 'MemberExpression': {
			const name = get_member_name(node);
			if (name === null) return computed();
			if (node.object.type !== 'Identifier') return computed();
			const info = enum_bindings.get(scope.get(node.object.name));
			return info ? enum_value(info, name) : computed();
		}
		case 'UnaryExpression': {
			const argument = evaluate(node.argument);
			if (argument.kind !== 'number') return computed();
			const value = Number(argument.value);
			if (node.operator === '+') return constant(+value);
			if (node.operator === '-') return constant(-value);
			if (node.operator === '~') return constant(~value);
			return computed();
		}
		case 'BinaryExpression': {
			const left = evaluate(node.left);
			const right = evaluate(node.right);
			if (left.kind === 'computed' || right.kind === 'computed') return computed();
			if (node.operator !== '+' && (left.kind !== 'number' || right.kind !== 'number'))
				return computed();
			return evaluate_binary(node.operator, left.value, right.value);
		}
		case 'LogicalExpression': {
			const left = evaluate(node.left);
			if (left.kind === 'computed') return computed();
			if (node.operator === '&&') return left.value ? evaluate(node.right) : left;
			if (node.operator === '||') return left.value ? left : evaluate(node.right);
			if (node.operator === '??') return left;
			return computed();
		}
		case 'ConditionalExpression': {
			const test = evaluate(node.test);
			if (test.kind === 'computed') return computed();
			return evaluate(test.value ? node.consequent : node.alternate);
		}
		default:
			return computed();
	}
}

/** Resolve constants independently of codegen order (a function can refer to a
 * module enum declared later). Cache per member and break circular references.
 * @param {EnumInfo} info
 * @param {string} name
 * @returns {EnumValue}
 */
function enum_value(info, name) {
	const cached = info.values.get(name);
	if (cached) return cached;
	const index = info.names.get(name);
	if (index === undefined) return computed();
	info.values.set(name, computed());
	const member = info.node.members[index];
	let value;
	if (member.initializer) value = evaluate_constant(member.initializer, info.scope);
	else if (index === 0) value = constant(0);
	else {
		const previous_member = info.node.members[index - 1];
		const previous_name =
			previous_member.id.type === 'Identifier'
				? previous_member.id.name
				: String(previous_member.id.value);
		const previous = enum_value(info, previous_name);
		value =
			previous.kind === 'number' && Number.isFinite(previous.value)
				? constant(Number(previous.value) + 1)
				: computed();
	}
	info.values.set(name, value);
	return value;
}

/** @param {any} node @returns {boolean} */
function is_string_expression(node) {
	if (node.type === 'TemplateLiteral') return true;
	if (node.type === 'Literal') return typeof node.value === 'string';
	if (node.type === 'BinaryExpression' && node.operator === '+')
		return is_string_expression(node.left) || is_string_expression(node.right);
	if (node.expression && (node.type.startsWith('TS') || node.type === 'ParenthesizedExpression'))
		return is_string_expression(node.expression);
	return false;
}

/** Emit through the normal client/server visitors, visiting each initializer once.
 * @param {AST.TSEnumDeclaration} node
 * @param {any} context
 * @returns {any}
 */
export function transform_enum(node, context) {
	if (context.state.to_ts) return context.next();
	if (is_ambient_enum(node, context.path)) return b.empty;
	const info = enums.get(node);
	if (!info) return context.next();
	info.parameter ??= info.scope.generate('enum_value');
	const origin = /** @type {AST.NodeWithLocation} */ (node);
	const enum_id = /** @type {AST.NodeWithLocation} */ (node.id);
	/** @type {AST.Statement[]} */
	const body = [];
	for (const member of node.members) {
		const member_origin = /** @type {AST.NodeWithLocation} */ (member);
		const member_id = /** @type {AST.NodeWithLocation} */ (member.id);
		const name = member.id.type === 'Identifier' ? member.id.name : String(member.id.value);
		const value = enum_value(info, name);
		const initializer = member.initializer
			? context.visit(member.initializer)
			: value.kind === 'number'
				? b.literal(value.value, undefined, member_origin)
				: b.unary('void', b.literal(0, undefined, member_origin));
		const key = b.literal(name, undefined, member_id);
		const read = b.member(b.id(info.parameter, enum_id), key, true);
		const assignment = b.assignment('=', read, initializer);
		body.push(
			setLocation(
				b.stmt(
					value.kind === 'string' ||
						(member.initializer && is_string_expression(member.initializer))
						? assignment
						: b.assignment('=', b.member(b.id(info.parameter, enum_id), assignment, true), key),
				),
				member_origin,
			),
		);
	}
	const declaration = setLocation(
		b.declaration(info.module ? 'var' : 'let', [b.declarator(node.id)]),
		origin,
	);
	const call = b.call(
		b.function(
			null,
			[b.id(info.parameter, enum_id)],
			b.block(body, origin),
			false,
			undefined,
			origin,
		),
		b.logical(
			'||',
			b.id(node.id.name, enum_id),
			b.assignment('=', b.id(node.id.name, enum_id), b.object([], origin)),
		),
	);
	return [declaration, setLocation(b.stmt(call), origin)];
}
