import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// A helper inlined on a cold path must stay the helper: each inlined
// expression is compared structurally with the helper's return expression,
// parameters substituted, so a change to one side fails here until the
// other follows.

/** @param {string} file */
function parse(file) {
	const path = fileURLToPath(new URL(`../../src/runtime/internal/client/${file}`, import.meta.url));
	return ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
}

/**
 * @param {ts.SourceFile} source
 * @param {string} name
 * @returns {ts.FunctionDeclaration}
 */
function fn(source, name) {
	const found = source.statements.find(
		(statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === name,
	);
	if (!found) throw new Error(`No function ${name}`);
	return /** @type {ts.FunctionDeclaration} */ (found);
}

/** @param {ts.FunctionDeclaration} declaration */
function returned(declaration) {
	const statement = declaration.body?.statements.find(ts.isReturnStatement);
	if (!statement?.expression) throw new Error(`${declaration.name?.text} returns nothing`);
	return statement.expression;
}

/**
 * The structure of an expression as data: node kinds, identifiers and
 * literal texts, without positions, parentheses or type casts.
 * @param {ts.Node} node
 * @param {Record<string, unknown>} [substitute] a shape per parameter name
 * @returns {unknown}
 */
function shape(node, substitute = {}) {
	while (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) node = node.expression;
	if (ts.isIdentifier(node)) {
		return node.text in substitute ? substitute[node.text] : { id: node.text };
	}
	if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return { literal: node.text };
	/** @type {unknown[]} */
	const children = [];
	node.forEachChild((child) => {
		children.push(shape(child, substitute));
	});
	return { kind: ts.SyntaxKind[node.kind], children };
}

describe('inlined helpers match their functions', () => {
	it('track() inlines is_ripple_object()', () => {
		const helper = returned(fn(parse('utils.js'), 'is_ripple_object'));
		const track = fn(parse('runtime.js'), 'track');
		const first = track.body?.statements[0];
		if (!first || !ts.isIfStatement(first))
			throw new Error('track() no longer starts with the check');
		expect(shape(first.expression)).toEqual(shape(helper));
	});

	it('create_deferred_effects() inlines effect()', () => {
		const helper = returned(fn(parse('blocks.js'), 'effect'));
		const creator = fn(parse('runtime.js'), 'create_deferred_effects');
		/** @type {ts.CallExpression | undefined} */
		let inlined;
		const visit = (/** @type {ts.Node} */ node) => {
			if (ts.isCallExpression(node) && node.expression.getText() === 'block') inlined = node;
			node.forEachChild(visit);
		};
		visit(creator);
		if (!inlined) throw new Error('create_deferred_effects() no longer creates the block itself');
		// The helper's `fn` stands for whatever the inlined call passes.
		const fn_argument = shape(inlined.arguments[inlined.arguments.length - 1]);
		expect(shape(inlined)).toEqual(shape(helper, { fn: fn_argument }));
	});
});
