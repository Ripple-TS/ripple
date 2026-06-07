import { track } from 'ripple';

// For loop components for hydration testing

export function StaticForLoop() @{
	const items = ['Apple', 'Banana', 'Cherry'];
	<ul>
		@for (const item of items) {
			<li>{item}</li>
		}
	</ul>
}

export function ForLoopWithIndex() @{
	const items = ['A', 'B', 'C'];
	<ul>
		@for (const item of items; index i) {
			<li>{`${i}: ${item}`}</li>
		}
	</ul>
}

export function KeyedForLoop() @{
	const items = [
		{ id: 1, name: 'First' },
		{ id: 2, name: 'Second' },
		{ id: 3, name: 'Third' },
	];
	<ul>
		@for (const item of items; key item.id) {
			<li>{item.name}</li>
		}
	</ul>
}

export function ReactiveForLoopAdd() @{
	let &[items] = track(['A', 'B']);
	<>
		<button
			class="add"
			onClick={() => {
				items = [...items, 'C'];
			}}
		>{'Add'}</button>
		<ul>
			@for (const item of items) {
				<li>{item}</li>
			}
		</ul>
	</>
}

export function ReactiveForLoopRemove() @{
	let &[items] = track(['A', 'B', 'C']);
	<>
		<button
			class="remove"
			onClick={() => {
				items = items.slice(0, -1);
			}}
		>{'Remove'}</button>
		<ul>
			@for (const item of items) {
				<li>{item}</li>
			}
		</ul>
	</>
}

export function ForLoopInteractive() @{
	let &[counts] = track([0, 0, 0]);
	<div>
		@for (const count of counts; index i) {
			<div class={`item-${i}`}>
				<span class="value">{count}</span>
				<button
					class="increment"
					onClick={() => {
						const newCounts = [...counts];
						newCounts[i]++;
						counts = newCounts;
					}}
				>{'+'}</button>
			</div>
		}
	</div>
}

export function NestedForLoop() @{
	const grid = [
		[1, 2],
		[3, 4],
	];
	<div class="grid">
		@for (const row of grid; index rowIndex) {
			<div class={`row-${rowIndex}`}>
				@for (const cell of row; index colIndex) {
					<span class={`cell-${rowIndex}-${colIndex}`}>{cell}</span>
				}
			</div>
		}
	</div>
}

export function EmptyForLoop() @{
	const items: string[] = [];
	<div class="container">
		@for (const item of items) {
			<span>{item}</span>
		}
	</div>
}

export function ForLoopComplexObjects() @{
	const users = [
		{ id: 1, name: 'Alice', role: 'Admin' },
		{ id: 2, name: 'Bob', role: 'User' },
	];
	<div>
		@for (const user of users; key user.id) {
			<div class={`user-${user.id}`}>
				<span class="name">{user.name}</span>
				<span class="role">{user.role}</span>
			</div>
		}
	</div>
}

// Test reordering items in a keyed for loop
export function KeyedForLoopReorder() @{
	let &[items] = track([
		{ id: 1, name: 'First' },
		{ id: 2, name: 'Second' },
		{ id: 3, name: 'Third' },
	]);
	<>
		<button
			class="reorder"
			onClick={() => {
				items = [items[2], items[0], items[1]];
			}}
		>{'Reorder'}</button>
		<ul>
			@for (const item of items; key item.id) {
				<li class={`item-${item.id}`}>{item.name}</li>
			}
		</ul>
	</>
}

// Test for loop with item property updates (keyed)
export function KeyedForLoopUpdate() @{
	let &[items] = track([
		{ id: 1, name: 'Item 1' },
		{ id: 2, name: 'Item 2' },
	]);
	<>
		<button
			class="update"
			onClick={() => {
				items = items.map((item) => (item.id === 1 ? { ...item, name: 'Updated' } : item));
			}}
		>{'Update'}</button>
		<ul>
			@for (const item of items; key item.id) {
				<li class={`item-${item.id}`}>{item.name}</li>
			}
		</ul>
	</>
}

