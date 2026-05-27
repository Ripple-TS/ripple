import type { Rule } from 'eslint';
import type * as AST from '@tsrx/core/types/estree';

const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow calling track() at module scope',
			recommended: true,
		},
		messages: {
			moduleScope: 'track() cannot be called at module scope. Move it into a function body.',
		},
		schema: [],
	},
	create(context) {
		let functionDepth = 0;

		const incrementFunctionDepth = () => functionDepth++;
		const decrementFunctionDepth = () => functionDepth--;

		return {
			FunctionDeclaration: incrementFunctionDepth,
			'FunctionDeclaration:exit': decrementFunctionDepth,
			FunctionExpression: incrementFunctionDepth,
			'FunctionExpression:exit': decrementFunctionDepth,
			ArrowFunctionExpression: incrementFunctionDepth,
			'ArrowFunctionExpression:exit': decrementFunctionDepth,

			// Check track() calls
			CallExpression(node: AST.CallExpression) {
				if (
					node.callee.type === 'Identifier' &&
					node.callee.name === 'track' &&
					functionDepth === 0
				) {
					context.report({
						node,
						messageId: 'moduleScope',
					});
				}
			},
		};
	},
};

export default rule;
