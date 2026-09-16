import { flushSync, track, type Tracked } from 'ripple';

interface Row {
	id: number;
	group: string;
	label: Tracked<string>;
}

type RowSpec = [id: number, group?: string];

interface Actions {
	select(id: number | undefined): void;
	setItems(rows: RowSpec[]): void;
	setGroup(group: string | undefined): void;
	relabel(index: number, label: string): void;
}

function selected_ids(): number[] {
	return Array.from(container.querySelectorAll('li.selected')).map(
		(el) => Number(el.getAttribute('data-id')),
	);
}

function matched_ids(): string[] {
	return Array.from(container.querySelectorAll('[data-group="match"]')).map(
		(el) => el.getAttribute('data-id') ?? '',
	);
}

function texts(): string[] {
	return Array.from(container.querySelectorAll('li')).map((el) => el.textContent ?? '');
}

describe('@for selector comparisons', () => {
	let actions: Actions;

	function App() @{
		const row = (id: number, group = 'a'): Row => ({ id, group, label: track(`row ${id}`) });

		const items = track<Row[]>([row(1), row(2), row(3)]);
		const selected = track<number | undefined>(undefined);
		const group = track<string | undefined>(undefined);

		actions = {
			select: (id) => {
				selected.value = id;
			},
			setItems: (specs) => {
				items.value = specs.map(([id, group]) => row(id, group));
			},
			setGroup: (next) => {
				group.value = next;
			},
			relabel: (index, label) => {
				items.value[index].label.value = label;
			},
		};

		<ul>
			@for (const item of items.value; key item.id) {
				<li
					data-id={item.id}
					class={selected.value === item.id ? 'selected' : ''}
					data-group={group.value === item.group ? 'match' : ''}
				>
					{selected.value !== item.id ? item.label.value : 'current'}
				</li>
			}
		</ul>
	}

	it('moves the selection between rows', () => {
		render(App);
		expect(selected_ids()).toEqual([]);

		actions.select(2);
		flushSync();
		expect(selected_ids()).toEqual([2]);
		expect(texts()).toEqual(['row 1', 'current', 'row 3']);

		actions.select(3);
		flushSync();
		expect(selected_ids()).toEqual([3]);
		expect(texts()).toEqual(['row 1', 'row 2', 'current']);

		actions.select(undefined);
		flushSync();
		expect(selected_ids()).toEqual([]);
		expect(texts()).toEqual(['row 1', 'row 2', 'row 3']);
	});

	it('matches rows created after the selection was set', () => {
		render(App);

		actions.select(5);
		flushSync();
		expect(selected_ids()).toEqual([]);

		actions.setItems([[1], [5]]);
		flushSync();
		expect(selected_ids()).toEqual([5]);

		actions.setItems([[1]]);
		flushSync();
		expect(selected_ids()).toEqual([]);

		actions.setItems([[1], [5]]);
		flushSync();
		expect(selected_ids()).toEqual([5]);
	});

	it('re-registers a row whose compared value changes', () => {
		render(App);

		actions.setItems([
			[1, 'a'],
			[2, 'b'],
		]);
		actions.setGroup('b');
		flushSync();
		expect(matched_ids()).toEqual(['2']);

		// Same keys, so the existing rows update in place with new groups.
		actions.setItems([
			[1, 'b'],
			[2, 'a'],
		]);
		flushSync();
		expect(matched_ids()).toEqual(['1']);

		actions.setGroup('a');
		flushSync();
		expect(matched_ids()).toEqual(['2']);
	});

	it('updates every row sharing the compared value', () => {
		render(App);

		actions.setItems([
			[1, 'a'],
			[2, 'b'],
			[3, 'a'],
		]);
		actions.setGroup('a');
		flushSync();
		expect(matched_ids()).toEqual(['1', '3']);

		actions.setGroup('b');
		flushSync();
		expect(matched_ids()).toEqual(['2']);

		actions.setGroup(undefined);
		flushSync();
		expect(matched_ids()).toEqual([]);
	});

	it('keeps the rest of the row expression reactive', () => {
		render(App);

		actions.select(1);
		flushSync();
		expect(texts()).toEqual(['current', 'row 2', 'row 3']);

		actions.relabel(1, 'second');
		flushSync();
		expect(texts()).toEqual(['current', 'second', 'row 3']);
		expect(selected_ids()).toEqual([1]);

		actions.select(2);
		flushSync();
		expect(texts()).toEqual(['row 1', 'current', 'row 3']);
	});
});

