import { Hydrate, track, effect, flushSync, mount, type Tracked } from 'ripple';
import { condition, idle, interaction, load, media, never, visible } from 'ripple/hydration';

describe('Hydrate client-only mounts', () => {
	it.each([
		load(),
		condition(false),
		idle(),
		interaction(),
		media('(min-width: 10000px)'),
		never(),
		visible(),
	])('renders normally for %j', (when) => {
		const calls: string[] = [];
		function Child() @{
			calls.push('init');
			effect(() => {
				calls.push('effect');
			});
			<button onClick={() => calls.push('click')}>live</button>
		}
		function App() {
			return <Hydrate {when} onHydrated={() => calls.push('hydrated')}>
				<Child />
			</Hydrate>;
		}
		const dispose = mount(App, { target: container });
		flushSync();
		container.querySelector('button')!.click();
		expect(calls).toEqual(['init', 'effect', 'click']);
		expect(container.innerHTML).not.toContain('<!--');
		dispose();
	});
	it('does not evaluate factories on client-only mounts or later navigation', () => {
		let exists: Tracked<boolean>;
		function factory(): never {
			throw new Error('unused factory');
		}
		function App() @{
			exists = track(false);
			@if (exists.value) {
				<Hydrate when={factory} children="hello" />
			}
		}
		const dispose = mount(App, { target: container });
		flushSync(() => (exists.value = true));
		expect(container.textContent).toBe('hello');
		dispose();
	});
	it('renders and updates tracked text children without a hydration range', () => {
		let children: Tracked<string>;
		function App() @{
			children = track('first');
			<div>
				<Hydrate when={never()} {children} />
			</div>
		}
		const dispose = mount(App, { target: container });
		expect(container.textContent).toBe('first');
		flushSync(() => (children.value = 'second'));
		expect(container.textContent).toBe('second');
		dispose();
	});
});
