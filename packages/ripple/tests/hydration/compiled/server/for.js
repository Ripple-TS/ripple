// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticForLoop() {
	_$_.push_component();

	const items = ['Apple', 'Banana', 'Cherry'];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<li');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopWithIndex() {
	_$_.push_component();

	const items = ['A', 'B', 'C'];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			var i = 0;

			for (const item of items) {
				_$_.output_push('<li');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(`${i}: ${item}`));
				}

				_$_.output_push('</li>');
				i++;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function KeyedForLoop() {
	_$_.push_component();

	const items = [
		{ id: 1, name: 'First' },
		{ id: 2, name: 'Second' },
		{ id: 3, name: 'Third' }
	];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<li');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item.name));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ReactiveForLoopAdd() {
	_$_.push_component();

	let lazy = _$_.track(['A', 'B']);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="add"');
		_$_.output_push('>');

		{
			_$_.output_push('Add');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy)) {
				_$_.output_push('<li');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ReactiveForLoopRemove() {
	_$_.push_component();

	let lazy_1 = _$_.track(['A', 'B', 'C']);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="remove"');
		_$_.output_push('>');

		{
			_$_.output_push('Remove');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_1)) {
				_$_.output_push('<li');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopInteractive() {
	_$_.push_component();

	let lazy_2 = _$_.track([0, 0, 0]);

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			var i = 0;

			for (const count of _$_.get(lazy_2)) {
				_$_.output_push('<div');
				_$_.output_push(_$_.attr('class', `item-${i}`));
				_$_.output_push('>');

				{
					_$_.output_push('<span');
					_$_.output_push(' class="value"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(count));
					}

					_$_.output_push('</span>');
					_$_.output_push('<button');
					_$_.output_push(' class="increment"');
					_$_.output_push('>');

					{
						_$_.output_push('+');
					}

					_$_.output_push('</button>');
				}

				_$_.output_push('</div>');
				i++;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function NestedForLoop() {
	_$_.push_component();

	const grid = [[1, 2], [3, 4]];

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="grid"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			var rowIndex = 0;

			for (const row of grid) {
				_$_.output_push('<div');
				_$_.output_push(_$_.attr('class', `row-${rowIndex}`));
				_$_.output_push('>');

				{
					_$_.output_push('<!--[-->');

					var colIndex = 0;

					for (const cell of row) {
						_$_.output_push('<span');
						_$_.output_push(_$_.attr('class', `cell-${rowIndex}-${colIndex}`));
						_$_.output_push('>');

						{
							_$_.output_push(_$_.escape(cell));
						}

						_$_.output_push('</span>');
						colIndex++;
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('</div>');
				rowIndex++;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function EmptyForLoop() {
	_$_.push_component();

	const items = [];

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="container"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<span');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</span>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function ForLoopComplexObjects() {
	_$_.push_component();

	const users = [
		{ id: 1, name: 'Alice', role: 'Admin' },
		{ id: 2, name: 'Bob', role: 'User' }
	];

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const user of users) {
				_$_.output_push('<div');
				_$_.output_push(_$_.attr('class', `user-${user.id}`));
				_$_.output_push('>');

				{
					_$_.output_push('<span');
					_$_.output_push(' class="name"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(user.name));
					}

					_$_.output_push('</span>');
					_$_.output_push('<span');
					_$_.output_push(' class="role"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(user.role));
					}

					_$_.output_push('</span>');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function KeyedForLoopReorder() {
	_$_.push_component();

	let lazy_3 = _$_.track([
		{ id: 1, name: 'First' },
		{ id: 2, name: 'Second' },
		{ id: 3, name: 'Third' }
	]);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="reorder"');
		_$_.output_push('>');

		{
			_$_.output_push('Reorder');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_3)) {
				_$_.output_push('<li');
				_$_.output_push(_$_.attr('class', `item-${item.id}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item.name));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function KeyedForLoopUpdate() {
	_$_.push_component();

	let lazy_4 = _$_.track([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="update"');
		_$_.output_push('>');

		{
			_$_.output_push('Update');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_4)) {
				_$_.output_push('<li');
				_$_.output_push(_$_.attr('class', `item-${item.id}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item.name));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopMixedOperations() {
	_$_.push_component();

	let lazy_5 = _$_.track(['A', 'B', 'C', 'D']);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="shuffle"');
		_$_.output_push('>');

		{
			_$_.output_push('Shuffle');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_5)) {
				_$_.output_push('<li');
				_$_.output_push(_$_.attr('class', `item-${item}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopInsideIf() {
	_$_.push_component();

	let lazy_6 = _$_.track(true);
	let lazy_7 = _$_.track(['X', 'Y', 'Z']);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="toggle"');
		_$_.output_push('>');

		{
			_$_.output_push('Toggle List');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="add"');
		_$_.output_push('>');

		{
			_$_.output_push('Add Item');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<!--[-->');

		if (_$_.get(lazy_6)) {
			_$_.output_push('<ul');
			_$_.output_push(' class="list"');
			_$_.output_push('>');

			{
				_$_.output_push('<!--[-->');

				for (const item of _$_.get(lazy_7)) {
					_$_.output_push('<li');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(item));
					}

					_$_.output_push('</li>');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('</ul>');
		}

		_$_.output_push('<!--]-->');
	});

	_$_.pop_component();
}

export function ForLoopEmptyToPopulated() {
	_$_.push_component();

	let lazy_8 = _$_.track([]);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="populate"');
		_$_.output_push('>');

		{
			_$_.output_push('Populate');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="list"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_8)) {
				_$_.output_push('<li');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopPopulatedToEmpty() {
	_$_.push_component();

	let lazy_9 = _$_.track(['One', 'Two', 'Three']);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="clear"');
		_$_.output_push('>');

		{
			_$_.output_push('Clear');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="list"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_9)) {
				_$_.output_push('<li');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function NestedForLoopReactive() {
	_$_.push_component();

	let lazy_10 = _$_.track([[1, 2], [3, 4]]);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="add-row"');
		_$_.output_push('>');

		{
			_$_.output_push('Add Row');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="update-cell"');
		_$_.output_push('>');

		{
			_$_.output_push('Update Cell');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="grid"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			var rowIndex = 0;

			for (const row of _$_.get(lazy_10)) {
				_$_.output_push('<div');
				_$_.output_push(_$_.attr('class', `row-${rowIndex}`));
				_$_.output_push('>');

				{
					_$_.output_push('<!--[-->');

					var colIndex = 0;

					for (const cell of row) {
						_$_.output_push('<span');
						_$_.output_push(_$_.attr('class', `cell-${rowIndex}-${colIndex}`));
						_$_.output_push('>');

						{
							_$_.output_push(_$_.escape(cell));
						}

						_$_.output_push('</span>');
						colIndex++;
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('</div>');
				rowIndex++;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function ForLoopDeeplyNested() {
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

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="org"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const dept of departments) {
				_$_.output_push('<div');
				_$_.output_push(_$_.attr('class', `dept-${dept.id}`));
				_$_.output_push('>');

				{
					_$_.output_push('<h2');
					_$_.output_push(' class="dept-name"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(dept.name));
					}

					_$_.output_push('</h2>');
					_$_.output_push('<!--[-->');

					for (const team of dept.teams) {
						_$_.output_push('<div');
						_$_.output_push(_$_.attr('class', `team-${team.id}`));
						_$_.output_push('>');

						{
							_$_.output_push('<h3');
							_$_.output_push(' class="team-name"');
							_$_.output_push('>');

							{
								_$_.output_push(_$_.escape(team.name));
							}

							_$_.output_push('</h3>');
							_$_.output_push('<ul');
							_$_.output_push('>');

							{
								_$_.output_push('<!--[-->');

								for (const member of team.members) {
									_$_.output_push('<li');
									_$_.output_push(' class="member"');
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(member));
									}

									_$_.output_push('</li>');
								}

								_$_.output_push('<!--]-->');
							}

							_$_.output_push('</ul>');
						}

						_$_.output_push('</div>');
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function ForLoopIndexUpdate() {
	_$_.push_component();

	let lazy_11 = _$_.track(['First', 'Second', 'Third']);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="prepend"');
		_$_.output_push('>');

		{
			_$_.output_push('Prepend');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			var i = 0;

			for (const item of _$_.get(lazy_11)) {
				_$_.output_push('<li');
				_$_.output_push(_$_.attr('class', `item-${i}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(`[${i}] ${item}`));
				}

				_$_.output_push('</li>');
				i++;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function KeyedForLoopWithIndex() {
	_$_.push_component();

	let lazy_12 = _$_.track([
		{ id: 'a', value: 'Alpha' },
		{ id: 'b', value: 'Beta' },
		{ id: 'c', value: 'Gamma' }
	]);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="reorder"');
		_$_.output_push('>');

		{
			_$_.output_push('Rotate');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			var i = 0;

			for (const item of _$_.get(lazy_12)) {
				_$_.output_push('<li');
				_$_.output_push(_$_.attr('data-index', i, false));
				_$_.output_push(_$_.attr('class', `item-${item.id}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(`[${i}] ${item.id}: ${item.value}`));
				}

				_$_.output_push('</li>');
				i++;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopWithSiblings() {
	_$_.push_component();

	let lazy_13 = _$_.track(['A', 'B']);

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="wrapper"');
		_$_.output_push('>');

		{
			_$_.output_push('<header');
			_$_.output_push(' class="before"');
			_$_.output_push('>');

			{
				_$_.output_push('Before');
			}

			_$_.output_push('</header>');
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_13)) {
				_$_.output_push('<div');
				_$_.output_push(_$_.attr('class', `item-${item}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</div>');
			}

			_$_.output_push('<!--]-->');
			_$_.output_push('<footer');
			_$_.output_push(' class="after"');
			_$_.output_push('>');

			{
				_$_.output_push('After');
			}

			_$_.output_push('</footer>');
		}

		_$_.output_push('</div>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="add"');
		_$_.output_push('>');

		{
			_$_.output_push('Add');
		}

		_$_.output_push('</button>');
	});

	_$_.pop_component();
}

export function ForLoopItemState() {
	_$_.push_component();

	const initialItems = [
		{ id: 1, text: 'Todo 1' },
		{ id: 2, text: 'Todo 2' },
		{ id: 3, text: 'Todo 3' }
	];

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of initialItems) {
				{
					const comp = TodoItem;
					const args = [{ id: item.id, text: item.text }];

					comp(...args);
				}
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

function TodoItem(props) {
	_$_.push_component();

	let lazy_14 = _$_.track(false);

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(_$_.attr('class', `todo-${props.id}`));
		_$_.output_push('>');

		{
			_$_.output_push('<input');
			_$_.output_push(' type="checkbox"');
			_$_.output_push(_$_.attr('checked', _$_.get(lazy_14), true));
			_$_.output_push(' class="checkbox"');
			_$_.output_push(' />');
			_$_.output_push('<span');
			_$_.output_push(_$_.attr('class', _$_.get(lazy_14) ? 'completed' : 'pending'));
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(props.text));
			}

			_$_.output_push('</span>');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function ForLoopSingleItem() {
	_$_.push_component();

	const items = ['Only'];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<li');
				_$_.output_push(' class="single"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopAddAtBeginning() {
	_$_.push_component();

	let lazy_15 = _$_.track(['B', 'C']);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="prepend"');
		_$_.output_push('>');

		{
			_$_.output_push('Prepend A');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_15)) {
				_$_.output_push('<li');
				_$_.output_push(_$_.attr('class', `item-${item}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopAddInMiddle() {
	_$_.push_component();

	let lazy_16 = _$_.track(['A', 'C']);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="insert"');
		_$_.output_push('>');

		{
			_$_.output_push('Insert B');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_16)) {
				_$_.output_push('<li');
				_$_.output_push(_$_.attr('class', `item-${item}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopRemoveFromMiddle() {
	_$_.push_component();

	let lazy_17 = _$_.track(['A', 'B', 'C']);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="remove-middle"');
		_$_.output_push('>');

		{
			_$_.output_push('Remove B');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_17)) {
				_$_.output_push('<li');
				_$_.output_push(_$_.attr('class', `item-${item}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopLargeList() {
	_$_.push_component();

	const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="large-list"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			var i = 0;

			for (const item of items) {
				_$_.output_push('<li');
				_$_.output_push(_$_.attr('class', `item-${i}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
				i++;
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopSwap() {
	_$_.push_component();

	let lazy_18 = _$_.track(['A', 'B', 'C', 'D']);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="swap"');
		_$_.output_push('>');

		{
			_$_.output_push('Swap First and Last');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_18)) {
				_$_.output_push('<li');
				_$_.output_push(_$_.attr('class', `item-${item}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForLoopReverse() {
	_$_.push_component();

	let lazy_19 = _$_.track(['A', 'B', 'C', 'D']);

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="reverse"');
		_$_.output_push('>');

		{
			_$_.output_push('Reverse');
		}

		_$_.output_push('</button>');
	});

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of _$_.get(lazy_19)) {
				_$_.output_push('<li');
				_$_.output_push(_$_.attr('class', `item-${item}`));
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(item));
				}

				_$_.output_push('</li>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}