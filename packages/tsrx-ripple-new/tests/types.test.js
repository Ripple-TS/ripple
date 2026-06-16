import { describe, it, expect } from 'vitest';
import { compile } from '../src/index.js';
import { compileToVolarMappings } from '../src/volar.js';

// TypeScript handling in .tsrx. The RUNTIME compile (client + server) must strip
// ALL type-only syntax — module-level statements are passed through to esrap and
// Vite does NOT type-strip a `.tsrx`, so any leaked TS reaches the runtime as
// invalid JS (e.g. `new Promise<string>(exec)` parses as `(new Promise) < string
// > (exec)` → `new Promise()` with no executor). The VOLAR path is the opposite:
// it must PRESERVE every type so the TypeScript language service can analyse the
// file. Both pipelines are exercised here.

const TAIL = ` export function C() @{ <i>{1 as any}</i> }`;
const runtime = (body, mode) => compile(body + TAIL, 'c.tsrx', { mode }).code;

// The TS-only constructs that must vanish from runtime output.
const TS_ONLY = [
	['generic new', `const p = new Promise<string>((r) => r("x"));`, /Promise<string>/],
	['generic call', `const q = ([] as number[]).map<string>((z) => String(z));`, /\.map<string>/],
	['type alias', `type T = { a: number };`, /\btype T\b/],
	['interface', `interface I { x: number }`, /\binterface\b/],
	['ambient declare', `declare const g: number;`, /\bdeclare\b/],
	['import type', `import type { Foo } from "./foo";`, /import type/],
	['export type', `export type Z = string;`, /export type|\btype Z\b/],
];

describe('@tsrx/ripple-new compile — TS stripping (runtime)', () => {
	for (const mode of ['client', 'server']) {
		describe(`mode: ${mode}`, () => {
			for (const [label, body, leak] of TS_ONLY) {
				it(`strips/drops ${label}`, () => {
					// Must not throw (a top-level `type`/`export type` used to crash the
					// printer) and must not leak the TS-only syntax into the output.
					const out = runtime(body, mode);
					expect(out).not.toMatch(leak);
				});
			}

			it('keeps the runtime value of a stripped generic (executor survives)', () => {
				// The reported bug: the type ARGUMENT was dropped but the call must be
				// intact — `new Promise<string>(exec)` → `new Promise(exec)`, not `new Promise()`.
				const out = runtime(`const p = new Promise<string>((resolve) => resolve("x"));`, mode);
				expect(out).toContain('new Promise((resolve) => resolve("x"))');
				expect(out).not.toContain('new Promise<string>');
			});

			it('preserves optional chaining (?. is runtime JS, not the TS `x?` marker)', () => {
				// Regression: the TS optional-parameter strip (`function f(x?: T)`) cleared
				// `optional: true` on EVERY node, which also nuked optional chaining on
				// MemberExpression/CallExpression — `a?.b` / `a?.()` silently became
				// `a.b` / `a()`, throwing at runtime on a nullish base.
				const out = runtime(
					`const r = obj?.a?.b ?? fallback;\nconst c = fn?.(1, 2);\nconst d = arr?.[0];`,
					mode,
				);
				expect(out).toContain('obj?.a?.b');
				expect(out).toContain('fn?.(1, 2)');
				expect(out).toContain('arr?.[0]');
			});

			it('still strips the TS optional-parameter marker (`x?: T` → `x`)', () => {
				const out = runtime(`function f(x?: number) { return x; }`, mode);
				expect(out).toContain('function f(x)');
				expect(out).not.toMatch(/function f\(x\?/);
			});
		});
	}
});

describe('@tsrx/ripple-new compile — Volar (TS language service) PRESERVES types', () => {
	const src =
		`type T = { a: number };\n` +
		`interface I { x: number }\n` +
		`const p = new Promise<string>((r) => r("x"));\n` +
		`export function C(props: I) @{ <i>{props.x as number}</i> }`;
	const { code } = compileToVolarMappings(src, 'v.tsrx');

	it('preserves generic type arguments', () => {
		expect(code).toContain('Promise<string>');
	});
	it('preserves type aliases and interfaces', () => {
		expect(code).toMatch(/\btype T\b/);
		expect(code).toMatch(/\binterface I\b/);
	});
	it('preserves parameter type annotations', () => {
		expect(code).toMatch(/props\s*:\s*I\b/);
	});
});
