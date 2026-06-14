// Regression: an unhandled render error must not strand the rest of the flush
// queue or skip commitEffects(). Before the fix, handleRenderError() rethrew
// out of the flush loop, so any block queued after a thrower never rendered and
// effects for already-rendered blocks in the same flush never committed.
import { describe, it, expect } from 'vitest';
import { createRoot, flushSync } from '../../src/index.js';
import {
	Thrower,
	Sibling,
	setThrower,
	setSibling,
	getSiblingLayoutRuns,
} from './_fixtures/scheduler-drain.tsrx';

describe('scheduler — unhandled render error does not strand the flush queue', () => {
	it('a thrower queued before a sibling does not stop the sibling rendering + committing effects', () => {
		const cThrower = document.createElement('div');
		const cSibling = document.createElement('div');
		document.body.appendChild(cThrower);
		document.body.appendChild(cSibling);
		const rThrower = createRoot(cThrower);
		const rSibling = createRoot(cSibling);
		rThrower.render(Thrower);
		rSibling.render(Sibling);
		flushSync(() => {});

		expect(cSibling.querySelector('#sibling')!.textContent).toBe('0');
		const layoutAfterMount = getSiblingLayoutRuns();

		// Single flush: the thrower (queued FIRST) throws during render; the
		// sibling (queued second) must still render and commit its layout effect.
		// The unhandled error still surfaces — but only after the flush drains.
		expect(() => {
			flushSync(() => {
				setThrower(1);
				setSibling(5);
			});
		}).toThrow('boom during render');

		expect(cSibling.querySelector('#sibling')!.textContent).toBe('5');
		expect(getSiblingLayoutRuns()).toBe(layoutAfterMount + 1);

		rThrower.unmount();
		rSibling.unmount();
		cThrower.remove();
		cSibling.remove();
	});
});
