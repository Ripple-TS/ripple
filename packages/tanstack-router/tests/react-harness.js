// React act checkpoints become the callback's settlement plus a real Ripple flush.
import { flushSync, mount } from 'ripple';
export * from './harness.js';
export { waitForElementToBeRemoved } from '@testing-library/dom';
export { renderHook } from './render-hook.tsrx';
export function act(callback) {
	const result = callback();
	if (result?.then)
		return result.then((value) => {
			flushSync();
			return value;
		});
	flushSync();
	return Promise.resolve(result).then((value) => {
		flushSync();
		return value;
	});
}
export function createRoot(target) {
	let dispose = () => {};
	return {
		render(component) {
			dispose();
			dispose = mount(component, { target });
		},
		unmount() {
			dispose();
		},
	};
}
