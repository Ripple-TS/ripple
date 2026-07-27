import { describe, expect, it } from 'vitest';
import { TsrxInTsxExpressionApp } from './tsx-expression-tsrx-components.tsrx';

export function runTsxExpressionTsrxRuntimeTests() {
	async function settle() {
		const flush = globalThis.flush;
		if (flush) {
			await flush();
		}
	}

	/** @param {unknown} Component */
	async function mount(Component) {
		await globalThis.render(Component);
		await settle();
	}

	/** @param {string} selector */
	function text(selector) {
		return globalThis.container.querySelector(selector)?.textContent ?? null;
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
