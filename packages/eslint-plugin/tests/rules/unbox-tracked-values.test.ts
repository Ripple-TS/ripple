import { RuleTester } from 'eslint';
import rule from '../../src/rules/unbox-tracked-values.js';
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

ruleTester.run('unbox-tracked-values', rule, {
	valid: [
		// Valid: the value gets unboxed
		{
			code: `
				component Counter() {
					const count = #ripple.track(0);
					<div>{@count}</div>
				}
			`,
		},
		// Valid: the values get unboxed
		{
			code: `
				component App() {
					const value = #ripple.track(42);
					const doubled = #ripple.track(@value * 2);
					<span>{@doubled}</span>
				}
			`,
		},
		// Valid: the value gets unboxed
		{
			code: `
				component Form() {
					const name = #ripple.track('');
					<input value={@name} />
				}
			`,
		},
		// Valid: nothing to unbox
		{
			code: `
				component List() {
					const items = [1, 2, 3];
					<div>{items.length}</div>
				}
			`,
		},
		// Valid: nothing to unbox
		{
			code: `
				component Example() {
					const nonTracked = 'hello';
					<div>{nonTracked}</div>
				}
			`,
		},
	],
	invalid: [
		{
			// Invalid: the value does not get unboxed
			code: `
				component Counter() {
					const count = #ripple.track(0);
					<div>{count}</div>
				}
			`,
			errors: [
				{
					messageId: 'needsUnbox',
					data: { name: 'count' },
				},
			],
		},
		{
			// Invalid: the value does not get unboxed
			code: `
				component App() {
					const value = #ripple.track(10);
					<span>{\`Value: \${value}\`}</span>
				}
			`,
			errors: [
				{
					messageId: 'needsUnbox',
					data: { name: 'value' },
				},
			],
		},
		{
			// Invalid: multiple values don't get unboxed
			code: `
				component Form() {
					const firstName = #ripple.track('');
					const lastName = #ripple.track('');
					<div>
						<span>{firstName}</span>
						<span>{lastName}</span>
					</div>
				}
			`,
			errors: [
				{
					messageId: 'needsUnbox',
					data: { name: 'firstName' },
				},
				{
					messageId: 'needsUnbox',
					data: { name: 'lastName' },
				},
			],
		},
	],
});
