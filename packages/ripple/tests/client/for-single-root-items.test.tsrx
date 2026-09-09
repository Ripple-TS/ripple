import { RippleArray, flushSync, mount, track } from 'ripple';

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

	describe('controlled list of root @if items (lazy anchors)', () => {
		const text_nodes = (el) => Array.from(el.childNodes).filter((n) => n.nodeType === 3).length;

		it('keeps no anchor nodes until a branch swaps, then removes the anchor with the item', () => {
			function App() @{
				let &[items] = track([
					{ id: 1, code: false },
					{ id: 2, code: true },
					{ id: 3, code: false },
				]);
				<>
					<button
						class="swap"
						onClick={() => {
							items = items.map((i) => (i.id === 2 ? { ...i, code: false } : i));
						}}
					>{'swap'}</button>
					<button
						class="remove"
						onClick={() => {
							items = items.filter((i) => i.id !== 2);
						}}
					>{'remove'}</button>
					<button
						class="clear"
						onClick={() => {
							items = [];
						}}
					>{'clear'}</button>
					<ul>
						@for (const item of items; key item.id) {
							@if (item.code) {
								<li class="code">{item.id}</li>
							} @else {
								<li class="text">{item.id}</li>
							}
						}
					</ul>
				</>
			}
			render(App);
			const ul = container.querySelector('ul');
			expect(text_nodes(ul)).toBe(0);
			expect(Array.from(ul.children).map((li) => li.className)).toEqual(['text', 'code', 'text']);

			container.querySelector('.swap').click();
			flushSync();
			expect(Array.from(ul.children).map((li) => li.className)).toEqual(['text', 'text', 'text']);
			// The swapped item now owns one text anchor, placed right after it.
			expect(text_nodes(ul)).toBe(1);
			expect(ul.children[1].nextSibling.nodeType).toBe(3);

			container.querySelector('.remove').click();
			flushSync();
			expect(Array.from(ul.children).map((li) => li.textContent)).toEqual(['1', '3']);
			expect(text_nodes(ul)).toBe(0);

			container.querySelector('.clear').click();
			flushSync();
			expect(ul.childNodes.length).toBe(0);
		});

		it('moves a materialized anchor with its item and removes it on unmount', () => {
			function App() @{
				let &[items] = track([
					{ id: 1, show: false },
					{ id: 2, show: true },
				]);
				<>
					<button
						class="show"
						onClick={() => {
							items = items.map((i) => (i.id === 1 ? { ...i, show: true } : i));
						}}
					>{'show'}</button>
					<button
						class="reverse"
						onClick={() => {
							items = [...items].reverse();
						}}
					>{'reverse'}</button>
					<ul>
						@for (const item of items; key item.id) {
							@if (item.show) {
								<li>{item.id}</li>
							}
						}
					</ul>
				</>
			}
			const unmount = mount(App, { target: container, rootBoundary: false });
			const ul = container.querySelector('ul');
			// An empty branch materializes its anchor at once, so it has a position.
			expect(text_nodes(ul)).toBe(1);
			expect(ul.firstChild.nodeType).toBe(3);
			expect(ul.children.length).toBe(1);

			container.querySelector('.show').click();
			flushSync();
			expect(Array.from(ul.children).map((li) => li.textContent)).toEqual(['1', '2']);
			// The content renders before its anchor.
			expect(ul.children[0].nextSibling.nodeType).toBe(3);

			container.querySelector('.reverse').click();
			flushSync();
			expect(Array.from(ul.children).map((li) => li.textContent)).toEqual(['2', '1']);
			// The anchor travelled with item 1 to the end.
			expect(ul.lastChild.nodeType).toBe(3);
			expect(ul.lastChild.previousSibling).toBe(ul.children[1]);

			unmount();
			expect(container.childNodes.length).toBe(0);
		});
	});
});
