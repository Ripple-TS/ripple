import { set_attribute, set_inner_html } from 'ripple/internal/client';

it(
	'keeps SVG script writes in their namespace instead of using HTML-only script properties',
	() => {
		const script = document.createElementNS('http://www.w3.org/2000/svg', 'script');
		set_attribute(script, 'src', '/example.js');
		set_inner_html(script, 'void 0');
		expect(script.getAttribute('src')).toBe('/example.js');
		expect(script.textContent).toBe('void 0');
		expect(Object.hasOwn(script, 'src')).toBe(false);
		expect(Object.hasOwn(script, 'text')).toBe(false);
	},
);
