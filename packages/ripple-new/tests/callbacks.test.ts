import { describe, it, expect, vi } from 'vitest';
import { mount, nextPaint } from './_helpers';
import {
	CallbackIdentity,
	EffectEventSubscriber,
	EffectEventIdentity,
} from './_fixtures/callbacks.tsrx';

describe('useCallback', () => {
	it('returns the same function reference when deps are unchanged', () => {
		const observe = vi.fn();
		const r = mount(CallbackIdentity, { depKey: 'a', observe });
		const first = observe.mock.calls[0][0];
		expect(typeof first).toBe('function');
		expect(first(1)).toBe(2);
		// Trigger re-render via state change, same deps → same identity.
		r.click('#inc');
		expect(observe.mock.calls.length).toBeGreaterThan(1);
		const afterStateChange = observe.mock.calls.at(-1)![0];
		expect(afterStateChange).toBe(first);
		r.unmount();
	});

	it('returns a new function reference when deps change', () => {
		const observe = vi.fn();
		const r = mount(CallbackIdentity, { depKey: 'a', observe });
		const first = observe.mock.calls[0][0];
		r.update(CallbackIdentity, { depKey: 'b', observe }); // dep changed
		const second = observe.mock.calls.at(-1)![0];
		expect(second).not.toBe(first);
		r.update(CallbackIdentity, { depKey: 'b', observe }); // same dep — same identity
		const third = observe.mock.calls.at(-1)![0];
		expect(third).toBe(second);
		r.unmount();
	});
});

describe('useEffectEvent', () => {
	it('returns a stable function identity across renders', () => {
		const observe = vi.fn();
		const r = mount(EffectEventIdentity, { observe });
		const first = observe.mock.calls[0][0];
		r.click('button');
		r.click('button');
		const observed = observe.mock.calls.map((c) => c[0]);
		// Every observed identity is the same function.
		for (const fn of observed) expect(fn).toBe(first);
		r.unmount();
	});

	it('its body always sees the latest closure values', async () => {
		const tickLog: string[] = [];
		const fire = { handler: null as any };
		const r = mount(EffectEventSubscriber, { tickLog, fire });
		await nextPaint();
		// Subscription fired once.
		expect(tickLog).toEqual(['subscribe']);
		// Click 3 times — state changes, but no re-subscription (deps are []).
		r.click('#inc');
		r.click('#inc');
		r.click('#inc');
		await nextPaint();
		expect(tickLog).toEqual(['subscribe']); // still just one subscribe
		// Now invoke the stored handler — it should see count=3.
		fire.handler();
		expect(tickLog).toEqual(['subscribe', 'count=3']);
		// Click more, invoke again — sees latest.
		r.click('#inc');
		r.click('#inc');
		fire.handler();
		expect(tickLog).toEqual(['subscribe', 'count=3', 'count=5']);
		r.unmount();
		expect(tickLog).toEqual(['subscribe', 'count=3', 'count=5', 'unsubscribe']);
	});
});
