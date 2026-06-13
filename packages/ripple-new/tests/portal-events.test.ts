import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from './_helpers';
import { flushSync } from '../src/index.js';
import {
	BasicPortalClick,
	CrossPortalBubble,
	StopPropagation,
	TwoPortalsSameTarget,
	TogglePortal,
} from './_fixtures/portal-events.tsrx';

// Each test allocates its own portal target attached to document.body, so the
// ripple-new event-delegation listeners are scoped to that target (matching
// React-17-shape behaviour).
let portalTarget: HTMLElement;

beforeEach(() => {
	portalTarget = document.createElement('section');
	portalTarget.id = 'portal-target';
	document.body.appendChild(portalTarget);
});

afterEach(() => {
	portalTarget.remove();
});

function clickIn(target: ParentNode, selector: string): void {
	const el = target.querySelector(selector) as HTMLElement | null;
	if (!el) throw new Error(`no element matching ${selector}`);
	flushSync(() => el.click());
}

describe('portal — event delegation', () => {
	it('fires click handlers attached INSIDE the portal contents', () => {
		const r = mount(BasicPortalClick, { target: portalTarget });
		expect(r.find('.count').textContent).toBe('0');

		clickIn(portalTarget, '.inside-btn');
		expect(r.find('.count').textContent).toBe('1');

		clickIn(portalTarget, '.inside-btn');
		clickIn(portalTarget, '.inside-btn');
		expect(r.find('.count').textContent).toBe('3');

		r.unmount();
	});

	it('bubbles events OUT of the portal to a handler on the React parent', () => {
		const r = mount(CrossPortalBubble, { target: portalTarget });
		expect(r.find('.inner-count').textContent).toBe('0');
		expect(r.find('.outer-count').textContent).toBe('0');

		// One click on the inner button should fire BOTH the inner button's
		// handler AND the outer div's handler — that's the whole point of the
		// $$portalParent jump: bubble continues up the React tree, not just the
		// portal target's DOM ancestors.
		clickIn(portalTarget, '.inside-btn');
		expect(r.find('.inner-count').textContent).toBe('1');
		expect(r.find('.outer-count').textContent).toBe('1');

		clickIn(portalTarget, '.inside-btn');
		expect(r.find('.inner-count').textContent).toBe('2');
		expect(r.find('.outer-count').textContent).toBe('2');

		r.unmount();
	});

	it('respects stopPropagation — outer handler does not fire when inner cancels bubbling', () => {
		const r = mount(StopPropagation, { target: portalTarget });

		clickIn(portalTarget, '.inside-btn');
		expect(r.find('.inner-count').textContent).toBe('1');
		expect(r.find('.outer-count').textContent).toBe('0');

		r.unmount();
	});

	it('two portals into the same target — both inner handlers fire independently', () => {
		const r = mount(TwoPortalsSameTarget, { target: portalTarget });
		expect(r.find('.a-count').textContent).toBe('0');
		expect(r.find('.b-count').textContent).toBe('0');

		clickIn(portalTarget, '.btn-a');
		expect(r.find('.a-count').textContent).toBe('1');
		expect(r.find('.b-count').textContent).toBe('0');

		clickIn(portalTarget, '.btn-b');
		clickIn(portalTarget, '.btn-b');
		expect(r.find('.a-count').textContent).toBe('1');
		expect(r.find('.b-count').textContent).toBe('2');

		r.unmount();
	});

	it('unmounting a portal detaches the listener (no orphaned dispatch)', () => {
		const r = mount(TogglePortal, { target: portalTarget });

		// Capture the inside-btn before we unmount — once toggled off, the DOM
		// is gone from portalTarget. We want to verify that REMOVING the portal
		// cleans up the listener; the easiest signal is "the second mount of the
		// portal doesn't end up with double listeners firing twice."
		expect(portalTarget.querySelector('.inside-btn')).not.toBe(null);

		r.click('.toggle'); // close: portal unmounts, listener detached
		expect(portalTarget.querySelector('.inside-btn')).toBe(null);

		r.click('.toggle'); // reopen: portal remounts, listener re-attached
		expect(portalTarget.querySelector('.inside-btn')).not.toBe(null);

		// After remount, the inside-btn has no click handler stamped in this
		// fixture — we're really verifying that no exception is thrown by a
		// stale dispatch path (e.g. iterating handlers on the now-detached old
		// portal block). The smoke test here is just that mount/unmount cycle
		// works cleanly across the delegation register/unregister boundary.
		clickIn(portalTarget, '.inside-btn');

		r.unmount();
	});

	it('unmounting the entire root detaches portal-target listeners', () => {
		const r = mount(BasicPortalClick, { target: portalTarget });

		// Sanity: click works before unmount.
		clickIn(portalTarget, '.inside-btn');
		expect(r.find('.count').textContent).toBe('1');

		r.unmount();
		// Portal contents are gone — the DOM was removed when the parent block
		// unmounted (recursive disposal). The listener on portalTarget was also
		// released via registerDelegationTarget's refcount.
		expect(portalTarget.querySelector('.inside-btn')).toBe(null);

		// Manually inject a button that would have BEEN a handler-attached node
		// before the listener was detached. Clicking it should fire NOTHING (no
		// exception, no leaked handler).
		const stray = document.createElement('button');
		stray.className = 'stray';
		portalTarget.appendChild(stray);
		let leakedHandlerFired = false;
		// Attach an $$click via the same DOM-property convention the runtime uses,
		// to detect whether the (now-detached) ripple-new listener still runs.
		(stray as any).$$click = () => {
			leakedHandlerFired = true;
		};
		stray.click();
		expect(leakedHandlerFired).toBe(false);
		stray.remove();
	});
});