describe('keyed reconciliation with most items moving', () => {
	it('keeps node identity and order when a large list is shuffled', () => {
		let apply: (order: number[]) => void = () => {};

		function App() @{
			const items = track(Array.from({ length: 300 }, (_, i) => i));
			apply = (order) => {
				items.value = order;
			};
			<ul>
				@for (const item of items.value; key item) {
					<li data-id={item}>{item}</li>
				}
			</ul>
		}

		render(App);
		const before = new Map(Array.from(
			container.querySelectorAll('li'),
			(el) => [el.getAttribute('data-id'), el],
		));

		// A permutation that moves nearly every item, plus a few new ones.
		let seed = 7;
		const next = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
		const order = Array.from({ length: 300 }, (_, i) => i);
		for (let i = order.length - 1; i > 0; i--) {
			const j = Math.floor(next() * (i + 1));
			[order[i], order[j]] = [order[j], order[i]];
		}
		order.splice(10, 0, 1000);
		order.splice(200, 0, 1001);

		apply(order);
		flushSync();

		const after = Array.from(container.querySelectorAll('li'));
		expect(after.map((el) => Number(el.getAttribute('data-id')))).toEqual(order);
		for (const el of after) {
			const id = el.getAttribute('data-id');
			if (before.has(id)) {
				expect(el).toBe(before.get(id));
			}
		}
		expect(after.map((el) => el.textContent)).toEqual(order.map(String));
	});
});

// An `@if (outer === item.key)` in a keyed loop body lowers to the same
// selector as an attribute comparison would, reading the block's key: a
// change of the outer value re-runs the ifs of its previous and next key
// alone, and a replaced item never re-runs its if.
describe('@if selector comparisons', () => {
	interface Item {
		id: number;
		label: string;
	}
	let select: (id: number | undefined) => void = () => {};
	let setItems: (items: Item[]) => void = () => {};

	function App() @{
		const items = track<Item[]>([
			{ id: 1, label: 'one' },
			{ id: 2, label: 'two' },
			{ id: 3, label: 'three' },
		]);
		const selected = track<number | undefined>(undefined);
		select = (id) => {
			selected.value = id;
		};
		setItems = (next) => {
			items.value = next;
		};

		<ul>
			@for (const item of items.value; key item.id) {
				<li data-id={item.id}>
					<span>{item.label}</span>
					@if (selected.value === item.id) {
						<b>{'current'}</b>
					}
				</li>
			}
		</ul>
	}

	function marked(): string[] {
		return Array.from(container.querySelectorAll('li')).map(
			(li) => `${li.getAttribute('data-id')}:${li.textContent}`,
		);
	}

	it('moves the marker between rows and keeps it on a replaced row', () => {
		render(App);
		flushSync();
		expect(marked()).toEqual(['1:one', '2:two', '3:three']);

		select(2);
		flushSync();
		expect(marked()).toEqual(['1:one', '2:twocurrent', '3:three']);
		const b = container.querySelector('b')!;

		select(3);
		flushSync();
		expect(marked()).toEqual(['1:one', '2:two', '3:threecurrent']);

		// The selected row's object is replaced under its key: the label
		// updates and the marker stays, in place behind the label.
		setItems([
			{ id: 1, label: 'uno' },
			{ id: 2, label: 'dos' },
			{ id: 3, label: 'tres' },
		]);
		flushSync();
		expect(marked()).toEqual(['1:uno', '2:dos', '3:trescurrent']);
		expect(container.querySelector('li:last-child')!.childNodes.length).toBe(2);
		expect(container.querySelector('b')).not.toBe(b);

		select(undefined);
		flushSync();
		expect(marked()).toEqual(['1:uno', '2:dos', '3:tres']);
		// Off again, and no anchor node is left behind the label.
		for (const li of container.querySelectorAll('li')) {
			expect(li.childNodes.length).toBe(1);
		}
	});

	it('marks a row created after the selection was set', () => {
		render(App);
		flushSync();
		select(4);
		flushSync();
		expect(marked()).toEqual(['1:one', '2:two', '3:three']);

		setItems([
			{ id: 4, label: 'four' },
			{ id: 1, label: 'one' },
		]);
		flushSync();
		expect(marked()).toEqual(['4:fourcurrent', '1:one']);
	});
});
