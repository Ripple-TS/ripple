import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticForLoop(__output) {
	_$_.push_component();

	const items = ['Apple', 'Banana', 'Cherry'];

	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of items) {
			__output.push('<li');
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopWithIndex(__output) {
	_$_.push_component();

	const items = ['A', 'B', 'C'];

	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		var i = 0;

		for (const item of items) {
			__output.push('<li');
			__output.push('>');

			{
				__output.push(_$_.escape(`${i}: ${item}`));
			}

			__output.push('</li>');
			i++;
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function KeyedForLoop(__output) {
	_$_.push_component();

	const items = [
		{ id: 1, name: 'First' },
		{ id: 2, name: 'Second' },
		{ id: 3, name: 'Third' }
	];

	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of items) {
			__output.push('<li');
			__output.push('>');

			{
				__output.push(_$_.escape(item.name));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ReactiveForLoopAdd(__output) {
	_$_.push_component();

	let items = track(['A', 'B']);

	__output.push('<button');
	__output.push(' class="add"');
	__output.push('>');

	{
		__output.push('Add');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ReactiveForLoopRemove(__output) {
	_$_.push_component();

	let items = track(['A', 'B', 'C']);

	__output.push('<button');
	__output.push(' class="remove"');
	__output.push('>');

	{
		__output.push('Remove');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopInteractive(__output) {
	_$_.push_component();

	let counts = track([0, 0, 0]);

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<!--[-->');

		var i = 0;

		for (const count of _$_.get(counts)) {
			__output.push('<div');
			__output.push(_$_.attr('class', `item-${i}`));
			__output.push('>');

			{
				__output.push('<span');
				__output.push(' class="value"');
				__output.push('>');

				{
					__output.push(_$_.escape(count));
				}

				__output.push('</span>');
				__output.push('<button');
				__output.push(' class="increment"');
				__output.push('>');

				{
					__output.push('+');
				}

				__output.push('</button>');
			}

			__output.push('</div>');
			i++;
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function NestedForLoop(__output) {
	_$_.push_component();

	const grid = [[1, 2], [3, 4]];

	__output.push('<div');
	__output.push(' class="grid"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		var rowIndex = 0;

		for (const row of grid) {
			__output.push('<div');
			__output.push(_$_.attr('class', `row-${rowIndex}`));
			__output.push('>');

			{
				__output.push('<!--[-->');

				var colIndex = 0;

				for (const cell of row) {
					__output.push('<span');
					__output.push(_$_.attr('class', `cell-${rowIndex}-${colIndex}`));
					__output.push('>');

					{
						__output.push(_$_.escape(cell));
					}

					__output.push('</span>');
					colIndex++;
				}

				__output.push('<!--]-->');
			}

			__output.push('</div>');
			rowIndex++;
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function EmptyForLoop(__output) {
	_$_.push_component();

	const items = [];

	__output.push('<div');
	__output.push(' class="container"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of items) {
			__output.push('<span');
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</span>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ForLoopComplexObjects(__output) {
	_$_.push_component();

	const users = [
		{ id: 1, name: 'Alice', role: 'Admin' },
		{ id: 2, name: 'Bob', role: 'User' }
	];

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const user of users) {
			__output.push('<div');
			__output.push(_$_.attr('class', `user-${user.id}`));
			__output.push('>');

			{
				__output.push('<span');
				__output.push(' class="name"');
				__output.push('>');

				{
					__output.push(_$_.escape(user.name));
				}

				__output.push('</span>');
				__output.push('<span');
				__output.push(' class="role"');
				__output.push('>');

				{
					__output.push(_$_.escape(user.role));
				}

				__output.push('</span>');
			}

			__output.push('</div>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function KeyedForLoopReorder(__output) {
	_$_.push_component();

	let items = track([
		{ id: 1, name: 'First' },
		{ id: 2, name: 'Second' },
		{ id: 3, name: 'Third' }
	]);

	__output.push('<button');
	__output.push(' class="reorder"');
	__output.push('>');

	{
		__output.push('Reorder');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push(_$_.attr('class', `item-${item.id}`));
			__output.push('>');

			{
				__output.push(_$_.escape(item.name));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function KeyedForLoopUpdate(__output) {
	_$_.push_component();

	let items = track([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]);

	__output.push('<button');
	__output.push(' class="update"');
	__output.push('>');

	{
		__output.push('Update');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push(_$_.attr('class', `item-${item.id}`));
			__output.push('>');

			{
				__output.push(_$_.escape(item.name));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopMixedOperations(__output) {
	_$_.push_component();

	let items = track(['A', 'B', 'C', 'D']);

	__output.push('<button');
	__output.push(' class="shuffle"');
	__output.push('>');

	{
		__output.push('Shuffle');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push(_$_.attr('class', `item-${item}`));
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopInsideIf(__output) {
	_$_.push_component();

	let showList = track(true);
	let items = track(['X', 'Y', 'Z']);

	__output.push('<button');
	__output.push(' class="toggle"');
	__output.push('>');

	{
		__output.push('Toggle List');
	}

	__output.push('</button>');
	__output.push('<button');
	__output.push(' class="add"');
	__output.push('>');

	{
		__output.push('Add Item');
	}

	__output.push('</button>');
	__output.push('<!--[-->');

	if (_$_.get(showList)) {
		__output.push('<ul');
		__output.push(' class="list"');
		__output.push('>');

		{
			__output.push('<!--[-->');

			for (const item of _$_.get(items)) {
				__output.push('<li');
				__output.push('>');

				{
					__output.push(_$_.escape(item));
				}

				__output.push('</li>');
			}

			__output.push('<!--]-->');
		}

		__output.push('</ul>');
	}

	__output.push('<!--]-->');
	_$_.pop_component();
}

export function ForLoopEmptyToPopulated(__output) {
	_$_.push_component();

	let items = track([]);

	__output.push('<button');
	__output.push(' class="populate"');
	__output.push('>');

	{
		__output.push('Populate');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push(' class="list"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopPopulatedToEmpty(__output) {
	_$_.push_component();

	let items = track(['One', 'Two', 'Three']);

	__output.push('<button');
	__output.push(' class="clear"');
	__output.push('>');

	{
		__output.push('Clear');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push(' class="list"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function NestedForLoopReactive(__output) {
	_$_.push_component();

	let grid = track([[1, 2], [3, 4]]);

	__output.push('<button');
	__output.push(' class="add-row"');
	__output.push('>');

	{
		__output.push('Add Row');
	}

	__output.push('</button>');
	__output.push('<button');
	__output.push(' class="update-cell"');
	__output.push('>');

	{
		__output.push('Update Cell');
	}

	__output.push('</button>');
	__output.push('<div');
	__output.push(' class="grid"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		var rowIndex = 0;

		for (const row of _$_.get(grid)) {
			__output.push('<div');
			__output.push(_$_.attr('class', `row-${rowIndex}`));
			__output.push('>');

			{
				__output.push('<!--[-->');

				var colIndex = 0;

				for (const cell of row) {
					__output.push('<span');
					__output.push(_$_.attr('class', `cell-${rowIndex}-${colIndex}`));
					__output.push('>');

					{
						__output.push(_$_.escape(cell));
					}

					__output.push('</span>');
					colIndex++;
				}

				__output.push('<!--]-->');
			}

			__output.push('</div>');
			rowIndex++;
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ForLoopDeeplyNested(__output) {
	_$_.push_component();

	const departments = [
		{
			id: 'd1',
			name: 'Engineering',

			teams: [
				{ id: 't1', name: 'Frontend', members: ['Alice', 'Bob'] },
				{ id: 't2', name: 'Backend', members: ['Charlie'] }
			]
		},

		{
			id: 'd2',
			name: 'Design',
			teams: [{ id: 't3', name: 'UX', members: ['Diana', 'Eve', 'Frank'] }]
		}
	];

	__output.push('<div');
	__output.push(' class="org"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const dept of departments) {
			__output.push('<div');
			__output.push(_$_.attr('class', `dept-${dept.id}`));
			__output.push('>');

			{
				__output.push('<h2');
				__output.push(' class="dept-name"');
				__output.push('>');

				{
					__output.push(_$_.escape(dept.name));
				}

				__output.push('</h2>');
				__output.push('<!--[-->');

				for (const team of dept.teams) {
					__output.push('<div');
					__output.push(_$_.attr('class', `team-${team.id}`));
					__output.push('>');

					{
						__output.push('<h3');
						__output.push(' class="team-name"');
						__output.push('>');

						{
							__output.push(_$_.escape(team.name));
						}

						__output.push('</h3>');
						__output.push('<ul');
						__output.push('>');

						{
							__output.push('<!--[-->');

							for (const member of team.members) {
								__output.push('<li');
								__output.push(' class="member"');
								__output.push('>');

								{
									__output.push(_$_.escape(member));
								}

								__output.push('</li>');
							}

							__output.push('<!--]-->');
						}

						__output.push('</ul>');
					}

					__output.push('</div>');
				}

				__output.push('<!--]-->');
			}

			__output.push('</div>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ForLoopIndexUpdate(__output) {
	_$_.push_component();

	let items = track(['First', 'Second', 'Third']);

	__output.push('<button');
	__output.push(' class="prepend"');
	__output.push('>');

	{
		__output.push('Prepend');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		var i = 0;

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push(_$_.attr('class', `item-${i}`));
			__output.push('>');

			{
				__output.push(_$_.escape(`[${i}] ${item}`));
			}

			__output.push('</li>');
			i++;
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function KeyedForLoopWithIndex(__output) {
	_$_.push_component();

	let items = track([
		{ id: 'a', value: 'Alpha' },
		{ id: 'b', value: 'Beta' },
		{ id: 'c', value: 'Gamma' }
	]);

	__output.push('<button');
	__output.push(' class="reorder"');
	__output.push('>');

	{
		__output.push('Rotate');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		var i = 0;

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push(_$_.attr('data-index', i, false));
			__output.push(_$_.attr('class', `item-${item.id}`));
			__output.push('>');

			{
				__output.push(_$_.escape(`[${i}] ${item.id}: ${item.value}`));
			}

			__output.push('</li>');
			i++;
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopWithSiblings(__output) {
	_$_.push_component();

	let items = track(['A', 'B']);

	__output.push('<div');
	__output.push(' class="wrapper"');
	__output.push('>');

	{
		__output.push('<header');
		__output.push(' class="before"');
		__output.push('>');

		{
			__output.push('Before');
		}

		__output.push('</header>');
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<div');
			__output.push(_$_.attr('class', `item-${item}`));
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</div>');
		}

		__output.push('<!--]-->');
		__output.push('<footer');
		__output.push(' class="after"');
		__output.push('>');

		{
			__output.push('After');
		}

		__output.push('</footer>');
	}

	__output.push('</div>');
	__output.push('<button');
	__output.push(' class="add"');
	__output.push('>');

	{
		__output.push('Add');
	}

	__output.push('</button>');
	_$_.pop_component();
}

export function ForLoopItemState(__output) {
	_$_.push_component();

	const initialItems = [
		{ id: 1, text: 'Todo 1' },
		{ id: 2, text: 'Todo 2' },
		{ id: 3, text: 'Todo 3' }
	];

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of initialItems) {
			{
				const comp = TodoItem;
				const args = [__output, { id: item.id, text: item.text }];

				comp(...args);
			}
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

function TodoItem(__output, props) {
	_$_.push_component();

	let done = track(false);

	__output.push('<div');
	__output.push(_$_.attr('class', `todo-${props.id}`));
	__output.push('>');

	{
		__output.push('<input');
		__output.push(' type="checkbox"');
		__output.push(_$_.attr('checked', _$_.get(done), true));
		__output.push(' class="checkbox"');
		__output.push(' />');
		__output.push('<span');
		__output.push(_$_.attr('class', _$_.get(done) ? 'completed' : 'pending'));
		__output.push('>');

		{
			__output.push(_$_.escape(props.text));
		}

		__output.push('</span>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ForLoopSingleItem(__output) {
	_$_.push_component();

	const items = ['Only'];

	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of items) {
			__output.push('<li');
			__output.push(' class="single"');
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopAddAtBeginning(__output) {
	_$_.push_component();

	let items = track(['B', 'C']);

	__output.push('<button');
	__output.push(' class="prepend"');
	__output.push('>');

	{
		__output.push('Prepend A');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push(_$_.attr('class', `item-${item}`));
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopAddInMiddle(__output) {
	_$_.push_component();

	let items = track(['A', 'C']);

	__output.push('<button');
	__output.push(' class="insert"');
	__output.push('>');

	{
		__output.push('Insert B');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push(_$_.attr('class', `item-${item}`));
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopRemoveFromMiddle(__output) {
	_$_.push_component();

	let items = track(['A', 'B', 'C']);

	__output.push('<button');
	__output.push(' class="remove-middle"');
	__output.push('>');

	{
		__output.push('Remove B');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push(_$_.attr('class', `item-${item}`));
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopLargeList(__output) {
	_$_.push_component();

	const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

	__output.push('<ul');
	__output.push(' class="large-list"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		var i = 0;

		for (const item of items) {
			__output.push('<li');
			__output.push(_$_.attr('class', `item-${i}`));
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
			i++;
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopSwap(__output) {
	_$_.push_component();

	let items = track(['A', 'B', 'C', 'D']);

	__output.push('<button');
	__output.push(' class="swap"');
	__output.push('>');

	{
		__output.push('Swap First and Last');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push(_$_.attr('class', `item-${item}`));
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForLoopReverse(__output) {
	_$_.push_component();

	let items = track(['A', 'B', 'C', 'D']);

	__output.push('<button');
	__output.push(' class="reverse"');
	__output.push('>');

	{
		__output.push('Reverse');
	}

	__output.push('</button>');
	__output.push('<ul');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of _$_.get(items)) {
			__output.push('<li');
			__output.push(_$_.attr('class', `item-${item}`));
			__output.push('>');

			{
				__output.push(_$_.escape(item));
			}

			__output.push('</li>');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}