import { describe, expect, it } from 'vitest';
import { TsrxInTsxExpressionApp } from './tsx-expression-tsrx-components.tsrx';

export function runTsxExpressionTsrxRuntimeTests() {
	async function settle() {
		const flush = /** @type {(() => Promise<void>) | undefined} */ (
			/** @type {any} */ (globalThis).flush
		);
		if (flush) {
			await flush();
		}
	}

	async function mount(Component) {
		await globalThis
			/** @type {any} */ .render(Component);
		await settle();
	}

	function text(selector) {
		const container = /** @type {HTMLElement} */ (/** @type {any} */ (globalThis).container);
		return container.querySelector(selector)?.textContent ?? null;
	}

	describe('JSX fragments inside expression values at runtime', () => {
		it('renders JSX passed through regular function JSX props', async () => {
			await mount(TsrxInTsxExpressionApp);

			expect(text('.tsrx-expression-editable-class')).toBe('editable-class');
			expect(text('.tsrx-expression-inner-placeholder .placeholder-class')).toBe(
				'shared placeholder',
			);
			expect(text('.tsrx-expression-plugin-placeholder .placeholder-class')).toBe(
				'shared placeholder',
			);
		});
	});
}
