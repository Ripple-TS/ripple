import { describe, it, expect } from 'vitest';
import { flushSync, track, type Tracked } from 'ripple';

interface Cell {
	id: string;
	text: string;
}

interface Row {
	id: number;
	label: string;
	active: boolean;
	cells: Cell[];
}

const cells = (prefix: string) => [
	{ id: 'a', text: `${prefix}a` },
	{ id: 'b', text: `${prefix}b` },
];

// An item body whose updates live in one render block carries that block on
// the item block (`_$_.item`): the item re-runs its update function alone,
// and the nested blocks of its body (a keyed list of cells here) stay.
describe('list items carrying their render block', () => {
	it('re-renders an item replaced under the same key and keeps its nested list', () => {
		let set: (rows: Row[]) => void = () => {};

		function App() @{
			const rows = track<Row[]>([
				{ id: 1, label: 'one', active: false, cells: cells('1') },
				{ id: 2, label: 'two', active: false, cells: cells('2') },
			]);
			set = (next) => {
				rows.value = next;
			};
			<table>
				<tbody>
					@for (const row of rows.value; key row.id) {
						<tr class={row.active ? 'active' : 'inactive'}>
							<th>{row.label}</th>
							@for (const cell of row.cells; key cell.id) {
								<td>{cell.text}</td>
							}
						</tr>
					}
				</tbody>
			</table>
		}

		render(App);
		flushSync();

		const rows = () => Array.from(container.querySelectorAll('tr'));
		const text = () => rows().map((tr) => `${tr.className}:${tr.textContent}`);
		expect(text()).toEqual(['inactive:one1a1b', 'inactive:two2a2b']);

		const [first, second] = rows();
		const first_cells = Array.from(first.querySelectorAll('td'));

		// The first row object is replaced under its key; its cell objects are
		// kept, so the nested list has nothing to do.
		const original = [
			{ id: 1, label: 'one', active: false, cells: cells('1') },
			{ id: 2, label: 'two', active: false, cells: cells('2') },
		];
		set(original);
		flushSync();
		set([{ ...original[0], label: 'uno', active: true }, original[1]]);
		flushSync();

		expect(text()).toEqual(['active:uno1a1b', 'inactive:two2a2b']);
		expect(rows()[0]).toBe(first);
		expect(rows()[1]).toBe(second);
		expect(Array.from(first.querySelectorAll('td'))).toEqual(first_cells);

		// A new cell array replaces the cells; the row's own DOM is kept.
		set([
			{
				...original[0],
				cells: [
					{ id: 'a', text: 'A' },
					{ id: 'c', text: 'C' },
				],
			},
			original[1],
		]);
		flushSync();
		expect(text()).toEqual(['inactive:oneAC', 'inactive:two2a2b']);
		expect(rows()[0]).toBe(first);
	});

	it('updates a plain (unkeyed) item body through the item block', () => {
		let set: (items: { text: string }[]) => void = () => {};

		function App() @{
			const items = track([{ text: 'a' }, { text: 'b' }]);
			set = (next) => {
				items.value = next;
			};
			<div>
				@for (const item of items.value) {
					<span>{item.text}</span>
				}
			</div>
		}

		render(App);
		flushSync();
		expect(container.querySelector('div')?.textContent).toBe('ab');

		set([{ text: 'a' }, { text: 'c' }, { text: 'd' }]);
		flushSync();
		expect(container.querySelector('div')?.textContent).toBe('acd');
	});

	it('destroys an item that re-ran its update function', () => {
		let set: (items: { id: number; text: string }[]) => void = () => {};

		function App() @{
			const items = track([
				{ id: 1, text: 'a' },
				{ id: 2, text: 'b' },
			]);
			set = (next) => {
				items.value = next;
			};
			<div>
				@for (const item of items.value; key item.id) {
					<span>{item.text}</span>
				}
			</div>
		}

		render(App);
		flushSync();

		set([
			{ id: 1, text: 'A' },
			{ id: 2, text: 'B' },
		]);
		flushSync();
		expect(container.querySelector('div')?.textContent).toBe('AB');

		set([
			{ id: 2, text: 'B' },
		]);
		flushSync();
		expect(container.querySelector('div')?.textContent).toBe('B');
		expect(container.querySelectorAll('span').length).toBe(1);
	});
});

// A keyed list that re-lays most of its range walks it front to back,
// inserting each item before the first node not yet in place.
describe('keyed list re-lay', () => {
	const ids = (n: number) => Array.from({ length: n }, (_, i) => i);

	it('reverses the middle after dropping both ends (kivi worst case)', () => {
		let set: (items: number[]) => void = () => {};

		function App() @{
			const items = track(ids(40));
			set = (next) => {
				items.value = next;
			};
			<div>
				@for (const item of items.value; key item) {
					<span data-id={item}>{item}</span>
				}
			</div>
		}

		render(App);
		flushSync();

		const before = Array.from(container.querySelectorAll('span'));
		const next = ids(40).slice(1, -1).reverse();
		set(next);
		flushSync();

		const after = Array.from(container.querySelectorAll('span'));
		expect(after.map((el) => el.textContent)).toEqual(next.map(String));
		for (const el of after) {
			expect(el).toBe(before[Number(el.dataset.id)]);
		}
	});

	it('creates new items inside a re-laid range in order', () => {
		let set: (items: number[]) => void = () => {};

		function App() @{
			const items = track(ids(40));
			set = (next) => {
				items.value = next;
			};
			<div>
				<b>{'head'}</b>
				@for (const item of items.value; key item) {
					<span data-id={item}>{item}</span>
				}
				<i>{'tail'}</i>
			</div>
		}

		render(App);
		flushSync();

		const before = Array.from(container.querySelectorAll('span'));
		const reversed = ids(40).reverse();
		const next = [100, ...reversed.slice(0, 20), 101, ...reversed.slice(20), 102];
		set(next);
		flushSync();

		const children = Array.from(container.querySelector('div')!.children);
		expect(children[0].localName).toBe('b');
		expect(children[children.length - 1].localName).toBe('i');
		expect(children.slice(1, -1).map((el) => el.textContent)).toEqual(next.map(String));
		for (const el of children.slice(1, -1)) {
			const id = Number((el as HTMLElement).dataset.id);
			if (id < 40) expect(el).toBe(before[id]);
		}

		set(ids(40));
		flushSync();
		expect(Array.from(container.querySelectorAll('span')).map((el) => el.textContent)).toEqual(
			ids(40).map(String),
		);
	});
});

