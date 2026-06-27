import { RippleArray, flushSync, track } from 'ripple';

// Regression tests for the 0.3.85 optimization (PR #1307) that elides the
// `<!>` wrapper for single control-flow / component root scopes. When such a
// scope renders its DOM through a descendant block, the owning block's
// `s.start` is null, so keyed-for reconciliation must resolve the real first
// node by descending child blocks instead of reading `s.start` directly.
// Previously this threw `Cannot use 'in' operator to search for 'parent' in
// null` from `append()` on a reactive insert.

describe('keyed for with single-root item bodies (#1307 regression)', () => {
	it(
		'prepends into a keyed @for whose body is a single component (single control-flow root)',
		() => {
			function MuzeCard(props) @{
				@if (true) {
					<p>{props.muze.muzeId}</p>
				}
			}
			function App() @{
				const muzes = new RippleArray({ muzeId: 'b' }, { muzeId: 'c' });
				<>
					<button onClick={() => muzes.unshift({ muzeId: 'a' })}>{'add'}</button>
					@for (const muze of muzes; key muze.muzeId) {
						<MuzeCard {muze} />
					}
				</>
			}
			render(App);
			expect(container.querySelectorAll('p').length).toBe(2);

			container.querySelector('button').click();
			flushSync();

			expect(Array.from(container.querySelectorAll('p')).map((p) => p.textContent)).toEqual([
				'a',
				'b',
				'c',
			]);
		},
	);

	it('reorders a keyed @for of single-control-flow-root components', () => {
		function MuzeCard(props) @{
			@if (true) {
				<p>{props.muze.muzeId}</p>
			}
		}
		function App() @{
			const muzes = new RippleArray({ muzeId: 'a' }, { muzeId: 'b' }, { muzeId: 'c' });
			<>
				<button onClick={() => muzes.reverse()}>{'reverse'}</button>
				@for (const muze of muzes; key muze.muzeId) {
					<MuzeCard {muze} />
				}
			</>
		}
		render(App);

		container.querySelector('button').click();
		flushSync();

		expect(Array.from(container.querySelectorAll('p')).map((p) => p.textContent)).toEqual([
			'c',
			'b',
			'a',
		]);
	});

	it('inserts in the middle of a keyed @for whose item body is a single @for', () => {
		function App() @{
			const groups = new RippleArray({ id: 'g1', items: ['1'] }, { id: 'g3', items: ['3'] });
			<>
				<button onClick={() => groups.splice(1, 0, { id: 'g2', items: ['2'] })}>{'insert'}</button>
				@for (const group of groups; key group.id) {
					@for (const item of group.items; key item) {
						<p>{item}</p>
					}
				}
			</>
		}
		render(App);

		container.querySelector('button').click();
		flushSync();

		expect(Array.from(container.querySelectorAll('p')).map((p) => p.textContent)).toEqual([
			'1',
			'2',
			'3',
		]);
	});

	it('realistic shape: keyed @for of components inside an @if > fragment', () => {
		function MuzeCard(props) @{
			@if (true) {
				<p class="muze">{props.muze.muzeId}</p>
			}
		}
		function App() @{
			let &[loaded, loadedT] = track(true);
			const muzes = new RippleArray({ muzeId: 'b' }, { muzeId: 'c' });
			<>
				<button onClick={() => muzes.unshift({ muzeId: 'a' })}>{'add'}</button>
				@if (loaded) {
					<>
						@for (const muze of muzes; key muze.muzeId) {
							<MuzeCard {muze} />
						}
						@if (muzes.length > 0) {
							<span class="count">{String(muzes.length)}</span>
						}
					</>
				}
			</>
		}
		render(App);
		expect(container.querySelectorAll('.muze').length).toBe(2);

		container.querySelector('button').click();
		flushSync();

		expect(Array.from(container.querySelectorAll('.muze')).map((p) => p.textContent)).toEqual([
			'a',
			'b',
			'c',
		]);
		expect(container.querySelector('.count').textContent).toBe('3');
	});
});
