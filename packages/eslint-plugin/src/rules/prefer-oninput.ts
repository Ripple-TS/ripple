import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Prefer onInput over onChange for form inputs in Ripple',
			category: 'Best Practices',
			recommended: true,
		},
		messages: {
			preferOnInput:
				'Use "onInput" instead of "onChange". Ripple does not have synthetic events like React.',
		},
		fixable: 'code',
		schema: [],
	},
	create(context) {
		const reported_ranges = new Set<string>();

		/**
		 * @param {any} node
		 */
		function report_onchange(node: any) {
			const range = node.range;
			if (!range) {
				return;
			}

			const key = `${range[0]}:${range[1]}`;
			if (reported_ranges.has(key)) {
				return;
			}
			reported_ranges.add(key);

			context.report({
				node,
				messageId: 'preferOnInput',
				fix(fixer) {
					return fixer.replaceText(node.name, 'onInput');
				},
			});
		}

		return {
			// Check JSX attributes (standard JSX)
			'JSXAttribute[name.name="onChange"]'(node: any) {
				report_onchange(node);
			},
			// Check Attribute nodes (Ripple parser)
			'Attribute[name.name="onChange"]'(node: any) {
				report_onchange(node);
			},
			// Check object properties (for spread props)
			'Property[key.name="onChange"]'(node: any) {
				// Only report if this looks like it's in a props object
				const ancestors = context.sourceCode.getAncestors(node);
				const inObjectExpression = ancestors.some(
					(ancestor) => ancestor.type === 'ObjectExpression',
				);

				if (inObjectExpression) {
					context.report({
						node,
						messageId: 'preferOnInput',
						fix(fixer) {
							return fixer.replaceText(node.key, 'onInput');
						},
					});
				}
			},
		};
	},
};

export default rule;
