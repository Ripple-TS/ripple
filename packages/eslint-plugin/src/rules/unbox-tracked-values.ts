import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Ensure tracked values are unboxed with @ operator',
			category: 'Possible Errors',
			recommended: true,
		},
		messages: {
			needsUnbox: 'Tracked value should be unboxed with @ operator. Did you mean "@{{name}}"?',
		},
		schema: [],
	},
	create(context) {
		const trackedVariables = new Set<string>();

		function isInJSXContext(node: any): boolean {
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
					parentType === 'ExpressionContainer' ||
					parentType === 'Element'
				) {
					return true;
				}
				parent = parent.parent;
			}

			return false;
		}

		function checkTrackedIdentifier(node: any) {
			if (trackedVariables.has(node.name) && isInJSXContext(node)) {
				const parent = node.parent;
				let isUnboxed = (parent && parent.type === 'TrackedExpression') || node.tracked === true;

				// Fallback: check source code for @ character as the first character
				if (!isUnboxed) {
					const sourceCode = context.getSourceCode();
					const firstChar = sourceCode.text.substring(Math.max(0, node.range![0]), node.range![0]);
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
			'VariableDeclarator[init.callee.name="track"]'(node: any) {
				if (node.id.type === 'Identifier') {
					trackedVariables.add(node.id.name);
				}
			},
			// Check all identifiers
			Identifier(node: any) {
				checkTrackedIdentifier(node);
			},
		};
	},
};

export default rule;
