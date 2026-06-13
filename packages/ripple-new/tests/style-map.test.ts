import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import { compile } from '@tsrx/ripple-new';
import { Picker, Composed, Switchable, Branded } from './_fixtures/style-map.tsrx';

// Style maps: `const styles = <style>...</style>` (or the exported form)
// becomes a compile-time object whose values are the hashed class strings.
// The component references them as `class={styles.red}` and gets the right
// scoped class on the element. The stylesheet is also injected once at
// module-level via the existing cssInjections pipeline.

describe('style maps — module-level <style> assigned to const', () => {
	it('compiles the <style> initializer into an object expression', () => {
		const src = `
      const styles = <style>
        .red { color: red; }
        .blue { color: blue; }
      </style>;
      export function Foo() @{ <div class={styles.red}>{'hi'}</div> }
    `;
		const { code } = compile(src, 'sm.tsrx');
		// The const initializer is now a plain object literal, NOT a JSXStyleElement.
		expect(code).toMatch(/const\s+styles\s*=\s*\{/);
		// The map values include the hash class + the original class name.
		expect(code).toMatch(/'red':\s*'tsrx-[a-z0-9]+ red'/i);
		expect(code).toMatch(/'blue':\s*'tsrx-[a-z0-9]+ blue'/i);
		// The stylesheet still flows through injectStyle for the module-level tag.
		expect(code).toMatch(/injectStyle\("tsrx-[a-z0-9]+"/i);
	});

	it('Picker: dynamic key lookup applies the right hashed class', () => {
		const r = mount(Picker, { kind: 'red' });
		const div = r.find('div');
		expect(div.textContent).toBe('I am red');
		expect(div.className).toMatch(/tsrx-[a-z0-9]+/i);
		expect(div.className).toContain(' red');
		// The injected stylesheet should make the rule apply.
		expect(getComputedStyle(div).color).toBe('rgb(200, 0, 0)');

		r.update(Picker, { kind: 'blue' });
		expect(div.className).toContain(' blue');
		expect(getComputedStyle(div).color).toBe('rgb(0, 0, 200)');
		r.unmount();
	});

	it('Composed: concatenating two map lookups stacks both classes', () => {
		const r = mount(Composed);
		const div = r.find('div');
		// Both hashed classes present on the element (deduped by the browser's
		// class list — same hash on both → just appears twice in the string).
		expect(div.className).toContain('red');
		expect(div.className).toContain('pad');
		expect(getComputedStyle(div).padding).toBe('5px');
		expect(getComputedStyle(div).color).toBe('rgb(200, 0, 0)');
		r.unmount();
	});

	it('Switchable: clicking flips between two map lookups', () => {
		const r = mount(Switchable);
		const btn = r.find('button');
		expect(btn.textContent).toBe('red');
		expect(btn.className).toContain('red');
		expect(getComputedStyle(btn).color).toBe('rgb(200, 0, 0)');

		r.click('button');
		expect(btn.textContent).toBe('blue');
		expect(btn.className).toContain('blue');
		expect(getComputedStyle(btn).color).toBe('rgb(0, 0, 200)');
		r.unmount();
	});

	it('export const palette = <style>...: exported maps work the same way', () => {
		const r = mount(Branded);
		const span = r.find('span');
		expect(span.textContent).toBe('branded');
		expect(span.className).toContain('accent');
		expect(getComputedStyle(span).color).toBe('rgb(255, 165, 0)');
		r.unmount();
	});
});
