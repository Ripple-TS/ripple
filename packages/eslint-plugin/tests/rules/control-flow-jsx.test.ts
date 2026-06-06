import { RuleTester } from 'eslint';
import rule from '../../src/rules/control-flow-jsx.js';
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

ruleTester.run('control-flow-jsx', rule, {
	valid: [
		// Valid: for...of with JSX in returned TSRX (outside effect)
		{
			code: `
				const App = () => @{
					const items = ['Item 1', 'Item 2'];
					@for (const item of items) {
						<div>{item}</div>
					}
				};
			`,
		},
		// Valid: for...of without JSX inside effect
		{
			code: `
				import { effect } from 'ripple';
				const App = () => @{
					const items = ['Item 1', 'Item 2'];
					effect(() => {
						let sum = 0;
						for (const item of items) {
							sum += item;
						}
					});
					<div />
				};
			`,
		},
		// Valid: nested JSX in for...of in returned TSRX
		{
			code: `
				const App = () => @{
					const items = [1, 2, 3];
					@for (const item of items) {
						<div>
							<span>{item}</span>
						</div>
					}
				};
			`,
		},
		// Valid: fragment output in @for
		{
			code: `
				const App = () => @{
					const items = [1, 2, 3];
					@for (const item of items) {
						<>
							{item}
						</>
					}
				};
			`,
		},
		// Valid: for...of without JSX inside effect with untrack
		{
			code: `
				import { RippleArray, track, effect, untrack } from 'ripple';
				const App = () => @{
					const items = new RippleArray(1, 2, 3);
					const &[sum] = track(0);
					effect(() => {
						sum = 0;
						for (const item of items) {
							untrack(() => {
								sum += item;
							});
						}
					});
					<div />
				};
			`,
		},
		// Valid: for...of outside returned TSRX (no checks applied)
		{
			code: `
				function notAComponent() {
					const items = [1, 2, 3];
					for (const item of items) {
						console.log(item);
					}
				}
			`,
		},
	],
	invalid: [
		// Invalid: for...of without JSX in returned TSRX
		{
			code: `
				const App = () => @{
					const items = ['Item 1', 'Item 2'];
					@for (const item of items) {
					}
				};
			`,
			errors: [
				{
					messageId: 'requireJsxInLoop',
				},
			],
		},
		// Invalid: for...of with JSX inside effect
		{
			code: `
				import { effect } from 'ripple';
				const App = () => @{
					const items = ['Item 1', 'Item 2'];
					effect(() => {
						for (const item of items) {
							<div>{item}</div>
						}
					});
					<div />
				};
			`,
			errors: [
				{
					messageId: 'noJsxInEffectLoop',
				},
			],
		},
		// Invalid: for...of with JSX deeply nested in effect
		{
			code: `
				import { effect } from 'ripple';
				const App = () => @{
					const items = [1, 2, 3];
					effect(() => {
						for (const item of items) {
							if (item > 1) {
								<span>{item}</span>
							}
						}
					});
					<div />
				};
			`,
			errors: [
				{
					messageId: 'noJsxInEffectLoop',
				},
			],
		},
		// Invalid: for...of without JSX in returned TSRX (even with other statements)
		{
			code: `
				const App = () => @{
					const items = [1, 2, 3];
					@for (const item of items) {
					}
				};
			`,
			errors: [
				{
					messageId: 'requireJsxInLoop',
				},
			],
		},
	],
});
