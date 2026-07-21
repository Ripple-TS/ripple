import {
	runSharedClassFunctionComponentTests,
	runSharedComponentParamsTests,
} from '@tsrx/core/test-harness/compile';
import { compile, compile_to_volar_mappings } from '../src/index.js';
import { describe, expect, it } from 'vitest';
import { find_exact_mapping } from '../../tsrx/src/source-map-utils.js';

runSharedClassFunctionComponentTests({
	compile,
	compile_to_volar_mappings,
	name: 'ripple',
});

runSharedComponentParamsTests({
	compile,
	compile_to_volar_mappings,
	name: 'ripple',
});

describe('@tsrx/ripple faithful text output', () => {
	it("keeps a single `@` text child as `<>@</>` instead of `{'@'}` in type-only output", () => {
		const { code, errors } = compile_to_volar_mappings(
			`export function App() @{
				<>@</>
			}`,
			'App.tsrx',
			{ loose: true },
		);

		expect(errors).toEqual([]);
		expect(code).toContain('<>@</>');
		expect(code).not.toContain("{'@'}");
	});

	it('does not promote ordinary single-text output into a string literal', () => {
		const { code, errors } = compile_to_volar_mappings(
			`export function App() @{
				<>Hello</>
			}`,
			'App.tsrx',
			{ loose: true },
		);

		expect(errors).toEqual([]);
		expect(code).toContain('<>Hello</>');
		expect(code).not.toContain("{'Hello'}");
	});

	it('lowers a single `@` text child to a faithful runtime text node', () => {
		const { code } = compile(
			`export function App() @{
				<>@</>
			}`,
			'App.tsrx',
			{ loose: true },
		);

		expect(code).toContain('_$_.text("@")');
	});

	it('renders nothing for a whitespace-only runtime output', () => {
		const { code } = compile(
			`export function App() {
				<>
				</>
			}`,
			'App.tsrx',
			{ loose: true },
		);

		// A nullish/whitespace-only output should emit no text node at all.
		expect(code).not.toContain('_$_.text');
	});

	it('emits a well-formed completion mapping for a `@` in a fragment (to_ts keeps text verbatim)', () => {
		// A `@` typed on its own line in a fragment (an in-progress `@if`/`@for`/…) is
		// recovered as text and compiles fine, so no compile-error fallback covers it. The
		// editor still needs a completion mapping there — and because Ripple keeps text
		// verbatim in to_ts (it does NOT trim as it does at runtime), the node's value and
		// location match, so the mapping has equal source/generated lengths and the completion
		// textEdit round-trips. The trimmed value + wide location combo used to produce a
		// mismatched mapping and VS Code silently dropped every item. Mirrors the reported
		// `@{ <> @ <Item/> </> }`.
		const source = 'function Comp(props) @{\n\t<>\n\t@\n\t\t<div>{"x"}</div>\n\t</>\n}';
		const { mappings } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const cursor = source.indexOf('@', source.indexOf('<>')) + 1;

		const covering = mappings.filter(
			(m) =>
				m.data?.completion &&
				cursor >= m.sourceOffsets[0] &&
				cursor <= m.sourceOffsets[0] + m.lengths[0],
		);

		expect(covering.length).toBeGreaterThan(0);
		for (const m of covering) {
			expect(m.lengths[0]).toBe(m.generatedLengths[0]);
			expect(m.data?.verification).toBeFalsy();
		}
	});
});

describe('@tsrx/ripple @switch to_ts', () => {
	// Split the generated `switch (...) { … }` into per-case bodies (text between labels).
	const case_bodies = (code) =>
		code
			.slice(code.indexOf('switch'))
			.split(/\n\s*(?:case [^:]+:|default:)/)
			.slice(1)
			.map((segment) => segment.trim());

	it('emits a terminating return in every @switch case (avoids TS 7029 fallthrough)', () => {
		// `@case` always renders and cannot `break`/fall through, so each generated case must
		// definitely return in the type-only view — even when the render is conditional (an
		// `@if` with no else) or the case is empty. Otherwise TS reports "Fallthrough case in
		// switch (7029)".
		const { code } = compile_to_volar_mappings(
			`export function App({ value }) @{
				@switch (value) {
					@case 1: {
						@if (value) {
							<div>{'a'}</div>
						}
					}
					@case 2: {
					}
					@default: {
						<div>{'d'}</div>
					}
				}
			}`,
			'App.tsrx',
			{ loose: true },
		);

		const bodies = case_bodies(code);
		expect(bodies).toHaveLength(3);
		// Conditional case must end with a fallback return, not a bare `if` (the bug left it
		// falling through to the next case).
		expect(bodies[0]).toMatch(/return\s[^;]*;$/);
		// Empty case must still return (not fall through).
		expect(bodies[1]).toMatch(/^return\s/);
	});

	it('does not add an unreachable return when a case already returns on every path', () => {
		// A single render output, or an exhaustive `@if`/`@else`, already returns — no synthetic
		// return should be appended (it would be unreachable code).
		const { code } = compile_to_volar_mappings(
			`export function App({ value }) @{
				@switch (value) {
					@case 1: {
						@if (value) {
							<div>{'a'}</div>
						} @else {
							<div>{'b'}</div>
						}
					}
					@default: {
						<div>{'d'}</div>
					}
				}
			}`,
			'App.tsrx',
			{ loose: true },
		);

		const bodies = case_bodies(code);
		// The exhaustive if/else case ends with the `if/else` block, not an extra trailing
		// return.
		expect(bodies[0]).toMatch(/}$/);
		expect(bodies[0]).not.toMatch(/}\s*return\s/);
	});

	it('gives every @switch case a return when interleaved with sibling children', () => {
		// A `@switch` alongside other children in a fragment is lowered to its render value, so
		// every case returns (with a trailing `return null`) — none may fall through. Mirrors
		// the reported `<> @switch … @if … <Item/> </>`, where the switch cases (including empty
		// ones) had no returns and TS reported a fallthrough.
		const { code } = compile_to_volar_mappings(
			`function Comp(props) @{
				<>
					@switch (value) {
						@case 'case1': {
							<></>
						}
						@case 'case2': {
						}
						@default: {
						}
					}
					<Item></Item>
				</>
			}`,
			'App.tsrx',
			{ loose: true },
		);

		const bodies = case_bodies(code);
		expect(bodies.length).toBeGreaterThanOrEqual(3);
		// Every case — including the empty `case2`/`default` — must return, not fall through.
		for (const body of bodies) {
			expect(body).toMatch(/^return\b/);
		}
	});
});

describe('@tsrx/ripple style scope hashes', () => {
	const source = `export function Card() @{
	<>
		<style>
			.card { padding: 1.5rem; }
		</style>
		<div class="card">{'one'}</div>
	</>
}

export function Other() @{
	<>
		<style>
			.card { padding: 1.5rem; }
		</style>
		<div class="card">{'two'}</div>
	</>
}`;

	it('produces distinct hashes for identical style blocks in the same file', () => {
		const { cssHash } = compile(source, 'Card.tsrx');
		const hashes = cssHash.split(' ');
		expect(hashes).toHaveLength(2);
		expect(hashes[0]).not.toBe(hashes[1]);
	});

	it('produces distinct hashes for identical style blocks across files', () => {
		const { cssHash: a } = compile(source, 'a/Card.tsrx');
		const { cssHash: b } = compile(source, 'b/Card.tsrx');
		expect(a).not.toBe(b);
	});
});

