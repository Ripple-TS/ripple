import { beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act, createElement } from 'react';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.act = act;

/** @type {HTMLDivElement} */
let container;

/** @type {import('react-dom/client').Root | null} */
let root;

globalThis.render = async function render(Component, props) {
	root = createRoot(container);
	await act(async () => {
		/** @type {import('react-dom/client').Root} */ (root).render(createElement(Component, props));
	});
};

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
	globalThis.container = container;
});

afterEach(() => {
	if (root) {
		act(() => {
			/** @type {import('react-dom/client').Root} */ (root).unmount();
		});
		root = null;
	}
	// cleanup but these are guaranteed to be present during tests
	// so tests can safely references container as a global
	document.body.removeChild(container);
	globalThis.container = /** @type {HTMLDivElement} */ (/** @type {unknown} */ (undefined));
});
