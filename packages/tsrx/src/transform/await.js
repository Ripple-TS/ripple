/**
 * @param {any[]} body_nodes
 * @returns {any | null}
 */
export function find_first_top_level_await_in_component_body(body_nodes) {
	for (const node of body_nodes) {
		const found = find_first_top_level_await(node, false);
		if (found) return found;
	}

	return null;
}

/**
 * @param {any} node
 * @param {boolean} inside_nested_function
 * @returns {any | null}
 */
export function find_first_top_level_await(node, inside_nested_function) {
	if (!node || typeof node !== 'object') {
		return null;
	}

	if (Array.isArray(node)) {
		for (const child of node) {
			const found = find_first_top_level_await(child, inside_nested_function);
			if (found) return found;
		}

		return null;
	}

	if (
		node.type === 'FunctionDeclaration' ||
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression'
	) {
		return inside_nested_function ? null : find_first_top_level_await(node.body, true);
	}

	if (inside_nested_function) {
		return null;
	}

	if (node.type === 'AwaitExpression' || (node.type === 'ForOfStatement' && node.await === true)) {
		return node;
	}

	for (const key of Object.keys(node)) {
		if (key === 'loc' || key === 'start' || key === 'end' || key === 'metadata') {
			continue;
		}

		const found = find_first_top_level_await(node[key], false);
		if (found) return found;
	}

	return null;
}
