import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import {
	DynamicProvider,
	Siblings,
	TwoContexts,
	ConditionalUse,
	ListConsumers,
	PortalledContext,
	LiveCount,
} from './_fixtures/context.tsrx';

describe('context — value updates', () => {
	it('consumers re-render when Provider value changes', () => {
		const r = mount(DynamicProvider);
		expect(r.find('.theme').textContent).toBe('init');
		r.click('#swap');
		expect(r.find('.theme').textContent).toBe('changed');
		r.click('#swap');
		expect(r.find('.theme').textContent).toBe('init');
		r.unmount();
	});
});

describe('context — multiple consumers', () => {
	it('all sibling consumers read the same Provider value', () => {
		const r = mount(Siblings);
		expect(r.findAll('.theme').map((el) => el.textContent)).toEqual(['dark', 'dark', 'dark']);
		r.unmount();
	});

	it('distinct contexts do not leak into each other', () => {
		const r = mount(TwoContexts);
		expect(r.find('.theme').textContent).toBe('dark');
		expect(r.find('.user').textContent).toBe('alice');
		expect(r.find('.combined').textContent).toBe('dark/alice');
		r.unmount();
	});
});

describe('context — inside control flow', () => {
	it('use() inside an if-branch reads the active Provider', () => {
		const r = mount(ConditionalUse, { show: true });
		expect(r.find('.theme').textContent).toBe('dark');
		r.update(ConditionalUse, { show: false });
		expect(r.findAll('.theme')).toHaveLength(0);
		expect(r.find('.hidden').textContent).toBe('hidden');
		r.update(ConditionalUse, { show: true });
		expect(r.find('.theme').textContent).toBe('dark');
		r.unmount();
	});

	it('use() inside for-of items reads the active Provider per item', () => {
		const r = mount(ListConsumers, { items: [1, 2, 3], value: 42 });
		expect(r.findAll('.count').map((el) => el.textContent)).toEqual(['42', '42', '42']);
		r.unmount();
	});

	it('Provider value updates flow to all for-of consumers', () => {
		const r = mount(LiveCount, { ids: ['a', 'b', 'c'] });
		expect(r.findAll('.count').map((el) => el.textContent)).toEqual(['0', '0', '0']);
		r.click('#inc');
		expect(r.findAll('.count').map((el) => el.textContent)).toEqual(['1', '1', '1']);
		r.click('#inc');
		r.click('#inc');
		expect(r.findAll('.count').map((el) => el.textContent)).toEqual(['3', '3', '3']);
		r.unmount();
	});
});

describe('context — through portals', () => {
	it('Provider wraps a portal — portal-target consumers see the value', () => {
		const target = document.createElement('aside');
		document.body.appendChild(target);
		const r = mount(PortalledContext, { target });
		// Portal content lives in `target`, NOT in the app container.
		expect(r.findAll('.portal-content')).toHaveLength(0);
		expect(target.querySelector('.portal-content')).not.toBe(null);
		// And the consumer inside the portal sees the outer Provider's value.
		expect(target.querySelector('.theme')!.textContent).toBe('from-portal-parent');
		r.unmount();
		target.remove();
	});
});
