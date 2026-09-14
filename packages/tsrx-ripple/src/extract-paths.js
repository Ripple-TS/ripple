// @ts-check

/**
@import * as AST from 'estree';
@import { DestructuredAssignment } from '../types/index';
 */

import { builders, buildFallback as build_fallback } from '@tsrx/core';

const b = builders;

/**
 * Extracts all destructured assignments from a pattern. The rest and default
 * paths lower to the Ripple runtime helpers `_$_.exclude_from_object`,
 * `_$_.array_slice`, and `_$_.fallback`.
 * @param {AST.Node} param
 * @returns {DestructuredAssignment[]}
 */
export function extract_paths(param) {
	return _extract_paths(
		[],
		param,
		/** @param {AST.Identifier | AST.MemberExpression | AST.CallExpression} node */
		(node) => node,
		/** @param {AST.Identifier | AST.MemberExpression} node */
		(node) => node,
		false,
	);
}

/**
 * @param {DestructuredAssignment[]} assignments
 * @param {AST.Node} param
 * @param {DestructuredAssignment['expression']} expression
 * @param {DestructuredAssignment['update_expression']} update_expression
 * @param {boolean} has_default_value
 * @returns {DestructuredAssignment[]}
 */
function _extract_paths(assignments = [], param, expression, update_expression, has_default_value) {
	switch (param.type) {
		case 'Identifier':
		case 'MemberExpression':
			assignments.push({
				node: param,
				is_rest: false,
				has_default_value,
				expression,
				update_expression,
			});
			break;

		case 'ObjectPattern':
			for (const prop of param.properties) {
				if (prop.type === 'RestElement') {
					/** @type {DestructuredAssignment['expression']} */
					const rest_expression = (object) => {
						/** @type {AST.Expression[]} */
						const props = [];

						for (const p of param.properties) {
							if (p.type === 'Property' && p.key.type !== 'PrivateIdentifier') {
								if (p.key.type === 'Identifier' && !p.computed) {
									props.push(b.literal(p.key.name));
								} else if (p.key.type === 'Literal') {
									props.push(b.literal(String(p.key.value)));
								} else {
									props.push(b.call('String', p.key));
								}
							}
						}

						return b.call('_$_.exclude_from_object', expression(object), b.array(props));
					};

					if (prop.argument.type === 'Identifier') {
						assignments.push({
							node: prop.argument,
							is_rest: true,
							has_default_value,
							expression: rest_expression,
							update_expression: rest_expression,
						});
					} else {
						_extract_paths(
							assignments,
							prop.argument,
							rest_expression,
							rest_expression,
							has_default_value,
						);
					}
				} else {
					/** @type {DestructuredAssignment['expression']} */
					const object_expression = (object) =>
						b.member(expression(object), prop.key, prop.computed || prop.key.type !== 'Identifier');
					_extract_paths(
						assignments,
						prop.value,
						object_expression,
						object_expression,
						has_default_value,
					);
				}
			}

			break;

		case 'ArrayPattern':
			for (let i = 0; i < param.elements.length; i += 1) {
				const element = param.elements[i];
				if (element) {
					if (element.type === 'RestElement') {
						/** @type {DestructuredAssignment['expression']} */
						const rest_expression = (object) =>
							b.call('_$_.array_slice', expression(object), b.literal(i));
						if (element.argument.type === 'Identifier') {
							assignments.push({
								node: element.argument,
								is_rest: true,
								has_default_value,
								expression: rest_expression,
								update_expression: rest_expression,
							});
						} else {
							_extract_paths(
								assignments,
								element.argument,
								rest_expression,
								rest_expression,
								has_default_value,
							);
						}
					} else {
						/** @type {DestructuredAssignment['expression']} */
						const array_expression = (object) => b.member(expression(object), b.literal(i), true);
						_extract_paths(
							assignments,
							element,
							array_expression,
							array_expression,
							has_default_value,
						);
					}
				}
			}

			break;

		case 'AssignmentPattern': {
			/** @type {DestructuredAssignment['expression']} */
			const fallback_expression = (object) => build_fallback(expression(object), param.right);

			if (param.left.type === 'Identifier') {
				assignments.push({
					node: param.left,
					is_rest: false,
					has_default_value: true,
					expression: fallback_expression,
					update_expression,
				});
			} else {
				_extract_paths(assignments, param.left, fallback_expression, update_expression, true);
			}

			break;
		}
	}

	return assignments;
}
