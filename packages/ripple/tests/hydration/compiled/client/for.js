import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<li> </li>`, 0);
var root = _$_.template(`<ul></ul>`, 0);
var root_3 = _$_.template(`<li> </li>`, 0);
var root_2 = _$_.template(`<ul></ul>`, 0);
var root_5 = _$_.template(`<li> </li>`, 0);
var root_4 = _$_.template(`<ul></ul>`, 0);
var root_7 = _$_.template(`<li> </li>`, 0);
var root_6 = _$_.template(`<button class="add">Add</button><ul></ul>`, 1);
var root_9 = _$_.template(`<li> </li>`, 0);
var root_8 = _$_.template(`<button class="remove">Remove</button><ul></ul>`, 1);
var root_11 = _$_.template(`<div><span class="value"> </span><button class="increment">+</button></div>`, 0);
var root_10 = _$_.template(`<div></div>`, 0);
var root_14 = _$_.template(`<span> </span>`, 0);
var root_13 = _$_.template(`<div></div>`, 0);
var root_12 = _$_.template(`<div class="grid"></div>`, 0);
var root_16 = _$_.template(`<span> </span>`, 0);
var root_15 = _$_.template(`<div class="container"></div>`, 0);
var root_18 = _$_.template(`<div><span class="name"> </span><span class="role"> </span></div>`, 0);
var root_17 = _$_.template(`<div></div>`, 0);

import { track } from 'ripple';

export function StaticForLoop(__anchor, _, __block) {
	_$_.push_component();

	const items = ['Apple', 'Banana', 'Cherry'];
	var ul_1 = root();

	{
		_$_.for(
			ul_1,
			() => items,
			(__anchor, item) => {
				var li_1 = root_1();

				{
					var text = _$_.child(li_1, true);

					text.nodeValue = item;
					_$_.pop(li_1);
				}

				_$_.append(__anchor, li_1);
			},
			4
		);

		_$_.pop(ul_1);
	}

	_$_.append(__anchor, ul_1);
	_$_.pop_component();
}

export function ForLoopWithIndex(__anchor, _, __block) {
	_$_.push_component();

	const items = ['A', 'B', 'C'];
	var ul_2 = root_2();

	{
		_$_.for(
			ul_2,
			() => items,
			(__anchor, item, i) => {
				var li_2 = root_3();

				{
					var text_1 = _$_.child(li_2, true);

					_$_.pop(li_2);
				}

				_$_.render(() => {
					_$_.set_text(text_1, `${_$_.get(i)}: ${item}`);
				});

				_$_.append(__anchor, li_2);
			},
			12
		);

		_$_.pop(ul_2);
	}

	_$_.append(__anchor, ul_2);
	_$_.pop_component();
}

export function KeyedForLoop(__anchor, _, __block) {
	_$_.push_component();

	const items = [
		{ id: 1, name: 'First' },
		{ id: 2, name: 'Second' },
		{ id: 3, name: 'Third' }
	];

	var ul_3 = root_4();

	{
		_$_.for_keyed(
			ul_3,
			() => items,
			(__anchor, pattern) => {
				var li_3 = root_5();

				{
					var text_2 = _$_.child(li_3, true);

					_$_.pop(li_3);
				}

				_$_.render(() => {
					_$_.set_text(text_2, _$_.get(pattern).name);
				});

				_$_.append(__anchor, li_3);
			},
			4,
			(pattern) => _$_.get(pattern).id
		);

		_$_.pop(ul_3);
	}

	_$_.append(__anchor, ul_3);
	_$_.pop_component();
}

export function ReactiveForLoopAdd(__anchor, _, __block) {
	_$_.push_component();

	let items = track(['A', 'B'], void 0, void 0, __block);
	var fragment = root_6();
	var button_1 = _$_.first_child_frag(fragment);

	button_1.__click = () => {
		_$_.set(items, [..._$_.get(items), 'C']);
	};

	var ul_4 = _$_.sibling(button_1);

	{
		_$_.for(
			ul_4,
			() => _$_.get(items),
			(__anchor, item) => {
				var li_4 = root_7();

				{
					var text_3 = _$_.child(li_4, true);

					text_3.nodeValue = item;
					_$_.pop(li_4);
				}

				_$_.append(__anchor, li_4);
			},
			4
		);

		_$_.pop(ul_4);
	}

	_$_.append(__anchor, fragment);
	_$_.pop_component();
}

export function ReactiveForLoopRemove(__anchor, _, __block) {
	_$_.push_component();

	let items = track(['A', 'B', 'C'], void 0, void 0, __block);
	var fragment_1 = root_8();
	var button_2 = _$_.first_child_frag(fragment_1);

	button_2.__click = () => {
		_$_.set(items, _$_.with_scope(__block, () => _$_.get(items).slice(0, -1)));
	};

	var ul_5 = _$_.sibling(button_2);

	{
		_$_.for(
			ul_5,
			() => _$_.get(items),
			(__anchor, item) => {
				var li_5 = root_9();

				{
					var text_4 = _$_.child(li_5, true);

					text_4.nodeValue = item;
					_$_.pop(li_5);
				}

				_$_.append(__anchor, li_5);
			},
			4
		);

		_$_.pop(ul_5);
	}

	_$_.append(__anchor, fragment_1);
	_$_.pop_component();
}

export function ForLoopInteractive(__anchor, _, __block) {
	_$_.push_component();

	let counts = track([0, 0, 0], void 0, void 0, __block);
	var div_1 = root_10();

	{
		_$_.for(
			div_1,
			() => _$_.get(counts),
			(__anchor, count, i) => {
				var div_2 = root_11();

				{
					var span_1 = _$_.child(div_2);

					{
						var text_5 = _$_.child(span_1, true);

						text_5.nodeValue = count;
						_$_.pop(span_1);
					}

					var button_3 = _$_.sibling(span_1);

					button_3.__click = () => {
						const newCounts = [..._$_.get(counts)];

						newCounts[_$_.get(i)]++;
						_$_.set(counts, newCounts);
					};
				}

				_$_.render(() => {
					_$_.set_class(div_2, `item-${_$_.get(i)}`, void 0, true);
				});

				_$_.append(__anchor, div_2);
			},
			12
		);

		_$_.pop(div_1);
	}

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function NestedForLoop(__anchor, _, __block) {
	_$_.push_component();

	const grid = [[1, 2], [3, 4]];
	var div_3 = root_12();

	{
		_$_.for(
			div_3,
			() => grid,
			(__anchor, row, rowIndex) => {
				var div_4 = root_13();

				{
					_$_.for(
						div_4,
						() => row,
						(__anchor, cell, colIndex) => {
							var span_2 = root_14();

							{
								var text_6 = _$_.child(span_2, true);

								text_6.nodeValue = cell;
								_$_.pop(span_2);
							}

							_$_.render(() => {
								_$_.set_class(span_2, `cell-${_$_.get(rowIndex)}-${_$_.get(colIndex)}`, void 0, true);
							});

							_$_.append(__anchor, span_2);
						},
						12
					);

					_$_.pop(div_4);

					_$_.render(() => {
						_$_.set_class(div_4, `row-${_$_.get(rowIndex)}`, void 0, true);
					});
				}

				_$_.append(__anchor, div_4);
			},
			12
		);

		_$_.pop(div_3);
	}

	_$_.append(__anchor, div_3);
	_$_.pop_component();
}

export function EmptyForLoop(__anchor, _, __block) {
	_$_.push_component();

	const items = [];
	var div_5 = root_15();

	{
		_$_.for(
			div_5,
			() => items,
			(__anchor, item) => {
				var span_3 = root_16();

				{
					var text_7 = _$_.child(span_3, true);

					text_7.nodeValue = item;
					_$_.pop(span_3);
				}

				_$_.append(__anchor, span_3);
			},
			4
		);

		_$_.pop(div_5);
	}

	_$_.append(__anchor, div_5);
	_$_.pop_component();
}

export function ForLoopComplexObjects(__anchor, _, __block) {
	_$_.push_component();

	const users = [
		{ id: 1, name: 'Alice', role: 'Admin' },
		{ id: 2, name: 'Bob', role: 'User' }
	];

	var div_6 = root_17();

	{
		_$_.for_keyed(
			div_6,
			() => users,
			(__anchor, pattern_1) => {
				var div_7 = root_18();

				{
					var span_4 = _$_.child(div_7);

					{
						var text_8 = _$_.child(span_4, true);

						_$_.pop(span_4);
					}

					var span_5 = _$_.sibling(span_4);

					{
						var text_9 = _$_.child(span_5, true);

						_$_.pop(span_5);
					}
				}

				_$_.render(
					(__prev) => {
						var __a = _$_.get(pattern_1).name;

						if (__prev.a !== __a) {
							_$_.set_text(text_8, __prev.a = __a);
						}

						var __b = _$_.get(pattern_1).role;

						if (__prev.b !== __b) {
							_$_.set_text(text_9, __prev.b = __b);
						}

						var __c = `user-${_$_.get(pattern_1).id}`;

						if (__prev.c !== __c) {
							_$_.set_class(div_7, __prev.c = __c, void 0, true);
						}
					},
					{ a: ' ', b: ' ', c: Symbol() }
				);

				_$_.append(__anchor, div_7);
			},
			4,
			(pattern_1) => _$_.get(pattern_1).id
		);

		_$_.pop(div_6);
	}

	_$_.append(__anchor, div_6);
	_$_.pop_component();
}

_$_.delegate(['click']);