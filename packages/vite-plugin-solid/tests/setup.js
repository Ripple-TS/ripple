import { beforeEach, afterEach } from 'vitest';
import { render as solidRender, createComponent } from '@solidjs/web';

// Solid's `lazy()` re-throws loader rejections through its internal signal
// graph even when an `<Errored>` boundary successfully catches and renders the
// fallback. That surfaces as an "unhandled rejection" in Node once the
// microtask queue drains. Swallow those here so they don't fail test runs —
// the boundary behaviour itself is asserted by the relevant tests.
if (typeof process !== 'undefined' && typeof process.on === 'function') {
	process.on('unhandledRejection', (reason) => {
		if (reason instanceof Error && /async fail|conditional boom|sync boom/.test(reason.message)) {
			return;
		}
		// Re-surface anything else by re-throwing on next tick.
		queueMicrotask(() => {
			throw reason;
		});
	});
}

/** @type {HTMLDivElement} */
let container;

/** @type {(() => void) | null} */
let dispose = null;

/**
 * Render a Solid component into the test container.
 *
 * @param {import('solid-js').Component<any>} Component
 * @param {Record<string, unknown>} [props]
 * @returns {Promise<void>}
 */
globalThis.render = async function render(Component, props) {
	dispose = solidRender(() => createComponent(Component, props ?? {}), container);
	// Let Solid finish initial effects / microtasks.
	await Promise.resolve();
	await Promise.resolve();
};

/**
 * Yield to Solid: flush pending microtasks so that signal updates and
 * promise-backed resources settle before assertions run.
 *
 * @returns {Promise<void>}
 */
globalThis.flush = async function flush() {
	for (let i = 0; i < 4; i++) {
		await Promise.resolve();
	}
};

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
	globalThis.container = container;
});

afterEach(() => {
	if (dispose) {
		dispose();
		dispose = null;
	}
	document.body.removeChild(container);
	globalThis.container = undefined;
});