// A trailing `@if` or `@for` behind template siblings appends into its parent
// (no `<!>` placeholder); the if materializes an anchor when it swaps.
describe('trailing control flow appends into the parent', () => {
	it('keeps a trailing @if in place across branch swaps', () => {
		let set: (value: number) => void = () => {};

		function App() @{
			const n = track(0);
			set = (value) => {
				n.value = value;
			};
			<div>
				<b>{'head'}</b>
				@if (n.value === 0) {
					<span>{'zero'}</span>
				} @else if (n.value === 1) {
					<em>{'one'}</em>
				}
			</div>
		}

		render(App);
		flushSync();
		const div = container.querySelector('div')!;
		expect(div.innerHTML).toBe('<b>head</b><span>zero</span>');

		set(1);
		flushSync();
		expect(div.textContent).toBe('headone');
		expect(div.querySelector('em')).not.toBeNull();

		set(2);
		flushSync();
		expect(div.textContent).toBe('head');

		set(0);
		flushSync();
		expect(div.textContent).toBe('headzero');
		expect(div.firstElementChild?.localName).toBe('b');
		expect(div.lastElementChild?.localName).toBe('span');
	});

	it('keeps a trailing @for with @empty in place', () => {
		let set: (items: string[]) => void = () => {};

		function App() @{
			const items = track(['a', 'b']);
			set = (next) => {
				items.value = next;
			};
			<div>
				<b>{'head'}</b>
				@for (const item of items.value; key item) {
					<span>{item}</span>
				} @empty {
					<i>{'none'}</i>
				}
			</div>
		}

		render(App);
		flushSync();
		const div = container.querySelector('div')!;
		expect(div.innerHTML).toBe('<b>head</b><span>a</span><span>b</span>');

		set([]);
		flushSync();
		expect(div.innerHTML).toBe('<b>head</b><i>none</i>');

		set(['c', 'a']);
		flushSync();
		expect(div.innerHTML).toBe('<b>head</b><span>c</span><span>a</span>');

		set(['a', 'c', 'd']);
		flushSync();
		expect(div.innerHTML).toBe('<b>head</b><span>a</span><span>c</span><span>d</span>');
	});
});

// A keyed item read only by its update function is held as it is (no
// tracked): a replaced item re-runs its block directly, and tracked values
// inside the item still subscribe the block.
describe('local keyed items', () => {
	it('re-renders a replaced item and follows a tracked value it holds', () => {
		let set: (items: { id: number; label: Tracked<string> }[]) => void = () => {};
		let a: Tracked<string>;
		let b: Tracked<string>;
		let c: Tracked<string>;

		function App() @{
			a = track('a');
			b = track('b');
			c = track('one');
			const items = track([
				{ id: 1, label: a },
				{ id: 2, label: b },
			]);
			set = (next) => {
				items.value = next;
			};
			<div>
				@for (const item of items.value; key item.id) {
					<span>{item.id + ':' + item.label.value}</span>
				}
			</div>
		}

		render(App);
		flushSync();
		const div = container.querySelector('div')!;
		expect(div.textContent).toBe('1:a2:b');
		const spans = Array.from(div.querySelectorAll('span'));

		a.value = 'A';
		flushSync();
		expect(div.textContent).toBe('1:A2:b');

		set([
			{ id: 2, label: b },
			{ id: 1, label: c },
		]);
		flushSync();
		expect(div.textContent).toBe('2:b1:one');
		expect(Array.from(div.querySelectorAll('span'))).toEqual([spans[1], spans[0]]);

		a.value = 'AA';
		flushSync();
		expect(div.textContent).toBe('2:b1:one');
	});

	it('clears and restores leaf text', () => {
		let set: (items: { id: number; text: string }[]) => void = () => {};

		function App() @{
			const items = track<{ id: number; text: string }[]>([
				{ id: 1, text: 'x' },
			]);
			set = (next) => {
				items.value = next;
			};
			<div>
				@for (const item of items.value; key item.id) {
					<span>{item.text}</span>
				}
			</div>
		}

		render(App);
		flushSync();
		const span = container.querySelector('span')!;
		expect(span.textContent).toBe('x');
		expect(span.childNodes.length).toBe(1);

		set([
			{ id: 1, text: '' },
		]);
		flushSync();
		expect(span.childNodes.length).toBe(0);

		set([
			{ id: 1, text: 'y' },
		]);
		flushSync();
		expect(span.textContent).toBe('y');
		expect(span.childNodes.length).toBe(1);

		set([
			{ id: 1, text: 'z' },
		]);
		flushSync();
		expect(span.textContent).toBe('z');
		expect(span.childNodes.length).toBe(1);
	});
});
