import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import { MultiTop, Mixed, Nested } from './_fixtures/fragments.tsrx';

describe('fragments', () => {
	it('mounts multi-root top-level fragment', () => {
		const r = mount(MultiTop);
		expect(r.findAll('p').map((p) => p.textContent)).toEqual(['1', '2', '3']);
		r.unmount();
		expect(r.container.parentNode).toBe(null);
	});

	it('flattens fragment children inside an element', () => {
		const r = mount(Mixed);
		expect(r.find('div .a').textContent).toBe('A');
		expect(r.find('div .b').textContent).toBe('B');
		expect(r.findAll('div > span')).toHaveLength(2);
		r.unmount();
	});

	it('flattens nested fragments', () => {
		const r = mount(Nested);
		expect(r.findAll('p').map((p) => p.textContent)).toEqual(['x', 'y', 'z']);
		r.unmount();
	});
});
