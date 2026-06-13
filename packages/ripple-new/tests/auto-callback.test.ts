import { describe, it, expect } from 'vitest';
import { compile } from '@tsrx/ripple-new';

// Pin the auto-callback transform: when a top-level `const fn = () => …`
// arrow inside a component body only closes over compile-time-stable
// bindings (useState setters, useRef returns, useCallback returns,
// module-level identifiers), the compiler auto-wraps the binding in
// useCallback with a deps array of the referenced stable locals.
// Unstable closures (props, plain useState VALUES, non-Identifier
// destructure, etc.) skip the rewrite so the arrow keeps its original
// per-render identity.
//
// Audited path: rewriteAutoCallback in compile.js (around lines 174-279)
// plus the source-order walk in compileComponent (~lines 816-820).

const c = (src: string): string => compile(src, 'auto-cb.tsrx').code;

describe('auto-callback transform — stable-closure arrows wrap in useCallback', () => {
	it('stable arrow over a useState setter wraps and includes the setter in deps', () => {
		// Updater form: arrow closes ONLY over `setCount`, not the value `count`.
		// The value would be unstable per the bailout rule (test below).
		const code = c(`
      import { useState } from 'ripple-new';
      export function Counter() @{
        const [count, setCount] = useState(0);
        const reset = () => setCount(0);
        <button onClick={reset}>{count as string}</button>
      }
    `);
		expect(code).toMatch(/const\s+reset\s*=\s*useCallback\s*\(/);
		expect(code).toMatch(/useCallback\s*\([\s\S]*?,\s*\[\s*setCount\s*\]/);
		expect(code).toMatch(/import\s*\{[^}]*useCallback[^}]*\}\s*from\s*['"]ripple-new['"]/);
	});

	it('arrow that closes only over a prop is NOT rewrapped', () => {
		const code = c(`
      export function Hi(props) @{
        const greet = () => console.log(props.name);
        <button onClick={greet}>{'hi'}</button>
      }
    `);
		expect(code).toMatch(/const\s+greet\s*=\s*\(/);
		expect(code).not.toMatch(/const\s+greet\s*=\s*useCallback/);
	});

	it('transitive stability: arrow b calling stable arrow a is also wrapped', () => {
		const code = c(`
      import { useState } from 'ripple-new';
      export function T() @{
        const [, setX] = useState(0);
        const a = () => setX(1);
        const b = () => a();
        <button onClick={b}>{'go'}</button>
      }
    `);
		expect(code).toMatch(/const\s+a\s*=\s*useCallback\([\s\S]*?,\s*\[\s*setX\s*\]/);
		expect(code).toMatch(/const\s+b\s*=\s*useCallback\([\s\S]*?,\s*\[\s*a\s*\]/);
	});

	it('useRef return is stable; .current accesses do NOT add deps', () => {
		const code = c(`
      import { useRef } from 'ripple-new';
      export function R() @{
        const r = useRef(null);
        const focus = () => r.current.focus();
        <input ref={r} onClick={focus} />
      }
    `);
		expect(code).toMatch(/const\s+focus\s*=\s*useCallback\([\s\S]*?,\s*\[\s*r\s*\]/);
	});

	it('idempotency: user-authored useCallback is not re-wrapped', () => {
		const code = c(`
      import { useState, useCallback } from 'ripple-new';
      export function I() @{
        const [, setX] = useState(0);
        const cb = useCallback(() => setX(1), [setX]);
        <button onClick={cb}>{'go'}</button>
      }
    `);
		expect(code).not.toMatch(/useCallback\s*\(\s*useCallback/);
	});

	it('useState VALUE (first tuple element) is NOT stable; closure over it bails', () => {
		const code = c(`
      import { useState } from 'ripple-new';
      export function V() @{
        const [count, setCount] = useState(0);
        const read = () => count;
        <button onClick={read}>{count as string}</button>
      }
    `);
		expect(code).not.toMatch(/const\s+read\s*=\s*useCallback/);
	});

	it('destructured useRef return is NOT stable (only Identifier-bound stays)', () => {
		const code = c(`
      import { useRef } from 'ripple-new';
      export function D() @{
        const { current: r } = useRef({ x: 1 });
        const fn = () => r;
        <button onClick={fn}>{'x'}</button>
      }
    `);
		expect(code).not.toMatch(/const\s+fn\s*=\s*useCallback/);
	});

	it("module-level identifier doesn't block rewrite and is not added to deps", () => {
		const code = c(`
      import { useState } from 'ripple-new';
      const ZERO = 0;
      export function M() @{
        const [, setX] = useState(0);
        const fn = () => setX(ZERO);
        <button onClick={fn}>{'z'}</button>
      }
    `);
		expect(code).toMatch(/const\s+fn\s*=\s*useCallback\([\s\S]*?,\s*\[\s*setX\s*\]/);
		expect(code).not.toMatch(/\[\s*setX\s*,\s*ZERO\s*\]/);
	});

	it('inner @for body arrows are NOT auto-wrapped (rewrite gated to top level)', () => {
		const code = c(`
      import { useState } from 'ripple-new';
      export function L(props) @{
        const [, setX] = useState(0);
        <ul>
          @for (const it of props.items; key it.id) {
            <li onClick={() => setX(it.id)}>{it.label as string}</li>
          }
        </ul>
      }
    `);
		// The for-body inline arrow may be optimized as an event-bundle but should
		// NOT be hoisted into a useCallback at component-body scope.
		expect(code).not.toMatch(/const\s+click\s*=\s*useCallback/);
	});

	it('mixed stable + unstable closure (prop reference inside arrow) bails', () => {
		const code = c(`
      import { useState } from 'ripple-new';
      export function Mix(props) @{
        const [, setX] = useState(0);
        const fn = (e) => { setX(1); return props.label + e.type; };
        <button onClick={fn}>{'x'}</button>
      }
    `);
		expect(code).not.toMatch(/const\s+fn\s*=\s*useCallback/);
	});
});
