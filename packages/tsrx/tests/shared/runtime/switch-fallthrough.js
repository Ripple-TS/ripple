import { describe, expect, it } from 'vitest';
import { AppSwitchEmptyCase, AppSwitchIsolated } from './switch-fallthrough-components.tsrx';

/**
 * Shared runtime suite for JSX `@switch` case isolation across all JSX targets.
 * The exported name is kept for existing target test imports.
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

	describe('switch case isolation', () => {
		it('renders only the matched case when status === "idle"', async () => {
			await mount(AppSwitchIsolated, { status: 'idle' });
			expect_rendered({ idle: true, active: false, offline: false, def: false });
		});

		it('renders only the matched case when status === "active"', async () => {
			await mount(AppSwitchIsolated, { status: 'active' });
			expect_rendered({ idle: false, active: true, offline: false, def: false });
		});

		it('renders only the matched case when status === "offline"', async () => {
			await mount(AppSwitchIsolated, { status: 'offline' });
			expect_rendered({ idle: false, active: false, offline: true, def: false });
		});

		it('renders only default when no case matches', async () => {
			await mount(AppSwitchIsolated, { status: 'nope' });
			expect_rendered({ idle: false, active: false, offline: false, def: true });
		});

		it('does not treat empty cases as aliases for later cases', async () => {
			await mount(AppSwitchEmptyCase, { status: 'idle' });
			expect_rendered({ idle: false, active: false, offline: false, def: false });

			await mount(AppSwitchEmptyCase, { status: 'active' });
			expect_rendered({ idle: false, active: true, offline: false, def: false });
		});
	});
}
