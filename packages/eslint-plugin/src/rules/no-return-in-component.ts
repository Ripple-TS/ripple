import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Deprecated: TSRX components are functions that return native TSRX expressions.',
			recommended: false,
		},
		deprecated: true,
		messages: {
			noReturn: 'TSRX components should return native TSRX expressions.',
		},
		schema: [],
	},
	create(context) {
		void context;
		return {};
	},
};

export default rule;
