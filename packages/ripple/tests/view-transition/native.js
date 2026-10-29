import { vi } from 'vitest';

// A deterministic native lifecycle; real snapshots/CSS are tested separately
// in tests/browser/view-transition.js. No React test source is copied here.
export function installViewTransitions() {
	const transitions = [];
	vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function () {
		return this.isConnected && !this.closest('[style*="display: none"], [style*="display:none"]')
			? [this.getBoundingClientRect()]
			: [];
	});
	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
		x: 0,
		y: 0,
		top: 0,
		left: 0,
		right: 100,
		bottom: 100,
		width: 100,
		height: 100,
	});
	const start = vi.fn((update) => {
		const ready = Promise.withResolvers();
		const finished = Promise.withResolvers();
		const committed = Promise.withResolvers();
		let skipped = false;
		const transition = {
			ready: ready.promise,
			finished: finished.promise,
			updateCallbackDone: committed.promise,
			types: new Set(),
			old: [],
			new: [],
			skipTransition: vi.fn(() => {
				skipped = true;
				ready.reject(new Error('skipped'));
			}),
			finish: () => finished.resolve(),
		};
		transitions.push(transition);
		const snapshot = () =>
			[...document.querySelectorAll('*')]
				.filter((e) => e.style?.getPropertyValue('view-transition-name'))
				.map((e) => [
					e,
					e.style.getPropertyValue('view-transition-name'),
					e.style.getPropertyValue('view-transition-class'),
				]);
		queueMicrotask(async () => {
			transition.old = snapshot();
			try {
				await update();
				transition.new = snapshot();
				committed.resolve();
				if (skipped) finished.resolve();
				else ready.resolve();
			} catch (error) {
				committed.reject(error);
				ready.reject(error);
				finished.reject(error);
			}
		});
		ready.promise.catch(() => {});
		committed.promise.catch(() => {});
		finished.promise.catch(() => {});
		return transition;
	});
	Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start });
	return { start, transitions };
}
