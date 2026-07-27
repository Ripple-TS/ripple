/** @import * as AST from 'estree' */
/** @import { NodeOfType, NodeTypeName } from '../../types/index' */

import { expect } from 'vitest';

/**
 * Assert a node's `type`, narrowing it for the rest of the test.
 *
 * @template {NodeTypeName} T
 * @param {unknown} node
 * @param {T} type
 * @returns {asserts node is NodeOfType<T>}
 */
export function assert_type(node, type) {
	expect(/** @type {AST.Node | null | undefined} */ (node)?.type).toBe(type);
}

/**
 * `assert_type` for a value that cannot be narrowed in place (an element of an
 * array, a property of a node): asserts the type and returns the node as it.
 *
 * @template {NodeTypeName} T
 * @param {unknown} node
 * @param {T} type
 * @returns {NodeOfType<T>}
 */
export function as_type(node, type) {
	assert_type(node, type);
	return node;
}
