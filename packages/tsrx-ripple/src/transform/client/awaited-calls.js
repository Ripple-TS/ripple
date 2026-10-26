// @ts-check

/** @import * as AST from 'estree'; */
/** @import { TransformClientContext } from '../../../types/index'; */
import { builders as b } from '@tsrx/core';
import {
	contains_await,
	get_ripple_namespace_call_name,
	get_ripple_namespace_static_call_name,
	is_ripple_import,
	is_ripple_track_call,
} from '../../utils.js';

/**
 * Keep awaits in the authored async function. Capture the callee before its
 * arguments, then establish the scope only for invocation. Optional-chain
 * guards enclose the rest of the chain, including argument evaluation.
 * Temporaries belong to each function invocation, including concurrent calls.
 * @param {AST.Expression} expression
 * @param {TransformClientContext} context
 * @returns {AST.Expression}
 */
export function visit_awaited_call(expression, context) {
	/** @param {string} name */
	const temporary = (name) => {
		const id = b.id(context.state.scope.generate(name));
		context.state.call_temps?.push(id);
		return id;
	};
	/** @param {AST.Node} node */
	const visit = (node) => /** @type {AST.Expression} */ (context.visit(node));
	/** @param {AST.Expression} value */
	const scoped = (value) =>
		contains_await(value) ? value : b.call('_$_.with_scope', b.id('__block'), b.thunk(value));
	/**
	 * @param {AST.Expression} value
	 * @param {(id: AST.Identifier) => AST.Expression} next
	 */
	const guard = (value, next) => {
		const id = temporary('optional');
		return b.sequence([
			b.assignment('=', id, scoped(value)),
			b.conditional(b.binary('==', id, b.literal(null)), b.void0, next(id)),
		]);
	};

	/**
	 * A continuation keeps later members/calls inside an earlier optional guard.
	 * @param {AST.Expression | AST.Super} node
	 * @param {(value: AST.Expression | AST.Super) => AST.Expression} next
	 * @returns {AST.Expression}
	 */
	const lower = (node, next) => {
		if (node.type === 'MemberExpression') {
			return lower(node.object, (object) => {
				/** @param {AST.Expression | AST.Super} object */
				const member = (object) =>
					next({
						...node,
						object,
						property: node.computed ? visit(node.property) : node.property,
						optional: false,
					});
				return node.optional
					? guard(/** @type {AST.Expression} */ (object), member)
					: member(object);
			});
		}
		if (node.type === 'CallExpression' || node.type === 'NewExpression') {
			// Runtime intrinsics carry explicit block/hash arguments. Let their
			// ordinary visitors preserve that lowering inside an optional chain.
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
				return next(visit(node));
			}
			/**
			 * @param {AST.Expression | AST.Super} callee
			 * @param {AST.Expression} receiver
			 * @param {AST.Expression[]} setup
			 */
			const invoke = (callee, receiver = b.void0, setup = []) => {
				if (node.type === 'CallExpression' && callee.type === 'MemberExpression') {
					if (callee.object.type === 'Super') {
						receiver = b.this;
					} else {
						receiver = temporary('receiver');
						setup.push(b.assignment('=', receiver, scoped(callee.object)));
						callee = { ...callee, object: receiver };
					}
					if (callee.computed && contains_await(callee.property)) {
						const key = temporary('key');
						setup.push(b.assignment('=', key, /** @type {AST.Expression} */ (callee.property)));
						callee = { ...callee, property: key };
					}
				}
				const fn = temporary('callee');
				setup.push(b.assignment('=', fn, scoped(/** @type {AST.Expression} */ (callee))));
				const args = b.array(
					node.arguments.map(
						(arg) => /** @type {AST.Expression | AST.SpreadElement} */ (context.visit(arg)),
					),
				);
				const call =
					node.type === 'NewExpression'
						? b.call('_$_.construct_with_scope', b.id('__block'), fn, args)
						: b.call('_$_.call_with_scope', b.id('__block'), fn, receiver, args);
				setup.push(
					node.type === 'CallExpression' && node.optional
						? b.conditional(b.binary('==', fn, b.literal(null)), b.void0, next(call))
						: next(call),
				);
				return b.sequence(setup);
			};
			if (node.type === 'CallExpression' && node.callee.type === 'ChainExpression') {
				// Parentheses end short-circuiting, but preserve a member's receiver:
				// `(object?.method)(await value)` still calls with `object` as `this`.
				const receiver = temporary('receiver');
				const callee = lower(node.callee.expression, (value) => {
					if (value.type !== 'MemberExpression' || value.object.type === 'Super')
						return /** @type {AST.Expression} */ (value);
					return b.sequence([
						b.assignment('=', receiver, value.object),
						{ ...value, object: receiver },
					]);
				});
				return invoke(callee, receiver, [b.assignment('=', receiver, b.void0)]);
			}
			return lower(node.callee, (callee) => invoke(callee));
		}
		return next(node.type === 'Super' ? node : visit(node));
	};

	return lower(expression, (value) => /** @type {AST.Expression} */ (value));
}
