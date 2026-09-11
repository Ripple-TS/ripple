/**
 * @import * as AST from 'estree';
 * @import { ScopeInterface } from '../../../types/index';
 */

import { builders as b } from '@tsrx/core';

/**
 * Support for hoisting template code (`@if` conditions and branches, render
 * blocks) into module-level functions created once per call site: free-variable
 * analysis of the compiled expressions, classification of each free name
 * (module-level or global, a local to capture, or not representable), and the
 * rewrite that reads captured locals back from where the caller stores them.
 */

/**
 * Globals a hoisted expression may reference directly; anything else unknown
 * to the scope chain is treated as a local and captured.
 */
const GLOBALS = new Set([
	'undefined',
	'NaN',
	'Infinity',
	'globalThis',
	'window',
	'document',
	'navigator',
	'location',
	'history',
	'console',
	'performance',
	'crypto',
	'localStorage',
	'sessionStorage',
	'Math',
	'JSON',
	'Object',
	'Array',
	'Number',
	'String',
	'Boolean',
	'Symbol',
	'BigInt',
	'Date',
	'RegExp',
	'Map',
	'Set',
	'WeakMap',
	'WeakSet',
	'WeakRef',
	'Promise',
	'Proxy',
	'Reflect',
	'Intl',
	'Function',
	'Error',
	'TypeError',
	'RangeError',
	'SyntaxError',
	'URL',
	'URLSearchParams',
	'parseInt',
	'parseFloat',
	'isNaN',
	'isFinite',
	'encodeURIComponent',
	'decodeURIComponent',
	'encodeURI',
	'decodeURI',
	'structuredClone',
	'queueMicrotask',
	'setTimeout',
	'clearTimeout',
	'setInterval',
	'clearInterval',
	'requestAnimationFrame',
	'cancelAnimationFrame',
	'fetch',
	'Node',
	'Element',
	'HTMLElement',
	'Event',
	'CustomEvent',
	'_$_',
]);

/** Keys of an AST node that hold types or metadata rather than child values. */
const SKIPPED_KEYS = new Set([
	'metadata',
	'loc',
	'start',
	'end',
	'range',
	'leadingComments',
	'trailingComments',
	'typeAnnotation',
	'typeParameters',
	'typeArguments',
	'returnType',
]);

/**
 * @param {any} value
 * @returns {value is AST.Node}
 */
function is_node(value) {
	return value !== null && typeof value === 'object' && typeof value.type === 'string';
}

/**
 * Collects the names a pattern declares.
 * @param {AST.Node} pattern
 * @param {Set<string>} into
 */
function collect_pattern_names(pattern, into) {
	switch (pattern.type) {
		case 'Identifier':
			into.add(pattern.name);
			break;
		case 'ObjectPattern':
			for (const property of pattern.properties) {
				collect_pattern_names(
					property.type === 'RestElement' ? property.argument : property.value,
					into,
				);
			}
			break;
		case 'ArrayPattern':
			for (const element of pattern.elements) {
				if (element !== null) collect_pattern_names(element, into);
			}
			break;
		case 'RestElement':
			collect_pattern_names(pattern.argument, into);
			break;
		case 'AssignmentPattern':
			collect_pattern_names(pattern.left, into);
			break;
	}
}

/**
 * Collects the names a function declares for its body: parameters, `var`,
 * `let`, `const`, function and class declarations anywhere inside it.
 * @param {AST.Function} fn
 * @returns {Set<string>}
 */
function local_names(fn) {
	/** @type {Set<string>} */
	const names = new Set();
	for (const param of fn.params) {
		collect_pattern_names(param, names);
	}
	/** @param {AST.Node} node */
	const collect = (node) => {
		switch (node.type) {
			case 'VariableDeclarator':
				collect_pattern_names(node.id, names);
				break;
			case 'FunctionDeclaration':
			case 'ClassDeclaration':
				if (node.id) names.add(node.id.name);
				return;
			case 'FunctionExpression':
			case 'ArrowFunctionExpression':
			case 'ClassExpression':
				return;
			case 'CatchClause':
				if (node.param) collect_pattern_names(node.param, names);
				break;
		}
		for (const key in node) {
			if (SKIPPED_KEYS.has(key)) continue;
			const value = /** @type {any} */ (node)[key];
			if (Array.isArray(value)) {
				for (const item of value) {
					if (is_node(item)) collect(item);
				}
			} else if (is_node(value)) {
				collect(value);
			}
		}
	};
	collect(fn.body);
	return names;
}

