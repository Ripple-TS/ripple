import { describe, it, expect } from 'vitest';
import { mount, flushEffects } from './_helpers';
import { flushSync } from '../src/index.js';
import { ActivityHost, NestedActivity, TextActivityHost } from './_fixtures/activity.tsrx';

// Parity with React 19 <Activity mode="hidden"|"visible"> — the portable subset
// of React's Activity-test.js / ReactDOMActivity-test.js (DOM + effect lifecycle
// + state preservation; scheduler/lane/StrictMode-internal tests are excluded).

function setup(initialMode: string) {
	const log: string[] = [];
	let setN: ((u: (v: number) => number) => void) | null = null;
	const opts = {
		mode: initialMode,
		log: (s: string) => log.push(s),
		expose: (fn: any) => (setN = fn),
	};
	const r = mount(ActivityHost, opts);
	flushEffects();
	const child = () => r.container.querySelector('#child') as HTMLElement | null;
	return {
		r,
		log,
		setMode: (m: string) => {
			r.update(ActivityHost, { ...opts, mode: m });
			flushEffects();
		},
		bump: () => {
			flushSync(() => setN!((v) => v + 1));
			flushEffects();
		},
		text: () => child()?.textContent ?? null,
		display: () => child()?.style.display ?? null,
		present: () => child() != null,
	};
}

describe('<Activity> — visible', () => {
	it('mount visible renders children and mounts effects', () => {
		const t = setup('visible');
		expect(t.log).toEqual(['render', 'mount layout', 'mount passive']);
		expect(t.text()).toBe('0');
		expect(t.display()).toBe('');
		t.r.unmount();
	});
});

describe('<Activity> — hidden', () => {
	it('mount hidden renders children + creates state but mounts NO effects, and hides the DOM', () => {
		const t = setup('hidden');
		expect(t.log).toEqual(['render']); // rendered, but no effects
		expect(t.present()).toBe(true); // DOM preserved...
		expect(t.text()).toBe('0'); // ...and rendered
		expect(t.display()).toBe('none'); // ...just visually hidden
		t.r.unmount();
	});
});

describe('<Activity> — toggling visibility', () => {
	it('unmounts effects on hide and re-mounts them on show, preserving state + DOM', () => {
		const t = setup('visible');
		// Build up some state while visible.
		t.bump();
		t.bump();
		expect(t.text()).toBe('2');
		t.log.length = 0;

		// Hide: effect cleanups run (before the DOM is hidden); state + DOM kept.
		t.setMode('hidden');
		expect(t.log).toEqual(['render', 'unmount layout', 'unmount passive']);
		expect(t.display()).toBe('none');
		expect(t.text()).toBe('2'); // state preserved while hidden
		t.log.length = 0;

		// Show: re-render + effects re-mount; state survived the round-trip.
		t.setMode('visible');
		expect(t.log).toEqual(['render', 'mount layout', 'mount passive']);
		expect(t.display()).toBe('');
		expect(t.text()).toBe('2');
		t.r.unmount();
	});

	it('starting hidden then shown defers the first effect mount until reveal', () => {
		const t = setup('hidden');
		expect(t.log).toEqual(['render']);
		t.log.length = 0;

		t.setMode('visible');
		expect(t.log).toEqual(['render', 'mount layout', 'mount passive']);
		expect(t.display()).toBe('');
		t.r.unmount();
	});

	it('skips a passive effect that was queued before the Activity hid', () => {
		// Regression: enqueueEffect skips registration while inactive and
		// deactivateScope fires stored cleanups, but a PendingEffect already
		// sitting in the passive queue (mount drains insertion+layout sync, defers
		// passive) must ALSO be skipped if its subtree hides before the queue
		// drains — otherwise the effect mounts into a hidden subtree.
		const log: string[] = [];
		const opts = { mode: 'visible', log: (s: string) => log.push(s), expose: () => {} };
		const r = mount(ActivityHost, opts);
		// Layout fired synchronously during mount; passive is queued, not yet run.
		expect(log).toContain('mount layout');
		expect(log).not.toContain('mount passive');

		// Hide BEFORE the passive queue drains, then drain it.
		r.update(ActivityHost, { ...opts, mode: 'hidden' });
		flushEffects();

		// The queued passive body must NOT have run into the now-hidden subtree.
		expect(log).not.toContain('mount passive');
		r.unmount();
	});

	it('re-renders while hidden (updates DOM) without running effects', () => {
		const t = setup('hidden');
		t.log.length = 0;
		// Bump state while hidden — DOM must update (prerender) but no effects.
		t.bump();
		expect(t.text()).toBe('1'); // DOM updated while hidden
		expect(t.display()).toBe('none');
		expect(t.log).toEqual(['render']); // re-rendered, still no effects
		t.r.unmount();
	});
});

describe('<Activity> — nested', () => {
	it('an inner visible Activity inside a hidden outer mounts nothing until the outer reveals', () => {
		const log: string[] = [];
		const opts = { outer: 'hidden', inner: 'visible', log: (s: string) => log.push(s) };
		const r = mount(NestedActivity, opts);
		flushEffects();
		// Outer hidden → inner renders but no effects, even though inner is visible.
		expect(log).toEqual(['render inner']);
		expect((r.container.querySelector('#inner') as HTMLElement).style.display).toBe('none');
		log.length = 0;

		// Reveal the outer → inner effects finally mount.
		r.update(NestedActivity, { ...opts, outer: 'visible' });
		flushEffects();
		expect(log).toEqual(['render inner', 'mount inner']);
		expect((r.container.querySelector('#inner') as HTMLElement).style.display).toBe('');
		r.unmount();
	});
});

describe('<Activity> — bare text child', () => {
	// A direct text node has no box and can't take display:none. Hiding must blank
	// its data instead, or the text stays visible while the subtree is "hidden".
	const host = (r: any) => r.container.querySelector('#host') as HTMLElement;

	it('mount hidden hides bare text (data blanked); not visible in the DOM', () => {
		const r = mount(TextActivityHost, { mode: 'hidden', text: 'secret' });
		flushEffects();
		expect(host(r).textContent).toBe(''); // text node blanked
		r.unmount();
	});

	it('mount visible shows the text', () => {
		const r = mount(TextActivityHost, { mode: 'visible', text: 'secret' });
		flushEffects();
		expect(host(r).textContent).toBe('secret');
		r.unmount();
	});

	it('toggling restores the text on show and re-hides on hide', () => {
		const r = mount(TextActivityHost, { mode: 'visible', text: 'secret' });
		flushEffects();
		expect(host(r).textContent).toBe('secret');

		r.update(TextActivityHost, { mode: 'hidden', text: 'secret' });
		expect(host(r).textContent).toBe('');

		r.update(TextActivityHost, { mode: 'visible', text: 'secret' });
		expect(host(r).textContent).toBe('secret');
		r.unmount();
	});
});
