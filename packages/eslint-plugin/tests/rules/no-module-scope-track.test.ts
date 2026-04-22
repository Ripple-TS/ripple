import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-module-scope-track.js';
import * as parser from '@tsrx/eslint-parser';

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
				import { track } from 'ripple';
				component App() {
					let count = track(0);
				}
			`,
		},
		// Valid: track() inside function
		{
			code: `
				import { track } from 'ripple';
				function createCounter() {
					return track(0);
				}
			`,
		},
		// Valid: track() inside arrow function
		{
			code: `
				import { track } from 'ripple';
				const createState = () => {
					return track({ count: 0 });
				};
			`,
		},
	],
	invalid: [
		// Invalid: track() at module scope
		{
			code: `
				import { track } from 'ripple';
				let count = track(0);
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
				let globalCount = track(0);
			`,
			errors: [
				{
					messageId: 'moduleScope',
				},
			],
		},
	],
});