/**
 * Walks a compiled expression and records every free identifier it references
 * in value position. Returns false when the expression has a shape a capture
 * cannot represent.
 *
 * @param {AST.Node} node
 * @param {Set<string>} references
 * @param {Set<string>} shadowed names bound inside the expression at this point
 * @returns {boolean}
 */
function scan(node, references, shadowed) {
	switch (node.type) {
		case 'Identifier':
			if (node.name === 'arguments') return false;
			if (!shadowed.has(node.name)) references.add(node.name);
			return true;
		case 'ThisExpression':
		case 'Super':
		case 'MetaProperty':
		case 'ClassExpression':
		case 'ClassDeclaration':
		case 'YieldExpression':
		case 'AwaitExpression':
		case 'MethodDefinition':
		case 'PropertyDefinition':
			return false;
		case 'MemberExpression':
			if (!scan(node.object, references, shadowed)) return false;
			return node.computed ? scan(node.property, references, shadowed) : true;
		case 'Property':
			if (node.computed && !scan(node.key, references, shadowed)) return false;
			return scan(node.value, references, shadowed);
		case 'FunctionExpression':
		case 'ArrowFunctionExpression':
		case 'FunctionDeclaration': {
			const inner = new Set(shadowed);
			if (node.type !== 'ArrowFunctionExpression' && node.id) inner.add(node.id.name);
			for (const name of local_names(node)) inner.add(name);
			for (const param of node.params) {
				if (param.type === 'AssignmentPattern' && !scan(param.right, references, inner)) {
					return false;
				}
			}
			return scan(node.body, references, inner);
		}
		case 'VariableDeclarator':
			return node.init === null || node.init === undefined
				? true
				: scan(node.init, references, shadowed);
		case 'LabeledStatement':
			return scan(node.body, references, shadowed);
		case 'BreakStatement':
		case 'ContinueStatement':
			return true;
	}

	if (node.type.startsWith('TS')) {
		// A type-level node carries no runtime reference; the value wrappers keep
		// their expression.
		const expression = /** @type {any} */ (node).expression;
		return is_node(expression) ? scan(expression, references, shadowed) : true;
	}

	for (const key in node) {
		if (SKIPPED_KEYS.has(key)) continue;
		const value = /** @type {any} */ (node)[key];
		if (Array.isArray(value)) {
			for (const item of value) {
				if (is_node(item) && !scan(item, references, shadowed)) return false;
			}
		} else if (is_node(value) && !scan(value, references, shadowed)) {
			return false;
		}
	}

	return true;
}

/**
 * How a free identifier of a hoisted expression reaches the compiled function:
 * referenced directly (module scope or a global), passed as a capture, or not
 * representable (a reassigned local).
 * @param {string} name
 * @param {ScopeInterface} scope
 * @returns {'direct' | 'capture' | 'bail'}
 */
function classify(name, scope) {
	// The runtime namespace import is module-level by construction; the
	// builders spell a namespace member as one dotted identifier.
	if (name === '_$_' || name.startsWith('_$_.')) return 'direct';

	/** @type {ScopeInterface | null} */
	let current = scope;

	while (current !== null) {
		const binding = current.declarations.get(name);
		if (binding !== undefined) {
			if (current.function_depth === 0) return 'direct';
			// A capture is passed by value: fine unless the binding is rebound
			// later (mutating the object it holds does not change its identity).
			return binding.reassigned ? 'bail' : 'capture';
		}
		// A name the transform generated (`lazy`, `consequent`, template ids) is
		// registered as a reference without any referencing node.
		const references = current.references.get(name);
		if (references !== undefined && references.length === 0) {
			return current.function_depth === 0 ? 'direct' : 'capture';
		}
		current = current.parent;
	}

	return GLOBALS.has(name) ? 'direct' : 'capture';
}

