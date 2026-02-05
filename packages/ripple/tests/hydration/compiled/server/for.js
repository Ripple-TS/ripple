import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/ssr';

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