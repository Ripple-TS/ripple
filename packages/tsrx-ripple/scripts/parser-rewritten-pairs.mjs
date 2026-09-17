// Writes `tests/fixtures/parser-rewritten-pairs.json`: every pair of HTML
// elements whose nesting `<outer><inner>x</inner></outer>` the HTML parser
// of Chromium, WebKit or Firefox does not create as written when parsed as
// template content (an ignored table part, a closed paragraph, a
// foster-parented text, Firefox's raw-text `noscript`). The compiler must
// parse, not DOM-build, each of these (`tests/parser-nesting.test.js`).
// Needs the three browsers of the benchmarks' Playwright
// (`pnpm --filter octane-benchmarks exec playwright install`); run from the
// repository root:
//   node packages/tsrx-ripple/scripts/parser-rewritten-pairs.mjs
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { HTML_TAGS } from '../src/dom-setters.js';

const require = createRequire(new URL('../../../benchmarks/package.json', import.meta.url));
const playwright = require('playwright');
const out = new URL('../tests/fixtures/parser-rewritten-pairs.json', import.meta.url);

const tags = [
	...new Set([
		...HTML_TAGS,
		'center',
		'dir',
		'listing',
		'xmp',
		'nobr',
		'plaintext',
		'image',
		'search',
	]),
]
	.filter((tag) => !['html', 'head', 'body', 'frameset', 'frame'].includes(tag))
	.sort();
/** @type {Set<string>} */
const rewritten = new Set();
for (const engine of ['chromium', 'webkit', 'firefox']) {
	const browser = await playwright[engine].launch({ headless: true });
	const page = await browser.newPage();
	await page.setContent('<!doctype html>');
	const pairs = await page.evaluate((tags) => {
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
		const rewritten = [];
		for (const outer of tags) {
			if (voids.has(outer)) continue;
			for (const inner of tags) {
				const child = voids.has(inner) ? `<${inner}>` : `<${inner}>x</${inner}>`;
				const template = document.createElement('template');
				template.innerHTML = `<${outer}>${child}</${outer}>`;
				const root = template.content.firstChild;
				const leaf = root?.firstChild;
				const as_written =
					template.content.childNodes.length === 1 &&
					root.localName === outer &&
					root.childNodes.length === 1 &&
					leaf.localName === inner &&
					(voids.has(inner)
						? leaf.childNodes.length === 0
						: leaf.childNodes.length === 1 && leaf.textContent === 'x');
				if (!as_written) rewritten.push(`${outer} ${inner}`);
			}
		}
		return rewritten;
	}, tags);
	await browser.close();
	console.log(`${engine}: ${pairs.length} rewritten pairs of ${tags.length} tags`);
	for (const pair of pairs) rewritten.add(pair);
}
writeFileSync(out, JSON.stringify([...rewritten].sort(), null, '\t') + '\n');
console.log(`${rewritten.size} rewritten pairs in all`);
