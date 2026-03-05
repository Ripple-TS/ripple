import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-module-scope-track.js';
import * as parser from '@ripple-ts/eslint-parser';

const ruleTester = new RuleTester({
	languageOptions: {
		parser,
		parserOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
		},
	},
});

ruleTester.run('no-module-scope-track', rule, {
	valid: [
		// Valid: track() inside component
		{
			code: `
				component App() {
					let count = #ripple.track(0);
				}
			`,
		},
		// Valid: track() inside function
		{
			code: `
				function createCounter() {
					return #ripple.track(0);
				}
			`,
		},
		// Valid: track() inside arrow function
		{
			code: `
				const createState = () => {
					return #ripple.track({ count: 0 });
				};
			`,
		},
	],
	invalid: [
		// Invalid: track() at module scope
		{
			code: `
				let count = #ripple.track(0);
			`,
			errors: [
				{
					messageId: 'moduleScope',
				},
			],
		},
		// Invalid: track() at module scope even with import
		{
			code: `
				import { track } from 'ripple';
				let globalCount = #ripple.track(0);
			`,
			errors: [
				{
					messageId: 'moduleScope',
				},
			],
		},
	],
});
