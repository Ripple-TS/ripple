/**
 * Helpers for preserving source-order semantics when non-JSX statements are
 * interleaved with JSX children inside a component or element body.
 *
 * Without these, targets like React and Solid would hoist all statements
 * before any JSX is constructed, so mutations between sibling JSX children
 * would be observed by every sibling instead of only the ones that appear
 * textually after the mutation.
 */

/**
 * Returns true when the body contains a non-JSX statement that appears
 * after a JSX child. In that case JSX children must be captured at their
 * source position so mutations in following statements do not retroactively
 * change what earlier children rendered.
 *
 * The `is_jsx_child` predicate is target-specific — each target recognizes
 * a different set of JSX-bearing node types (Ripple `Element`, `Text`,
 * `TSRXExpression`, etc. plus plain JSX nodes).
 *
 * @param {any[]} body_nodes
 * @param {(node: any) => boolean} is_jsx_child
 * @returns {boolean}
 */
export function is_interleaved_body(body_nodes, is_jsx_child) {
	let seen_jsx = false;
	for (const child of body_nodes) {
		if (is_jsx_child(child)) {
			seen_jsx = true;
		} else if (seen_jsx) {
			return true;
		}
	}
	return false;
}

/**
 * Only JSX nodes that evaluate to a single expression can be hoisted into a
 * `const`. Static text children (`JSXText`) are inert and don't need
 * capturing — their position relative to mutations doesn't change output.
 *
 * @param {any} jsx
 * @returns {boolean}
 */
export function is_capturable_jsx_child(jsx) {
	if (!jsx) return false;
	const t = jsx.type;
	return t === 'JSXElement' || t === 'JSXFragment' || t === 'JSXExpressionContainer';
}

/**
 * Build a `VariableDeclaration` that captures a JSX child into a const at
 * its source position, along with a JSXExpressionContainer referencing the
 * capture. The caller inserts the declaration into the enclosing block's
 * statements in source order and uses the reference in place of the JSX
 * child inside the returned fragment.
 *
 * @param {any} jsx
 * @param {number} capture_index
 * @returns {{ declaration: any, reference: any }}
 */
export function capture_jsx_child(jsx, capture_index) {
	const name = `_tsrx_child_${capture_index}`;
	const init = jsx.type === 'JSXExpressionContainer' ? jsx.expression : jsx;

	const declaration = /** @type {any} */ ({
		type: 'VariableDeclaration',
		kind: 'const',
		declarations: [
			/** @type {any} */ ({
				type: 'VariableDeclarator',
				id: /** @type {any} */ ({
					type: 'Identifier',
					name,
					metadata: { path: [] },
				}),
				init,
				metadata: { path: [] },
			}),
		],
		metadata: { path: [] },
	});

	// NOTE: JSXExpressionContainer nodes are intentionally created without
	// loc — they're synthetic wrappers whose source positions don't
	// correspond to source-map entries and adding loc causes Volar mapping
	// failures.
	const reference = /** @type {any} */ ({
		type: 'JSXExpressionContainer',
		expression: /** @type {any} */ ({
			type: 'Identifier',
			name,
			metadata: { path: [] },
		}),
		metadata: { path: [] },
	});

	return { declaration, reference };
}