describe('@tsrx/ripple dynamic tag syntax', () => {
	const source = `function App() @{
	const Tag = 'section';
	<{Tag} class="host">{'hello'}</{Tag}>
}`;

	it('renders dynamic tags directly through composite on the client', () => {
		const { code } = compile(source, 'App.tsrx');
		expect(code).not.toContain(`import { Dynamic as TsrxDynamic } from 'ripple';`);
		expect(code).toContain('_$_.composite(() => Tag, ');
		expect(code).toContain(`class: "host"`);
	});

	it('lowers dynamic tags through the internal dynamic_element helper on the server', () => {
		const { code } = compile(source, 'App.tsrx', { mode: 'server' });
		expect(code).toContain('const comp = _$_.dynamic_element;');
		expect(code).toContain('is: Tag');
		expect(code).not.toContain('TsrxDynamic');
		// The helper is statically known — no `if (comp)` guard.
		expect(code).not.toContain('if (comp)');
	});

	it('keeps scoped type selectors and applies scope hashes for dynamic tags', () => {
		const { code, css, cssHash } = compile(
			`function App() @{
				const Tag = 'section';
				<>
					<{Tag} class="host">{'hello'}</{Tag}>
					<style>
						div { color: red; }
						.host { color: blue; }
						.unused { color: green; }
					</style>
				</>
			}`,
			'App.tsrx',
		);

		// The tag resolves at runtime, so it could be any element: type
		// selectors must survive pruning, matching classes get the hash, and
		// genuinely unused classes are still pruned.
		expect(css).toContain(`div.${cssHash} { color: red; }`);
		expect(css).toContain(`.host.${cssHash} { color: blue; }`);
		expect(css).toContain('/* (unused) .unused { color: green; }*/');
		expect(code).toContain(`class: '${cssHash} host'`);
	});

	it('emits valid to_ts output for dynamic tags', () => {
		const { code } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		expect(code).toContain(`import { Dynamic as TsrxDynamic } from 'ripple';`);
		expect(code).toContain(`<TsrxDynamic is={Tag} class="host"`);
		expect(code).toContain(`children={() =>`);
		expect(code).toContain(`'hello';`);
	});

	it('does not map generated Dynamic tag names over dynamic tag props', () => {
		const source = `function App() @{
	const tag = 'div';
	const className = 'test-class';
	<{tag} class={className} id="test" data-testid="dynamic-element">{'Content'}</{tag}>
}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const generated_tag_offset = result.code.indexOf('<TsrxDynamic') + 1;
		const generated_is_value_offset = result.code.indexOf('tag', result.code.indexOf('is={'));
		const generated_class_offset = result.code.indexOf('class=', generated_tag_offset);
		const source_class_offset = source.indexOf('class=');
		const source_closing_tag_offset = source.indexOf('tag}', source.indexOf('</{'));

		const generated_tag_mapping = result.mappings.find((mapping) => {
			const generated_offset = mapping.generatedOffsets[0];
			const generated_length = mapping.generatedLengths?.[0] ?? mapping.lengths[0];
			return (
				generated_offset <= generated_tag_offset &&
				generated_tag_offset < generated_offset + generated_length
			);
		});
		const class_mapping = find_exact_mapping(
			result.mappings,
			source_class_offset,
			generated_class_offset,
			'class'.length,
		);
		const closing_tag_mapping = find_exact_mapping(
			result.mappings,
			source_closing_tag_offset,
			generated_is_value_offset,
			'tag'.length,
		);

		expect(generated_tag_mapping).toBeUndefined();
		expect(class_mapping).toBeDefined();
		expect(closing_tag_mapping).toBeDefined();
	});
});

describe('@tsrx/ripple Volar mappings cover declaration keywords', () => {
	/**
	 * @param {string} source
	 */
	const expect_class_keyword_mapping = (source) => {
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const source_class_offset = source.indexOf('class');
		const generated_class_offset = result.code.indexOf('class');
		const mapping = find_exact_mapping(
			result.mappings,
			source_class_offset,
			generated_class_offset,
			'class'.length,
		);

		expect(mapping?.data.structure).toBe(true);
	};

	it('maps named class keywords', () => {
		expect_class_keyword_mapping(`class Store {
	value = 1;
}`);
	});

	it('maps anonymous default class keywords', () => {
		expect_class_keyword_mapping(`export default class {
	value = 1;
}`);
	});
});

describe('@tsrx/ripple Volar mappings cover arrow functions', () => {
	it('adds a verification-only mapping for the whole arrow function', () => {
		const source = `function C() { const f = (x: number): number => x + 1; return <></>; }`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const source_arrow = '(x: number): number => x + 1';
		const source_offset = source.indexOf(source_arrow);
		const generated_offset = result.code.indexOf(source_arrow);
		const mapping = find_exact_mapping(
			result.mappings,
			source_offset,
			generated_offset,
			source_arrow.length,
		);

		expect(mapping?.data.verification).toBe(true);
		expect(mapping?.data.completion).toBeUndefined();
		expect(mapping?.data.semantic).toBeUndefined();
		expect(mapping?.data.navigation).toBeUndefined();
	});
});

describe('@tsrx/ripple lowers `@{ … }` code blocks in expression position', () => {
	const variants = {
		'assigned to a variable': `function App() {
	const view = @{
		const label = 'hi';
		<p>{label}</p>
	};
	return view;
}`,
		returned: `function make() {
	return @{ <p>{'hi'}</p> };
}`,
	};

	for (const [position, source] of Object.entries(variants)) {
		for (const mode of /** @type {const} */ (['client', 'server'])) {
			it(`compiles a code block ${position} to a tsrx_element (${mode})`, () => {
				const { code } = compile(source, 'App.tsrx', { mode });
				expect(code).toContain('_$_.tsrx_element');
				expect(code).toContain(`ripple/internal/${mode}`);
				expect(code).not.toContain('JSXCodeBlock');
			});
		}

		it(`emits valid to_ts for a code block ${position}`, () => {
			const { code } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			// The block lowers to an immediately-invoked arrow so the TSX printer
			// emits valid TS for type/editor support, rather than leaking a raw
			// `JSXCodeBlock` that prints as a malformed `= { … }`.
			expect(code).toContain('(() => {');
			expect(code).toContain('return <p>');
			expect(code).not.toContain('JSXCodeBlock');
			expect(code).not.toMatch(/=\s*\{\s*\n\s*const/);
		});
	}

	const code_only = `const Test = @{
	const y = 1;
};`;

	for (const mode of /** @type {const} */ (['client', 'server'])) {
		it(`compiles a code-only block in value position to a tsrx_element (${mode})`, () => {
			const { code, errors } = compile(code_only, 'App.tsrx', { mode });
			expect(errors).toEqual([]);
			// A render-less block in value position must not print as a bare
			// `= { … }` block (a malformed object literal); it lowers to the same
			// tsrx_element shape as a render-bearing block, just with no output.
			expect(code).toContain('_$_.tsrx_element');
			expect(code).toContain('const y = 1;');
			expect(code).not.toMatch(/=\s*\{\s*\n\s*const/);
		});
	}

	it('emits valid to_ts for a code-only block in value position', () => {
		const { code } = compile_to_volar_mappings(code_only, 'App.tsrx', { loose: true });
		expect(code).toContain('(() => {');
		expect(code).toContain('const y = 1;');
		expect(code).not.toContain('JSXCodeBlock');
		expect(code).not.toMatch(/=\s*\{\s*\n\s*const/);
	});

	it('keeps setup and variable identifiers navigable in to_ts output', () => {
		const source = `function App() {
	const view = @{
		const label = 'hi';
		<p>{label}</p>
	};
	return view;
}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		for (const token of ['label', 'view']) {
			const source_offset = source.indexOf(token);
			const generated_offset = result.code.indexOf(token);
			const mapping = find_exact_mapping(
				result.mappings,
				source_offset,
				generated_offset,
				token.length,
			);
			expect(mapping?.data.navigation).toBe(true);
		}
	});
});

