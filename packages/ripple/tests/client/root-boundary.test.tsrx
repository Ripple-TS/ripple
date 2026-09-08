import { flushSync, mount, trackAsync } from 'ripple';

describe('mount rootBoundary', () => {
	it('renders under a default root boundary, so trackAsync works outside @try', async () => {
		function App() @{
			const data = trackAsync(() => Promise.resolve('loaded'));
			<div class="value">{data.value}</div>
		}

		const unmount = mount(App, { target: container });
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();

		expect(container.querySelector('.value')?.textContent).toBe('loaded');
		unmount();
		expect(container.innerHTML).toBe('');
	});

	it('renders without any root boundary when rootBoundary is false', () => {
		function App() @{
			<div class="plain">{'no boundary'}</div>
		}

		const unmount = mount(App, { target: container, rootBoundary: false });
		flushSync();

		expect(container.querySelector('.plain')?.textContent).toBe('no boundary');
		unmount();
		expect(container.innerHTML).toBe('');
	});

	it('requires a user @try for trackAsync when rootBoundary is false', () => {
		function App() @{
			const data = trackAsync(() => Promise.resolve('loaded'));
			<div class="value">{data.value}</div>
		}

		expect(() => mount(App, { target: container, rootBoundary: false })).toThrow(
			/Missing parent `try/,
		);
	});
});
