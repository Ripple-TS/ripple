import { HMR } from '../../../src/runtime/internal/client/constants.js';
import { hmr } from '../../../src/runtime/internal/client/hmr.js';
import { effect, flushSync, mount } from 'ripple';

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

	it('removes DOM when an HMR-wrapped root is unmounted', () => {
		function App() @{
			<div class="hmr-root">{'hmr root'}</div>
		}

		const cleanup = mount(hmr(App), { target: container });
		flushSync();

		expect(container.querySelector('.hmr-root')?.textContent).toBe('hmr root');

		cleanup();

		expect(container.querySelector('.hmr-root')).toBeNull();
		expect(container.innerHTML).toBe('');
	});

	it('runs child teardowns when an HMR-wrapped root is unmounted', () => {
		let teardown_count = 0;

		function Child() @{
			effect(() => {
				return () => {
					teardown_count++;
				};
			});
			<span class="hmr-child">{'child'}</span>
		}

		function App() @{
			<Child />
		}

		const cleanup = mount(hmr(App), { target: container });
		flushSync();

		expect(container.querySelector('.hmr-child')?.textContent).toBe('child');
		expect(teardown_count).toBe(0);

		cleanup();

		expect(container.querySelector('.hmr-child')).toBeNull();
		expect(teardown_count).toBe(1);
	});

	it('does not double-remove child DOM when the root owns the DOM range', () => {
		let remove_count = 0;
		const original_remove = Element.prototype.remove;

		Element.prototype.remove = function () {
			if (this.classList.contains('owned-root')) {
				remove_count++;
			}
			return original_remove.call(this);
		};

		try {
			function App() @{
				<div class="owned-root">
					<span>{'child'}</span>
				</div>
			}

			const cleanup = mount(App, { target: container });
			flushSync();

			expect(container.querySelector('.owned-root')).not.toBeNull();

			cleanup();

			expect(container.querySelector('.owned-root')).toBeNull();
			expect(remove_count).toBe(1);
		} finally {
			Element.prototype.remove = original_remove;
		}
	});
});
