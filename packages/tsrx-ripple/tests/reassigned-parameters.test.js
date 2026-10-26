import { acorn } from '@tsrx/core';
import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

describe('@tsrx/ripple reassigned function parameters', () => {
	const parameters = [
		'label',
		'label: string',
		'label?: string',
		'label = ""',
		'label: string = ""',
		'{ label = "" }: { label?: string }',
		'[label = ""]: string[]',
	];

	const functions = [
		['declaration', (params, body) => `export function render(${params}) { ${body} }`],
		['expression', (params, body) => `export const render = function(${params}) { ${body} };`],
		['arrow', (params, body) => `export const render = (${params}) => { ${body} };`],
	];

	for (const options of [
		{ mode: 'client', hydration: false },
		{ mode: 'client', hydration: true },
		{ mode: 'server' },
	]) {
		for (const [kind, source] of functions) {
			it.each(parameters)(
				`preserves %s in a function ${kind} (${JSON.stringify(options)})`,
				(params) => {
					const { code, errors } = compile(
						source(params, 'if (!label) label = "untitled"; return <p>{label}</p>;'),
						'Panel.tsrx',
						options,
					);

					expect(errors).toEqual([]);
					expect(() =>
						acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' }),
					).not.toThrow();
				},
			);
		}
	}
});
