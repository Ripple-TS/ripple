import type { Rule } from 'eslint';
import type * as AST from '@tsrx/core/types/estree';
import { functionReturnsNativeTsrx, isNativeTsrxNode } from '../utils/tsrx.js';

const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Validate TSRX @for rendering loops and disallow template output in effect() loops',
			recommended: true,
		},
		messages: {
			requireJsxInLoop:
				'@for loops in returned TSRX should contain template output. Render an element, text, expression, or compat template.',
			requireDirectiveForRenderingLoop: 'Use @for when a TSRX for...of loop renders output.',
			noJsxInEffectLoop:
				'For...of loops inside effect() should not contain template output. Effects are for side effects, not rendering.',
		},
		schema: [],
	},
	create(context) {
		let insideComponent = 0;
		let insideEffect = 0;
		let nonComponentFunctionDepth = 0;
		const functionStack: boolean[] = [];

		function containsTemplateOutput(
			node: AST.Node,
			visited: Set<AST.Node> = new Set(),
			options: { skipTemplateDirectiveSubtrees?: boolean } = {},
		): boolean {
			if (!node) return false;

			// Avoid infinite loops from circular references
			if (visited.has(node)) return false;
			visited.add(node);

			if (options.skipTemplateDirectiveSubtrees && node.metadata?.tsrxDirective) {
				return false;
			}

			if (isTemplateOutputNode(node)) {
				return true;
			}

			const keys = Object.keys(node);
			for (const key of keys) {
				if (key === 'parent' || key === 'loc' || key === 'range') {
					continue;
				}

				const value = (node as any)[key];
				if (value && typeof value === 'object') {
					if (Array.isArray(value)) {
						for (const item of value) {
							if (
								item &&
								typeof item === 'object' &&
								containsTemplateOutput(item, visited, options)
							) {
								return true;
							}
						}
					} else if (value.type && containsTemplateOutput(value, visited, options)) {
						return true;
					}
				}
			}

			return false;
		}

		return {
			FunctionDeclaration: enterFunction,
			'FunctionDeclaration:exit': exitFunction,
			FunctionExpression: enterFunction,
			'FunctionExpression:exit': exitFunction,
			ArrowFunctionExpression: enterFunction,
			'ArrowFunctionExpression:exit': exitFunction,

			"CallExpression[callee.name='effect']"() {
				insideEffect++;
			},
			"CallExpression[callee.name='effect']:exit"() {
				insideEffect--;
			},

			ForOfStatement(node: AST.ForOfStatement) {
				if (insideComponent === 0) return;

				const hasOutput = containsTemplateOutput(node.body);
				const isTemplateFor = node.metadata?.tsrxDirective === 'for';
				const hasNonDirectiveOutput = containsTemplateOutput(node.body, new Set(), {
					skipTemplateDirectiveSubtrees: true,
				});

				if (insideEffect > 0) {
					if (hasOutput) {
						context.report({
							node,
							messageId: 'noJsxInEffectLoop',
						});
					}
				} else if (nonComponentFunctionDepth > 0) {
					return;
				} else {
					if (isTemplateFor && !hasOutput) {
						context.report({
							node,
							messageId: 'requireJsxInLoop',
						});
					} else if (!isTemplateFor && hasNonDirectiveOutput) {
						context.report({
							node,
							messageId: 'requireDirectiveForRenderingLoop',
						});
					}
				}
			},
		};

		function enterFunction(node: AST.Node) {
			const isComponent = functionReturnsNativeTsrx(node);
			functionStack.push(isComponent);

			if (isComponent) {
				insideComponent++;
			} else if (insideComponent > 0) {
				nonComponentFunctionDepth++;
			}
		}

		function exitFunction() {
			const isComponent = functionStack.pop();

			if (isComponent) {
				insideComponent--;
			} else if (insideComponent > 0) {
				nonComponentFunctionDepth--;
			}
		}
	},
};

function isTemplateOutputNode(node: AST.Node): boolean {
	if (
		node.type === ('JSXText' as string) &&
		typeof (node as any).value === 'string' &&
		(node as any).value.trim() === ''
	) {
		return false;
	}

	return (
		node.type === ('JSXElement' as string) ||
		node.type === ('JSXFragment' as string) ||
		node.type === ('JSXExpressionContainer' as string) ||
		node.type === ('JSXText' as string) ||
		node.type === 'Text' ||
		node.type === 'TSRXExpression' ||
		node.type === 'TsxCompat' ||
		isNativeTsrxNode(node)
	);
}

export default rule;