/**
 * Returns a copy of `node` with every free reference to a captured name
 * replaced by the expression `replace` gives for it (null keeps the name).
 * @template {AST.Node} T
 * @param {T} node
 * @param {(name: string) => AST.Expression | null} replace
 * @param {Set<string>} shadowed
 * @returns {T}
 */
export function rewrite(node, replace, shadowed) {
	if (node.type === 'Identifier') {
		if (shadowed.has(node.name)) return node;
		const replacement = replace(node.name);
		return replacement === null ? node : /** @type {T} */ (/** @type {unknown} */ (replacement));
	}

	if (node.type.startsWith('TS')) {
		const expression = /** @type {any} */ (node).expression;
		return is_node(expression)
			? { ...node, expression: rewrite(expression, replace, shadowed) }
			: node;
	}

	/** @type {any} */
	const copy = { ...node };

	if (node.type === 'MemberExpression') {
		copy.object = rewrite(node.object, replace, shadowed);
		if (node.computed) copy.property = rewrite(node.property, replace, shadowed);
		return copy;
	}

	if (node.type === 'Property') {
		if (node.computed) copy.key = rewrite(node.key, replace, shadowed);
		copy.value = rewrite(node.value, replace, shadowed);
		if (node.shorthand && copy.value !== node.value) copy.shorthand = false;
		return copy;
	}

	if (
		node.type === 'FunctionExpression' ||
		node.type === 'ArrowFunctionExpression' ||
		node.type === 'FunctionDeclaration'
	) {
		const inner = new Set(shadowed);
		if (node.type !== 'ArrowFunctionExpression' && node.id) inner.add(node.id.name);
		for (const name of local_names(node)) inner.add(name);
		copy.params = node.params.map((param) => rewrite(param, replace, inner));
		copy.body = rewrite(node.body, replace, inner);
		return copy;
	}

	for (const key in node) {
		if (SKIPPED_KEYS.has(key)) continue;
		const value = /** @type {any} */ (node)[key];
		if (Array.isArray(value)) {
			copy[key] = value.map((item) => (is_node(item) ? rewrite(item, replace, shadowed) : item));
		} else if (is_node(value)) {
			copy[key] = rewrite(value, replace, shadowed);
		}
	}

	return copy;
}

/** Names of the module-level declarations emitted so far, per `hoisted` list. */
/** @type {WeakMap<AST.Statement[], Set<string>>} */
const hoisted_names = new WeakMap();

/**
 * Records a name declared at module level by the transform, so the capture
 * analysis references it directly instead of capturing it.
 * @param {AST.Statement[]} hoisted
 * @param {string} name
 */
export function register_hoisted(hoisted, name) {
	let names = hoisted_names.get(hoisted);
	if (names === undefined) {
		names = new Set();
		hoisted_names.set(hoisted, names);
	}
	names.add(name);
}

/**
 * @param {AST.Statement[]} hoisted
 * @param {string} name
 * @returns {boolean}
 */
export function is_hoisted(hoisted, name) {
	return hoisted_names.get(hoisted)?.has(name) === true;
}

/**
 * The locals a set of compiled functions would have to capture to live at
 * module level, or null when one of them cannot (it reads a reassigned local,
 * `this`, `arguments` or a class).
 * @param {AST.Function[]} functions
 * @param {ScopeInterface} scope
 * @param {AST.Statement[]} hoisted
 * @param {Iterable<string>} [own] names the functions define among themselves
 * @returns {string[] | null}
 */
export function captured_locals(functions, scope, hoisted, own = []) {
	/** @type {Set<string>} */
	const references = new Set();
	for (const fn of functions) {
		if (!scan(fn, references, new Set())) return null;
	}
	const owned = new Set(own);
	/** @type {string[]} */
	const captures = [];
	for (const name of references) {
		if (owned.has(name) || is_hoisted(hoisted, name)) continue;
		const kind = classify(name, scope);
		if (kind === 'bail') return null;
		if (kind === 'capture') captures.push(name);
	}
	return captures;
}
