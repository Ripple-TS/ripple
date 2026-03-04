import type { Rule } from 'eslint';
import type * as AST from 'ripple/types/estree';

const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow return statements with JSX in Ripple components',
			recommended: true,
		},
		messages: {
			noReturn: 'Do not return JSX from Ripple components. Use JSX as statements instead.',
		},
		schema: [],
	},
	create(context) {
		let insideComponent = 0;

		return {
			// Track component boundaries
			"ExpressionStatement > CallExpression[callee.name='component']"() {
				insideComponent++;
			},
			"ExpressionStatement > CallExpression[callee.name='component']:exit"() {
				insideComponent--;
			},
			// Also track arrow functions and regular functions that might be components
			'VariableDeclarator[init.callee.name="component"]'() {
				insideComponent++;
			},
			'VariableDeclarator[init.callee.name="component"]:exit'() {
				insideComponent--;
			},
			// Check return statements
			ReturnStatement(node: AST.ReturnStatement) {
				if (insideComponent > 0 && node.argument) {
					// Check if returning JSX (JSXElement, JSXFragment)
					if (node.argument.type === 'JSXElement' || node.argument.type === 'JSXFragment') {
						context.report({
							node,
							messageId: 'noReturn',
						});
					}
				}
			},
		};
	},
};

export default rule;
