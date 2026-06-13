import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import { Classed, WithAttrs, Clicker, FnSetter } from './_fixtures/attrs-events.tsrx';

describe('attributes', () => {
	it('binds dynamic class', () => {
		const r = mount(Classed, { kind: 'red' });
		expect(r.find('div').className).toBe('red');
		r.unmount();
	});

	it('binds dynamic attributes', () => {
		const r = mount(WithAttrs, { url: 'https://x', title: 'hi' });
		const a = r.find('a') as HTMLAnchorElement;
		expect(a.getAttribute('href')).toBe('https://x');
		expect(a.getAttribute('title')).toBe('hi');
		r.unmount();
	});
});

describe('events + useState', () => {
	it('increments on click', () => {
		const r = mount(Clicker);
		expect(r.find('button').textContent).toBe('0');
		r.click('button');
		expect(r.find('button').textContent).toBe('1');
		r.click('button');
		r.click('button');
		expect(r.find('button').textContent).toBe('3');
		r.unmount();
	});

	it('functional setters chain via flushSync', () => {
		const r = mount(FnSetter);
		r.click('button');
		expect(r.find('button').textContent).toBe('3'); // 3 functional setters in one click
		r.unmount();
	});
});
