import { describe, expect, it } from 'vitest';
import { createJsxTransform, createVolarMappingsResult, parseModule } from '../../src/index.js';

/**
 * A ReturnStatement contributes a mapping for its `return` KEYWORD only — a
 * whole-statement mapping would be too broad and shadow every finer mapping
 * inside it.
 *
 * That clamp assumes the author wrote the keyword at the statement's start.
 * Template arms break the assumption: the transform SYNTHESIZES their returns
 * and gives them the arm's authored range, whose text is the arm's own syntax.
 * Clamping both sides to `'return'.length` then pairs six arbitrary source
 * characters with six arbitrary generated ones — for `@default: { … }` it
 * reported `@defau` → `defaul`, which outranked every real mapping in a
 * narrowest-match lookup and made hovering the clause resolve to nonsense.
 */

const PLATFORM = {
	name: 'return-mapping-test',
	imports: {
		fragment: 'test-platform',
		suspense: 'test-platform',
		dynamic: 'test-platform/dynamic',
		errorBoundary: 'test-platform/error-boundary',
	},
	jsx: { rewriteClassAttr: false, classAttrName: 'class' },
	validation: { requireUseServerForAwait: false },
};

function volarMappings(source) {
	const errors = [];
	const comments = [];
	const ast = parseModule(source, 'App.tsrx', {
		collect: true,
		loose: true,
		preserveParens: true,
		keywordTokens: true,
		errors,
		comments,
	});
	const transformed = createJsxTransform(PLATFORM)(ast, source, 'App.tsrx', {
		collect: true,
		loose: true,
		typeOnly: true,
		errors,
		comments,
	});
	const result = createVolarMappingsResult({
		ast: transformed.ast,
		ast_from_source: ast,
		source,
		generated_code: transformed.code,
		source_map: transformed.map,
		errors,
	});
	return { code: transformed.code, mappings: result.mappings };
}

/** Every authored span a mapping claims at `offset`. */
function claimsAt(source, mappings, offset) {
	const claims = [];
	for (const mapping of mappings) {
		for (let i = 0; i < mapping.sourceOffsets.length; i++) {
			if (mapping.sourceOffsets[i] !== offset) continue;
			const length = mapping.lengths[Math.min(i, mapping.lengths.length - 1)];
			claims.push(source.slice(offset, offset + length));
		}
	}
	return claims;
}

describe('return-keyword mappings', () => {
	it('claims nothing for a synthesized return in a template arm', () => {
		const source = `export default function App() @{
	const n = 1;
	<div>
		@switch (n) {
			@case 1: { <s>one</s> }
			@default: { <u>o</u> }
		}
	</div>
}
`;
		const { mappings } = volarMappings(source);
		for (const keyword of ['@case', '@default']) {
			const offset = source.indexOf(keyword);
			expect(offset, `${keyword} missing from the fixture`).toBeGreaterThanOrEqual(0);
			// Pre-fix this reported `@case ` / `@defau` — a six-character window of
			// source that is not a token and does not contain `return`.
			expect(claimsAt(source, mappings, offset), keyword).toEqual([]);
		}
	});

	it('still maps a return the author actually wrote', () => {
		const source = `export function total(a: number) {\n\treturn a + 1;\n}\n`;
		const { mappings } = volarMappings(source);
		const offset = source.indexOf('return');
		expect(claimsAt(source, mappings, offset)).toContain('return');
	});

	it('never claims a span that does not spell `return`', () => {
		const source = `export default function App() @{
	const items: string[] = [];
	<ul>
		@for (const i of items; key i) { <li>{i}</li> } @empty { <li>x</li> }
	</ul>
}
`;
		const { mappings } = volarMappings(source);
		// Whatever the transform synthesizes, no mapping may be clamped to the
		// keyword's length at a position the keyword is not written.
		for (const mapping of mappings) {
			for (let i = 0; i < mapping.sourceOffsets.length; i++) {
				const start = mapping.sourceOffsets[i];
				const length = mapping.lengths[Math.min(i, mapping.lengths.length - 1)];
				if (length !== 'return'.length) continue;
				const claimed = source.slice(start, start + length);
				if (claimed === 'return') continue;
				// A six-character claim that is not `return` is only legitimate when
				// it came from a real six-character token, never from this clamp.
				expect(claimed).not.toMatch(/^@/);
			}
		}
	});
});