describe('@tsrx/ripple lowers control flow combined into an expression', () => {
	// A `@if`/`@for`/`@switch`/`@try` directive (or `@{ … }` block) combined into an
	// operator expression is wrapped so it becomes a valid value: a `tsrx_element`
	// render on the client/server, a `<> … </>` in to_ts. It must NOT leak as a bare
	// `if (…) { … }` statement into expression position.
	const operand = `function App({ something }: { something: boolean }) @{
		const ad = (@if (something) { <div>Hello</div> }) || 'something else';
		<div>{ad}</div>
	}`;

	for (const mode of /** @type {const} */ (['client', 'server'])) {
		it(`wraps the directive in a tsrx_element render (${mode})`, () => {
			const { code, errors } = compile(operand, 'App.tsrx', { collect: true, mode });
			expect(errors).toEqual([]);
			// `const ad = _$_.tsrx_element(…) || 'something else'` — the directive lives
			// inside the render callback, not as a bare `if` in expression position.
			expect(code).toMatch(/const ad = _\$_\.tsrx_element\(/);
			expect(code).not.toMatch(/const ad = if\b/);
		});
	}

	it('wraps the directive in a fragment in to_ts output', () => {
		const { code, errors } = compile_to_volar_mappings(operand, 'App.tsrx', { loose: true });
		expect(errors).toEqual([]);
		// The directive value is wrapped in a `<> … </>` (a truthy fragment) as the `||`
		// operand, matching React and the client/server runtime — NOT lowered to a bare
		// `(something ? … : null) || …`, which would imply the fallback can fire when at
		// runtime the render handle is always truthy. The type view must agree.
		expect(code).toContain(
			"const ad = <>{something ? <div>Hello</div> : null}</> || 'something else';",
		);
		expect(code).not.toMatch(/const ad = \(/);
		expect(code).not.toMatch(/const ad = if\b/);
	});

	it('lowers a value-position @else if chain to a ternary chain in to_ts output', () => {
		const source = `function App({ x }: { x: number }) {
	const v = @if (x > 1) { <div>a</div> } @else if (x > 0) { <div>b</div> } @else { <div>c</div> }
	return <div>{v}</div>;
}`;
		// Each `@else if` link recurses into build_tsrx_ts_directive_value as a plain
		// IfStatement — it must lower like the rooting `@if` (the ternary's next arm),
		// not fall through to the `@try` lowering (which used to crash on the missing
		// `block`).
		const { code, errors } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		expect(errors).toEqual([]);
		expect(code).toContain('x > 1 ? <div>a</div> : x > 0 ? <div>b</div> : <div>c</div>');
	});

	it('wraps a @{ … } code block operand and a ternary branch', () => {
		const code_block = `function App() @{
			const ad = (@{ const x = 1; <span>{x}</span> }) || 'd';
			<div>{ad}</div>
		}`;
		const ternary = `function App({ o }: { o: boolean }) @{
			const ad = o ? @if (o) { <p>a</p> } @else { <p>b</p> } : <span>c</span>;
			<div>{ad}</div>
		}`;
		for (const source of [code_block, ternary]) {
			const { code, errors } = compile(source, 'App.tsrx', { collect: true });
			expect(errors, source).toEqual([]);
			expect(code, source).toContain('_$_.tsrx_element');
			expect(code, source).not.toMatch(/=\s*if\b/);
		}
	});

	// A directive leaks in EVERY value position, not just operands — the wrap is
	// keyed off the render-child/statement slots (allow-list), so it covers a
	// concise arrow body (idiomatic in `.map()`), a member object, a `return`
	// argument inside a nested function, etc., across all three modes.
	const valuePositions = {
		'concise arrow body (.map)': `function App({ xs }: { xs: number[] }) @{ <div>{xs.map((x) => @if (x) { <span>{x}</span> })}</div> }`,
		'member object': `function App({ c }: { c: boolean }) @{ const v = (@if (c) { <span>a</span> }).foo; <div>{v}</div> }`,
		'nested function return': `function App({ c }: { c: boolean }) @{ function inner() { return @if (c) { <span>a</span> }; } <div>{inner()}</div> }`,
	};
	for (const [kind, source] of Object.entries(valuePositions)) {
		for (const [mode, fn, opts] of /** @type {const} */ ([
			['client', compile, { collect: true }],
			['server', compile, { collect: true, mode: 'server' }],
			['to_ts', compile_to_volar_mappings, { loose: true }],
		])) {
			it(`wraps a directive in a ${kind} (${mode})`, () => {
				const { code, errors } = fn(source, 'App.tsrx', opts);
				expect(errors).toEqual([]);
				// No control-flow statement / raw JSX node leaked into expression position.
				expect(code).not.toMatch(/=\s*if\b/);
				expect(code).not.toMatch(/=>\s*if\b/);
				expect(code).not.toMatch(/return if\b/);
				expect(code).not.toContain('JSXIfExpression');
			});
		}
	}

	it('does not redundantly wrap a @{ … } code block in non-render value positions', () => {
		// Regression: a code block self-lowers to an IIFE/render of its own, so it must
		// NOT be wrapped in an extra fragment when used as e.g. an array element.
		const { code, errors } = compile(
			`function App() @{ let xs = [@{ let a = 1; <span>{a}</span> }]; <div>{xs}</div> }`,
			'App.tsrx',
			{ collect: true },
		);
		expect(errors).toEqual([]);
		expect(code).not.toContain('JSXCodeBlock');
		// The element scope hash etc. is unrelated; just ensure no stray fragment
		// wrapper was introduced around the code block in the array.
		expect(code).not.toMatch(/\[\s*_\$_\.tsrx_element\(\(__anchor[\s\S]*?\)\) *,?\s*\]/);
	});

	// A directive used as the SOLE value of a slot (`let cd = @if (…) { … }`) has no
	// native Ripple lowering, so without wrapping it leaked as `let cd = if (…) {}`
	// (invalid in every mode). It is now wrapped like any other value position.
	const soleValue = {
		'@if': `function App({ c }: { c: boolean }) @{ let cd = @if (c) { <p>a</p> }; <div>{cd}</div> }`,
		'@if empty': `function App({ c }: { c: boolean }) @{ let cd = @if (c) {}; <div>{cd}</div> }`,
		'@switch': `function App({ c }: { c: boolean }) @{ let cd = @switch (c) { @case true: { <p>a</p> } @default: { <p>b</p> } }; <div>{cd}</div> }`,
		assignment: `function App({ c }: { c: boolean }) @{ let cd; cd = @if (c) { <p>a</p> }; <div>{cd}</div> }`,
	};
	for (const [kind, source] of Object.entries(soleValue)) {
		for (const mode of /** @type {const} */ (['client', 'server'])) {
			it(`wraps a sole-value ${kind} directive (${mode})`, () => {
				const { code, errors } = compile(source, 'App.tsrx', { collect: true, mode });
				expect(errors).toEqual([]);
				expect(code).toContain('_$_.tsrx_element');
				expect(code).not.toMatch(/=\s*if\b/);
				expect(code).not.toMatch(/=\s*switch\b/);
			});
		}

		it(`wraps a sole-value ${kind} directive (to_ts)`, () => {
			const { code, errors } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
			expect(errors).toEqual([]);
			// to_ts lowers a sole-value directive to a typed VALUE (matching the JS
			// targets): a ternary for `@if`, a returning IIFE for `@switch` — never a
			// void IIFE whose branches lack `return`.
			if (kind === '@switch') {
				expect(code).toContain('return null;');
				expect(code).toMatch(/case true:\s*return </);
			} else {
				expect(code).toMatch(/cd = c \?/);
			}
			expect(code).not.toMatch(/=\s*if\b/);
			expect(code).not.toMatch(/=\s*switch\b/);
		});
	}

	it('still lowers a sole-value @{ … } code block to an IIFE (not double-wrapped)', () => {
		const { code, errors } = compile(
			`function App() @{ let cd = @{ const x = 1; <span>{x}</span> }; <div>{cd}</div> }`,
			'App.tsrx',
			{ collect: true },
		);
		expect(errors).toEqual([]);
		expect(code).toContain('_$_.tsrx_element');
		expect(code).not.toMatch(/=\s*if\b/);
	});
});

describe('@tsrx/ripple lowers a directive value to a typed value in to_ts (like the JS targets)', () => {
	// A directive in VALUE position must lower to a value the const can be typed
	// from — a ternary / `.map` / returning IIFE — NOT a void IIFE whose branches
	// lack `return` (which would type the const as `void`).
	const ts = (src) => compile_to_volar_mappings(src, 'App.tsrx', { loose: true }).code;

	it('@if -> ternary', () => {
		expect(
			ts(`function App() @{ const v = @if (cond()) { <a /> } @else { <b /> }; <div>{v}</div> }`),
		).toContain('const v = cond() ? <a /> : <b />;');
	});

	it('@if without else -> ternary with null', () => {
		expect(ts(`function App() @{ const v = @if (cond()) { <a /> }; <div>{v}</div> }`)).toContain(
			'const v = cond() ? <a /> : null;',
		);
	});

	it('@switch -> returning IIFE with trailing return null', () => {
		const code = ts(
			`function App() @{ const v = @switch (cond()) { @case 1: { <a /> } @case 2: { <b /> } }; <div>{v}</div> }`,
		);
		expect(code).toMatch(/case 1:\s*return <a \/>;/);
		expect(code).toContain('return null;');
	});

	it('@try -> returning IIFE with try/catch', () => {
		const code = ts(
			`function App() @{ const v = @try { <a /> } @catch (e) { <b /> }; <div>{v}</div> }`,
		);
		expect(code).toMatch(/try \{\s*return <a \/>;/);
		expect(code).toMatch(/catch \(e\) \{\s*return <b \/>;/);
	});

	it('@for -> Array.from(iterable).map (iterable-safe, not an IIFE-with-for)', () => {
		const code = ts(
			`function App({ xs }: { xs: number[] }) @{ const v = @for (const x of xs) { <li>{x}</li> }; <div>{v}</div> }`,
		);
		expect(code).toMatch(/const v = Array\.from\(xs\)\.map\(\(x\) =>/);
		expect(code).toContain('return <li>{x}</li>;');
		expect(code).not.toMatch(/=\s*\(\(\)\s*=>\s*\{\s*for\b/);
	});

	// `@for` accepts any iterable, but `Set`/`Map`/generators have no `.length` or
	// `.map`. Lower through `Array.from(...)` so the binding and the `@empty` branch
	// type-check (the index `; index i` becomes the map callback's 2nd param).
	it('@for over a non-array iterable is iterable-safe via Array.from (+ index, + @empty)', () => {
		const empty = ts(
			`function App({ xs }: { xs: Set<number> }) @{ const v = @for (const x of xs; index i) { <li>{i}{x}</li> } @empty { <p>none</p> }; <div>{v}</div> }`,
		);
		// no bare `xs.length` / `xs.map` (Set has neither) — both go through Array.from.
		expect(empty).not.toMatch(/\bxs\.length\b/);
		expect(empty).not.toMatch(/\bxs\.map\b/);
		// `Array.from(xs)` is materialized ONCE (a generator would be exhausted twice),
		// then the length test and `.map` read the same bound array.
		expect(empty).toContain('const $$items = Array.from(xs);');
		expect(empty).toMatch(/\$\$items\.length === 0/);
		expect(empty).toMatch(/\$\$items\.map\(\(x, i\) =>/);
		expect((empty.match(/Array\.from/g) || []).length).toBe(1);
	});

	// `@for await` iterates an AsyncIterable, which `Array.from` does NOT accept — it
	// lowers to an awaited async IIFE with a real `for await` loop (no `Array.from`).
	it('@for await lowers to an awaited for-await IIFE (not Array.from of an AsyncIterable)', () => {
		const code = ts(
			`async function App({ xs }: { xs: AsyncIterable<number> }) @{ const v = @for await (const x of xs) { <li>{x}</li> } @empty { <p/> }; <div>{v}</div> }`,
		);
		expect(code).toMatch(/const v = await \(async \(\) =>/);
		expect(code).toMatch(/for await \(const x of xs\)/);
		expect(code).toMatch(/\$\$items\.length === 0 \? <p \/> : \$\$items/);
		// must NOT pass an AsyncIterable to Array.from (the bug).
		expect(code).not.toMatch(/Array\.from\(xs\)/);
	});

	it('a directive in RENDER position is unchanged (still renders, no value lowering)', () => {
		const code = ts(`function App() @{ <div>@if (cond()) { <a /> } @else { <b /> }</div> }`);
		// Render position keeps its render IIFE; it is NOT turned into a ternary value.
		expect(code).not.toMatch(/<div>\{cond\(\) \?/);
	});

	// A branch/case with multiple sibling templates must merge into ONE `return` of
	// a fragment — not several returns where only the first is reachable (which would
	// make the editor types disagree with the template).
	it('merges multiple sibling templates in a branch into a single return', () => {
		const ifCode = ts(
			`function App() @{ const v = @if (cond()) { <a /> <b /> } @else { <c /> }; <div>{v}</div> }`,
		);
		expect(ifCode).toContain('const v = cond() ? <><a /><b /></> : <c />;');

		const switchCode = ts(
			`function App() @{ const v = @switch (cond()) { @case 1: { <a /> <b /> } }; <div>{v}</div> }`,
		);
		// One return per case (the merged fragment), not two unreachable returns —
		// the `toMatch` would fail on `case 1: return <a />; return <b />;`.
		expect(switchCode).toMatch(/case 1:\s*return <><a \/><b \/><\/>;/);
		expect(switchCode).not.toMatch(/return <a \/>;\s*return <b \/>;/);

		const forCode = ts(
			`function App({ xs }: { xs: number[] }) @{ const v = @for (const x of xs) { <a /> <b /> }; <div>{v}</div> }`,
		);
		expect(forCode).toMatch(/\.map\(\(x\) => \{\s*return <><a \/><b \/><\/>;\s*\}\)/);
	});

	// A NESTED directive inside a branch/case is render content too: it must be
	// lowered to its own value and merged into the branch's returned fragment — not
	// emitted as a bare `if (…) { … }` dropped from the value.
	it('lowers a nested directive inside a branch to a value and includes it in the return', () => {
		const code = ts(
			`function App() @{ const v = @switch (cond()) { @case 1: { <a /> <b /> @if (cond()) { <div>Hello</div> } } }; <div>{v}</div> }`,
		);
		expect(code).toContain('return <><a /><b />{cond() ? <div>Hello</div> : null}</>;');
		// The nested @if must NOT leak as a bare render statement (no value).
		expect(code).not.toMatch(/if \(cond\(\)\) \{\s*<div>Hello<\/div>;/);
	});

	// A directive nested inside an authored fragment that is itself a branch's value
	// is value content too — it lowers to its own value (a `.map`, not the void
	// render IIFE-with-`for` that drops to `void`).
	it('lowers a directive nested in a fragment inside a branch value to a value', () => {
		const code = ts(
			`function App({ xs, c }: { xs: number[]; c: any }) @{ const v = @switch (c) { @case 1: { <><a /> @for (const x of xs) { <li>{x}</li> }</> } }; <div>{v}</div> }`,
		);
		expect(code).toMatch(
			/<><a \/>\{Array\.from\(xs\)\.map\(\(x\) => \{\s*return <li>\{x\}<\/li>;\s*\}\)\}<\/>/,
		);
		// not a void IIFE-with-for inside the fragment.
		expect(code).not.toMatch(/<a \/>\{\(\(\) => \{\s*for \(/);
	});

	// The same nested directive in RENDER position (a direct child of the rendered
	// output) is NOT value-lowered — it still renders as a `for` loop.
	it('keeps a nested directive in render position rendering (not value-lowered)', () => {
		const code = ts(
			`export const Head = ({ scripts }: { scripts: { src: string }[] }) => @{ <head>@for (const script of scripts) { <script src={script.src} /> }</head> }`,
		);
		expect(code).toContain('for (const script of scripts)');
		expect(code).not.toMatch(/scripts\.map\(/);
	});
});

describe('@tsrx/ripple keeps fragments combined into an expression in to_ts output', () => {
	// A fragment is always truthy, but its single child may be falsy, so the to_ts
	// collapse of `<>{0}</>` to `0` would flip `<>{0}</> || 'd'` from rendering `0`
	// to rendering `'d'`. Keep the fragment when it is combined into an expression.
	it('keeps a fragment as a logical operand', () => {
		const { code } = compile_to_volar_mappings(
			`function App() @{ let c = <>{0}</> || "default"; <div>{c}</div> }`,
			'App.tsrx',
			{ loose: true },
		);
		expect(code).toContain('<>');
		expect(code).toContain('</>');
		expect(code).not.toMatch(/let c = 0 \|\|/);
	});

	it('keeps fragments as ternary branches', () => {
		const { code } = compile_to_volar_mappings(
			`function App({ o }: { o: boolean }) @{ let c = o ? <>{1}</> : <>{2}</>; <div>{c}</div> }`,
			'App.tsrx',
			{ loose: true },
		);
		expect(code).toContain('<>');
		expect(code).not.toMatch(/\?\s*1\s*:\s*2/);
	});

	it('keeps an authored fragment that is the sole value of a slot', () => {
		// An authored `<>…</>` is kept verbatim in value position (it must not unwrap
		// to a bare `1`); only generated directive wrappers collapse.
		const { code } = compile_to_volar_mappings(
			`function App() @{ const v = <>{1}</>; <div>{v}</div> }`,
			'App.tsrx',
			{ loose: true },
		);
		expect(code).toContain('const v = <>{1}</>;');
	});
});

describe('@tsrx/ripple Volar mappings style anchors', () => {
	it('omits stylesheet AST children from template style anchors', () => {
		const source = `function App() @{
	const items = ['one'];
	<>
		@try {
			<div className="content">{'hello'}</div>
		} @pending {
			<div>Hello</div>
		} @catch (err) {
			<p className="error">{'error'}</p>
		}

		@if (items.length > 0) {
			const hey = 'yo';
		} @else {
		}

		@for (const item of items) {
			<div>{item}</div>
		} @empty {
			<div>Nothing to see</div>
		}

		<style>
			.content {
				color: blue;
			}
			.error {
				color: red;
			}
		</style>
	</>
}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const server = compile(source, 'App.tsrx', { mode: 'server', loose: true });
		/** @type {string[]} */
		const source_style_nodes = [];
		const seen = new WeakSet();
		/** @param {any} node */
		const collect_style_nodes = (node) => {
			if (!node || typeof node !== 'object' || seen.has(node)) return;
			seen.add(node);
			if (node.type === 'JSXStyleElement') {
				source_style_nodes.push(node.type);
			}
			for (const key in node) {
				if (key === 'parent' || key === 'metadata') continue;
				const value = node[key];
				if (Array.isArray(value)) {
					for (const child of value) collect_style_nodes(child);
				} else {
					collect_style_nodes(value);
				}
			}
		};
		collect_style_nodes(result.sourceAst);

		expect(result.code).toContain('<style></style>');
		expect(result.code).not.toContain('StyleSheet');
		expect(
			result.cssMappings.some((mapping) => mapping.data?.customData?.content?.includes('.content')),
		).toBe(true);
		expect(source_style_nodes).toEqual(['JSXStyleElement']);
		expect(server.code).not.toContain('StyleSheet');
		expect(server.css).toContain('.content');
	});
});

describe('@tsrx/ripple Volar mappings normalize to_ts source locations', () => {
	it('maps script tokens after multiline template children', () => {
		const source = `function App() @{
		const x = 1;
		<pre>
			{x}
		</pre>
}
expect(x).toBe(1);`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const source_expect_offset = source.indexOf('expect');
		const generated_expect_offset = result.code.indexOf('expect');
		const mapping = find_exact_mapping(
			result.mappings,
			source_expect_offset,
			generated_expect_offset,
			'expect'.length,
		);

		expect(mapping).toBeDefined();
	});

	it('keeps lazy tracked values mapped to their source condition in @if output', () => {
		const source = `import { track } from 'ripple';
function App() @{
	let &[show] = track(true);
	<>
		@if (show) {
			<Child />
		}
		<button onClick={() => (show = !show)}>{'Toggle Child'}</button>
	</>
}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const generated_if_offset = result.code.indexOf('if (show)');
		const generated_show_offset = result.code.indexOf('show', generated_if_offset);
		const source_show_offset = source.indexOf('show) {');
		const mapping = find_exact_mapping(
			result.mappings,
			source_show_offset,
			generated_show_offset,
			'show'.length,
		);

		expect(result.code).toContain('if (show)');
		expect(result.code).not.toContain("show?.['#v']");
		expect(mapping).toBeDefined();
	});

	it('maps preserved TypeScript pragma comments at their source column', () => {
		const source = `import { RippleObject } from 'ripple';
import { TRACKED_OBJECT } from '../../src/runtime/internal/client/constants.js';
function ObjectTest() @{
	const obj = new RippleObject({ a: 0 });
	// @ts-expect-error TRACKED_OBJECT is internal
	expect(TRACKED_OBJECT in obj).toBe(true);
	<pre>{'done'}</pre>
}`;
		const result = compile_to_volar_mappings(source, 'object.test.tsrx', { loose: true });
		const source_comment_offset = source.indexOf('// @ts-expect-error');
		const generated_comment_offset = result.code.indexOf('// @ts-expect-error');
		const comment_length = '// @ts-expect-error TRACKED_OBJECT is internal'.length;
		const mapping = find_exact_mapping(
			result.mappings,
			source_comment_offset,
			generated_comment_offset,
			comment_length,
		);

		expect(source_comment_offset).toBeGreaterThan(
			source.lastIndexOf('\n', source_comment_offset) + 1,
		);
		expect(mapping).toBeDefined();
	});
});

describe('@tsrx/ripple Volar TypeScript output', () => {
	it('keeps expression braces for literal JSX attributes', () => {
		const { code } = compile_to_volar_mappings(
			`function App() @{
		<option value={1} label={'One'} selected={true}>{'One'}</option>
}`,
			'App.tsrx',
			{ loose: true },
		);

		expect(code).toContain("<option value={1} label={'One'} selected={true}>");
	});

	it('preserves attribute-only head scripts inside a loop', () => {
		const { code } = compile_to_volar_mappings(
			`export const Head = ({ scripts }: { scripts: { src: string }[] }) => @{
		<head>
			@for (const script of scripts) {
				<script src={script.src} />
			}
		</head>
}`,
			'Head.tsrx',
			{ loose: true },
		);

		expect(code).toContain('<script src={script.src} />');
		expect(code).toContain('for (const script of scripts)');
		expect(code).not.toContain('JSXCodeBlock');
	});

	it('does not collect statements from nested ordinary function bodies', () => {
		const { code } = compile_to_volar_mappings(
			`import { track } from 'ripple';
function App() @{
		let value = track('');
		const value_accessors = [
			() => value.value,
			(v: string) => {
				if (v.includes('c')) {
					v = v.replace(/c/g, '');
				}
				value.value = v;
			},
		];
		<input type="text" ref={bindValue(...value_accessors)} />
}`,
			'App.tsrx',
			{ loose: true },
		);

		expect(code.match(/if \(v\.includes\('c'\)\)/g)).toHaveLength(1);
		expect(code).not.toContain("let value = track('');\n\n\t\tif (v.includes('c'))");
	});
});

describe('@tsrx/ripple try pending fallbacks', () => {
	it('allows empty pending blocks as null fallbacks', () => {
		const { code } = compile(
			`function App() @{
				@try {
					<div>content</div>
				} @pending {}
			}`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.try(');
		expect(code).toContain('template(`<div>content</div>`');
	});

	it('prints pending blocks as valid TypeScript in Volar output', () => {
		const { code } = compile_to_volar_mappings(
			`function App() @{
				@try {
					<p>{'ok'}</p>
				} @pending {
					<p>{'loading...'}</p>
				} @catch (err) {
					<p>{'caught rejection'}</p>
				}
			}`,
			'App.tsrx',
			{ loose: true },
		);

		expect(code).toContain("return <p>{'loading...'}</p>;");
		expect(code).toContain('try {');
		expect(code).toContain('catch (err)');
		expect(code).not.toContain(' pending ');
	});
});

describe('@tsrx/ripple for empty fallbacks', () => {
	it('prints empty blocks as valid TypeScript in Volar output', () => {
		const { code } = compile_to_volar_mappings(
			`function App() @{
				const items = [];
				@for (const item of items) {
					<div>Hello</div>
				} @empty {
					<div>Nothing to see</div>
				}
			}`,
			'App.tsrx',
			{ loose: true },
		);

		expect(code).toContain('for (const item of items)');
		expect(code).toContain('return <div>Nothing to see</div>;');
		expect(code).not.toContain(' empty ');
	});
});

describe('@tsrx/ripple named ref props', () => {
	it('keeps named ref-like props ordinary for components', () => {
		const { code } = compile(
			`function Child(props) { return <></>; }
			function App() { return <>
				let input;
				<Child input_ref={input} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('input_ref: input');
	});

	it('wraps anonymous ref props for components', () => {
		const { code } = compile(
			`function Child(props) { return <></>; }
			function App() { return <>
				let input;
				<Child ref={input} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('ref: _$_.create_ref_prop(() => input, (v) => input = v)');
	});

	it('keeps named ref-like props ordinary on host elements', () => {
		const { code } = compile(
			`function App() { return <>
				let input;
				<input input_ref={input} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('input_ref');
		expect(code).not.toContain('_$_.create_ref_prop');
	});

	it('adds assignment setters for host ref attributes with identifiers and member expressions', () => {
		const { code } = compile(
			`function App() { return <>
				let input;
				let state = {};
				<input ref={input} />
				<input ref={state.input} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.ref(input_1, () => input, (v) => input = v)');
		expect(code).toContain('_$_.ref(input_2, () => state.input, (v) => state.input = v)');
	});

	it('prints named ref props in Volar TypeScript output', () => {
		const { code } = compile_to_volar_mappings(
			`function App() { return <>
				let input;
				<input input_ref={input} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).not.toContain(
			"import { _$_RefProp__create } from 'ripple/compiler/internal/import';",
		);
		expect(code).toContain('<input input_ref={input} />');
	});

	it('preserves child namespaces for nested host ref props in Volar TypeScript output', () => {
		const { code } = compile_to_volar_mappings(
			`function App() { return <>
				let circle;
				let div;
				<svg>
					<circle circle_ref={circle} />
					<foreignObject>
						<div div_ref={div} />
					</foreignObject>
				</svg>
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('<circle circle_ref={circle} />');
		expect(code).toContain('<div div_ref={div} />');
	});

	it('maps named ref-like prop values as ordinary props', () => {
		const source = `function Child(props: { inputRef?: any; otherRef?: any }) { return <>
	<input />
</>; }

function App() @{
	let input: HTMLInputElement | undefined;
	const state = { input: undefined as HTMLInputElement | undefined };
	<>
		<input type="text" input_ref={input} />
		<Child inputRef={input} otherRef={state.input} />
	</>
}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		expect(result.errors).toEqual([]);
		expect(result.code).toContain('input_ref={input}');
		expect(result.code).toContain('otherRef={state.input}');
	});
});

describe('@tsrx/ripple JSX fragment Volar output', () => {
	it('prints JSX converted from fragment expression containers', () => {
		const source = `function App() @{
	const content = <section>{<div>{'inside'}</div>}</section>;
	<>{content}</>
}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		expect(result.code).toContain('<section>');
		expect(result.code).toContain('<div>');
		expect(result.code).toContain("{'inside'}");
		expect(result.code).not.toContain('<tsx');
	});

	it('returns setup statements before a single fragment output', () => {
		const source = `class Foo { bar() @{ const x = 1; <><div>before</div><div>{x}</div></> } }`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const declaration = result.code.indexOf('const x = 1;');
		const returned_fragment = result.code.indexOf('return <><div>');
		const second_child = result.code.indexOf('<div>{x}</div>', returned_fragment + 1);

		expect(declaration).toBeGreaterThan(-1);
		expect(returned_fragment).toBeGreaterThan(-1);
		expect(second_child).toBeGreaterThan(-1);
		expect(declaration).toBeLessThan(returned_fragment);
		expect(returned_fragment).toBeLessThan(second_child);
	});

	it('returns JSX from root control-flow branches in Volar output', () => {
		const source = `function Component() @{
	const tracker = track<HTMLDivElement | null>(null);
	const show = track(true);
	captured = tracker;
	toggle = show;

	@if (show.value) {
		<div ref={tracker}>{'Hello World'}</div>
	}
}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		expect(result.code).toContain('if (show.value) {');
		expect(result.code).toContain("return <div ref={tracker}>{'Hello World'}</div>;");
		expect(result.code).not.toContain('return if');
		expect(result.code).not.toContain('(() =>');
	});

	it('prints statement-container setup before returning template output', () => {
		const source = `let logs: string[] = [];
function Child(&{ a, b, c }: { a: number; b: number; c: number }) @{
		effect(() => {
			logs.push(\`Child effect: \${a}, \${b}, \${c}\`);
		});
		<div>{a + ' ' + b + ' ' + c}</div>
}`;
		const result = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		expect(result.code).toContain('effect(() => {');
		expect(result.code).toContain('return <div>');
		expect(result.code).not.toContain('<>effect(() =>');
	});
});

describe('@tsrx/ripple <> expression values', () => {
	it('passes plain identifier props directly in fragment shorthand values', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const placeholder = 'value';
				return <><Some prop={placeholder} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.render_component(Some, __anchor, { prop: placeholder });');
		expect(code).not.toContain('get prop()');
	});

	it('passes plain identifier props directly in tsx expression values', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const placeholder = 'value';
				return <><Some prop={placeholder} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.render_component(Some, __anchor, { prop: placeholder });');
		expect(code).not.toContain('get prop()');
	});

	it('passes plain identifier props directly in tsrx expression values', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const placeholder = 'value';
				return <><Some prop={placeholder} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.render_component(Some, __anchor, { prop: placeholder });');
		expect(code).not.toContain('get prop()');
	});

	it('passes plain identifier props directly in component bodies', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() { return <>
				const placeholder = 'value';
				<Some prop={placeholder} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.render_component(Some, node, { prop: placeholder });');
		expect(code).not.toContain('get prop()');
	});

	it('passes plain non-tracked expression props directly', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const first = 'hello';
				const second = 'world';
				return <><Some prop={first + second} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.render_component(Some, __anchor, { prop: first + second });');
		expect(code).not.toContain('get prop()');
	});

	it('wraps member expression props in getters', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const obj = { value: 'value' };
				return <><Some prop={obj.value} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('return obj.value;');
	});

	it('wraps computed member expression props in getters', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function Test() {
				const obj = { value: 'value' };
				const key = 'value';
				return <><Some prop={obj[key]} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('return obj[key];');
	});

	it('wraps call expression props in getters', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function getValue() {
				return 'value';
			}
			function Test() {
				return <><Some prop={getValue()} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('getValue');
	});

	it('wraps call expression props in fragment shorthand values in getters', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function getValue() {
				return 'value';
			}
			function Test() {
				return <><Some prop={getValue()} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('getValue');
	});

	it('wraps call expression props in component bodies in getters', () => {
		const { code } = compile(
			`function Some(props) { return <></>; }
			function getValue() {
				return 'value';
			}
			function Test() { return <>
				<Some prop={getValue()} />
			</>; }`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('getValue');
	});

	it('wraps lazy tracked identifier props in fragment shorthand values in getters', () => {
		const { code } = compile(
			`import { track } from 'ripple';
			function Some(props) { return <></>; }
			function Test() @{
				let &[count] = track(0);
				const content = <><Some prop={count} /></>;
				<>{content}</>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('return lazy.value;');
	});

	it('wraps lazy tracked identifier props in function fragment returns in getters', () => {
		const { code } = compile(
			`import { track } from 'ripple';
			function Some(props) { return <></>; }
			function Test() {
				let &[count] = track(0);
				return <><Some prop={count} /></>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('return lazy.value;');
	});

	it('wraps lazy tracked identifier props in getters', () => {
		const { code } = compile(
			`import { track } from 'ripple';
			function Some(props) { return <></>; }
			function Test() @{
				let &[count] = track(0);
				const content = <><Some prop={count} /></>;
				<>{content}</>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain('return lazy.value;');
	});

	it('wraps lazy tracked expression props in getters', () => {
		const { code } = compile(
			`import { track } from 'ripple';
			function Some(props) { return <></>; }
			function Test() @{
				let &[count] = track(0);
				const content = <><Some prop={count % 2 ? 'odd' : 'even'} /></>;
				<>{content}</>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('get prop()');
		expect(code).toContain(`return lazy.value % 2 ? 'odd' : 'even';`);
	});

	it('lowers tsx values nested in template expressions', () => {
		const { code } = compile(
			`function App() @{
				const primary = true;
				<div>
					{primary
						? ['first:', <strong>one</strong>, ':tail']
						: ['second:', <strong>two</strong>, ':done']}
				</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('_$_.tsrx_element');
		expect(code).toContain('? [');
		expect(code).not.toContain('<>');
	});

	it('lowers native element values outside components', () => {
		const { code } = compile(`const test = <button>Hello</button>;`, 'App.tsrx');

		expect(code).toContain('const test = _$_.tsrx_element');
		expect(code).toContain('template(`<button>Hello</button>`');
	});

	it('lowers bare native element expression statements outside components', () => {
		const { code } = compile(`<button>Hello</button>;`, 'App.tsrx');

		expect(code).toContain('_$_.tsrx_element');
		expect(code).toContain('template(`<button>Hello</button>`');
	});

	it('renders native element values assigned inside returned templates on the server', () => {
		const { code } = compile(
			`function App() @{
				const test = <button>Hello</button>;
				<>{test}</>
			}`,
			'App.tsrx',
			{ mode: 'server' },
		);

		expect(code).toContain('const test = _$_.tsrx_element');
		expect(code).toContain('_$_.render_expression(test)');
		expect(code).not.toContain('_$_.escape(test)');
	});

	it('keeps direct arrow component returns on the render path', () => {
		const { code } = compile(`const App = () => <button>Hello</button>;`, 'App.tsrx');

		expect(code).toContain('template(`<button>Hello</button>`');
		expect(code).toContain('_$_.append(__anchor, button)');
		expect(code).not.toContain('template(``');
	});

	it('keeps returned elements after comments on the render path', () => {
		const { code } = compile(
			`function App() {
				return /* comment */ <div>Commented</div>;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('template(`<div>Commented</div>`');
		expect(code).toContain('_$_.append(__anchor, div)');
	});

	it('keeps directly called PascalCase numeric helpers as ordinary functions', () => {
		const { code } = compile(
			`function StatusCode() {
				return 200;
			}
			const value = StatusCode();`,
			'App.tsrx',
		);

		expect(code).toContain('function StatusCode()');
		expect(code).toContain('return 200;');
		expect(code).toContain('const value = StatusCode();');
		expect(code).not.toContain('function StatusCode(__anchor');
		expect(code).not.toContain('template(`200`');
	});

	it('keeps directly called PascalCase template literal helpers as ordinary functions', () => {
		const { code } = compile(
			`function FormatName(first, last) {
				return \`\${first} \${last}\`;
			}
			const label = FormatName("Ada", "Lovelace");`,
			'App.tsrx',
		);

		expect(code).toContain('function FormatName(first, last)');
		expect(code).toContain('return `${first} ${last}`;');
		expect(code).toContain('const label = FormatName("Ada", "Lovelace");');
		expect(code).not.toContain('function FormatName(__anchor');
	});

	it('keeps renderable-only PascalCase functions as plain functions', () => {
		const { code } = compile(
			`function Label() {
				return "Hi";
			}
			function App() {
				return <Label />;
			}`,
			'App.tsrx',
		);

		expect(code).toContain('function Label()');
		expect(code).toContain('return "Hi";');
		expect(code).toContain('_$_.render_component(Label, __anchor, {})');
	});

	it('uses server render_expression for conditional array expression values', () => {
		const { code } = compile(
			`function App() @{
				const condition = true;
				const ternary_items = condition ? ['start:', ['one', 2], ':end'] : ['fallback'];
				const logical_items = condition && ['start:', ['one', 2], ':end'];

				<>
					<div>{ternary_items}</div>
					<div>{logical_items}</div>
				</>
			}`,
			'App.tsrx',
			{ mode: 'server' },
		);

		expect(code).toContain('_$_.render_expression(ternary_items)');
		expect(code).toContain('_$_.render_expression(logical_items)');
		expect(code).not.toContain('_$_.escape(ternary_items)');
		expect(code).not.toContain('_$_.escape(logical_items)');
	});

	it('uses client expression anchors that can hydrate conditional array markers', () => {
		const { code } = compile(
			`function App() @{
				const condition = true;
				const items = condition ? ['start:', ['one', 2], ':end'] : ['fallback'];

				<div>{items}</div>
			}`,
			'App.tsrx',
		);

		expect(code).toContain('template(`<div> </div>`');
		expect(code).toContain('_$_.child(');
		expect(code).not.toContain('_$_.child(div, true)');
		expect(code).toContain('_$_.expression(');
	});
});

describe('@tsrx/ripple nested function fragment returns', () => {
	it('keeps special fragment returns inside component prop arrow functions', () => {
		const { code } = compile(
			`function Child(props) { return <></>; }

			export function App() { return <>
				<Child
					fragment={() => {
						return <><div>fragment</div></>;
					}}
					tsx={() => {
						return <><div>tsx</div></>;
					}}
					tsrx={() => {
						return <><div>tsrx</div></>;
					}}
				/>
			</>; }`,
			'App.tsrx',
		);

		expect(code).toMatch(/fragment: \(\) => {\s+return _\$_.tsrx_element/);
		expect(code).toMatch(/tsx: \(\) => {\s+return _\$_.tsrx_element/);
		expect(code).toMatch(/tsrx: \(\) => {\s+return _\$_.tsrx_element/);
	});

	it('allows return-value branches inside nested component prop functions', () => {
		const source = `function Page(props) { return <></>; }

			export function Test() { return <>
				<Page
					params={{
						menuAlt: (isAdmin) => {
							if (isAdmin) {
								return [<>Delete</>, <>Edit</>];
							} else {
								return [<>View</>];
							}
						},
						bySwitch: (role) => {
							switch (role) {
								case 'admin':
									return [<>Edit</>];
								default:
									return [<>View</>];
							}
						},
					}}
				/>
		</>; }`;
		const { code } = compile(source, 'App.tsrx');
		const server = compile(source, 'App.tsrx', { mode: 'server' });

		expect(code).toMatch(/menuAlt: \(isAdmin\) => \{/);
		expect(code).toMatch(/bySwitch: \(role\) => \{/);
		expect(code).toContain("case 'admin':");
		expect(code).toContain('_$_.tsrx_element');
		expect(server.code).toContain('return [');
		expect(server.code).toContain('_$_.tsrx_element');
	});

	it('allows any returns inside nested component prop functions', () => {
		const source = `function Page(props) { return <></>; }

			export function Test() { return <>
				<Page fn={() => {
					if (true) {
						return;
					}
					return undefined;
				}} />
			</>; }`;
		const { code } = compile(source, 'App.tsrx');
		const server = compile(source, 'App.tsrx', { mode: 'server' });
		const tsx = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		expect(code).toContain('return;');
		expect(code).toContain('return undefined;');
		expect(server.code).toContain('return;');
		expect(server.code).toContain('return undefined;');
		expect(tsx.code).toContain('return;');
		expect(tsx.code).toContain('return undefined;');
		expect(code).not.toContain('Return statements are not allowed');
	});

	it('compiles multiple component guard returns as plain control flow', () => {
		const source = `function Test({ done }) @{
			if (done.value) {
				return <p>Done</p>;
			} else if (done.value === 'test') {
				return <p>Not done</p>;
			}

			const loop = () => <>
				@for (const item of items) {
					<div>{item}</div>
				}
			</>;

			<>{loop()}</>
		}`;
		const client = compile(source, 'App.tsrx');
		const server = compile(source, 'App.tsrx', { mode: 'server' });
		const tsx = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		// Plain JS guards are ordinary early returns now — no `return_guard`
		// bookkeeping. Each guard returns a `tsrx_element` directly.
		expect(client.code).not.toContain('return_guard');
		expect(client.code).toContain('if (done.value)');
		expect(client.code).toContain("} else if (done.value === 'test')");
		expect(client.code).toContain('return _$_.tsrx_element((__anchor, __block) =>');
		expect(client.code).toContain('_$_.for(');
		expect(client.code).toContain('_$_.render_tsrx_element(_$_.with_scope(__block, loop),');
		expect(server.code).not.toContain('return_guard');
		expect(server.code).toContain('if (done.value)');
		expect(server.code).toContain('return _$_.tsrx_element(() =>');
		expect(server.code).toContain('_$_.render_tsrx_element(loop())');
		expect(tsx.code).toContain('if (done.value)');
		expect(tsx.code).toContain('return <p>Done</p>');
	});

	it('compiles guard returns in separate functions as plain control flow', () => {
		const source = `function First(flag) @{
			if (flag) {
				return <p>first</p>;
			}
			<span>fallback</span>
		}

		function Second(flag) @{
			if (flag) {
				return <p>second</p>;
			}
			<span>fallback</span>
		}`;
		const client = compile(source, 'App.tsrx');
		const server = compile(source, 'App.tsrx', { mode: 'server' });

		expect(client.code).not.toContain('return_guard');
		expect(client.code.match(/if \(flag\) \{/g)).toHaveLength(2);
		expect(server.code).not.toContain('return_guard');
		expect(server.code.match(/if \(flag\) \{/g)).toHaveLength(2);
	});

	it('does not synthesize a return_guard binding that could clash with user names', () => {
		const source = `function Test(return_guard) @{
			if (return_guard) {
				return <p>done</p>;
			}
			<span>{return_guard}</span>
		}`;
		const client = compile(source, 'App.tsrx');
		const server = compile(source, 'App.tsrx', { mode: 'server' });

		// No compiler-generated return_guard binding exists, so the user's
		// `return_guard` parameter is used as-is with no `_1` suffix.
		expect(client.code).not.toContain('return_guard_1');
		expect(client.code).toContain('if (return_guard)');
		expect(server.code).not.toContain('return_guard_1');
		expect(server.code).toContain('if (return_guard)');
	});
});

describe('@tsrx/ripple unified function and component compilation', () => {
	const expect_value_function = (source) => {
		const client = compile(source, 'App.tsrx');
		const server = compile(source, 'App.tsrx', { mode: 'server' });

		expect(client.code).toContain('_$_.tsrx_element((__anchor, __block) =>');
		expect(server.code).toContain('_$_.tsrx_element(() =>');
		expect(client.code).not.toContain('function Test(__anchor');
		expect(server.code).not.toContain('_$_.push_component()');
		expect(server.code).not.toContain('_$_.pop_component()');
	};

	it('compiles native template returns as value-producing functions', () => {
		expect_value_function(`function Test() { return <p />; }`);
	});

	it('compiles template variables and alternate returns as renderable values', () => {
		expect_value_function(`function Test(flag) {
			const alt = <p />;
			if (flag === 'array') return [alt, 'text'];
			if (flag === 'null') return null;
			if (flag === 'undefined') return undefined;
			return alt;
		}`);
	});

	it('guards regular statements after conditional component returns', () => {
		const source = `function Test(flag) @{
			if (flag) return;
			sideEffect();
			<p />
		}`;
		const client = compile(source, 'App.tsrx');
		const server = compile(source, 'App.tsrx', { mode: 'server' });

		expect(client.code).toContain('if (flag) return;');
		expect(client.code).toContain('_$_.with_scope(__block, sideEffect);');
		expect(client.code).not.toContain('return_guard');
		expect(server.code).toContain('if (flag) return;');
		expect(server.code).toContain('sideEffect();');
		expect(server.code).not.toContain('return_guard');
	});

	it('preserves ordinary control flow for plain functions returning templates', () => {
		const source = `function Dashboard({ user: &[user] }) {
			if (!user) {
				return <p>No user found</p>;
			}

			return <>
				<h1>Welcome,{user}</h1>
				<p>Here is your dashboard.</p>
			</>;
		}`;
		const client = compile(source, 'App.tsrx');
		const server = compile(source, 'App.tsrx', { mode: 'server' });

		expect(client.code).toContain('if (!_$_.lazy_array_get(lazy, 0))');
		expect(client.code).toContain('return _$_.tsrx_element((__anchor, __block) =>');
		expect(client.code).not.toContain('return_guard');
		expect(client.code).not.toContain('_$_.if(');
		expect(server.code).toContain('if (!_$_.lazy_array_get(lazy, 0))');
		expect(server.code).not.toContain('return_guard');
	});

	it('does not use direct calls to disqualify native template functions', () => {
		const source = `function Test() { return <p />; }
			function App() { return <>{Test()}</>; }`;
		const client = compile(source, 'App.tsrx');
		const server = compile(source, 'App.tsrx', { mode: 'server' });

		expect(client.code).toContain('function Test()');
		expect(client.code).toContain('() => _$_.with_scope(__block, Test)');
		expect(client.code).not.toContain('Test(__anchor');
		expect(server.code).toContain('_$_.render_expression(Test())');
	});

	it('emits component calls through the runtime component helper', () => {
		const source = `function Test() { return <p />; }
			function App() { return <><Test /></>; }`;
		const client = compile(source, 'App.tsrx');
		const server = compile(source, 'App.tsrx', { mode: 'server' });

		expect(client.code).toContain('_$_.render_component(Test, __anchor, {})');
		expect(server.code).toContain('_$_.render_component(comp, ...args)');
	});

	it('does not classify plain functions as JSX-producing TSRX functions', () => {
		const source = `function App() @{
			function Plain() { return 'plain'; }
			function Compat() { return <><div /></>; }
			<></>
		}`;
		const client = compile(source, 'App.tsrx');
		const server = compile(source, 'App.tsrx', { mode: 'server' });

		expect(client.code).toContain("return 'plain';");
		expect(client.code).not.toContain('Plain(__anchor');
		expect(client.code).not.toContain('Compat(__anchor');
		expect(server.code).not.toContain('Plain(__output');
		expect(server.code).not.toContain('Compat(__output');
	});
});

describe('@tsrx/ripple template comments', () => {
	const source = `function TodoList() @{
<>
  /* world 0 */
  // hello
  /* world 1 */
  <ul>
  // hello
  /* world 2 */

  </ul>

  <ul>
  // hello
  /* world 3 */
  // hello
  </ul>
  /* world 4 */
  </>
}`;

	it('keeps line and block comments out of client templates', () => {
		const { code } = compile(source, 'App.tsrx');
		expect(code).not.toMatch(/world|hello/);
		expect(code).toContain('<ul></ul><ul></ul>');
	});

	it('keeps line and block comments out of server output', () => {
		const { code } = compile(source, 'App.tsrx', { mode: 'server' });
		expect(code).not.toMatch(/world|hello/);
	});

	it('keeps template comments out of to_ts output', () => {
		const { code } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		expect(code).not.toMatch(/world|hello/);
	});
});
