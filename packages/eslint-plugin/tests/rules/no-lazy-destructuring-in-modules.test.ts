import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-lazy-destructuring-in-modules.js';
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

ruleTester.run('no-lazy-destructuring-in-modules', rule, {
	valid: [
		// Valid: using .value in TypeScript modules
		{
			code: `
				import { track, effect } from 'ripple';

				export function useCount() {
					const count = track(1);

					effect(() => {
						console.log(count.value);
					});

					return { count };
				}
			`,
			filename: 'countStore.ts',
		},
		// Valid: using .value in regular JavaScript
		{
			code: `
				import { track, effect } from 'ripple';

				function useCounter() {
					const count = track(0);
					effect(() => {
						console.log(count.value);
					});
					return { count };
				}
			`,
			filename: 'counter.js',
		},
		// Valid: lazy destructuring in .ripple files should be allowed
		{
			code: `
				import { track, effect } from 'ripple';
				component Counter() {
					let &[count] = track(0);
					effect(() => {
						console.log(count);
					});
					<div>{count}</div>
				}
			`,
			filename: 'Counter.rsrx',
		},
		// Valid: lazy destructuring in .tsrx files should be allowed
		{
			code: `
				import { track, effect } from 'ripple';
				component Counter() {
					let &[count] = track(0);
					effect(() => {
						console.log(count);
					});
					<div>{count}</div>
				}
			`,
			filename: 'Counter.tsrx',
		},
		// Valid: lazy object destructuring in .ripple files
		{
			code: `
				import { track } from 'ripple';
				component Child(&{ count, name }: Props) {
					<div>{count}{name}</div>
				}
			`,
			filename: 'Child.rsrx',
		},
		// Valid: lazy object destructuring in .tsrx files
		{
			code: `
				import { track } from 'ripple';
				component Child(&{ count, name }: Props) {
					<div>{count}{name}</div>
				}
			`,
			filename: 'Child.tsrx',
		},
	],
	invalid: [
		{
			// Invalid: using &[] lazy array destructuring in TypeScript module
			code: `
				import { track, effect } from 'ripple';
				export function useCount() {
					const &[count] = track(1);
					effect(() => {
						console.log(count);
					});
					return { count };
				}
			`,
			filename: 'countStore.ts',
			errors: [
				{
					messageId: 'noLazyDestructuring',
				},
			],
		},
		{
			// Invalid: using &[] in JavaScript module
			code: `
				import { track } from 'ripple';
				function useCounter() {
					const &[value] = track(42);
					const result = value * 2;
					return result;
				}
			`,
			filename: 'counter.js',
			errors: [
				{
					messageId: 'noLazyDestructuring',
				},
			],
		},
		{
			// Invalid: multiple &[] in TypeScript module
			code: `
				import { track } from 'ripple';
				export function useForm() {
					const &[firstName] = track('');
					const &[lastName] = track('');
					const fullName = firstName + ' ' + lastName;
					return { fullName };
				}
			`,
			filename: 'form.ts',
			errors: [
				{
					messageId: 'noLazyDestructuring',
				},
				{
					messageId: 'noLazyDestructuring',
				},
			],
		},
		{
			// Invalid: &[] lazy destructuring in TSX file
			code: `
				import { track, effect } from 'ripple';
				export function useData() {
					const &[data] = track(null);
					effect(() => {
						console.log(data);
					});
					return data;
				}
			`,
			filename: 'hooks.tsx',
			errors: [
				{
					messageId: 'noLazyDestructuring',
				},
			],
		},
	],
});
