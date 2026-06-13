import { describe, it, expect } from 'vitest';
import { mount } from './_helpers';
import {
	Hello,
	Counter,
	Greet,
	Mixed,
	SvgStatic,
	SvgDynamic,
	MathStatic,
	MathDynamic,
} from './_fixtures/basic.tsrx';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

describe('basic', () => {
	it('mounts a static element', () => {
		const r = mount(Hello);
		expect(r.html()).toBe('<div class="greet">Hello, world</div>');
		r.unmount();
		expect(r.container.parentNode).toBe(null);
	});

	it('renders props into a text hole (only-child fast path)', () => {
		const r = mount(Counter, { n: 7 });
		expect(r.html()).toBe('<span>7</span>');
		r.unmount();
	});

	it('renders multiple text holes among static text', () => {
		const r = mount(Greet, { name: 'world' });
		expect(r.find('p').textContent).toBe('Hello, world !');
		r.unmount();
	});

	it('mounts nested static elements', () => {
		const r = mount(Mixed);
		expect(r.findAll('#m > span')).toHaveLength(2);
		expect(r.find('.a').textContent).toBe('A');
		expect(r.find('.b').textContent).toBe('B');
		r.unmount();
	});
});

describe('basic — SVG', () => {
	it('places <svg> and its descendants in the SVG namespace', () => {
		const r = mount(SvgStatic);
		const svg = r.find('#chart');
		expect(svg.namespaceURI).toBe(SVG_NS);
		expect(svg.tagName).toBe('svg'); // case-preserving in SVG
		expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
		expect(svg.getAttribute('class')).toBe('chart');

		const circle = r.find('circle');
		expect(circle.namespaceURI).toBe(SVG_NS);
		expect(circle.getAttribute('cx')).toBe('50');
		expect(circle.getAttribute('fill')).toBe('red');

		const g = r.find('g');
		expect(g.namespaceURI).toBe(SVG_NS);
		expect(g.getAttribute('class')).toBe('labels');

		const textEl = svg.querySelector('text')!; // distinguish SVG <text> from text nodes
		expect(textEl.namespaceURI).toBe(SVG_NS);
		expect(textEl.textContent).toBe('hi');
		r.unmount();
	});

	it('updates dynamic class + attributes on SVG without breaking namespace', () => {
		const r = mount(SvgDynamic, { klass: 'one', w: 30, fill: 'red' });
		const svg = r.find('#dyn');
		const rect = r.find('rect');
		expect(svg.namespaceURI).toBe(SVG_NS);
		expect(rect.namespaceURI).toBe(SVG_NS);
		expect(svg.getAttribute('class')).toBe('one'); // must go through setAttribute, NOT .className
		expect(rect.getAttribute('width')).toBe('30');
		expect(rect.getAttribute('fill')).toBe('red');

		r.update(SvgDynamic, { klass: 'two', w: 60, fill: 'blue' });
		expect(svg.getAttribute('class')).toBe('two');
		expect(rect.getAttribute('width')).toBe('60');
		expect(rect.getAttribute('fill')).toBe('blue');

		// Clearing class via null removes the attribute.
		r.update(SvgDynamic, { klass: null, w: 60, fill: 'blue' });
		expect(svg.hasAttribute('class')).toBe(false);
		r.unmount();
	});
});

describe('basic — MathML', () => {
	it('places <math> and its descendants in the MathML namespace', () => {
		const r = mount(MathStatic);
		const math = r.find('#eq');
		expect(math.namespaceURI).toBe(MATHML_NS);
		expect(math.getAttribute('display')).toBe('block');

		const mrow = math.querySelector('mrow')!;
		expect(mrow.namespaceURI).toBe(MATHML_NS);

		const mis = Array.from(math.querySelectorAll('mi'));
		expect(mis).toHaveLength(2);
		for (const mi of mis) expect(mi.namespaceURI).toBe(MATHML_NS);
		expect(mis.map((m) => m.textContent)).toEqual(['a', 'b']);

		const mo = math.querySelector('mo')!;
		expect(mo.namespaceURI).toBe(MATHML_NS);
		expect(mo.textContent).toBe('+');
		r.unmount();
	});

	it('updates dynamic class + attributes on MathML elements', () => {
		const r = mount(MathDynamic, { display: 'block', klass: 'a', value: 1 });
		const math = r.find('#dyneq');
		const mn = r.find('mn');
		expect(math.namespaceURI).toBe(MATHML_NS);
		expect(mn.namespaceURI).toBe(MATHML_NS);
		expect(math.getAttribute('display')).toBe('block');
		expect(mn.getAttribute('class')).toBe('a');
		expect(mn.textContent).toBe('1');

		r.update(MathDynamic, { display: 'inline', klass: 'b', value: 42 });
		expect(math.getAttribute('display')).toBe('inline');
		expect(mn.getAttribute('class')).toBe('b');
		expect(mn.textContent).toBe('42');
		r.unmount();
	});
});
