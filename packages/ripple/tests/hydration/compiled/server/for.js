// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function StaticForLoop() {
	return _$_.tsrx_element(() => {
		const items = ['Apple', 'Banana', 'Cherry'];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul><!--[-->';

			for (const item of items) {
				__out += '<li>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopWithIndex() {
	return _$_.tsrx_element(() => {
		const items = ['A', 'B', 'C'];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul>';

			{
				__out += '<!--[-->';

				var i = 0;

				for (const item of items) {
					__out += '<li>' + _$_.escape(`${i}: ${item}`) + '</li>';
					i++;
				}

				__out += '<!--]-->';
			}

			__out += '</ul>';
			_$_.output_push(__out);
		});
	});
}

export function KeyedForLoop() {
	return _$_.tsrx_element(() => {
		const items = [
			{ id: 1, name: 'First' },
			{ id: 2, name: 'Second' },
			{ id: 3, name: 'Third' }
		];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul><!--[-->';

			for (const item of items) {
				__out += '<li>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item.name);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ReactiveForLoopAdd() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(['A', 'B'], '1qi64qy');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="add">Add</button><ul><!--[-->';

			for (const item of items.value) {
				__out += '<li>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ReactiveForLoopRemove() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(['A', 'B', 'C'], '1e738lw');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="remove">Remove</button><ul><!--[-->';

			for (const item of items.value) {
				__out += '<li>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopInteractive() {
	return _$_.tsrx_element(() => {
		const counts = _$_.track([0, 0, 0], 'f8yrj3');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			{
				__out += '<!--[-->';

				var i = 0;

				for (const count of counts.value) {
					__out += '<div' + _$_.attr('class', `item-${i}`) + '><span class="value">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(count);
					}

					__out += '</span><button class="increment">+</button></div>';
					i++;
				}

				__out += '<!--]-->';
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function NestedForLoop() {
	return _$_.tsrx_element(() => {
		const grid = [[1, 2], [3, 4]];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="grid">';

			{
				__out += '<!--[-->';

				var rowIndex = 0;

				for (const row of grid) {
					__out += '<div' + _$_.attr('class', `row-${rowIndex}`) + '>';

					{
						__out += '<!--[-->';

						var colIndex = 0;

						for (const cell of row) {
							__out += '<span' + _$_.attr('class', `cell-${rowIndex}-${colIndex}`) + '>';

							{
								_$_.output_push(__out);
								__out = '';
								_$_.render_expression(cell);
							}

							__out += '</span>';
							colIndex++;
						}

						__out += '<!--]-->';
					}

					__out += '</div>';
					rowIndex++;
				}

				__out += '<!--]-->';
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function EmptyForLoop() {
	return _$_.tsrx_element(() => {
		const items = [];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="container"><!--[-->';

			for (const item of items) {
				__out += '<span>' + _$_.escape(item) + '</span>';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopComplexObjects() {
	return _$_.tsrx_element(() => {
		const users = [
			{ id: 1, name: 'Alice', role: 'Admin' },
			{ id: 2, name: 'Bob', role: 'User' }
		];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><!--[-->';

			for (const user of users) {
				__out += '<div' + _$_.attr('class', `user-${user.id}`) + '><span class="name">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(user.name);
				}

				__out += '</span><span class="role">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(user.role);
				}

				__out += '</span></div>';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function KeyedForLoopReorder() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(
			[
				{ id: 1, name: 'First' },
				{ id: 2, name: 'Second' },
				{ id: 3, name: 'Third' }
			],
			'1sa3hr7'
		);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="reorder">Reorder</button><ul><!--[-->';

			for (const item of items.value) {
				__out += '<li' + _$_.attr('class', `item-${item.id}`) + '>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item.name);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function KeyedForLoopUpdate() {
	return _$_.tsrx_element(() => {
		const items = _$_.track([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }], 'xwci56');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="update">Update</button><ul><!--[-->';

			for (const item of items.value) {
				__out += '<li' + _$_.attr('class', `item-${item.id}`) + '>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item.name);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopMixedOperations() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(['A', 'B', 'C', 'D'], 'h5qbw6');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="shuffle">Shuffle</button><ul><!--[-->';

			for (const item of items.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopInsideIf() {
	return _$_.tsrx_element(() => {
		const showList = _$_.track(true, '1fjdps');
		const items = _$_.track(['X', 'Y', 'Z'], '1h205c3');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="toggle">Toggle List</button><button class="add">Add Item</button><!--[-->';

			if (showList.value) {
				__out += '<ul class="list"><!--[-->';

				for (const item of items.value) {
					__out += '<li>';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(item);
					}

					__out += '</li>';
				}

				__out += '<!--]--></ul>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopEmptyToPopulated() {
	return _$_.tsrx_element(() => {
		const items = _$_.track([], 'muog58');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="populate">Populate</button><ul class="list"><!--[-->';

			for (const item of items.value) {
				__out += '<li>' + _$_.escape(item) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopPopulatedToEmpty() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(['One', 'Two', 'Three'], '1u44ewo');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="clear">Clear</button><ul class="list"><!--[-->';

			for (const item of items.value) {
				__out += '<li>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function NestedForLoopReactive() {
	return _$_.tsrx_element(() => {
		const grid = _$_.track([[1, 2], [3, 4]], '197p4tv');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="nested-for-reactive"><button class="add-row">Add Row</button><button class="update-cell">Update Cell</button><div class="grid">';

			{
				__out += '<!--[-->';

				var rowIndex = 0;

				for (const row of grid.value) {
					__out += '<div' + _$_.attr('class', `row-${rowIndex}`) + '>';

					{
						__out += '<!--[-->';

						var colIndex = 0;

						for (const cell of row) {
							__out += '<span' + _$_.attr('class', `cell-${rowIndex}-${colIndex}`) + '>';

							{
								_$_.output_push(__out);
								__out = '';
								_$_.render_expression(cell);
							}

							__out += '</span>';
							colIndex++;
						}

						__out += '<!--]-->';
					}

					__out += '</div>';
					rowIndex++;
				}

				__out += '<!--]-->';
			}

			__out += '</div></div>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopDeeplyNested() {
	return _$_.tsrx_element(() => {
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
			let __out = '';

			__out += '<div class="org"><!--[-->';

			for (const dept of departments) {
				__out += '<div' + _$_.attr('class', `dept-${dept.id}`) + '><h2 class="dept-name">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(dept.name);
				}

				__out += '</h2><!--[-->';

				for (const team of dept.teams) {
					__out += '<div' + _$_.attr('class', `team-${team.id}`) + '><h3 class="team-name">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(team.name);
					}

					__out += '</h3><ul><!--[-->';

					for (const member of team.members) {
						__out += '<li class="member">';

						{
							_$_.output_push(__out);
							__out = '';
							_$_.render_expression(member);
						}

						__out += '</li>';
					}

					__out += '<!--]--></ul></div>';
				}

				__out += '<!--]--></div>';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopIndexUpdate() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(['First', 'Second', 'Third'], '1waej1i');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="prepend">Prepend</button><ul>';

			{
				__out += '<!--[-->';

				var i = 0;

				for (const item of items.value) {
					__out += '<li' + _$_.attr('class', `item-${i}`) + '>' + _$_.escape(`[${i}] ${item}`) + '</li>';
					i++;
				}

				__out += '<!--]-->';
			}

			__out += '</ul>';
			_$_.output_push(__out);
		});
	});
}

export function KeyedForLoopWithIndex() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(
			[
				{ id: 'a', value: 'Alpha' },
				{ id: 'b', value: 'Beta' },
				{ id: 'c', value: 'Gamma' }
			],
			'ejgeai'
		);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="reorder">Rotate</button><ul>';

			{
				__out += '<!--[-->';

				var i = 0;

				for (const item of items.value) {
					__out += '<li' + _$_.attr('data-index', i, false) + _$_.attr('class', `item-${item.id}`) + '>' + _$_.escape(`[${i}] ${item.id}: ${item.value}`) + '</li>';
					i++;
				}

				__out += '<!--]-->';
			}

			__out += '</ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopWithSiblings() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(['A', 'B'], 'gs9c2a');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrapper"><header class="before">Before</header><!--[-->';

			for (const item of items.value) {
				__out += '<div' + _$_.attr('class', `item-${item}`) + '>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</div>';
			}

			__out += '<!--]--><footer class="after">After</footer></div><button class="add">Add</button>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopItemState() {
	return _$_.tsrx_element(() => {
		const initialItems = [
			{ id: 1, text: 'Todo 1' },
			{ id: 2, text: 'Todo 2' },
			{ id: 3, text: 'Todo 3' }
		];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><!--[-->';

			for (const item of initialItems) {
				{
					const comp = TodoItem;
					const args = [{ id: item.id, text: item.text }];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

function TodoItem(props) {
	return _$_.tsrx_element(() => {
		const done = _$_.track(false, 'lyii78');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div' + _$_.attr('class', `todo-${props.id}`) + '><input type="checkbox"' + _$_.attr('checked', done.value, true) + ' class="checkbox" /><span' + _$_.attr('class', done.value ? 'completed' : 'pending') + '>' + _$_.escape(props.text) + '</span></div>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopSingleItem() {
	return _$_.tsrx_element(() => {
		const items = ['Only'];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul><!--[-->';

			for (const item of items) {
				__out += '<li class="single">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopAddAtBeginning() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(['B', 'C'], '5xk2t6');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="prepend">Prepend A</button><ul><!--[-->';

			for (const item of items.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopAddInMiddle() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(['A', 'C'], '7pf806');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="insert">Insert B</button><ul><!--[-->';

			for (const item of items.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopRemoveFromMiddle() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(['A', 'B', 'C'], '7wzmn3');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="remove-middle">Remove B</button><ul><!--[-->';

			for (const item of items.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopLargeList() {
	return _$_.tsrx_element(() => {
		const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="large-list">';

			{
				__out += '<!--[-->';

				var i = 0;

				for (const item of items) {
					__out += '<li' + _$_.attr('class', `item-${i}`) + '>';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(item);
					}

					__out += '</li>';
					i++;
				}

				__out += '<!--]-->';
			}

			__out += '</ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopSwap() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(['A', 'B', 'C', 'D'], 'qiflm7');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="swap">Swap First and Last</button><ul><!--[-->';

			for (const item of items.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopReverse() {
	return _$_.tsrx_element(() => {
		const items = _$_.track(['A', 'B', 'C', 'D'], 'a3chgk');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="reverse">Reverse</button><ul><!--[-->';

			for (const item of items.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function KeyedForLoopAppendAndRotate() {
	return _$_.tsrx_element(() => {
		const items = _$_.track([1, 2, 3], '1at4qo4');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrapper"><div class="host"><!--[-->';

			for (const item of items.value) {
				__out += '<span class="item">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(item);
				}

				__out += '</span>';
			}

			__out += '<!--]--><p class="tail">p</p></div><button class="push">Push</button><button class="rotate">Rotate</button></div>';
			_$_.output_push(__out);
		});
	});
}

function RootKeyedList(props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			for (const item of props.items.value) {
				__out += '<span class="item">' + _$_.escape(item) + '</span>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function RootKeyedForLoopAppendAndRotate() {
	return _$_.tsrx_element(() => {
		const items = _$_.track([1, 2, 3], 'mdp2e8');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrapper"><div class="host">';

			{
				const comp = RootKeyedList;
				const args = [{ items }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<p class="tail">p</p></div><button class="push">Push</button><button class="rotate">Rotate</button></div>';
			_$_.output_push(__out);
		});
	});
}