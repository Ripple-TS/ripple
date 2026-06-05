import { RuleTester } from 'eslint';
import rule from '../../src/rules/valid-for-of-key.js';
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

ruleTester.run('valid-for-of-key', rule, {
	valid: [
		// Valid: @for with valid key (variable defined in loop)
		{
			code: `
				function App() {
					const items = [{id: 1}, {id: 2}];
					return <>
						@for (const item of items; key item.id) {
							<div>{item.id}</div>
						}
					</>;
				}
			`,
		},
		// Valid: @for with valid key (variable defined in outer scope)
		{
			code: `
				function App() {
					const items = [1, 2];
					const globalId = 123;
					return <>
						@for (const item of items; key globalId) {
							<div>{item}</div>
						}
					</>;
				}
			`,
		},
		// Valid: @for without key
		{
			code: `
				function App() {
					const items = [1, 2];
					return <>
						@for (const item of items) {
							<div>{item}</div>
						}
					</>;
				}
			`,
		},
		// Valid: @for with index and key
		{
			code: `
				function App() {
					const items = [{id: 1}, {id: 2}];
					return <>
						@for (const item of items; index i; key item.id) {
							<div>{item.id}</div>
						}
					</>;
				}
			`,
		},
	],
	invalid: [
		// Invalid: key uses undefined variable
		{
			code: `
				function App() {
					const items = [{id: 1}, {id: 2}];
					return <>
						@for (const item of items; key unknownVariable) {
							<div>{item.id}</div>
						}
					</>;
				}
			`,
			errors: [
				{
					messageId: 'undefinedVariable',
					data: {
						name: 'unknownVariable',
					},
				},
			],
		},
		// Invalid: key uses undefined variable in expression
		{
			code: `
				function App() {
					const items = [{id: 1}, {id: 2}];
					return <>
						@for (const item of items; key item.id + unknownVariable) {
							<div>{item.id}</div>
						}
					</>;
				}
			`,
			errors: [
				{
					messageId: 'undefinedVariable',
					data: {
						name: 'unknownVariable',
					},
				},
			],
		},
	],
});
