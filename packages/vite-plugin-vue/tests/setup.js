import { createVaporApp, nextTick } from './vue-runtime-shim.js';

/** @type {HTMLDivElement} */
let container;

/** @type {import('vue').App | null} */
let app = null;

globalThis.render = async function render(Component, props) {
	app = createVaporApp(Component, props ?? {});
	app.mount(container);
	await nextTick();
	await nextTick();
};

/**
 * Flush pending Vue update work.
 *
 * @returns {Promise<void>}
 */
globalThis.flush = async function flush() {
	for (let i = 0; i < 4; i++) {
		await nextTick();
	}
};

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
	globalThis.container = container;
});

afterEach(() => {
	if (app) {
		app.unmount();
		app = null;
	}
	document.body.removeChild(container);
	globalThis.container = /** @type {HTMLDivElement} */ (/** @type {unknown} */ (undefined));
});
