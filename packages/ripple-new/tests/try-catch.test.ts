import { describe, it, expect } from 'vitest';
import { mount, nextPaint } from './_helpers';
import { RenderBoundary, EffectBoundary, Nested, StatefulInside } from './_fixtures/try-catch.tsrx';

describe('tryBlock — render errors', () => {
	it('catches a child render error and shows the fallback', () => {
		const r = mount(RenderBoundary, { bang: true });
		expect(r.findAll('.ok')).toHaveLength(0);
		expect(r.find('.caught .msg').textContent).toBe('render boom');
		r.unmount();
	});

	it('renders the try body when the child does not throw', () => {
		const r = mount(RenderBoundary, { bang: false });
		expect(r.find('.ok').textContent).toBe('rendered');
		expect(r.findAll('.caught')).toHaveLength(0);
		r.unmount();
	});

	it('reset() re-attempts the try body', () => {
		const r = mount(RenderBoundary, { bang: true });
		expect(r.find('.caught .msg').textContent).toBe('render boom');
		// Make subsequent renders safe, then click reset.
		r.update(RenderBoundary, { bang: false });
		// Still in catch (props update doesn't auto-retry — reset does).
		r.click('.caught button');
		expect(r.find('.ok').textContent).toBe('rendered');
		expect(r.findAll('.caught')).toHaveLength(0);
		r.unmount();
	});
});

describe('tryBlock — effect errors', () => {
	it('catches an effect throw and swaps to fallback', async () => {
		const r = mount(EffectBoundary, { bang: false });
		expect(r.find('.ok').textContent).toBe('ok-for-now');

		// Trigger the effect to throw on the next render.
		r.update(EffectBoundary, { bang: true });
		// Effect bodies run after paint — wait.
		await nextPaint();
		expect(r.findAll('.ok')).toHaveLength(0);
		expect(r.find('.caught .msg').textContent).toBe('effect boom');
		r.unmount();
	});
});

describe('tryBlock — nesting', () => {
	it('inner boundary catches its own subtree before outer sees it', () => {
		const r = mount(Nested);
		expect(r.find('.inner-msg').textContent).toBe('inner: always');
		expect(r.findAll('.outer-msg')).toHaveLength(0);
		expect(r.find('.outer')).not.toBeNull(); // outer still rendered fine
		r.unmount();
	});
});

describe('tryBlock — stateful try body', () => {
	it('does not switch to catch on state-only re-renders', () => {
		const r = mount(StatefulInside);
		expect(r.find('button').textContent).toBe('0');
		r.click('#inc');
		r.click('#inc');
		expect(r.find('button').textContent).toBe('2');
		expect(r.findAll('.caught')).toHaveLength(0);
		r.unmount();
	});
});
