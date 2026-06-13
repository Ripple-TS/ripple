// FragmentInstance.focus() / focusLast() / blur() — React canary parity.
//
// Focus-walking rules pinned here:
//   - tree order, depth-first
//   - inherently focusable tags (input/button/select/textarea/a[href]) +
//     elements with tabIndex >= 0 OR contenteditable="true"
//   - disabled and tabIndex < 0 → skipped
//   - hidden → skipped
//   - blur() only affects the active element when it lives INSIDE the
//     fragment range (no surprise blurs of elements outside the scope)
import { describe, it, expect } from 'vitest';
import { mount } from '../_helpers';
import { FragmentInstance } from '../../src/index.js';
import {
	TwoInputs,
	DisabledThenButton,
	NonFocusableBeforeButton,
	NoFocusable,
	ExplicitTabIndex,
	SkipsNegativeTabIndex,
	BlurInside,
	BlurOutside,
} from './_fixtures/fragment-refs-focus.tsrx';

function makeRef(): { current: FragmentInstance | null } {
	return { current: null };
}

describe('FragmentInstance.focus / focusLast / blur', () => {
	it('focus() focuses the first focusable child in tree order', () => {
		const fragRef = makeRef();
		const r = mount(TwoInputs, { fragRef });
		fragRef.current!.focus();
		expect(document.activeElement).toBe(r.find('#a'));
		r.unmount();
	});

	it('focus() accepts a FocusOptions object and forwards it to .focus()', () => {
		const fragRef = makeRef();
		const r = mount(TwoInputs, { fragRef });
		const target = r.find('#a') as HTMLInputElement;
		let receivedOptions: FocusOptions | undefined;
		const originalFocus = target.focus;
		target.focus = function (opts?: FocusOptions) {
			receivedOptions = opts;
			return originalFocus.call(this, opts);
		};
		fragRef.current!.focus({ preventScroll: true });
		expect(receivedOptions).toEqual({ preventScroll: true });
		r.unmount();
	});

	it('focus() skips disabled controls', () => {
		const fragRef = makeRef();
		const r = mount(DisabledThenButton, { fragRef });
		fragRef.current!.focus();
		// Disabled <button> isn't picked; the next button is.
		expect(document.activeElement).toBe(r.find('#good'));
		r.unmount();
	});

	it('focus() skips non-focusable element ancestors and lands on the first focusable descendant', () => {
		const fragRef = makeRef();
		const r = mount(NonFocusableBeforeButton, { fragRef });
		fragRef.current!.focus();
		expect(document.activeElement).toBe(r.find('#target'));
		r.unmount();
	});

	it('focus() is a no-op when there is nothing focusable in the fragment', () => {
		const fragRef = makeRef();
		const r = mount(NoFocusable, { fragRef });
		const before = document.activeElement;
		fragRef.current!.focus();
		// activeElement unchanged → focus() didn't move it.
		expect(document.activeElement).toBe(before);
		r.unmount();
	});

	it('focus() honours explicit tabIndex=0 on a div', () => {
		const fragRef = makeRef();
		const r = mount(ExplicitTabIndex, { fragRef });
		fragRef.current!.focus();
		expect(document.activeElement).toBe(r.find('#tabbable'));
		r.unmount();
	});

	it('focus() / focusLast() skip elements with tabIndex=-1', () => {
		const fragRef = makeRef();
		const r = mount(SkipsNegativeTabIndex, { fragRef });
		fragRef.current!.focus();
		expect(document.activeElement).toBe(r.find('#keep'));
		fragRef.current!.focusLast();
		expect(document.activeElement).toBe(r.find('#keep'));
		r.unmount();
	});

	it('focusLast() focuses the LAST focusable child in tree order', () => {
		const fragRef = makeRef();
		const r = mount(TwoInputs, { fragRef });
		fragRef.current!.focusLast();
		expect(document.activeElement).toBe(r.find('#b'));
		r.unmount();
	});

	it('blur() blurs an active element that lives inside the fragment', () => {
		const fragRef = makeRef();
		const r = mount(BlurInside, { fragRef });
		const input = r.find('#inside') as HTMLInputElement;
		input.focus();
		expect(document.activeElement).toBe(input);
		fragRef.current!.blur();
		// blur removed focus → activeElement falls back to <body>.
		expect(document.activeElement).not.toBe(input);
		r.unmount();
	});

	it('blur() is a no-op when the focused element is OUTSIDE the fragment', () => {
		const fragRef = makeRef();
		const r = mount(BlurOutside, { fragRef });
		const outside = r.find('#outside') as HTMLInputElement;
		outside.focus();
		expect(document.activeElement).toBe(outside);
		fragRef.current!.blur();
		// Still focused — blur() didn't touch the outside element.
		expect(document.activeElement).toBe(outside);
		r.unmount();
	});
});
