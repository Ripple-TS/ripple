import { describe, it, expect } from 'vitest';
import { compile } from '@tsrx/ripple-new';

// Compile-error coverage: pin the maintained rejection messages so future
// parser/compiler edits can't silently drop a guard. Each test asserts
// both the throw and a recognizable regex on the message — the regex is
// the user-facing contract, not the throw itself.

describe('compile errors — rejected authoring patterns', () => {
	it('rejects multiple `ref={…}` attributes on a single element', () => {
		const src = `
      import { useRef } from 'ripple-new';
      export function MultiRef() @{
        const a = useRef(null);
        const b = useRef(null);
        <div ref={a} ref={b}>{'two refs'}</div>
      }
    `;
		expect(() => compile(src, 'multi-ref.tsrx')).toThrow(/multiple `ref=.*?` attributes/);
		expect(() => compile(src, 'multi-ref.tsrx')).toThrow(/ref=\{\[a, b\]\}/);
	});

	it('allows a single `ref={[a, b]}` array form (canonical multi-attach)', () => {
		const src = `
      import { useRef } from 'ripple-new';
      export function ArrayRef() @{
        const a = useRef(null);
        const b = useRef(null);
        <div ref={[a, b]}>{'array form'}</div>
      }
    `;
		expect(() => compile(src, 'array-ref.tsrx')).not.toThrow();
	});

	it('rejects an `async function` component with an actionable message', () => {
		const src = `export async function Foo() @{ <div>{1}</div> }`;
		// Without this guard an async component compiles to broken synchronous
		// code with no diagnostic — silent miscompilation is the worst failure.
		expect(() => compile(src, 'async-comp.tsrx')).toThrow(/declared `async`/);
		expect(() => compile(src, 'async-comp.tsrx')).toThrow(/use\(promise\)/);
	});

	it('rejects an `async` exported-default component', () => {
		const src = `export default async function Foo() @{ <div>{1}</div> }`;
		expect(() => compile(src, 'async-default.tsrx')).toThrow(/declared `async`/);
	});

	it('rejects a generator (`function*`) component', () => {
		const src = `export function* Gen() @{ <div>{1}</div> }`;
		expect(() => compile(src, 'gen-comp.tsrx')).toThrow(/generator/);
	});

	it('rejects `@for await (...)` (async iteration) — must fail loudly, not lower to a sync loop', () => {
		const src = `
      export function L(props) @{
        <ul>
          @for await (const x of props.items) {
            <li>{x as any}</li>
          }
        </ul>
      }
    `;
		// The TSRX parser rejects the surface syntax outright today; makeForCall
		// also guards the lowered node. Either way the contract is: it throws.
		expect(() => compile(src, 'for-await.tsrx')).toThrow();
	});
});
