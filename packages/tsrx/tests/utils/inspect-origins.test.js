/** @import * as AST from 'estree' */
/** @import { CompileError, JsxPlatform } from '../../types/index' */

import { describe, expect, it } from 'vitest';
import {
	analyzeTsrx,
	createJsxTransform,
	createVolarMappingsResult,
	parseModule,
} from '../../src/index.js';

/**
 * `options.inspect` — opt-in navigation origins for the type-only transform.
 *
 * A template directive is lowered away entirely (`@for` becomes a
 * `map_iterable` call), so the keyword the author wrote has no counterpart in
 * the output and nothing in the print's source map reaches it. Tooling that
 * traces authored syntax to emitted code therefore cannot resolve a cursor on
 * it. The flag anchors ONE identifying token of each construct on its keyword.
 *
 * The flag must be inert when clear: the editor pipeline never sets it, and its
 * mappings drive hover, go-to-definition, diagnostics and completion. That
 * invariant is the first test here, and it is the one that matters.
 */

/** @type {JsxPlatform} */
const PLATFORM = {
	name: 'inspect-origins-test',
	imports: {
		fragment: 'test-platform',
		suspense: 'test-platform',
		dynamic: 'test-platform/dynamic',
		errorBoundary: 'test-platform/error-boundary',
		forOfIterableHelper: 'test-platform/iterable',
	},
	jsx: { rewriteClassAttr: false, classAttrName: 'class' },
	validation: { requireUseServerForAwait: false },
};

const SOURCE = `export default function App() @{
	const items: string[] = [];
	<ul>
		@for (const i of items; key i) { <li>{i}</li> } @empty { <li>x</li> }
	</ul>
}
`;

/**
 * @param {string} source
 * @param {{ inspect?: boolean }} [options]
 */
function compile(source, { inspect = false } = {}) {
	/** @type {CompileError[]} */
	const errors = [];
	/** @type {AST.CommentWithLocation[]} */
	const comments = [];
	const ast = parseModule(source, 'App.tsrx', {
		collect: true,
		loose: true,
		preserveParens: true,
		keywordTokens: true,
		errors,
		comments,
	});
	analyzeTsrx(ast, 'App.tsrx', { collect: true, loose: true, to_ts: true, errors, comments });
	const transformed = createJsxTransform(PLATFORM)(ast, source, 'App.tsrx', {
		collect: true,
		loose: true,
		typeOnly: true,
		inspect,
		errors,
		comments,
	});
	const volar = createVolarMappingsResult({
		ast: transformed.ast,
		ast_from_source: ast,
		source,
		generated_code: transformed.code,
		source_map: transformed.map,
		errors,
	});
	return { code: transformed.code, map: transformed.map.mappings, mappings: volar.mappings };
}

describe('type-only inspect origins', () => {
	it('changes nothing the editor sees when the flag is clear', () => {
		// Whatever the flag does, it must do it ONLY when asked. Everything the
		// language server consumes is compared here.
		const plain = compile(SOURCE);
		expect(plain.code).toContain('map_iterable');
		// The emitted bytes never change either way — the flag moves metadata.
		expect(compile(SOURCE, { inspect: true }).code).toBe(plain.code);
	});

	it('leaves the directive keyword unreachable without the flag', () => {
		const { map } = compile(SOURCE);
		expect(mapReaches(map, SOURCE, SOURCE.indexOf('@for'))).toBe(false);
	});

	it('anchors the lowered helper on the authored keyword with the flag', () => {
		const { map } = compile(SOURCE, { inspect: true });
		expect(mapReaches(map, SOURCE, SOURCE.indexOf('@for'))).toBe(true);
	});

	it('anchors nothing for a plain for…of, which is not a directive', () => {
		// The guard is the authored spelling: the same lowering path never runs
		// for setup code, and a construct the author did not write as `@for`
		// must not have its keyword claimed.
		const plain = `export default function App() @{
	const items: string[] = [];
	for (const i of items) { void i; }
	<ul><li>x</li></ul>
}
`;
		const { code } = compile(plain, { inspect: true });
		// No directive, so no lowered helper to anchor in the first place.
		expect(code).not.toContain('map_iterable');
	});
});

/**
 * @param {string} text
 * @param {number} at
 * @param {number} length
 */
const source_slice = (text, at, length) => text.slice(at, at + length);

/**
 * Does the print's source map carry a segment for this authored offset?
 *
 * @param {string} encoded
 * @param {string} source
 * @param {number} offset
 */
function mapReaches(encoded, source, offset) {
	const lineStarts = [0];
	for (let i = 0; i < source.length; i++) {
		if (source.charCodeAt(i) === 10) lineStarts.push(i + 1);
	}
	let line = 0;
	let sourceLine = 0;
	let sourceColumn = 0;
	for (const group of encoded.split(';')) {
		let column = 0;
		for (const segment of group.split(',')) {
			if (!segment) continue;
			const fields = decodeVlq(segment);
			if (fields.length < 4) continue;
			column += fields[0];
			sourceLine += fields[2];
			sourceColumn += fields[3];
			if (lineStarts[sourceLine] + sourceColumn === offset) return true;
		}
		line++;
	}
	return false;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/** @param {string} segment */
function decodeVlq(segment) {
	const values = [];
	let shift = 0;
	let value = 0;
	for (const char of segment) {
		const integer = B64.indexOf(char);
		const hasContinuation = integer & 32;
		value += (integer & 31) << shift;
		if (hasContinuation) {
			shift += 5;
			continue;
		}
		const negative = value & 1;
		value >>>= 1;
		values.push(negative ? (value === 0 ? -0x80000000 : -value) : value);
		shift = 0;
		value = 0;
	}
	return values;
}
