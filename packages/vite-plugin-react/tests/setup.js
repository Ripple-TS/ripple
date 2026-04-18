import { beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** @type {HTMLDivElement} */
let container;

/** @type {import('react-dom/client').Root | null} */
let root;

/**
 * Render a React component into the test container.
 *
 * @param {import('react').ComponentType} Component
 * @param {Record<string, unknown>} [props]
 */
globalThis.render = function render(Component, props) {
	root = createRoot(container);
	act(() => {
		root.render(/** @type {any} */ (Component)(props ?? {}));
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
			root.unmount();
		});
		root = null;
	}
	document.body.removeChild(container);
	globalThis.container = undefined;
});