// Test for loop with combined add/remove/reorder
export function ForLoopMixedOperations() @{
	let &[items] = track(['A', 'B', 'C', 'D']);
	<>
		<button
			class="shuffle"
			onClick={() => {
				// Remove B, add E, reorder to D, C, A, E
				items = ['D', 'C', 'A', 'E'];
			}}
		>{'Shuffle'}</button>
		<ul>
			@for (const item of items) {
				<li class={`item-${item}`}>{item}</li>
			}
		</ul>
	</>
}

// Test for loop inside if block (combined control flow)
export function ForLoopInsideIf() @{
	let &[showList] = track(true);
	let &[items] = track(['X', 'Y', 'Z']);
	<>
		<button
			class="toggle"
			onClick={() => {
				showList = !showList;
			}}
		>{'Toggle List'}</button>
		<button
			class="add"
			onClick={() => {
				items = [...items, 'W'];
			}}
		>{'Add Item'}</button>
		@if (showList) {
			<ul class="list">
				@for (const item of items) {
					<li>{item}</li>
				}
			</ul>
		}
	</>
}

// Test for loop that transitions from empty to populated
export function ForLoopEmptyToPopulated() @{
	let &[items] = track<string[]>([]);
	<>
		<button
			class="populate"
			onClick={() => {
				items = ['One', 'Two', 'Three'];
			}}
		>{'Populate'}</button>
		<ul class="list">
			@for (const item of items) {
				<li>{item}</li>
			}
		</ul>
	</>
}

// Test for loop that transitions from populated to empty
export function ForLoopPopulatedToEmpty() @{
	let &[items] = track(['One', 'Two', 'Three']);
	<>
		<button
			class="clear"
			onClick={() => {
				items = [];
			}}
		>{'Clear'}</button>
		<ul class="list">
			@for (const item of items) {
				<li>{item}</li>
			}
		</ul>
	</>
}

// Test nested for loops with reactivity
export function NestedForLoopReactive() @{
	let &[grid] = track([
		[1, 2],
		[3, 4],
	]);
	<div class="nested-for-reactive">
		<button
			class="add-row"
			onClick={() => {
				grid = [...grid, [5, 6]];
			}}
		>{'Add Row'}</button>
		<button
			class="update-cell"
			onClick={() => {
				const newGrid = grid.map((row) => [...row]);
				newGrid[0][0] = 99;
				grid = newGrid;
			}}
		>{'Update Cell'}</button>
		<div class="grid">
			@for (const row of grid; index rowIndex) {
				<div class={`row-${rowIndex}`}>
					@for (const cell of row; index colIndex) {
						<span class={`cell-${rowIndex}-${colIndex}`}>{cell}</span>
					}
				</div>
			}
		</div>
	</div>
}

// Test for loop with deeply nested data
export function ForLoopDeeplyNested() @{
	const departments = [
		{
			id: 'd1',
			name: 'Engineering',
			teams: [
				{ id: 't1', name: 'Frontend', members: ['Alice', 'Bob'] },
				{ id: 't2', name: 'Backend', members: ['Charlie'] },
			],
		},
		{
			id: 'd2',
			name: 'Design',
			teams: [
				{ id: 't3', name: 'UX', members: ['Diana', 'Eve', 'Frank'] },
			],
		},
	];
	<div class="org">
		@for (const dept of departments; key dept.id) {
			<div class={`dept-${dept.id}`}>
				<h2 class="dept-name">{dept.name}</h2>
				@for (const team of dept.teams; key team.id) {
					<div class={`team-${team.id}`}>
						<h3 class="team-name">{team.name}</h3>
						<ul>
							@for (const member of team.members) {
								<li class="member">{member}</li>
							}
						</ul>
					</div>
				}
			</div>
		}
	</div>
}

// Test for loop with index that gets updated
export function ForLoopIndexUpdate() @{
	let &[items] = track(['First', 'Second', 'Third']);
	<>
		<button
			class="prepend"
			onClick={() => {
				items = ['Zeroth', ...items];
			}}
		>{'Prepend'}</button>
		<ul>
			@for (const item of items; index i) {
				<li class={`item-${i}`}>{`[${i}] ${item}`}</li>
			}
		</ul>
	</>
}

