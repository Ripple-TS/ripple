import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import { PortalledWithTsrx, InlineTsrx } from './_fixtures/tsrx-block.tsrx';

describe('<tsrx> expression block', () => {
	it('uses a tsrx-block bound to a const as a Portal child render fn', () => {
		const target = document.createElement('section');
		document.body.appendChild(target);
		const r = mount(PortalledWithTsrx, { target, label: 'hello' });
		expect(target.querySelector('.from-tsrx')!.textContent).toBe('hello');
		r.unmount();
		expect(target.querySelector('.from-tsrx')).toBe(null);
		target.remove();
	});

	it('uses a tsrx-block inline inside a JSX expression slot', () => {
		const target = document.createElement('section');
		document.body.appendChild(target);
		const r = mount(InlineTsrx, { target });
		expect(target.querySelector('.inline')!.textContent).toBe('inline');
		r.unmount();
		target.remove();
	});
});
