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
var root_20 = _$_.template(`<li> </li>`, 0);
var root_19 = _$_.template(`<button class="reorder">Reorder</button><ul></ul>`, 1);
var root_22 = _$_.template(`<li> </li>`, 0);
var root_21 = _$_.template(`<button class="update">Update</button><ul></ul>`, 1);
var root_24 = _$_.template(`<li> </li>`, 0);
var root_23 = _$_.template(`<button class="shuffle">Shuffle</button><ul></ul>`, 1);
var root_27 = _$_.template(`<li> </li>`, 0);
var root_26 = _$_.template(`<ul class="list"></ul>`, 0);
var root_25 = _$_.template(`<button class="toggle">Toggle List</button><button class="add">Add Item</button><!>`, 1);
var root_29 = _$_.template(`<li> </li>`, 0);
var root_28 = _$_.template(`<button class="populate">Populate</button><ul class="list"></ul>`, 1);
var root_31 = _$_.template(`<li> </li>`, 0);
var root_30 = _$_.template(`<button class="clear">Clear</button><ul class="list"></ul>`, 1);
var root_34 = _$_.template(`<span> </span>`, 0);
var root_33 = _$_.template(`<div></div>`, 0);
var root_32 = _$_.template(`<button class="add-row">Add Row</button><button class="update-cell">Update Cell</button><div class="grid"></div>`, 1);
var root_38 = _$_.template(`<li class="member"> </li>`, 0);
var root_37 = _$_.template(`<div><h3 class="team-name"> </h3><ul></ul></div>`, 0);
var root_36 = _$_.template(`<div><h2 class="dept-name"> </h2><!></div>`, 0);
var root_35 = _$_.template(`<div class="org"></div>`, 0);
var root_40 = _$_.template(`<li> </li>`, 0);
var root_39 = _$_.template(`<button class="prepend">Prepend</button><ul></ul>`, 1);
var root_42 = _$_.template(`<li> </li>`, 0);
var root_41 = _$_.template(`<button class="reorder">Rotate</button><ul></ul>`, 1);
var root_44 = _$_.template(`<div> </div>`, 0);
var root_43 = _$_.template(`<div class="wrapper"><header class="before">Before</header><!><footer class="after">After</footer></div><button class="add">Add</button>`, 1);
var root_46 = _$_.template(`<!>`, 1);
var root_45 = _$_.template(`<div></div>`, 0);
var root_47 = _$_.template(`<div><input type="checkbox" class="checkbox"><span> </span></div>`, 0);
var root_49 = _$_.template(`<li class="single"> </li>`, 0);
var root_48 = _$_.template(`<ul></ul>`, 0);
var root_51 = _$_.template(`<li> </li>`, 0);
var root_50 = _$_.template(`<button class="prepend">Prepend A</button><ul></ul>`, 1);
var root_53 = _$_.template(`<li> </li>`, 0);
var root_52 = _$_.template(`<button class="insert">Insert B</button><ul></ul>`, 1);
var root_55 = _$_.template(`<li> </li>`, 0);
var root_54 = _$_.template(`<button class="remove-middle">Remove B</button><ul></ul>`, 1);
var root_57 = _$_.template(`<li> </li>`, 0);
var root_56 = _$_.template(`<ul class="large-list"></ul>`, 0);
var root_59 = _$_.template(`<li> </li>`, 0);
var root_58 = _$_.template(`<button class="swap">Swap First and Last</button><ul></ul>`, 1);
var root_61 = _$_.template(`<li> </li>`, 0);
var root_60 = _$_.template(`<button class="reverse">Reverse</button><ul></ul>`, 1);

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
					var text_1 = _$_.child(li_1, true);

					text_1.nodeValue = item;
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
					var text_2 = _$_.child(li_2, true);

					_$_.pop(li_2);
				}

				_$_.render(() => {
					_$_.set_text(text_2, `${_$_.get(i)}: ${item}`);
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
					var text_3 = _$_.child(li_3, true);

					_$_.pop(li_3);
				}

				_$_.render(() => {
					_$_.set_text(text_3, _$_.get(pattern).name);
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
					var text_4 = _$_.child(li_4, true);

					text_4.nodeValue = item;
					_$_.pop(li_4);
				}

				_$_.append(__anchor, li_4);
			},
			4
		);

		_$_.pop(ul_4);
	}

	_$_.next();
	_$_.append(__anchor, fragment, true);
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
					var text_5 = _$_.child(li_5, true);

					text_5.nodeValue = item;
					_$_.pop(li_5);
				}

				_$_.append(__anchor, li_5);
			},
			4
		);

		_$_.pop(ul_5);
	}

	_$_.next();
	_$_.append(__anchor, fragment_1, true);
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
						var text_6 = _$_.child(span_1, true);

						text_6.nodeValue = count;
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
								var text_7 = _$_.child(span_2, true);

								text_7.nodeValue = cell;
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
					var text_8 = _$_.child(span_3, true);

					text_8.nodeValue = item;
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
						var text_9 = _$_.child(span_4, true);

						_$_.pop(span_4);
					}

					var span_5 = _$_.sibling(span_4);

					{
						var text_10 = _$_.child(span_5, true);

						_$_.pop(span_5);
					}
				}

				_$_.render(
					(__prev) => {
						var __a = _$_.get(pattern_1).name;

						if (__prev.a !== __a) {
							_$_.set_text(text_9, __prev.a = __a);
						}

						var __b = _$_.get(pattern_1).role;

						if (__prev.b !== __b) {
							_$_.set_text(text_10, __prev.b = __b);
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

export function KeyedForLoopReorder(__anchor, _, __block) {
	_$_.push_component();

	let items = track(
		[
			{ id: 1, name: 'First' },
			{ id: 2, name: 'Second' },
			{ id: 3, name: 'Third' }
		],
		void 0,
		void 0,
		__block
	);

	var fragment_2 = root_19();
	var button_4 = _$_.first_child_frag(fragment_2);

	button_4.__click = () => {
		_$_.set(items, [_$_.get(items)[2], _$_.get(items)[0], _$_.get(items)[1]]);
	};

	var ul_6 = _$_.sibling(button_4);

	{
		_$_.for_keyed(
			ul_6,
			() => _$_.get(items),
			(__anchor, pattern_2) => {
				var li_6 = root_20();

				{
					var text_11 = _$_.child(li_6, true);

					_$_.pop(li_6);
				}

				_$_.render(
					(__prev) => {
						var __a = _$_.get(pattern_2).name;

						if (__prev.a !== __a) {
							_$_.set_text(text_11, __prev.a = __a);
						}

						var __b = `item-${_$_.get(pattern_2).id}`;

						if (__prev.b !== __b) {
							_$_.set_class(li_6, __prev.b = __b, void 0, true);
						}
					},
					{ a: ' ', b: Symbol() }
				);

				_$_.append(__anchor, li_6);
			},
			4,
			(pattern_2) => _$_.get(pattern_2).id
		);

		_$_.pop(ul_6);
	}

	_$_.next();
	_$_.append(__anchor, fragment_2, true);
	_$_.pop_component();
}

export function KeyedForLoopUpdate(__anchor, _, __block) {
	_$_.push_component();

	let items = track([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }], void 0, void 0, __block);
	var fragment_3 = root_21();
	var button_5 = _$_.first_child_frag(fragment_3);

	button_5.__click = () => {
		_$_.set(items, _$_.with_scope(__block, () => _$_.get(items).map((item) => item.id === 1 ? { ...item, name: 'Updated' } : item)));
	};

	var ul_7 = _$_.sibling(button_5);

	{
		_$_.for_keyed(
			ul_7,
			() => _$_.get(items),
			(__anchor, pattern_3) => {
				var li_7 = root_22();

				{
					var text_12 = _$_.child(li_7, true);

					_$_.pop(li_7);
				}

				_$_.render(
					(__prev) => {
						var __a = _$_.get(pattern_3).name;

						if (__prev.a !== __a) {
							_$_.set_text(text_12, __prev.a = __a);
						}

						var __b = `item-${_$_.get(pattern_3).id}`;

						if (__prev.b !== __b) {
							_$_.set_class(li_7, __prev.b = __b, void 0, true);
						}
					},
					{ a: ' ', b: Symbol() }
				);

				_$_.append(__anchor, li_7);
			},
			4,
			(pattern_3) => _$_.get(pattern_3).id
		);

		_$_.pop(ul_7);
	}

	_$_.next();
	_$_.append(__anchor, fragment_3, true);
	_$_.pop_component();
}

export function ForLoopMixedOperations(__anchor, _, __block) {
	_$_.push_component();

	let items = track(['A', 'B', 'C', 'D'], void 0, void 0, __block);
	var fragment_4 = root_23();
	var button_6 = _$_.first_child_frag(fragment_4);

	button_6.__click = () => {
		_$_.set(items, ['D', 'C', 'A', 'E']);
	};

	var ul_8 = _$_.sibling(button_6);

	{
		_$_.for(
			ul_8,
			() => _$_.get(items),
			(__anchor, item) => {
				var li_8 = root_24();

				_$_.set_class(li_8, `item-${item}`, void 0, true);

				{
					var text_13 = _$_.child(li_8, true);

					text_13.nodeValue = item;
					_$_.pop(li_8);
				}

				_$_.append(__anchor, li_8);
			},
			4
		);

		_$_.pop(ul_8);
	}

	_$_.next();
	_$_.append(__anchor, fragment_4, true);
	_$_.pop_component();
}

export function ForLoopInsideIf(__anchor, _, __block) {
	_$_.push_component();

	let showList = track(true, void 0, void 0, __block);
	let items = track(['X', 'Y', 'Z'], void 0, void 0, __block);
	var fragment_5 = root_25();
	var button_7 = _$_.first_child_frag(fragment_5);

	button_7.__click = () => {
		_$_.set(showList, !_$_.get(showList));
	};

	var button_8 = _$_.sibling(button_7);

	button_8.__click = () => {
		_$_.set(items, [..._$_.get(items), 'W']);
	};

	var node = _$_.sibling(button_8);

	{
		var consequent = (__anchor) => {
			var ul_9 = root_26();

			{
				_$_.for(
					ul_9,
					() => _$_.get(items),
					(__anchor, item) => {
						var li_9 = root_27();

						{
							var text_14 = _$_.child(li_9, true);

							text_14.nodeValue = item;
							_$_.pop(li_9);
						}

						_$_.append(__anchor, li_9);
					},
					4
				);

				_$_.pop(ul_9);
			}

			_$_.append(__anchor, ul_9);
		};

		_$_.if(node, (__render) => {
			if (_$_.get(showList)) __render(consequent);
		});
	}

	_$_.append(__anchor, fragment_5);
	_$_.pop_component();
}

export function ForLoopEmptyToPopulated(__anchor, _, __block) {
	_$_.push_component();

	let items = track([], void 0, void 0, __block);
	var fragment_6 = root_28();
	var button_9 = _$_.first_child_frag(fragment_6);

	button_9.__click = () => {
		_$_.set(items, ['One', 'Two', 'Three']);
	};

	var ul_10 = _$_.sibling(button_9);

	{
		_$_.for(
			ul_10,
			() => _$_.get(items),
			(__anchor, item) => {
				var li_10 = root_29();

				{
					var text_15 = _$_.child(li_10, true);

					text_15.nodeValue = item;
					_$_.pop(li_10);
				}

				_$_.append(__anchor, li_10);
			},
			4
		);

		_$_.pop(ul_10);
	}

	_$_.next();
	_$_.append(__anchor, fragment_6, true);
	_$_.pop_component();
}

export function ForLoopPopulatedToEmpty(__anchor, _, __block) {
	_$_.push_component();

	let items = track(['One', 'Two', 'Three'], void 0, void 0, __block);
	var fragment_7 = root_30();
	var button_10 = _$_.first_child_frag(fragment_7);

	button_10.__click = () => {
		_$_.set(items, []);
	};

	var ul_11 = _$_.sibling(button_10);

	{
		_$_.for(
			ul_11,
			() => _$_.get(items),
			(__anchor, item) => {
				var li_11 = root_31();

				{
					var text_16 = _$_.child(li_11, true);

					text_16.nodeValue = item;
					_$_.pop(li_11);
				}

				_$_.append(__anchor, li_11);
			},
			4
		);

		_$_.pop(ul_11);
	}

	_$_.next();
	_$_.append(__anchor, fragment_7, true);
	_$_.pop_component();
}

export function NestedForLoopReactive(__anchor, _, __block) {
	_$_.push_component();

	let grid = track([[1, 2], [3, 4]], void 0, void 0, __block);
	var fragment_8 = root_32();
	var button_11 = _$_.first_child_frag(fragment_8);

	button_11.__click = () => {
		_$_.set(grid, [..._$_.get(grid), [5, 6]]);
	};

	var button_12 = _$_.sibling(button_11);

	button_12.__click = () => {
		const newGrid = _$_.with_scope(__block, () => _$_.get(grid).map((row) => [...row]));

		newGrid[0][0] = 99;
		_$_.set(grid, newGrid);
	};

	var div_8 = _$_.sibling(button_12);

	{
		_$_.for(
			div_8,
			() => _$_.get(grid),
			(__anchor, row, rowIndex) => {
				var div_9 = root_33();

				{
					_$_.for(
						div_9,
						() => row,
						(__anchor, cell, colIndex) => {
							var span_6 = root_34();

							{
								var text_17 = _$_.child(span_6, true);

								text_17.nodeValue = cell;
								_$_.pop(span_6);
							}

							_$_.render(() => {
								_$_.set_class(span_6, `cell-${_$_.get(rowIndex)}-${_$_.get(colIndex)}`, void 0, true);
							});

							_$_.append(__anchor, span_6);
						},
						12
					);

					_$_.pop(div_9);

					_$_.render(() => {
						_$_.set_class(div_9, `row-${_$_.get(rowIndex)}`, void 0, true);
					});
				}

				_$_.append(__anchor, div_9);
			},
			12
		);

		_$_.pop(div_8);
	}

	_$_.next(2);
	_$_.append(__anchor, fragment_8, true);
	_$_.pop_component();
}

export function ForLoopDeeplyNested(__anchor, _, __block) {
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

	var div_10 = root_35();

	{
		_$_.for_keyed(
			div_10,
			() => departments,
			(__anchor, pattern_4) => {
				var div_11 = root_36();

				{
					var h2_1 = _$_.child(div_11);

					{
						var text_18 = _$_.child(h2_1, true);

						_$_.pop(h2_1);
					}

					var node_1 = _$_.sibling(h2_1);

					_$_.for_keyed(
						node_1,
						() => _$_.get(pattern_4).teams,
						(__anchor, pattern_5) => {
							var div_12 = root_37();

							{
								var h3_1 = _$_.child(div_12);

								{
									var text_19 = _$_.child(h3_1, true);

									_$_.pop(h3_1);
								}

								var ul_12 = _$_.sibling(h3_1);

								{
									_$_.for(
										ul_12,
										() => _$_.get(pattern_5).members,
										(__anchor, member) => {
											var li_12 = root_38();

											{
												var text_20 = _$_.child(li_12, true);

												text_20.nodeValue = member;
												_$_.pop(li_12);
											}

											_$_.append(__anchor, li_12);
										},
										4
									);

									_$_.pop(ul_12);
								}
							}

							_$_.render(
								(__prev) => {
									var __a = _$_.get(pattern_5).name;

									if (__prev.a !== __a) {
										_$_.set_text(text_19, __prev.a = __a);
									}

									var __b = `team-${_$_.get(pattern_5).id}`;

									if (__prev.b !== __b) {
										_$_.set_class(div_12, __prev.b = __b, void 0, true);
									}
								},
								{ a: ' ', b: Symbol() }
							);

							_$_.append(__anchor, div_12);
						},
						0,
						(pattern_5) => _$_.get(pattern_5).id
					);

					_$_.pop(div_11);
				}

				_$_.render(
					(__prev) => {
						var __a = _$_.get(pattern_4).name;

						if (__prev.a !== __a) {
							_$_.set_text(text_18, __prev.a = __a);
						}

						var __b = `dept-${_$_.get(pattern_4).id}`;

						if (__prev.b !== __b) {
							_$_.set_class(div_11, __prev.b = __b, void 0, true);
						}
					},
					{ a: ' ', b: Symbol() }
				);

				_$_.append(__anchor, div_11);
			},
			4,
			(pattern_4) => _$_.get(pattern_4).id
		);

		_$_.pop(div_10);
	}

	_$_.append(__anchor, div_10);
	_$_.pop_component();
}

export function ForLoopIndexUpdate(__anchor, _, __block) {
	_$_.push_component();

	let items = track(['First', 'Second', 'Third'], void 0, void 0, __block);
	var fragment_9 = root_39();
	var button_13 = _$_.first_child_frag(fragment_9);

	button_13.__click = () => {
		_$_.set(items, ['Zeroth', ..._$_.get(items)]);
	};

	var ul_13 = _$_.sibling(button_13);

	{
		_$_.for(
			ul_13,
			() => _$_.get(items),
			(__anchor, item, i) => {
				var li_13 = root_40();

				{
					var text_21 = _$_.child(li_13, true);

					_$_.pop(li_13);
				}

				_$_.render(
					(__prev) => {
						var __a = `[${_$_.get(i)}] ${item}`;

						if (__prev.a !== __a) {
							_$_.set_text(text_21, __prev.a = __a);
						}

						var __b = `item-${_$_.get(i)}`;

						if (__prev.b !== __b) {
							_$_.set_class(li_13, __prev.b = __b, void 0, true);
						}
					},
					{ a: ' ', b: Symbol() }
				);

				_$_.append(__anchor, li_13);
			},
			12
		);

		_$_.pop(ul_13);
	}

	_$_.next();
	_$_.append(__anchor, fragment_9, true);
	_$_.pop_component();
}

export function KeyedForLoopWithIndex(__anchor, _, __block) {
	_$_.push_component();

	let items = track(
		[
			{ id: 'a', value: 'Alpha' },
			{ id: 'b', value: 'Beta' },
			{ id: 'c', value: 'Gamma' }
		],
		void 0,
		void 0,
		__block
	);

	var fragment_10 = root_41();
	var button_14 = _$_.first_child_frag(fragment_10);

	button_14.__click = () => {
		_$_.set(items, [_$_.get(items)[1], _$_.get(items)[2], _$_.get(items)[0]]);
	};

	var ul_14 = _$_.sibling(button_14);

	{
		_$_.for_keyed(
			ul_14,
			() => _$_.get(items),
			(__anchor, pattern_6, i) => {
				var li_14 = root_42();

				{
					var text_22 = _$_.child(li_14, true);

					_$_.pop(li_14);
				}

				_$_.render(
					(__prev) => {
						var __a = `[${_$_.get(i)}] ${_$_.get(pattern_6).id}: ${_$_.get(pattern_6).value}`;

						if (__prev.a !== __a) {
							_$_.set_text(text_22, __prev.a = __a);
						}

						var __b = _$_.get(i);

						if (__prev.b !== __b) {
							_$_.set_attribute(li_14, 'data-index', __prev.b = __b);
						}

						var __c = `item-${_$_.get(pattern_6).id}`;

						if (__prev.c !== __c) {
							_$_.set_class(li_14, __prev.c = __c, void 0, true);
						}
					},
					{ a: ' ', b: void 0, c: Symbol() }
				);

				_$_.append(__anchor, li_14);
			},
			12,
			(pattern_6, i) => _$_.get(pattern_6).id
		);

		_$_.pop(ul_14);
	}

	_$_.next();
	_$_.append(__anchor, fragment_10, true);
	_$_.pop_component();
}

export function ForLoopWithSiblings(__anchor, _, __block) {
	_$_.push_component();

	let items = track(['A', 'B'], void 0, void 0, __block);
	var fragment_11 = root_43();
	var div_13 = _$_.first_child_frag(fragment_11);

	{
		var header_1 = _$_.child(div_13);
		var node_2 = _$_.sibling(header_1);

		_$_.for(
			node_2,
			() => _$_.get(items),
			(__anchor, item) => {
				var div_14 = root_44();

				_$_.set_class(div_14, `item-${item}`, void 0, true);

				{
					var text_23 = _$_.child(div_14, true);

					text_23.nodeValue = item;
					_$_.pop(div_14);
				}

				_$_.append(__anchor, div_14);
			},
			0
		);

		_$_.pop(div_13);
	}

	var button_15 = _$_.sibling(div_13);

	button_15.__click = () => {
		_$_.set(items, [..._$_.get(items), 'C']);
	};

	_$_.next();
	_$_.append(__anchor, fragment_11, true);
	_$_.pop_component();
}

export function ForLoopItemState(__anchor, _, __block) {
	_$_.push_component();

	const initialItems = [
		{ id: 1, text: 'Todo 1' },
		{ id: 2, text: 'Todo 2' },
		{ id: 3, text: 'Todo 3' }
	];

	var div_15 = root_45();

	{
		_$_.for_keyed(
			div_15,
			() => initialItems,
			(__anchor, pattern_7) => {
				var fragment_12 = root_46();
				var node_3 = _$_.first_child_frag(fragment_12);

				TodoItem(
					node_3,
					{
						get id() {
							return _$_.get(pattern_7).id;
						},

						get text() {
							return _$_.get(pattern_7).text;
						}
					},
					_$_.active_block
				);

				_$_.append(__anchor, fragment_12);
			},
			4,
			(pattern_7) => _$_.get(pattern_7).id
		);

		_$_.pop(div_15);
	}

	_$_.append(__anchor, div_15);
	_$_.pop_component();
}

function TodoItem(__anchor, props, __block) {
	_$_.push_component();

	let done = track(false, void 0, void 0, __block);
	var div_16 = root_47();

	{
		var input_1 = _$_.child(div_16);

		input_1.__change = (e) => {
			_$_.set(done, e.target.checked);
		};

		var span_7 = _$_.sibling(input_1);

		{
			var text_24 = _$_.child(span_7, true);

			_$_.pop(span_7);
		}
	}

	_$_.render(
		(__prev) => {
			var __a = _$_.get(done);

			if (__prev.a !== __a) {
				_$_.set_checked(input_1, __prev.a = __a);
			}

			var __b = props.text;

			if (__prev.b !== __b) {
				_$_.set_text(text_24, __prev.b = __b);
			}

			var __c = _$_.get(done) ? 'completed' : 'pending';

			if (__prev.c !== __c) {
				_$_.set_class(span_7, __prev.c = __c, void 0, true);
			}

			var __d = `todo-${props.id}`;

			if (__prev.d !== __d) {
				_$_.set_class(div_16, __prev.d = __d, void 0, true);
			}
		},
		{ a: void 0, b: ' ', c: Symbol(), d: Symbol() }
	);

	_$_.append(__anchor, div_16);
	_$_.pop_component();
}

export function ForLoopSingleItem(__anchor, _, __block) {
	_$_.push_component();

	const items = ['Only'];
	var ul_15 = root_48();

	{
		_$_.for(
			ul_15,
			() => items,
			(__anchor, item) => {
				var li_15 = root_49();

				{
					var text_25 = _$_.child(li_15, true);

					text_25.nodeValue = item;
					_$_.pop(li_15);
				}

				_$_.append(__anchor, li_15);
			},
			4
		);

		_$_.pop(ul_15);
	}

	_$_.append(__anchor, ul_15);
	_$_.pop_component();
}

export function ForLoopAddAtBeginning(__anchor, _, __block) {
	_$_.push_component();

	let items = track(['B', 'C'], void 0, void 0, __block);
	var fragment_13 = root_50();
	var button_16 = _$_.first_child_frag(fragment_13);

	button_16.__click = () => {
		_$_.set(items, ['A', ..._$_.get(items)]);
	};

	var ul_16 = _$_.sibling(button_16);

	{
		_$_.for(
			ul_16,
			() => _$_.get(items),
			(__anchor, item) => {
				var li_16 = root_51();

				_$_.set_class(li_16, `item-${item}`, void 0, true);

				{
					var text_26 = _$_.child(li_16, true);

					text_26.nodeValue = item;
					_$_.pop(li_16);
				}

				_$_.append(__anchor, li_16);
			},
			4
		);

		_$_.pop(ul_16);
	}

	_$_.next();
	_$_.append(__anchor, fragment_13, true);
	_$_.pop_component();
}

export function ForLoopAddInMiddle(__anchor, _, __block) {
	_$_.push_component();

	let items = track(['A', 'C'], void 0, void 0, __block);
	var fragment_14 = root_52();
	var button_17 = _$_.first_child_frag(fragment_14);

	button_17.__click = () => {
		const copy = [..._$_.get(items)];

		_$_.with_scope(__block, () => copy.splice(1, 0, 'B'));
		_$_.set(items, copy);
	};

	var ul_17 = _$_.sibling(button_17);

	{
		_$_.for(
			ul_17,
			() => _$_.get(items),
			(__anchor, item) => {
				var li_17 = root_53();

				_$_.set_class(li_17, `item-${item}`, void 0, true);

				{
					var text_27 = _$_.child(li_17, true);

					text_27.nodeValue = item;
					_$_.pop(li_17);
				}

				_$_.append(__anchor, li_17);
			},
			4
		);

		_$_.pop(ul_17);
	}

	_$_.next();
	_$_.append(__anchor, fragment_14, true);
	_$_.pop_component();
}

export function ForLoopRemoveFromMiddle(__anchor, _, __block) {
	_$_.push_component();

	let items = track(['A', 'B', 'C'], void 0, void 0, __block);
	var fragment_15 = root_54();
	var button_18 = _$_.first_child_frag(fragment_15);

	button_18.__click = () => {
		_$_.set(items, _$_.with_scope(__block, () => _$_.get(items).filter((item) => item !== 'B')));
	};

	var ul_18 = _$_.sibling(button_18);

	{
		_$_.for(
			ul_18,
			() => _$_.get(items),
			(__anchor, item) => {
				var li_18 = root_55();

				_$_.set_class(li_18, `item-${item}`, void 0, true);

				{
					var text_28 = _$_.child(li_18, true);

					text_28.nodeValue = item;
					_$_.pop(li_18);
				}

				_$_.append(__anchor, li_18);
			},
			4
		);

		_$_.pop(ul_18);
	}

	_$_.next();
	_$_.append(__anchor, fragment_15, true);
	_$_.pop_component();
}

export function ForLoopLargeList(__anchor, _, __block) {
	_$_.push_component();

	const items = _$_.with_scope(__block, () => Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`));
	var ul_19 = root_56();

	{
		_$_.for(
			ul_19,
			() => items,
			(__anchor, item, i) => {
				var li_19 = root_57();

				{
					var text_29 = _$_.child(li_19, true);

					text_29.nodeValue = item;
					_$_.pop(li_19);
				}

				_$_.render(() => {
					_$_.set_class(li_19, `item-${_$_.get(i)}`, void 0, true);
				});

				_$_.append(__anchor, li_19);
			},
			12
		);

		_$_.pop(ul_19);
	}

	_$_.append(__anchor, ul_19);
	_$_.pop_component();
}

export function ForLoopSwap(__anchor, _, __block) {
	_$_.push_component();

	let items = track(['A', 'B', 'C', 'D'], void 0, void 0, __block);
	var fragment_16 = root_58();
	var button_19 = _$_.first_child_frag(fragment_16);

	button_19.__click = () => {
		const copy = [..._$_.get(items)];

		[copy[0], copy[3]] = [copy[3], copy[0]];
		_$_.set(items, copy);
	};

	var ul_20 = _$_.sibling(button_19);

	{
		_$_.for(
			ul_20,
			() => _$_.get(items),
			(__anchor, item) => {
				var li_20 = root_59();

				_$_.set_class(li_20, `item-${item}`, void 0, true);

				{
					var text_30 = _$_.child(li_20, true);

					text_30.nodeValue = item;
					_$_.pop(li_20);
				}

				_$_.append(__anchor, li_20);
			},
			4
		);

		_$_.pop(ul_20);
	}

	_$_.next();
	_$_.append(__anchor, fragment_16, true);
	_$_.pop_component();
}

export function ForLoopReverse(__anchor, _, __block) {
	_$_.push_component();

	let items = track(['A', 'B', 'C', 'D'], void 0, void 0, __block);
	var fragment_17 = root_60();
	var button_20 = _$_.first_child_frag(fragment_17);

	button_20.__click = () => {
		_$_.set(items, _$_.with_scope(__block, () => [..._$_.get(items)].reverse()));
	};

	var ul_21 = _$_.sibling(button_20);

	{
		_$_.for(
			ul_21,
			() => _$_.get(items),
			(__anchor, item) => {
				var li_21 = root_61();

				_$_.set_class(li_21, `item-${item}`, void 0, true);

				{
					var text_31 = _$_.child(li_21, true);

					text_31.nodeValue = item;
					_$_.pop(li_21);
				}

				_$_.append(__anchor, li_21);
			},
			4
		);

		_$_.pop(ul_21);
	}

	_$_.next();
	_$_.append(__anchor, fragment_17, true);
	_$_.pop_component();
}

_$_.delegate(['click', 'change']);