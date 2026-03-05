import type { Rule } from 'eslint';
import type * as AST from 'ripple/types/estree';

const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Ensure tracked values are unboxed with @ operator',
			recommended: true,
		},
		messages: {
			needsUnbox: 'Tracked value should be unboxed with @ operator. Did you mean "@{{name}}"?',
		},
		schema: [],
	},
	create(context) {
		const trackedVariables = new Set<string>();

		function isInJSXContext(node: AST.Node & { parent: AST.Node }): boolean {
			let parent = node.parent;

			// Walk up the AST to find if we're inside JSX/Element
			while (parent) {
				const parentType = parent.type;
				// Check for JSX context
				if (
					parentType === 'JSXExpressionContainer' ||
					parentType === 'JSXElement' ||
					parentType === 'JSXFragment' ||
					// Check for Ripple Element context
					parentType === 'Element'
				) {
					return true;
				}
				parent = (parent as AST.Node & { parent: AST.Node }).parent;
			}

			return false;
		}

		function checkTrackedIdentifier(node: AST.Identifier & { parent: AST.Node }) {
			if (trackedVariables.has(node.name) && isInJSXContext(node)) {
				const parent = node.parent;
				let isUnboxed = (parent && parent.type === 'TrackedExpression') || node.tracked === true;

				// Fallback: check source code for @ character as the first character
				if (!isUnboxed) {
					const firstChar = context.sourceCode.text.substring(
						Math.max(0, node.range![0] - 1),
						node.range![0],
					);
					isUnboxed = firstChar === '@';
				}

				if (!isUnboxed) {
					context.report({
						node,
						messageId: 'needsUnbox',
						data: { name: node.name },
					});
				}
			}
		}

		return {
			// Track variables that are assigned from track()
			'VariableDeclarator[init.callee.name="track"]'(node: AST.VariableDeclarator) {
				if (node.id.type === 'Identifier') {
					trackedVariables.add(node.id.name);
				}
			},
			// Check all identifiers
			Identifier(node: AST.Identifier & { parent: AST.Node }) {
				checkTrackedIdentifier(node);
			},
		};
	},
};

export default rule;
