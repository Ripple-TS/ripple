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
				__out += '<li>' + _$_.escape(item) + '</li>';
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
				__out += '<li>' + _$_.escape(item.name) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ReactiveForLoopAdd() {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track(['A', 'B'], 'e145678a');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="add">Add</button><ul><!--[-->';

			for (const item of lazy.value) {
				__out += '<li>' + _$_.escape(item) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ReactiveForLoopRemove() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(['A', 'B', 'C'], 'b4e9bd54');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="remove">Remove</button><ul><!--[-->';

			for (const item of lazy_1.value) {
				__out += '<li>' + _$_.escape(item) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopInteractive() {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track([0, 0, 0], '36f563df');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div>';

			{
				__out += '<!--[-->';

				var i = 0;

				for (const count of lazy_2.value) {
					__out += '<div' + _$_.attr('class', `item-${i}`) + '><span class="value">' + _$_.escape(count) + '</span><button class="increment">+</button></div>';
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
							__out += '<span' + _$_.attr('class', `cell-${rowIndex}-${colIndex}`) + '>' + _$_.escape(cell) + '</span>';
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
				__out += '<div' + _$_.attr('class', `user-${user.id}`) + '><span class="name">' + _$_.escape(user.name) + '</span><span class="role">' + _$_.escape(user.role) + '</span></div>';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function KeyedForLoopReorder() {
	return _$_.tsrx_element(() => {
		let lazy_3 = _$_.track(
			[
				{ id: 1, name: 'First' },
				{ id: 2, name: 'Second' },
				{ id: 3, name: 'Third' }
			],
			'e7abc6a3'
		);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="reorder">Reorder</button><ul><!--[-->';

			for (const item of lazy_3.value) {
				__out += '<li' + _$_.attr('class', `item-${item.id}`) + '>' + _$_.escape(item.name) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function KeyedForLoopUpdate() {
	return _$_.tsrx_element(() => {
		let lazy_4 = _$_.track([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }], '7a2c2ada');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="update">Update</button><ul><!--[-->';

			for (const item of lazy_4.value) {
				__out += '<li' + _$_.attr('class', `item-${item.id}`) + '>' + _$_.escape(item.name) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopMixedOperations() {
	return _$_.tsrx_element(() => {
		let lazy_5 = _$_.track(['A', 'B', 'C', 'D'], '3dd7c7b6');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="shuffle">Shuffle</button><ul><!--[-->';

			for (const item of lazy_5.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>' + _$_.escape(item) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopInsideIf() {
	return _$_.tsrx_element(() => {
		let lazy_6 = _$_.track(true, '0528df30');
		let lazy_7 = _$_.track(['X', 'Y', 'Z'], 'bf375103');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="toggle">Toggle List</button><button class="add">Add Item</button><!--[-->';

			if (lazy_6.value) {
				__out += '<ul class="list"><!--[-->';

				for (const item of lazy_7.value) {
					__out += '<li>' + _$_.escape(item) + '</li>';
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
		let lazy_8 = _$_.track([], '525c5dbc');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="populate">Populate</button><ul class="list"><!--[-->';

			for (const item of lazy_8.value) {
				__out += '<li>' + _$_.escape(item) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopPopulatedToEmpty() {
	return _$_.tsrx_element(() => {
		let lazy_9 = _$_.track(['One', 'Two', 'Three'], 'ee47f078');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="clear">Clear</button><ul class="list"><!--[-->';

			for (const item of lazy_9.value) {
				__out += '<li>' + _$_.escape(item) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function NestedForLoopReactive() {
	return _$_.tsrx_element(() => {
		let lazy_10 = _$_.track([[1, 2], [3, 4]], 'a2f41fb3');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="nested-for-reactive"><button class="add-row">Add Row</button><button class="update-cell">Update Cell</button><div class="grid">';

			{
				__out += '<!--[-->';

				var rowIndex = 0;

				for (const row of lazy_10.value) {
					__out += '<div' + _$_.attr('class', `row-${rowIndex}`) + '>';

					{
						__out += '<!--[-->';

						var colIndex = 0;

						for (const cell of row) {
							__out += '<span' + _$_.attr('class', `cell-${rowIndex}-${colIndex}`) + '>' + _$_.escape(cell) + '</span>';
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
				__out += '<div' + _$_.attr('class', `dept-${dept.id}`) + '><h2 class="dept-name">' + _$_.escape(dept.name) + '</h2><!--[-->';

				for (const team of dept.teams) {
					__out += '<div' + _$_.attr('class', `team-${team.id}`) + '><h3 class="team-name">' + _$_.escape(team.name) + '</h3><ul><!--[-->';

					for (const member of team.members) {
						__out += '<li class="member">' + _$_.escape(member) + '</li>';
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
		let lazy_11 = _$_.track(['First', 'Second', 'Third'], 'f61e31e6');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="prepend">Prepend</button><ul>';

			{
				__out += '<!--[-->';

				var i = 0;

				for (const item of lazy_11.value) {
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
		let lazy_12 = _$_.track(
			[
				{ id: 'a', value: 'Alpha' },
				{ id: 'b', value: 'Beta' },
				{ id: 'c', value: 'Gamma' }
			],
			'3467975a'
		);

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="reorder">Rotate</button><ul>';

			{
				__out += '<!--[-->';

				var i = 0;

				for (const item of lazy_12.value) {
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
		let lazy_13 = _$_.track(['A', 'B'], '3c7e8152');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="wrapper"><header class="before">Before</header><!--[-->';

			for (const item of lazy_13.value) {
				__out += '<div' + _$_.attr('class', `item-${item}`) + '>' + _$_.escape(item) + '</div>';
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
		let lazy_14 = _$_.track(false, '4f2402a4');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div' + _$_.attr('class', `todo-${props.id}`) + '><input type="checkbox"' + _$_.attr('checked', lazy_14.value, true) + ' class="checkbox" /><span' + _$_.attr('class', lazy_14.value ? 'completed' : 'pending') + '>' + _$_.escape(props.text) + '</span></div>';
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
				__out += '<li class="single">' + _$_.escape(item) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopAddAtBeginning() {
	return _$_.tsrx_element(() => {
		let lazy_15 = _$_.track(['B', 'C'], '1561403a');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="prepend">Prepend A</button><ul><!--[-->';

			for (const item of lazy_15.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>' + _$_.escape(item) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopAddInMiddle() {
	return _$_.tsrx_element(() => {
		let lazy_16 = _$_.track(['A', 'C'], '1bc60b46');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="insert">Insert B</button><ul><!--[-->';

			for (const item of lazy_16.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>' + _$_.escape(item) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopRemoveFromMiddle() {
	return _$_.tsrx_element(() => {
		let lazy_17 = _$_.track(['A', 'B', 'C'], '1c87f95f');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="remove-middle">Remove B</button><ul><!--[-->';

			for (const item of lazy_17.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>' + _$_.escape(item) + '</li>';
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
					__out += '<li' + _$_.attr('class', `item-${i}`) + '>' + _$_.escape(item) + '</li>';
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
		let lazy_18 = _$_.track(['A', 'B', 'C', 'D'], '5f8d152f');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="swap">Swap First and Last</button><ul><!--[-->';

			for (const item of lazy_18.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>' + _$_.escape(item) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForLoopReverse() {
	return _$_.tsrx_element(() => {
		let lazy_19 = _$_.track(['A', 'B', 'C', 'D'], '24602e64');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="reverse">Reverse</button><ul><!--[-->';

			for (const item of lazy_19.value) {
				__out += '<li' + _$_.attr('class', `item-${item}`) + '>' + _$_.escape(item) + '</li>';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}