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
});
