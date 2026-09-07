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

		let &[items] = track<Row[]>([row(1), row(2), row(3)]);
		let &[selected] = track<number | undefined>(undefined);
		let &[group] = track<string | undefined>(undefined);

		actions = {
			select: (id) => {
				selected = id;
			},
			setItems: (specs) => {
				items = specs.map(([id, group]) => row(id, group));
			},
			setGroup: (next) => {
				group = next;
			},
			relabel: (index, label) => {
				items[index].label.value = label;
			},
		};

		<ul>
			@for (const item of items; key item.id) {
				<li
					data-id={item.id}
					class={selected === item.id ? 'selected' : ''}
					data-group={group === item.group ? 'match' : ''}
				>
					{selected !== item.id ? item.label.value : 'current'}
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
			let &[items] = track(Array.from({ length: 300 }, (_, i) => i));
			apply = (order) => {
				items = order;
			};
			<ul>
				@for (const item of items; key item) {
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
