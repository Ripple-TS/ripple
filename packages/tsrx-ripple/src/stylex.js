// @ts-check
/** @import * as AST from 'estree' */
/** @import {AnalysisContext, AnalysisResult} from '../types/index' */

import { builders as b, error } from '@tsrx/core';
import { is_element_dom_element } from './utils.js';

/**
 * Called by the existing JSX visitor after analyzing the authored expressions.
 * Both renderers consume the same lowered attributes. No source edits or extra
 * walks are needed, and expression locations retain TypeScript text proofs.
 * @param {AST.TSRXJSXElement} node
 * @param {AnalysisContext} context
 */
export function lower_stylex(node, context) {
	const analysis = /** @type {AnalysisResult} */ (context.state.analysis);
	if (!analysis.stylex || context.state.to_ts) return;
	const opening = node.openingElement;
	// Components, including member and dynamic tags, own their sx prop.
	if (!is_element_dom_element(node)) return;

	for (let index = 0; index < opening.attributes.length; index++) {
		const attr = opening.attributes[index];
		if (
			attr.type !== 'JSXAttribute' ||
			attr.name.type !== 'JSXIdentifier' ||
			attr.name.name !== 'sx'
		)
			continue;
		if (
			attr.value?.type !== 'JSXExpressionContainer' ||
			attr.value.expression.type === 'JSXEmptyExpression'
		) {
			error(
				'sx must contain a StyleX expression, for example sx={styles.root}.',
				analysis.module.filename,
				attr,
				context.state.collect ? analysis.errors : undefined,
				analysis.comments,
			);
			continue;
		}
		const { reference, callee } = stylex_attrs(context);
		const call = b.call(callee, attr.value.expression);
		const spread = b.jsx_spread_attribute(call, /** @type {AST.NodeWithLocation} */ (attr));
		opening.attributes[index] = spread;
		context.state.scope.reference(reference, [
			...context.path,
			node,
			opening,
			spread,
			call,
			...(callee === reference ? [] : [callee]),
		]);
	}
}

/**
 * Reuse a visible value import without rewriting user bindings. Scopes already
 * contain every import, including ones declared after the component.
 * @param {AnalysisContext} context
 * @returns {{ reference: AST.Identifier, callee: AST.Identifier | AST.MemberExpression }}
 */
function stylex_attrs(context) {
	const analysis = /** @type {AnalysisResult} */ (context.state.analysis);
	for (const [name, binding] of analysis.scope.declarations) {
		const declaration = binding.initial;
		if (
			binding.declaration_kind !== 'import' ||
			declaration?.type !== 'ImportDeclaration' ||
			declaration.importKind === 'type' ||
			declaration.source.type !== 'Literal' ||
			declaration.source.value !== '@stylexjs/stylex' ||
			context.state.scope.get(name) !== binding
		)
			continue;
		const specifier = declaration.specifiers.find((specifier) => specifier.local === binding.node);
		const reference = b.id(name);
		if (specifier?.type === 'ImportNamespaceSpecifier') {
			return { reference, callee: b.member(reference, 'attrs') };
		}
		if (
			specifier?.type === 'ImportSpecifier' &&
			specifier.importKind !== 'type' &&
			(specifier.imported.type === 'Identifier'
				? specifier.imported.name
				: specifier.imported.value) === 'attrs'
		) {
			return { reference, callee: reference };
		}
	}
	if (!analysis.stylex_import) {
		// createScopes already registered every nested declaration in root.conflicts.
		// generate avoids those names too, including locals in later components.
		const name = analysis.scope.generate('__ripple_stylex');
		const declaration = b.import_all(name, '@stylexjs/stylex');
		analysis.scope.declare(declaration.specifiers[0].local, 'normal', 'import', declaration);
		analysis.module.ast.body.push(declaration);
		analysis.stylex_import = declaration;
	}
	const reference = b.id(analysis.stylex_import.specifiers[0].local.name);
	return { reference, callee: b.member(reference, 'attrs') };
}
