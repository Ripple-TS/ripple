import { describe, it, expect } from 'vitest';
import { mount } from '../_helpers';
import { ForeignObjectInIf, SvgCallbackRefInIf } from './_fixtures/svg-runtime-foreign.tsrx';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HTML_NS = 'http://www.w3.org/1999/xhtml';

// ============================================================================
// foreignObject namespace switching under RUNTIME insertion
// ============================================================================
// The static-mount case is covered by svg-foreign-object. This drives the same
// SVG → XHTML → SVG push/pop through the createElementNS commit path by toggling
// an @if branch — the path most likely to forget the parent namespace context.
describe('namespace — foreignObject inserted at runtime (@if)', () => {
	it('switches to XHTML inside foreignObject and pops back to SVG for the following sibling', () => {
		const r = mount(ForeignObjectInIf, { show: false, label: 'hello' });
		expect(r.findAll('#fo-svg')).toHaveLength(0);
		expect(r.find('.fallback').textContent).toBe('hidden');

		const assertNamespaces = (label: string) => {
			expect(r.find('#fo-svg').namespaceURI).toBe(SVG_NS);
			// <foreignObject> itself is an SVG element.
			expect(r.find('#fo').namespaceURI).toBe(SVG_NS);
			// Its children switch to the XHTML namespace.
			expect(r.find('#fo-html').namespaceURI).toBe(HTML_NS);
			expect(r.find('#fo-span').namespaceURI).toBe(HTML_NS);
			expect(r.find('#fo-span').textContent).toBe(label);
			// The SVG sibling AFTER foreignObject must pop back to the SVG namespace.
			expect(r.find('#fo-rect').namespaceURI).toBe(SVG_NS);
		};

		// Insert at runtime.
		r.update(ForeignObjectInIf, { show: true, label: 'hello' });
		assertNamespaces('hello');

		// Toggle off then on — the re-mount must reconstruct the same push/pop,
		// not leak the previous context.
		r.update(ForeignObjectInIf, { show: false, label: 'hello' });
		expect(r.findAll('#fo-svg')).toHaveLength(0);
		r.update(ForeignObjectInIf, { show: true, label: 'again' });
		assertNamespaces('again');

		r.unmount();
	});
});

// ============================================================================
// Refs on a foreign element inserted/removed at runtime
// ============================================================================
describe('refs — callback ref on an SVG element inserted at runtime (@if)', () => {
	it('fires with the SVGElement on @if mount and null on @if unmount', () => {
		const calls: any[] = [];
		const observe = (el: any) => calls.push(el);

		const r = mount(SvgCallbackRefInIf, { show: false, observe });
		expect(calls).toHaveLength(0); // branch not mounted yet → ref never attached

		// Insert — ref attaches with the runtime-created SVG element.
		r.update(SvgCallbackRefInIf, { show: true, observe });
		const el = calls.find((c) => c !== null);
		expect(el).toBeTruthy();
		expect(el instanceof SVGElement).toBe(true);
		expect(el.namespaceURI).toBe(SVG_NS);
		expect(el.getAttribute('class')).toBe('target');

		// Remove — the @if teardown must detach the ref (fn(null)).
		r.update(SvgCallbackRefInIf, { show: false, observe });
		expect(calls).toContain(null);

		r.unmount();
	});
});
