import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import { SpreadToggle, SpreadDirect } from './_fixtures/spread-ref.tsrx';

describe('spread-supplied ref (React 19 parity with ref={})', () => {
	it('callback ref via spread runs its cleanup-return on conditional detach + unmount', () => {
		const attaches: any[] = [];
		const cleanups: any[] = [];
		const cb = (el: any) => {
			attaches.push(el);
			return () => cleanups.push(el);
		};
		const r = mount(SpreadToggle, { attrs: { id: 'target', ref: cb } });
		expect(attaches).toHaveLength(1);
		expect(attaches[0]).toBeInstanceOf(HTMLElement);
		expect(cleanups).toHaveLength(0);
		const node = attaches[0];

		// Hide → @if unmounts the span → spread ref's cleanup runs (not ref(null)).
		r.click('#toggle');
		expect(r.findAll('#target')).toHaveLength(0);
		expect(cleanups).toEqual([node]);

		// Show again → re-attach; unmount → detach again.
		r.click('#toggle');
		expect(attaches).toHaveLength(2);
		r.unmount();
		expect(cleanups).toHaveLength(2);
	});

	it('object ref via spread sets and nulls .current', () => {
		const ref: { current: any } = { current: null };
		const r = mount(SpreadToggle, { attrs: { id: 'target', ref } });
		expect(ref.current).toBeInstanceOf(HTMLElement);

		r.click('#toggle'); // hide → detach
		expect(ref.current).toBe(null);
		r.unmount();
	});

	it('array ref via spread attaches every member (no .current corruption)', () => {
		const objRef: { current: any } = { current: null };
		const cbHits: any[] = [];
		const r = mount(SpreadDirect, {
			attrs: { id: 'target', ref: [objRef, (el: any) => cbHits.push(el)] },
		});
		expect(objRef.current).toBeInstanceOf(HTMLElement);
		expect(cbHits).toHaveLength(1);
		expect(cbHits[0]).toBeInstanceOf(HTMLElement);
		r.unmount();
		expect(objRef.current).toBe(null);
	});

	it('changing the spread ref across renders detaches old before attaching new', () => {
		const log: string[] = [];
		const a = (el: any) => {
			log.push(el ? 'A:attach' : 'A:null');
			return () => log.push('A:cleanup');
		};
		const b = (el: any) => {
			log.push(el ? 'B:attach' : 'B:null');
			return () => log.push('B:cleanup');
		};
		const r = mount(SpreadDirect, { attrs: { id: 'target', ref: a } });
		expect(log).toEqual(['A:attach']);

		r.update(SpreadDirect, { attrs: { id: 'target', ref: b } });
		expect(log).toEqual(['A:attach', 'A:cleanup', 'B:attach']);

		r.unmount();
		expect(log).toEqual(['A:attach', 'A:cleanup', 'B:attach', 'B:cleanup']);
	});

	it('spread callback ref fires with a connected node (deferred to commit)', () => {
		let connected: any = null;
		const r = mount(SpreadDirect, {
			attrs: {
				id: 'target',
				ref: (el: any) => {
					connected = el && el.isConnected;
				},
			},
		});
		expect(connected).toBe(true);
		r.unmount();
	});

	it('removing the ref key from the spread detaches the prior ref', () => {
		const log: string[] = [];
		const a = (el: any) => {
			log.push(el ? 'A:attach' : 'A:null');
			return () => log.push('A:cleanup');
		};
		const r = mount(SpreadDirect, { attrs: { id: 'target', ref: a } });
		expect(log).toEqual(['A:attach']);

		// Re-render with the ref key gone — old ref must detach.
		r.update(SpreadDirect, { attrs: { id: 'target' } });
		expect(log).toEqual(['A:attach', 'A:cleanup']);
		r.unmount();
		expect(log).toEqual(['A:attach', 'A:cleanup']);
	});
});
