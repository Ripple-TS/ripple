import { Hydrate } from 'ripple';
import { getCss } from 'ripple/server';
import { condition, idle, interaction, load, media, never, visible } from 'ripple/hydration';

describe('Hydrate SSR', () => {
	it.each([
		load(),
		idle(),
		visible(),
		interaction(),
		media('(min-width: 100px)'),
		condition(() => {
			throw new Error('getter ran');
		}),
		never(),
		() => {
			throw new Error('factory ran');
		},
	])('renders without evaluating factories/getters or browser APIs: %j', async (when) => {
		function App() {
			return <Hydrate
				{when}
				onHydrated={() => {
					throw new Error('callback ran');
				}}
			>
				<b>SSR</b>
			</Hydrate>;
		}
		const { body } = await render(App);
		expect(body).toContain('<b>SSR</b>');
		// Only the root and Hydrate pairs. No extra child-expression marker.
		expect(body.match(/<!--/g)).toHaveLength(4);
	});
	it('retains scoped styles for never content', async () => {
		function Child() @{
			<>
				<style>
					p {
						color: red;
					}
				</style>
				<p>styled</p>
			</>
		}
		function App() {
			return <Hydrate when={never()}>
				<Child />
			</Hydrate>;
		}
		const { body, css } = await render(App);
		expect(body).toContain('styled');
		expect(getCss(css)).toContain('color: red');
	});
	it('serializes normalized interaction intent and factory metadata safely', async () => {
		function App() @{
			<>
				<Hydrate when={interaction({ events: ['click', 'click', 'keydown'] })}>
					<button />
				</Hydrate>
				<Hydrate when={() => never()} />
			</>
		}
		const { body } = await render(App);
		expect(body).toContain('<!--[he:click%20keydown-->');
		expect(body).toContain('<!--[hd-->');
	});
});
