import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-return-in-component.js';
import * as parser from '@tsrx/eslint-parser';

const ruleTester = new RuleTester({
	languageOptions: {
		parser,
		parserOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			ecmaFeatures: {
				jsx: true,
			},
		},
	},
});

ruleTester.run('no-return-in-component', rule, {
	valid: [
		// Valid: component functions return native TSRX.
		{
			code: `
				function App() {
					return <div>{"Hello"}</div>;
				}
			`,
		},
		// Valid: return non-JSX
		{
			code: `
				function App() {
					function helper() {
						return 42;
					}
					return <div>{helper()}</div>;
				}
			`,
		},
	],
	invalid: [],
});
