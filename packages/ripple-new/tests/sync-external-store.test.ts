import { describe, it, expect } from 'vitest';
import { mount, nextPaint } from './_helpers';
import { makeStore, Reader, SwappableReader } from './_fixtures/sync-external-store.tsrx';

// React 18's useSyncExternalStore contract: subscribe on mount, unsubscribe
// on unmount, re-render on every notify, fresh getSnapshot() every render.
// ripple-new implements this on top of the existing useState + useEffect
// machinery, derived from the user's compiler-injected slot.

describe('useSyncExternalStore', () => {
	it('renders the initial snapshot from the store', () => {
		const store = makeStore(7);
		const r = mount(Reader, { store });
		expect(r.find('.value').textContent).toBe('7');
		r.unmount();
	});

	it('subscribes on mount and updates the DOM when the store notifies', async () => {
		const store = makeStore(0);
		const r = mount(Reader, { store });
		await nextPaint();
		expect(store.listenerCount()).toBe(1);
		expect(r.find('.value').textContent).toBe('0');

		store.set(42);
		await nextPaint();
		expect(r.find('.value').textContent).toBe('42');

		store.set(43);
		await nextPaint();
		expect(r.find('.value').textContent).toBe('43');
		r.unmount();
	});

	it('unsubscribes on unmount (store drops its listener)', async () => {
		const store = makeStore(1);
		const r = mount(Reader, { store });
		await nextPaint();
		expect(store.listenerCount()).toBe(1);
		r.unmount();
		await nextPaint();
		expect(store.listenerCount()).toBe(0);
	});

	it('post-unmount store mutations do NOT trigger any work', async () => {
		const store = makeStore(0);
		const r = mount(Reader, { store });
		await nextPaint();
		r.unmount();
		await nextPaint();
		// No throw, no stray DOM mutation — the unsubscribe contract is honored.
		expect(() => store.set(999)).not.toThrow();
		expect(store.listenerCount()).toBe(0);
	});

	it('swapping the store unsubscribes from the old and subscribes to the new', async () => {
		const a = makeStore(10);
		const b = makeStore(20);
		const r = mount(SwappableReader, { store: a, alt: b });
		await nextPaint();
		expect(a.listenerCount()).toBe(1);
		expect(b.listenerCount()).toBe(0);
		expect(r.find('.value').textContent).toBe('10');

		r.update(SwappableReader, { store: b, alt: b });
		await nextPaint();
		// Old store released, new store has the listener, snapshot reflects b.
		expect(a.listenerCount()).toBe(0);
		expect(b.listenerCount()).toBe(1);
		expect(r.find('.value').textContent).toBe('20');

		// Mutating the OLD store should NOT update the DOM — we re-subscribed.
		a.set(999);
		await nextPaint();
		expect(r.find('.value').textContent).toBe('20');

		// Mutating the NEW store should update the DOM.
		b.set(21);
		await nextPaint();
		expect(r.find('.value').textContent).toBe('21');
		r.unmount();
	});

	it('multiple components sharing one store all see the same updates', async () => {
		const store = makeStore(0);
		const r1 = mount(Reader, { store });
		const r2 = mount(Reader, { store });
		await nextPaint();
		expect(store.listenerCount()).toBe(2);

		store.set(99);
		await nextPaint();
		expect(r1.find('.value').textContent).toBe('99');
		expect(r2.find('.value').textContent).toBe('99');

		r1.unmount();
		await nextPaint();
		expect(store.listenerCount()).toBe(1);
		r2.unmount();
		await nextPaint();
		expect(store.listenerCount()).toBe(0);
	});
});
