import { describe, expect, it } from 'vitest';
import {
	AppBreakAfterActive,
	AppBreakAfterOffline,
	AppFallthroughAll,
} from './switch-fallthrough-components.tsrx';

/**
 * Shared runtime suite for `switch`-statement fall-through across all four JSX
 * targets (React, Preact, Solid, Vue). The components live in the sibling
 * `switch-fallthrough-components.tsrx`; whichever platform vite plugin is
 * running the test session transforms that file with its own JSX lowering
 * on import (a JS `switch` for React/Preact/Vue, a `<Switch>/<Match>` for
 * Solid). Each platform's `runtime.test.tsrx` just calls
 * `runSwitchFallthroughRuntimeTests()` with no arguments — the components
 * are baked in.
 *
 * The mounted DOM is expected to be identical across targets because
 * fall-through is defined by JavaScript `switch` semantics regardless of
 * how each target lowers the switch internally.
 *
 * Each test mounts via the platform-supplied `globalThis.render` (set up by
 * each plugin's `tests/setup.js`) and reads the resulting DOM via the
 * platform-supplied `globalThis.container`. We yield via `globalThis.flush`
 * when available (Solid, Vue) so asynchronous reactive effects settle before
 * we assert.
 *
 * The three baked-in components share the same
 * `<span class="span-...">{obj.X}</span>` shape so the assertions can
 * cross-check by class name; only the placement of `break` differs.
 *
 *   - `AppFallthroughAll`     — no `break` anywhere (full fall-through chain
 *     into `default`).
 *   - `AppBreakAfterActive`   — `break` after the `active` case body.
 *   - `AppBreakAfterOffline`  — `break` after the `offline` case body.
 */
export function runSwitchFallthroughRuntimeTests() {
	/**
	 * @param {string} class_name
	 * @returns {string | null}
	 */
	function text_of(class_name) {
		const container = /** @type {HTMLElement} */ (/** @type {any} */ (globalThis).container);
		return container.querySelector(`.${class_name}`)?.textContent ?? null;
	}

	async function settle() {
		const flush = /** @type {(() => Promise<void>) | undefined} */ (
			/** @type {any} */ (globalThis).flush
		);
		if (flush) {
			await flush();
		}
	}

	/**
	 * @param {any} Component
	 * @param {{ status: string }} props
	 */
	async function mount(Component, props) {
		await globalThis
			/** @type {any} */ .render(Component, props);
		await settle();
	}

	/**
	 * @param {{ idle: boolean, active: boolean, offline: boolean, def: boolean }} expected
	 */
	function expect_rendered(expected) {
		expect(text_of('span-idle')).toBe(expected.idle ? 'Online' : null);
		expect(text_of('span-active')).toBe(expected.active ? 'Away' : null);
		expect(text_of('span-offline')).toBe(expected.offline ? 'Offline' : null);
		expect(text_of('span-default')).toBe(expected.def ? 'Indeterminate' : null);
	}

	describe('switch fall-through — no break statements', () => {
		// Every case falls through into the next; `default` is the terminal
		// arm. Matching at any entry point renders that body plus every
		// downstream body until the end of the switch.

		it('renders idle + active + offline + default when status === "idle"', async () => {
			await mount(AppFallthroughAll, { status: 'idle' });
			expect_rendered({ idle: true, active: true, offline: true, def: true });
		});

		it('renders active + offline + default when status === "active"', async () => {
			await mount(AppFallthroughAll, { status: 'active' });
			expect_rendered({ idle: false, active: true, offline: true, def: true });
		});

		it('renders offline + default when status === "offline"', async () => {
			await mount(AppFallthroughAll, { status: 'offline' });
			expect_rendered({ idle: false, active: false, offline: true, def: true });
		});

		it('renders only default when no case matches', async () => {
			await mount(AppFallthroughAll, { status: 'nope' });
			expect_rendered({ idle: false, active: false, offline: false, def: true });
		});
	});

	describe('switch fall-through — break after "active"', () => {
		// The break terminates fall-through after the `active` body. Matching
		// idle or active stops at active; matching offline still falls into
		// default (no break after offline).

		it('renders idle + active and stops at the break when status === "idle"', async () => {
			await mount(AppBreakAfterActive, { status: 'idle' });
			expect_rendered({ idle: true, active: true, offline: false, def: false });
		});

		it('renders active only when status === "active"', async () => {
			await mount(AppBreakAfterActive, { status: 'active' });
			expect_rendered({ idle: false, active: true, offline: false, def: false });
		});

		it('renders offline + default when status === "offline"', async () => {
			await mount(AppBreakAfterActive, { status: 'offline' });
			expect_rendered({ idle: false, active: false, offline: true, def: true });
		});

		it('renders only default when no case matches', async () => {
			await mount(AppBreakAfterActive, { status: 'nope' });
			expect_rendered({ idle: false, active: false, offline: false, def: true });
		});
	});

	describe('switch fall-through — break after "offline"', () => {
		// The break terminates fall-through after the `offline` body. Matching
		// any of idle / active / offline stops before reaching `default`.

		it('renders idle + active + offline when status === "idle"', async () => {
			await mount(AppBreakAfterOffline, { status: 'idle' });
			expect_rendered({ idle: true, active: true, offline: true, def: false });
		});

		it('renders active + offline when status === "active"', async () => {
			await mount(AppBreakAfterOffline, { status: 'active' });
			expect_rendered({ idle: false, active: true, offline: true, def: false });
		});

		it('renders offline only when status === "offline"', async () => {
			await mount(AppBreakAfterOffline, { status: 'offline' });
			expect_rendered({ idle: false, active: false, offline: true, def: false });
		});

		it('renders only default when no case matches', async () => {
			await mount(AppBreakAfterOffline, { status: 'nope' });
			expect_rendered({ idle: false, active: false, offline: false, def: true });
		});
	});
}
