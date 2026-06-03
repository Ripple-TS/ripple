import type { Rule } from 'eslint';
import type * as AST from '@tsrx/core/types/estree';
import { functionReturnsNativeTsrx, isNativeTsrxNode } from '../utils/tsrx.js';

const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Validate TSRX @for rendering loops and disallow JSX in effect() loops',
			recommended: true,
		},
		messages: {
			requireJsxInLoop:
				'@for loops in returned TSRX should contain JSX elements. Use JSX to render items.',
			requireDirectiveForRenderingLoop: 'Use @for when a TSRX for...of loop renders JSX elements.',
			noJsxInEffectLoop:
				'For...of loops inside effect() should not contain JSX. Effects are for side effects, not rendering.',
		},
		schema: [],
	},
	create(context) {
		let insideComponent = 0;
		let insideEffect = 0;
		let nonComponentFunctionDepth = 0;
		const functionStack: boolean[] = [];

		function containsJSX(node: AST.Node, visited: Set<AST.Node> = new Set()): boolean {
			if (!node) return false;

			// Avoid infinite loops from circular references
			if (visited.has(node)) return false;
			visited.add(node);

			if (
				node.type === ('JSXElement' as string) ||
				node.type === ('JSXFragment' as string) ||
				isNativeTsrxNode(node)
			) {
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
							if (item && typeof item === 'object' && containsJSX(item, visited)) {
								return true;
							}
						}
					} else if (value.type && containsJSX(value, visited)) {
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

				const hasJSX = containsJSX(node.body);
				const isTemplateFor = node.metadata?.tsrxDirective === 'for';

				if (insideEffect > 0) {
					if (hasJSX) {
						context.report({
							node,
							messageId: 'noJsxInEffectLoop',
						});
					}
				} else if (nonComponentFunctionDepth > 0) {
					return;
				} else {
					if (isTemplateFor && !hasJSX) {
						context.report({
							node,
							messageId: 'requireJsxInLoop',
						});
					} else if (!isTemplateFor && hasJSX) {
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

export default rule;
