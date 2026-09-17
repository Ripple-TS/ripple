import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.js';
import { HTML_ELEMENT_SETTERS, HTML_TAG_SETTERS, HTML_TAGS } from '../src/dom-setters.js';
import { generate } from '../scripts/generate-dom-setters.js';

/** @param {string} template */
function client(template) {
	const { code, errors } = compile(`export function App(props) @{ ${template} }`, 'App.tsrx', {
		mode: 'client',
		hydration: false,
	});
	expect(errors).toEqual([]);
	return code;
}

describe('@tsrx/ripple DOM setters', () => {
	it('is generated from the installed lib.dom.d.ts', () => {
		const file = fileURLToPath(new URL('../src/dom-setters.js', import.meta.url));
		expect(readFileSync(file, 'utf8')).toBe(generate());
	});

	it('lists settable properties per element, without those of Element', () => {
		expect(HTML_ELEMENT_SETTERS.has('title')).toBe(true);
		expect(HTML_ELEMENT_SETTERS.has('tabIndex')).toBe(true);
		expect(HTML_ELEMENT_SETTERS.has('id')).toBe(false);
		expect(HTML_ELEMENT_SETTERS.has('className')).toBe(false);
		expect(HTML_TAG_SETTERS.input).toContain('indeterminate');
		expect(HTML_TAG_SETTERS.video).toContain('currentTime');
		expect(HTML_TAG_SETTERS.div).not.toContain('value');
		expect(HTML_TAGS.has('div')).toBe(true);
	});

	it('assigns a property, sets an attribute, or leaves it to the runtime', () => {
		// A settable property of the element: a non-string value is assigned.
		expect(client('<video currentTime={props.t} />')).toMatch(
			/_\$_\.set_property_value\([\w.]+, 'currentTime', /,
		);
		expect(client('<div title={props.t} />')).toMatch(
			/_\$_\.set_property_value\([\w.]+, 'title', /,
		);
		// Not a property: `setAttribute` alone, no setter walk.
		expect(client('<div data-x={props.x} />')).toMatch(
			/_\$_\.set_attribute_value\([\w.]+, 'data-x', /,
		);
		expect(client('<div tabindex={props.x} />')).toMatch(
			/_\$_\.set_attribute_value\([\w.]+, 'tabindex', /,
		);
		expect(client('<foo bar={props.x} />')).toMatch(/_\$_\.set_attribute_value\([\w.]+, 'bar', /);
		// Only the runtime can tell: a custom element, an SVG name, namespaced content.
		expect(client('<my-el foo={props.x} />')).toMatch(/_\$_\.set_attribute\([\w.]+, 'foo', /);
		expect(client('<a href={props.x} />')).toMatch(/_\$_\.set_attribute\([\w.]+, 'href', /);
		expect(client('<svg><path d={props.x} /></svg>')).toMatch(/_\$_\.set_attribute\([\w.]+, 'd', /);
		// A plain value is written once, with the same helpers.
		const once = client('<div title={props} data-x={props} />');
		expect(once).toContain("_$_.set_property_value(div, 'title', props)");
		expect(once).toContain("_$_.set_attribute_value(div, 'data-x', props)");
	});
});
