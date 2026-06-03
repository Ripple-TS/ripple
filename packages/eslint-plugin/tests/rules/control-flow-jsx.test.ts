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
		// Valid: @for with JSX in returned TSRX (outside effect)
		{
			code: `
				function App() {
					return <>
					const items = ['Item 1', 'Item 2'];

					@for (const item of items) {
						<div>{item}</div>
					}
					</>;
				}
			`,
		},
		// Valid: for...of without JSX inside effect
		{
			code: `
				import { effect } from 'ripple';
				function App() {
					return <>
					const items = ['Item 1', 'Item 2'];
					effect(() => {
						let sum = 0;
						for (const item of items) {
							sum += item;
						}
					});
					</>;
				}
			`,
		},
		// Valid: nested JSX in @for in returned TSRX
		{
			code: `
				function App() {
					return <>
					const items = [1, 2, 3];
					@for (const item of items) {
						<div>
							<span>{item}</span>
						</div>
					}
					</>;
				}
			`,
		},
		// Valid: for...of without JSX inside effect with untrack
		{
			code: `
				import { RippleArray, track, effect, untrack } from 'ripple';
				function App() {
					return <>
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
					</>;
				}
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
		// Valid: ordinary setup for...of without JSX inside returned TSRX
		{
			code: `
				function App() {
					return <>
					const items = ['Item 1', 'Item 2'];
					const labels: string[] = [];
					for (const item of items) {
						labels.push(item.toUpperCase());
					}
					<ul>{labels.join(', ')}</ul>
					</>;
				}
			`,
		},
		// Valid: plain setup for...of can delegate rendering to nested TSRX directives
		{
			code: `
				function Icon({ paths }) {
					return <svg>
					for (const path of paths) {
						@switch (path.type) {
							case 'circle':
								<circle cx={path.x} cy={path.y} r={path.r} />
								break;
							case 'line':
								<line x1={path.x1} y1={path.y1} x2={path.x2} y2={path.y2} />
								break;
						}
					}
					</svg>;
				}
			`,
		},
		{
			code: `
				function App({ items }) {
					return <>
					for (const item of items) {
						@if (item.visible) {
							<div>{item.label}</div>
						}
					}
					</>;
				}
			`,
		},
		{
			code: `
				function App({ items }) {
					return <>
					for (const item of items) {
						@try {
							<Row {item} />
						} catch (error) {
							<Fallback {error} />
						}
					}
					</>;
				}
			`,
		},
	],
	invalid: [
		// Invalid: @for without JSX in returned TSRX
		{
			code: `
				function App() {
					return <>
					const items = ['Item 1', 'Item 2'];
					@for (const item of items) {
						console.log(item);
					}
					</>;
				}
			`,
			errors: [
				{
					messageId: 'requireJsxInLoop',
				},
			],
		},
		// Invalid: plain for...of with JSX in returned TSRX
		{
			code: `
				function App() {
					return <>
					const items = ['Item 1', 'Item 2'];
					for (const item of items) {
						<div>{item}</div>
					}
					</>;
				}
			`,
			errors: [
				{
					messageId: 'requireDirectiveForRenderingLoop',
				},
			],
		},
		// Invalid: for...of with JSX inside effect
		{
			code: `
				import { effect } from 'ripple';
				function App() {
					return <>
					const items = ['Item 1', 'Item 2'];
					effect(() => {
						for (const item of items) {
							<div>{item}</div>
						}
					});
					</>;
				}
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
				function App() {
					return <>
					const items = [1, 2, 3];
					effect(() => {
						for (const item of items) {
							if (item > 1) {
								<span>{item}</span>
							}
						}
					});
					</>;
				}
			`,
			errors: [
				{
					messageId: 'noJsxInEffectLoop',
				},
			],
		},
		// Invalid: @for without JSX in returned TSRX (even with other statements)
		{
			code: `
				function App() {
					return <>
					const items = [1, 2, 3];
					@for (const item of items) {
						const double = item * 2;
						console.log(double);
					}
					</>;
				}
			`,
			errors: [
				{
					messageId: 'requireJsxInLoop',
				},
			],
		},
	],
});
