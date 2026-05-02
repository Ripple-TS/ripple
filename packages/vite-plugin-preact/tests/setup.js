import { afterEach, beforeEach } from 'vitest';
import { h, render as preactRender } from 'preact';
import { act } from 'preact/test-utils';

/** @type {HTMLDivElement} */
let container;

globalThis.render = async function render(Component, props) {
	await act(() => {
		preactRender(h(Component, props ?? {}), container);
	});
};

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
	globalThis.container = container;
});

afterEach(() => {
	preactRender(null, container);
	document.body.removeChild(container);
	globalThis.container = /** @type {HTMLDivElement} */ (/** @type {unknown} */ (undefined));
});