// Test keyed for loop with index
export function KeyedForLoopWithIndex() @{
	let &[items] = track([
		{ id: 'a', value: 'Alpha' },
		{ id: 'b', value: 'Beta' },
		{ id: 'c', value: 'Gamma' },
	]);
	<>
		<button
			class="reorder"
			onClick={() => {
				items = [items[1], items[2], items[0]];
			}}
		>{'Rotate'}</button>
		<ul>
			@for (const item of items; index i; key item.id) {
				<li class={`item-${item.id}`} data-index={i}>{`[${i}] ${item.id}: ${item.value}`}</li>
			}
		</ul>
	</>
}

// Test for loop with sibling elements
export function ForLoopWithSiblings() @{
	let &[items] = track(['A', 'B']);
	<>
		<div class="wrapper">
			<header class="before">{'Before'}</header>
			@for (const item of items) {
				<div class={`item-${item}`}>{item}</div>
			}
			<footer class="after">{'After'}</footer>
		</div>
		<button
			class="add"
			onClick={() => {
				items = [...items, 'C'];
			}}
		>{'Add'}</button>
	</>
}

// Test for loop items with their own reactive state
export function ForLoopItemState() @{
	const initialItems = [
		{ id: 1, text: 'Todo 1' },
		{ id: 2, text: 'Todo 2' },
		{ id: 3, text: 'Todo 3' },
	];
	<div>
		@for (const item of initialItems; key item.id) {
			<TodoItem id={item.id} text={item.text} />
		}
	</div>
}

function TodoItem(props: { id: number; text: string }) @{
	let &[done] = track(false);
	<div class={`todo-${props.id}`}>
		<input
			type="checkbox"
			class="checkbox"
			checked={done}
			onChange={(e) => {
				done = (e.target as HTMLInputElement).checked;
			}}
		/>
		<span class={done ? 'completed' : 'pending'}>{props.text}</span>
	</div>
}

// Test for loop with single item
export function ForLoopSingleItem() @{
	const items = ['Only'];
	<ul>
		@for (const item of items) {
			<li class="single">{item}</li>
		}
	</ul>
}

// Test for loop adding at beginning
export function ForLoopAddAtBeginning() @{
	let &[items] = track(['B', 'C']);
	<>
		<button
			class="prepend"
			onClick={() => {
				items = ['A', ...items];
			}}
		>{'Prepend A'}</button>
		<ul>
			@for (const item of items) {
				<li class={`item-${item}`}>{item}</li>
			}
		</ul>
	</>
}

// Test for loop adding in the middle
export function ForLoopAddInMiddle() @{
	let &[items] = track(['A', 'C']);
	<>
		<button
			class="insert"
			onClick={() => {
				const copy = [...items];
				copy.splice(1, 0, 'B');
				items = copy;
			}}
		>{'Insert B'}</button>
		<ul>
			@for (const item of items) {
				<li class={`item-${item}`}>{item}</li>
			}
		</ul>
	</>
}

// Test for loop removing from the middle
export function ForLoopRemoveFromMiddle() @{
	let &[items] = track(['A', 'B', 'C']);
	<>
		<button
			class="remove-middle"
			onClick={() => {
				items = items.filter((item) => item !== 'B');
			}}
		>{'Remove B'}</button>
		<ul>
			@for (const item of items) {
				<li class={`item-${item}`}>{item}</li>
			}
		</ul>
	</>
}

// Test for loop with large list
export function ForLoopLargeList() @{
	const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);
	<ul class="large-list">
		@for (const item of items; index i) {
			<li class={`item-${i}`}>{item}</li>
		}
	</ul>
}

// Test for loop with swap operation
export function ForLoopSwap() @{
	let &[items] = track(['A', 'B', 'C', 'D']);
	<>
		<button
			class="swap"
			onClick={() => {
				const copy = [...items];
				[copy[0], copy[3]] = [copy[3], copy[0]];
				items = copy;
			}}
		>{'Swap First and Last'}</button>
		<ul>
			@for (const item of items) {
				<li class={`item-${item}`}>{item}</li>
			}
		</ul>
	</>
}

// Test for loop with reverse operation
export function ForLoopReverse() @{
	let &[items] = track(['A', 'B', 'C', 'D']);
	<>
		<button
			class="reverse"
			onClick={() => {
				items = [...items].reverse();
			}}
		>{'Reverse'}</button>
		<ul>
			@for (const item of items) {
				<li class={`item-${item}`}>{item}</li>
			}
		</ul>
	</>
}
