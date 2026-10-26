// @ts-check

/** @import * as AST from 'estree'; */
/** @import { TransformClientContext } from '../../../types/index'; */
import { builders as b } from '@tsrx/core';
import {
	get_ripple_namespace_call_name,
	get_ripple_namespace_static_call_name,
	is_ripple_import,
	is_ripple_track_call,
} from '../../utils.js';

/** @param {AST.Expression | AST.Super} node @returns {boolean} */
export function has_awaited_chain_call(node) {
	if (node.type === 'MemberExpression') return has_awaited_chain_call(node.object);
	return node.type === 'CallExpression' && node.metadata.has_await === true;
}

/**
 * Evaluate operands into function-local temporaries, then invoke with the
 * existing scope wrapper. Only the callee's member/call chain is lowered here;
 * other expressions go through the ordinary visitors. Continuations keep the
 * rest of an optional chain, including its arguments, inside its nullish guard.
 * @param {AST.Expression} expression
 * @param {TransformClientContext} context
 * @param {boolean} [deleting]
 * @returns {AST.Expression}
 */
export function visit_awaited_call(expression, context, deleting = false) {
	/** @param {string} name */
	const temporary = (name) => {
		const id = b.id(context.state.scope.generate(name));
		context.state.call_temps?.push(id);
		return id;
	};
	/** @param {AST.Expression} value */
	const scoped = (value) =>
		value.type === 'Identifier' || value.type === 'ThisExpression'
			? value
			: b.call('_$_.with_scope', b.id('__block'), b.thunk(value));
	/** @param {AST.Expression} node */
	const visit = (node) => {
		const value = /** @type {AST.Expression} */ (context.visit(node));
		return node.metadata.has_await || node.type === 'Identifier' || node.type === 'ThisExpression'
			? value
			: scoped(value);
	};
	/** @param {AST.Expression} value @param {AST.Expression} body @param {AST.Expression} fallback */
	const guard = (value, body, fallback) =>
		b.conditional(b.binary('==', value, b.literal(null)), fallback, body);

	/**
	 * The continuation receives a value/reference with no await left in its operands.
	 * @param {AST.Expression | AST.Super} node
	 * @param {(value: AST.Expression, receiver?: AST.Expression) => AST.Expression} next
	 * @param {AST.Expression} [fallback]
	 * @returns {AST.Expression}
	 */
	const lower = (node, next, fallback = deleting ? b.true : b.void0) => {
		if (node.type === 'MemberExpression') {
			const member = (/** @type {AST.Expression | AST.Super} */ object) => {
				const receiver = object.type === 'Super' ? b.this : temporary('receiver');
				const key = node.computed ? temporary('key') : node.property;
				const value = {
					...node,
					object: object.type === 'Super' ? object : receiver,
					property: key,
					optional: false,
				};
				const result = node.computed
					? b.sequence([
							b.assignment(
								'=',
								/** @type {AST.Identifier} */ (key),
								visit(/** @type {AST.Expression} */ (node.property)),
							),
							next(value, receiver),
						])
					: next(value, receiver);
				return object.type === 'Super'
					? result
					: b.sequence([
							b.assignment('=', /** @type {AST.Identifier} */ (receiver), scoped(object)),
							node.optional ? guard(receiver, result, fallback) : result,
						]);
			};
			return node.object.type === 'Super'
				? member(node.object)
				: lower(node.object, member, fallback);
		}
		if (node.type === 'ChainExpression') {
			// Parentheses end short-circuiting, but retain a final member's receiver.
			const receiver = temporary('receiver');
			const value = temporary('value');
			return b.sequence([
				b.assignment(
					'=',
					value,
					lower(
						node.expression,
						(value, owner = b.void0) =>
							b.sequence([b.assignment('=', receiver, owner), scoped(value)]),
						b.void0,
					),
				),
				next(value, receiver),
			]);
		}
		if (node.type === 'CallExpression' || node.type === 'NewExpression') {
			// Keep the existing explicit block/hash lowering for Ripple intrinsics.
			const callee = node.callee;
			const intrinsic =
				callee.type !== 'Super' &&
				is_ripple_import(callee, context) &&
				((callee.type === 'Identifier' && get_ripple_namespace_call_name(callee.name) !== null) ||
					(node.type === 'CallExpression' &&
						callee.type === 'MemberExpression' &&
						callee.object.type === 'Identifier' &&
						callee.property.type === 'Identifier' &&
						get_ripple_namespace_static_call_name(callee.object.name, callee.property.name) !==
							null));
			if (intrinsic || is_ripple_track_call(callee, context)) {
				const value = temporary('value');
				return b.sequence([b.assignment('=', value, visit(node)), next(value)]);
			}
			return lower(
				callee,
				(callee, receiver) => {
					const fn = temporary('callee');
					const args = temporary('args');
					const values = b.array(
						node.arguments.map((arg) =>
							arg.type === 'SpreadElement' ? b.spread(visit(arg.argument)) : visit(arg),
						),
					);
					const call =
						node.type === 'NewExpression'
							? { ...node, callee: fn, arguments: [b.spread(args)], typeArguments: undefined }
							: receiver
								? b.call(b.member(fn, 'apply'), receiver, args)
								: b.call(fn, b.spread(args));
					const result = b.sequence([b.assignment('=', args, values), next(scoped(call))]);
					return b.sequence([
						b.assignment('=', fn, scoped(callee)),
						node.type === 'CallExpression' && node.optional ? guard(fn, result, fallback) : result,
					]);
				},
				fallback,
			);
		}
		if (
			node.type === 'TSAsExpression' ||
			node.type === 'TSSatisfiesExpression' ||
			node.type === 'TSNonNullExpression' ||
			node.type === 'TSInstantiationExpression'
		) {
			return lower(/** @type {AST.Expression} */ (node.expression), next, fallback);
		}
		if (node.type === 'Super') throw new Error('Unexpected super call with awaited arguments');
		if (node.type === 'Identifier' || node.type === 'ThisExpression') return next(visit(node));
		const value = temporary('value');
		return b.sequence([b.assignment('=', value, visit(node)), next(value)]);
	};

	return lower(expression, (value) => (deleting ? b.unary('delete', value) : value));
}
