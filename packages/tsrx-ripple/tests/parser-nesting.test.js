import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';

// Every element nesting Chromium's parser rewrites (see
// scripts/parser-rewritten-pairs.mjs): a template holding one must be a
// compile error or keep parsing, never be DOM-built as written.
const pairs = /** @type {string[]} */ (
	JSON.parse(
		readFileSync(new URL('./fixtures/parser-rewritten-pairs.json', import.meta.url), 'utf8'),
	)
);
const voids = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'source',
	'track',
	'wbr',
]);

describe('@tsrx/ripple never DOM-builds a nesting the parser rewrites', () => {
	it(`checks ${pairs.length} pairs`, () => {
		/** @type {string[]} */
		const built = [];
		let errors = 0;
		for (const pair of pairs) {
			const [outer, inner] = pair.split(' ');
			const child = voids.has(inner) ? `<${inner} />` : `<${inner}>x</${inner}>`;
			try {
				const { code, errors: found } = compile(
					`export function App() @{ <${outer}>${child}</${outer}> }`,
					'App.tsrx',
					{ mode: 'client' },
				);
				if (found.length > 0) errors++;
				else if (code.includes('_$_.template_el(')) built.push(pair);
			} catch {
				errors++;
			}
		}
		expect(built).toEqual([]);
		// Sanity: the validator rejects a good share of them outright.
		expect(errors).toBeGreaterThan(100);
	});
});
