import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import {
	ConnectedRef,
	RefInLayout,
	NestedTiming,
	RefAndLayout,
	FragmentTiming,
} from './_fixtures/ref-timing.tsrx';

describe('ref attach timing (React 19 commit-phase)', () => {
	it('a callback ref fires with a node already connected to the document', () => {
		let node: any = null;
		let connected: any = null;
		const r = mount(ConnectedRef, {
			observe: (el: any) => {
				node = el;
				connected = el && el.isConnected;
			},
		});
		expect(node).toBeInstanceOf(HTMLElement);
		// Before the deferred-attach fix the ref fired on the detached clone
		// (isConnected === false). React attaches refs after DOM insertion.
		expect(connected).toBe(true);
		r.unmount();
	});

	it('ref.current is populated by the time a layout effect runs', () => {
		let seen: any = undefined;
		const r = mount(RefInLayout, { observe: (el: any) => (seen = el) });
		expect(seen).toBeInstanceOf(HTMLElement);
		expect(seen.id).toBe('host');
		r.unmount();
	});

	it('refs attach child-before-parent across component boundaries', () => {
		const log: string[] = [];
		const r = mount(NestedTiming, { log: (s: string) => log.push(s) });
		expect(log).toEqual(['child', 'parent']);
		r.unmount();
	});

	it('ref attaches before the layout effect body (mount), layout cleanup before ref detach (unmount)', () => {
		const log: string[] = [];
		const r = mount(RefAndLayout, { log: (s: string) => log.push(s) });
		// Mount: ref attached before the layout effect runs.
		expect(log).toEqual(['ref:attach', 'layout:body']);

		// Unmount: layout effect cleanup runs before the ref detaches — the
		// reverse of mount, matching React's commit teardown order.
		r.unmount();
		expect(log).toEqual(['ref:attach', 'layout:body', 'layout:cleanup', 'ref:cleanup']);
	});

	it('a fragment callback ref fires after its children are connected', () => {
		let connected: any = null;
		const r = mount(FragmentTiming, { observe: (c: boolean) => (connected = c) });
		expect(connected).toBe(true);
		r.unmount();
	});
});
