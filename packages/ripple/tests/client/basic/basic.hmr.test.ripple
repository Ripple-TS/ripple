import { HMR } from '../../../src/runtime/internal/client/constants.js';
import { hmr } from '../../../src/runtime/internal/client/hmr.js';

describe('basic client > hmr', () => {
	it('handles updates before first render', () => {
		const initial_component = () => {};
		const updated_component = () => {};

		const wrapper = hmr(initial_component);
		const incoming = hmr(updated_component);

		expect(() => {
			wrapper[HMR].update(incoming);
		}).not.toThrow();

		expect(wrapper[HMR].current).toBeUndefined();
		expect(wrapper[HMR].fn).toBe(updated_component);
	});
});
