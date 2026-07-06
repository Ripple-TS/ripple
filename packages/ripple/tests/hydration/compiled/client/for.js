// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<li> </li>`, 0);
var root = _$_.template(`<ul></ul>`, 0);
var root_3 = _$_.template(`<li> </li>`, 0);
var root_2 = _$_.template(`<ul></ul>`, 0);
var root_5 = _$_.template(`<li> </li>`, 0);
var root_4 = _$_.template(`<ul></ul>`, 0);
var root_8 = _$_.template(`<li> </li>`, 0);
var root_7 = _$_.template(`<button class="add">Add</button><ul></ul>`, 1, 2);
var root_6 = _$_.template(`<!>`, 1, 1);
var root_11 = _$_.template(`<li> </li>`, 0);
var root_10 = _$_.template(`<button class="remove">Remove</button><ul></ul>`, 1, 2);
var root_9 = _$_.template(`<!>`, 1, 1);
var root_13 = _$_.template(`<div><span class="value"> </span><button class="increment">+</button></div>`, 0);
var root_12 = _$_.template(`<div></div>`, 0);
var root_16 = _$_.template(`<span> </span>`, 0);
var root_15 = _$_.template(`<div></div>`, 0);
var root_14 = _$_.template(`<div class="grid"></div>`, 0);
var root_18 = _$_.template(`<span> </span>`, 0);
var root_17 = _$_.template(`<div class="container"></div>`, 0);
var root_20 = _$_.template(`<div><span class="name"> </span><span class="role"> </span></div>`, 0);
var root_19 = _$_.template(`<div></div>`, 0);
var root_23 = _$_.template(`<li> </li>`, 0);
var root_22 = _$_.template(`<button class="reorder">Reorder</button><ul></ul>`, 1, 2);
var root_21 = _$_.template(`<!>`, 1, 1);
var root_26 = _$_.template(`<li> </li>`, 0);
var root_25 = _$_.template(`<button class="update">Update</button><ul></ul>`, 1, 2);
var root_24 = _$_.template(`<!>`, 1, 1);
var root_29 = _$_.template(`<li> </li>`, 0);
var root_28 = _$_.template(`<button class="shuffle">Shuffle</button><ul></ul>`, 1, 2);
var root_27 = _$_.template(`<!>`, 1, 1);
var root_33 = _$_.template(`<li> </li>`, 0);
var root_32 = _$_.template(`<ul class="list"></ul>`, 0);
var root_31 = _$_.template(`<button class="toggle">Toggle List</button><button class="add">Add Item</button><!>`, 1, 3);
var root_30 = _$_.template(`<!>`, 1, 1);
var root_36 = _$_.template(`<li> </li>`, 0);
var root_35 = _$_.template(`<button class="populate">Populate</button><ul class="list"></ul>`, 1, 2);
var root_34 = _$_.template(`<!>`, 1, 1);
var root_39 = _$_.template(`<li> </li>`, 0);
var root_38 = _$_.template(`<button class="clear">Clear</button><ul class="list"></ul>`, 1, 2);
var root_37 = _$_.template(`<!>`, 1, 1);
var root_42 = _$_.template(`<span> </span>`, 0);
var root_41 = _$_.template(`<div></div>`, 0);
var root_40 = _$_.template(`<div class="nested-for-reactive"><button class="add-row">Add Row</button><button class="update-cell">Update Cell</button><div class="grid"></div></div>`, 0);
var root_46 = _$_.template(`<li class="member"> </li>`, 0);
var root_45 = _$_.template(`<div><h3 class="team-name"> </h3><ul></ul></div>`, 0);
var root_44 = _$_.template(`<div><h2 class="dept-name"> </h2><!></div>`, 0);
var root_43 = _$_.template(`<div class="org"></div>`, 0);
var root_49 = _$_.template(`<li> </li>`, 0);
var root_48 = _$_.template(`<button class="prepend">Prepend</button><ul></ul>`, 1, 2);
var root_47 = _$_.template(`<!>`, 1, 1);
var root_52 = _$_.template(`<li> </li>`, 0);
var root_51 = _$_.template(`<button class="reorder">Rotate</button><ul></ul>`, 1, 2);
var root_50 = _$_.template(`<!>`, 1, 1);
var root_55 = _$_.template(`<div> </div>`, 0);
var root_54 = _$_.template(`<div class="wrapper"><header class="before">Before</header><!><footer class="after">After</footer></div><button class="add">Add</button>`, 1, 2);
var root_53 = _$_.template(`<!>`, 1, 1);
var root_56 = _$_.template(`<div></div>`, 0);
var root_57 = _$_.template(`<div><input type="checkbox" class="checkbox"><span> </span></div>`, 0);
var root_59 = _$_.template(`<li class="single"> </li>`, 0);
var root_58 = _$_.template(`<ul></ul>`, 0);
var root_62 = _$_.template(`<li> </li>`, 0);
var root_61 = _$_.template(`<button class="prepend">Prepend A</button><ul></ul>`, 1, 2);
var root_60 = _$_.template(`<!>`, 1, 1);
var root_65 = _$_.template(`<li> </li>`, 0);
var root_64 = _$_.template(`<button class="insert">Insert B</button><ul></ul>`, 1, 2);
var root_63 = _$_.template(`<!>`, 1, 1);
var root_68 = _$_.template(`<li> </li>`, 0);
var root_67 = _$_.template(`<button class="remove-middle">Remove B</button><ul></ul>`, 1, 2);
var root_66 = _$_.template(`<!>`, 1, 1);
var root_70 = _$_.template(`<li> </li>`, 0);
var root_69 = _$_.template(`<ul class="large-list"></ul>`, 0);
var root_73 = _$_.template(`<li> </li>`, 0);
var root_72 = _$_.template(`<button class="swap">Swap First and Last</button><ul></ul>`, 1, 2);
var root_71 = _$_.template(`<!>`, 1, 1);
var root_76 = _$_.template(`<li> </li>`, 0);
var root_75 = _$_.template(`<button class="reverse">Reverse</button><ul></ul>`, 1, 2);
var root_74 = _$_.template(`<!>`, 1, 1);

import { track } from 'ripple';

export function StaticForLoop() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = ['Apple', 'Banana', 'Cherry'];
		var ul = root();

		{
			_$_.for(
				ul,
				() => items,
				(__anchor, item) => {
					var li = root_1();

					{
						var expression = _$_.child(li);

						_$_.expression(expression, () => item);
						_$_.pop(li);
					}

					_$_.append(__anchor, li);
				},
				4
			);

			_$_.pop(ul);
		}

		_$_.append(__anchor, ul);
	});
}

export function ForLoopWithIndex() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = ['A', 'B', 'C'];
		var ul_1 = root_2();

		{
			_$_.for(
				ul_1,
				() => items,
				(__anchor, item, i) => {
					var li_1 = root_3();

					{
						var expression_1 = _$_.child(li_1, true);

						_$_.pop(li_1);
					}

					_$_.render(() => {
						_$_.set_text(expression_1, `${i.value}: ${item}`);
					});

					_$_.append(__anchor, li_1);
				},
				12
			);

			_$_.pop(ul_1);
		}

		_$_.append(__anchor, ul_1);
	});
}

export function KeyedForLoop() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [
			{ id: 1, name: 'First' },
			{ id: 2, name: 'Second' },
			{ id: 3, name: 'Third' }
		];

		var ul_2 = root_4();

		{
			_$_.for_keyed(
				ul_2,
				() => items,
				(__anchor, pattern) => {
					var li_2 = root_5();

					{
						var expression_2 = _$_.child(li_2);

						_$_.expression(expression_2, () => _$_.get(pattern).name);
						_$_.pop(li_2);
					}

					_$_.append(__anchor, li_2);
				},
				4,
				(pattern) => _$_.get(pattern).id
			);

			_$_.pop(ul_2);
		}

		_$_.append(__anchor, ul_2);
	});
}

export function ReactiveForLoopAdd() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track(['A', 'B'], __block, 'e145678a');
		var fragment = root_6();
		var node = _$_.first_child_frag(fragment);

		_$_.expression(node, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_1 = root_7();
			var button = _$_.first_child_frag(fragment_1);

			button.__click = () => {
				_$_.set(lazy, [...lazy.value, 'C']);
			};

			var ul_3 = _$_.sibling(button);

			{
				_$_.for(
					ul_3,
					() => lazy.value,
					(__anchor, item) => {
						var li_3 = root_8();

						{
							var expression_3 = _$_.child(li_3);

							_$_.expression(expression_3, () => item);
							_$_.pop(li_3);
						}

						_$_.append(__anchor, li_3);
					},
					4
				);

				_$_.pop(ul_3);
			}

			_$_.next();
			_$_.append(__anchor, fragment_1, true);
		}));

		_$_.append(__anchor, fragment);
	});
}

export function ReactiveForLoopRemove() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_1 = _$_.track(['A', 'B', 'C'], __block, 'b4e9bd54');
		var fragment_2 = root_9();
		var node_1 = _$_.first_child_frag(fragment_2);

		_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_3 = root_10();
			var button_1 = _$_.first_child_frag(fragment_3);

			button_1.__click = () => {
				_$_.set(lazy_1, _$_.with_scope(__block, () => lazy_1.value.slice(0, -1)));
			};

			var ul_4 = _$_.sibling(button_1);

			{
				_$_.for(
					ul_4,
					() => lazy_1.value,
					(__anchor, item) => {
						var li_4 = root_11();

						{
							var expression_4 = _$_.child(li_4);

							_$_.expression(expression_4, () => item);
							_$_.pop(li_4);
						}

						_$_.append(__anchor, li_4);
					},
					4
				);

				_$_.pop(ul_4);
			}

			_$_.next();
			_$_.append(__anchor, fragment_3, true);
		}));

		_$_.append(__anchor, fragment_2);
	});
}

export function ForLoopInteractive() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_2 = _$_.track([0, 0, 0], __block, '36f563df');
		var div = root_12();

		{
			_$_.for(
				div,
				() => lazy_2.value,
				(__anchor, count, i) => {
					var div_1 = root_13();

					{
						var span = _$_.child(div_1);

						{
							var expression_5 = _$_.child(span);

							_$_.expression(expression_5, () => count);
							_$_.pop(span);
						}

						var button_2 = _$_.sibling(span);

						button_2.__click = () => {
							const newCounts = [...lazy_2.value];

							newCounts[i.value]++;
							_$_.set(lazy_2, newCounts);
						};
					}

					_$_.render(() => {
						_$_.set_class(div_1, `item-${i.value}`, void 0, true);
					});

					_$_.append(__anchor, div_1);
				},
				12
			);

			_$_.pop(div);
		}

		_$_.append(__anchor, div);
	});
}

export function NestedForLoop() {
	return _$_.tsrx_element((__anchor, __block) => {
		const grid = [[1, 2], [3, 4]];
		var div_2 = root_14();

		{
			_$_.for(
				div_2,
				() => grid,
				(__anchor, row, rowIndex) => {
					var div_3 = root_15();

					{
						_$_.for(
							div_3,
							() => row,
							(__anchor, cell, colIndex) => {
								var span_1 = root_16();

								{
									var expression_6 = _$_.child(span_1);

									_$_.expression(expression_6, () => cell);
									_$_.pop(span_1);
								}

								_$_.render(() => {
									_$_.set_class(span_1, `cell-${rowIndex.value}-${colIndex.value}`, void 0, true);
								});

								_$_.append(__anchor, span_1);
							},
							12
						);

						_$_.pop(div_3);

						_$_.render(() => {
							_$_.set_class(div_3, `row-${rowIndex.value}`, void 0, true);
						});
					}

					_$_.append(__anchor, div_3);
				},
				12
			);

			_$_.pop(div_2);
		}

		_$_.append(__anchor, div_2);
	});
}

export function EmptyForLoop() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [];
		var div_4 = root_17();

		{
			_$_.for(
				div_4,
				() => items,
				(__anchor, item) => {
					var span_2 = root_18();

					{
						var expression_7 = _$_.child(span_2);

						_$_.expression(expression_7, () => item);
						_$_.pop(span_2);
					}

					_$_.append(__anchor, span_2);
				},
				4
			);

			_$_.pop(div_4);
		}

		_$_.append(__anchor, div_4);
	});
}

export function ForLoopComplexObjects() {
	return _$_.tsrx_element((__anchor, __block) => {
		const users = [
			{ id: 1, name: 'Alice', role: 'Admin' },
			{ id: 2, name: 'Bob', role: 'User' }
		];

		var div_5 = root_19();

		{
			_$_.for_keyed(
				div_5,
				() => users,
				(__anchor, pattern_1) => {
					var div_6 = root_20();

					{
						var span_3 = _$_.child(div_6);

						{
							var expression_8 = _$_.child(span_3);

							_$_.expression(expression_8, () => _$_.get(pattern_1).name);
							_$_.pop(span_3);
						}

						var span_4 = _$_.sibling(span_3);

						{
							var expression_9 = _$_.child(span_4);

							_$_.expression(expression_9, () => _$_.get(pattern_1).role);
							_$_.pop(span_4);
						}
					}

					_$_.render(() => {
						_$_.set_class(div_6, `user-${_$_.get(pattern_1).id}`, void 0, true);
					});

					_$_.append(__anchor, div_6);
				},
				4,
				(pattern_1) => _$_.get(pattern_1).id
			);

			_$_.pop(div_5);
		}

		_$_.append(__anchor, div_5);
	});
}

export function KeyedForLoopReorder() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_3 = _$_.track(
			[
				{ id: 1, name: 'First' },
				{ id: 2, name: 'Second' },
				{ id: 3, name: 'Third' }
			],
			__block,
			'e7abc6a3'
		);

		var fragment_4 = root_21();
		var node_2 = _$_.first_child_frag(fragment_4);

		_$_.expression(node_2, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_5 = root_22();
			var button_3 = _$_.first_child_frag(fragment_5);

			button_3.__click = () => {
				_$_.set(lazy_3, [lazy_3.value[2], lazy_3.value[0], lazy_3.value[1]]);
			};

			var ul_5 = _$_.sibling(button_3);

			{
				_$_.for_keyed(
					ul_5,
					() => lazy_3.value,
					(__anchor, pattern_2) => {
						var li_5 = root_23();

						{
							var expression_10 = _$_.child(li_5);

							_$_.expression(expression_10, () => _$_.get(pattern_2).name);
							_$_.pop(li_5);
						}

						_$_.render(() => {
							_$_.set_class(li_5, `item-${_$_.get(pattern_2).id}`, void 0, true);
						});

						_$_.append(__anchor, li_5);
					},
					4,
					(pattern_2) => _$_.get(pattern_2).id
				);

				_$_.pop(ul_5);
			}

			_$_.next();
			_$_.append(__anchor, fragment_5, true);
		}));

		_$_.append(__anchor, fragment_4);
	});
}

export function KeyedForLoopUpdate() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_4 = _$_.track([{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }], __block, '7a2c2ada');
		var fragment_6 = root_24();
		var node_3 = _$_.first_child_frag(fragment_6);

		_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_7 = root_25();
			var button_4 = _$_.first_child_frag(fragment_7);

			button_4.__click = () => {
				_$_.set(lazy_4, _$_.with_scope(__block, () => lazy_4.value.map((item) => item.id === 1 ? { ...item, name: 'Updated' } : item)));
			};

			var ul_6 = _$_.sibling(button_4);

			{
				_$_.for_keyed(
					ul_6,
					() => lazy_4.value,
					(__anchor, pattern_3) => {
						var li_6 = root_26();

						{
							var expression_11 = _$_.child(li_6);

							_$_.expression(expression_11, () => _$_.get(pattern_3).name);
							_$_.pop(li_6);
						}

						_$_.render(() => {
							_$_.set_class(li_6, `item-${_$_.get(pattern_3).id}`, void 0, true);
						});

						_$_.append(__anchor, li_6);
					},
					4,
					(pattern_3) => _$_.get(pattern_3).id
				);

				_$_.pop(ul_6);
			}

			_$_.next();
			_$_.append(__anchor, fragment_7, true);
		}));

		_$_.append(__anchor, fragment_6);
	});
}

export function ForLoopMixedOperations() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_5 = _$_.track(['A', 'B', 'C', 'D'], __block, '3dd7c7b6');
		var fragment_8 = root_27();
		var node_4 = _$_.first_child_frag(fragment_8);

		_$_.expression(node_4, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_9 = root_28();
			var button_5 = _$_.first_child_frag(fragment_9);

			button_5.__click = () => {
				_$_.set(lazy_5, ['D', 'C', 'A', 'E']);
			};

			var ul_7 = _$_.sibling(button_5);

			{
				_$_.for(
					ul_7,
					() => lazy_5.value,
					(__anchor, item) => {
						var li_7 = root_29();

						_$_.set_class(li_7, `item-${item}`, void 0, true);

						{
							var expression_12 = _$_.child(li_7);

							_$_.expression(expression_12, () => item);
							_$_.pop(li_7);
						}

						_$_.append(__anchor, li_7);
					},
					4
				);

				_$_.pop(ul_7);
			}

			_$_.next();
			_$_.append(__anchor, fragment_9, true);
		}));

		_$_.append(__anchor, fragment_8);
	});
}

export function ForLoopInsideIf() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_6 = _$_.track(true, __block, '0528df30');
		let lazy_7 = _$_.track(['X', 'Y', 'Z'], __block, 'bf375103');
		var fragment_10 = root_30();
		var node_6 = _$_.first_child_frag(fragment_10);

		_$_.expression(node_6, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_11 = root_31();
			var button_6 = _$_.first_child_frag(fragment_11);

			button_6.__click = () => {
				_$_.set(lazy_6, !lazy_6.value);
			};

			var button_7 = _$_.sibling(button_6);

			button_7.__click = () => {
				_$_.set(lazy_7, [...lazy_7.value, 'W']);
			};

			var node_5 = _$_.sibling(button_7);

			{
				var consequent = (__anchor) => {
					var ul_8 = root_32();

					{
						_$_.for(
							ul_8,
							() => lazy_7.value,
							(__anchor, item) => {
								var li_8 = root_33();

								{
									var expression_13 = _$_.child(li_8);

									_$_.expression(expression_13, () => item);
									_$_.pop(li_8);
								}

								_$_.append(__anchor, li_8);
							},
							4
						);

						_$_.pop(ul_8);
					}

					_$_.append(__anchor, ul_8);
				};

				_$_.if(node_5, (__render) => {
					if (lazy_6.value) __render(consequent);
				});
			}

			_$_.append(__anchor, fragment_11);
		}));

		_$_.append(__anchor, fragment_10);
	});
}

export function ForLoopEmptyToPopulated() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_8 = _$_.track([], __block, '525c5dbc');
		var fragment_12 = root_34();
		var node_7 = _$_.first_child_frag(fragment_12);

		_$_.expression(node_7, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_13 = root_35();
			var button_8 = _$_.first_child_frag(fragment_13);

			button_8.__click = () => {
				_$_.set(lazy_8, ['One', 'Two', 'Three']);
			};

			var ul_9 = _$_.sibling(button_8);

			{
				_$_.for(
					ul_9,
					() => lazy_8.value,
					(__anchor, item) => {
						var li_9 = root_36();

						{
							var expression_14 = _$_.child(li_9);

							_$_.expression(expression_14, () => item);
							_$_.pop(li_9);
						}

						_$_.append(__anchor, li_9);
					},
					4
				);

				_$_.pop(ul_9);
			}

			_$_.next();
			_$_.append(__anchor, fragment_13, true);
		}));

		_$_.append(__anchor, fragment_12);
	});
}

export function ForLoopPopulatedToEmpty() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_9 = _$_.track(['One', 'Two', 'Three'], __block, 'ee47f078');
		var fragment_14 = root_37();
		var node_8 = _$_.first_child_frag(fragment_14);

		_$_.expression(node_8, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_15 = root_38();
			var button_9 = _$_.first_child_frag(fragment_15);

			button_9.__click = () => {
				_$_.set(lazy_9, []);
			};

			var ul_10 = _$_.sibling(button_9);

			{
				_$_.for(
					ul_10,
					() => lazy_9.value,
					(__anchor, item) => {
						var li_10 = root_39();

						{
							var expression_15 = _$_.child(li_10);

							_$_.expression(expression_15, () => item);
							_$_.pop(li_10);
						}

						_$_.append(__anchor, li_10);
					},
					4
				);

				_$_.pop(ul_10);
			}

			_$_.next();
			_$_.append(__anchor, fragment_15, true);
		}));

		_$_.append(__anchor, fragment_14);
	});
}

export function NestedForLoopReactive() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_10 = _$_.track([[1, 2], [3, 4]], __block, 'a2f41fb3');
		var div_7 = root_40();

		{
			var button_10 = _$_.child(div_7);

			button_10.__click = () => {
				_$_.set(lazy_10, [...lazy_10.value, [5, 6]]);
			};

			var button_11 = _$_.sibling(button_10);

			button_11.__click = () => {
				const newGrid = _$_.with_scope(__block, () => lazy_10.value.map((row) => [...row]));

				newGrid[0][0] = 99;
				_$_.set(lazy_10, newGrid);
			};

			var div_8 = _$_.sibling(button_11);

			{
				_$_.for(
					div_8,
					() => lazy_10.value,
					(__anchor, row, rowIndex) => {
						var div_9 = root_41();

						{
							_$_.for(
								div_9,
								() => row,
								(__anchor, cell, colIndex) => {
									var span_5 = root_42();

									{
										var expression_16 = _$_.child(span_5);

										_$_.expression(expression_16, () => cell);
										_$_.pop(span_5);
									}

									_$_.render(() => {
										_$_.set_class(span_5, `cell-${rowIndex.value}-${colIndex.value}`, void 0, true);
									});

									_$_.append(__anchor, span_5);
								},
								12
							);

							_$_.pop(div_9);

							_$_.render(() => {
								_$_.set_class(div_9, `row-${rowIndex.value}`, void 0, true);
							});
						}

						_$_.append(__anchor, div_9);
					},
					12
				);

				_$_.pop(div_8);
			}
		}

		_$_.append(__anchor, div_7);
	});
}

export function ForLoopDeeplyNested() {
	return _$_.tsrx_element((__anchor, __block) => {
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

		var div_10 = root_43();

		{
			_$_.for_keyed(
				div_10,
				() => departments,
				(__anchor, pattern_4) => {
					var div_11 = root_44();

					{
						var h2 = _$_.child(div_11);

						{
							var expression_17 = _$_.child(h2);

							_$_.expression(expression_17, () => _$_.get(pattern_4).name);
							_$_.pop(h2);
						}

						var node_9 = _$_.sibling(h2);

						_$_.for_keyed(
							node_9,
							() => _$_.get(pattern_4).teams,
							(__anchor, pattern_5) => {
								var div_12 = root_45();

								{
									var h3 = _$_.child(div_12);

									{
										var expression_18 = _$_.child(h3);

										_$_.expression(expression_18, () => _$_.get(pattern_5).name);
										_$_.pop(h3);
									}

									var ul_11 = _$_.sibling(h3);

									{
										_$_.for(
											ul_11,
											() => _$_.get(pattern_5).members,
											(__anchor, member) => {
												var li_11 = root_46();

												{
													var expression_19 = _$_.child(li_11);

													_$_.expression(expression_19, () => member);
													_$_.pop(li_11);
												}

												_$_.append(__anchor, li_11);
											},
											4
										);

										_$_.pop(ul_11);
									}
								}

								_$_.render(() => {
									_$_.set_class(div_12, `team-${_$_.get(pattern_5).id}`, void 0, true);
								});

								_$_.append(__anchor, div_12);
							},
							0,
							(pattern_5) => _$_.get(pattern_5).id
						);

						_$_.pop(div_11);
					}

					_$_.render(() => {
						_$_.set_class(div_11, `dept-${_$_.get(pattern_4).id}`, void 0, true);
					});

					_$_.append(__anchor, div_11);
				},
				4,
				(pattern_4) => _$_.get(pattern_4).id
			);

			_$_.pop(div_10);
		}

		_$_.append(__anchor, div_10);
	});
}

export function ForLoopIndexUpdate() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_11 = _$_.track(['First', 'Second', 'Third'], __block, 'f61e31e6');
		var fragment_16 = root_47();
		var node_10 = _$_.first_child_frag(fragment_16);

		_$_.expression(node_10, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_17 = root_48();
			var button_12 = _$_.first_child_frag(fragment_17);

			button_12.__click = () => {
				_$_.set(lazy_11, ['Zeroth', ...lazy_11.value]);
			};

			var ul_12 = _$_.sibling(button_12);

			{
				_$_.for(
					ul_12,
					() => lazy_11.value,
					(__anchor, item, i) => {
						var li_12 = root_49();

						{
							var expression_20 = _$_.child(li_12, true);

							_$_.pop(li_12);
						}

						_$_.render(
							(__prev) => {
								var __a = `[${i.value}] ${item}`;

								if (__prev.a !== __a) {
									_$_.set_text(expression_20, __prev.a = __a);
								}

								var __b = `item-${i.value}`;

								if (__prev.b !== __b) {
									_$_.set_class(li_12, __prev.b = __b, void 0, true);
								}
							},
							{ a: ' ', b: Symbol() }
						);

						_$_.append(__anchor, li_12);
					},
					12
				);

				_$_.pop(ul_12);
			}

			_$_.next();
			_$_.append(__anchor, fragment_17, true);
		}));

		_$_.append(__anchor, fragment_16);
	});
}

export function KeyedForLoopWithIndex() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_12 = _$_.track(
			[
				{ id: 'a', value: 'Alpha' },
				{ id: 'b', value: 'Beta' },
				{ id: 'c', value: 'Gamma' }
			],
			__block,
			'3467975a'
		);

		var fragment_18 = root_50();
		var node_11 = _$_.first_child_frag(fragment_18);

		_$_.expression(node_11, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_19 = root_51();
			var button_13 = _$_.first_child_frag(fragment_19);

			button_13.__click = () => {
				_$_.set(lazy_12, [lazy_12.value[1], lazy_12.value[2], lazy_12.value[0]]);
			};

			var ul_13 = _$_.sibling(button_13);

			{
				_$_.for_keyed(
					ul_13,
					() => lazy_12.value,
					(__anchor, pattern_6, i) => {
						var li_13 = root_52();

						{
							var expression_21 = _$_.child(li_13, true);

							_$_.pop(li_13);
						}

						_$_.render(
							(__prev) => {
								var __a = `[${i.value}] ${_$_.get(pattern_6).id}: ${_$_.get(pattern_6).value}`;

								if (__prev.a !== __a) {
									_$_.set_text(expression_21, __prev.a = __a);
								}

								var __b = i.value;

								if (__prev.b !== __b) {
									_$_.set_attribute(li_13, 'data-index', __prev.b = __b);
								}

								var __c = `item-${_$_.get(pattern_6).id}`;

								if (__prev.c !== __c) {
									_$_.set_class(li_13, __prev.c = __c, void 0, true);
								}
							},
							{ a: ' ', b: void 0, c: Symbol() }
						);

						_$_.append(__anchor, li_13);
					},
					12,
					(pattern_6, i) => _$_.get(pattern_6).id
				);

				_$_.pop(ul_13);
			}

			_$_.next();
			_$_.append(__anchor, fragment_19, true);
		}));

		_$_.append(__anchor, fragment_18);
	});
}

export function ForLoopWithSiblings() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_13 = _$_.track(['A', 'B'], __block, '3c7e8152');
		var fragment_20 = root_53();
		var node_13 = _$_.first_child_frag(fragment_20);

		_$_.expression(node_13, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_21 = root_54();
			var div_13 = _$_.first_child_frag(fragment_21);

			{
				var header = _$_.child(div_13);
				var node_12 = _$_.sibling(header);

				_$_.for(
					node_12,
					() => lazy_13.value,
					(__anchor, item) => {
						var div_14 = root_55();

						_$_.set_class(div_14, `item-${item}`, void 0, true);

						{
							var expression_22 = _$_.child(div_14);

							_$_.expression(expression_22, () => item);
							_$_.pop(div_14);
						}

						_$_.append(__anchor, div_14);
					},
					0
				);

				_$_.pop(div_13);
			}

			var button_14 = _$_.sibling(div_13);

			button_14.__click = () => {
				_$_.set(lazy_13, [...lazy_13.value, 'C']);
			};

			_$_.next();
			_$_.append(__anchor, fragment_21, true);
		}));

		_$_.append(__anchor, fragment_20);
	});
}

export function ForLoopItemState() {
	return _$_.tsrx_element((__anchor, __block) => {
		const initialItems = [
			{ id: 1, text: 'Todo 1' },
			{ id: 2, text: 'Todo 2' },
			{ id: 3, text: 'Todo 3' }
		];

		var div_15 = root_56();

		{
			_$_.for_keyed(
				div_15,
				() => initialItems,
				(__anchor, pattern_7) => {
					_$_.render_component(TodoItem, __anchor, {
						get id() {
							return _$_.get(pattern_7).id;
						},

						get text() {
							return _$_.get(pattern_7).text;
						}
					});
				},
				4,
				(pattern_7) => _$_.get(pattern_7).id
			);

			_$_.pop(div_15);
		}

		_$_.append(__anchor, div_15);
	});
}

function TodoItem(props) {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_14 = _$_.track(false, __block, '4f2402a4');
		var div_16 = root_57();

		{
			var input = _$_.child(div_16);

			input.__change = (e) => {
				_$_.set(lazy_14, e.target.checked);
			};

			var span_6 = _$_.sibling(input);

			{
				var expression_23 = _$_.child(span_6, true);

				_$_.pop(span_6);
			}
		}

		_$_.render(
			(__prev) => {
				var __a = lazy_14.value;

				if (__prev.a !== __a) {
					_$_.set_checked(input, __prev.a = __a);
				}

				var __b = props.text;

				if (__prev.b !== __b) {
					_$_.set_text(expression_23, __prev.b = __b);
				}

				var __c = lazy_14.value ? 'completed' : 'pending';

				if (__prev.c !== __c) {
					_$_.set_class(span_6, __prev.c = __c, void 0, true);
				}

				var __d = `todo-${props.id}`;

				if (__prev.d !== __d) {
					_$_.set_class(div_16, __prev.d = __d, void 0, true);
				}
			},
			{ a: void 0, b: ' ', c: Symbol(), d: Symbol() }
		);

		_$_.append(__anchor, div_16);
	});
}

export function ForLoopSingleItem() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = ['Only'];
		var ul_14 = root_58();

		{
			_$_.for(
				ul_14,
				() => items,
				(__anchor, item) => {
					var li_14 = root_59();

					{
						var expression_24 = _$_.child(li_14);

						_$_.expression(expression_24, () => item);
						_$_.pop(li_14);
					}

					_$_.append(__anchor, li_14);
				},
				4
			);

			_$_.pop(ul_14);
		}

		_$_.append(__anchor, ul_14);
	});
}

export function ForLoopAddAtBeginning() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_15 = _$_.track(['B', 'C'], __block, '1561403a');
		var fragment_22 = root_60();
		var node_14 = _$_.first_child_frag(fragment_22);

		_$_.expression(node_14, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_23 = root_61();
			var button_15 = _$_.first_child_frag(fragment_23);

			button_15.__click = () => {
				_$_.set(lazy_15, ['A', ...lazy_15.value]);
			};

			var ul_15 = _$_.sibling(button_15);

			{
				_$_.for(
					ul_15,
					() => lazy_15.value,
					(__anchor, item) => {
						var li_15 = root_62();

						_$_.set_class(li_15, `item-${item}`, void 0, true);

						{
							var expression_25 = _$_.child(li_15);

							_$_.expression(expression_25, () => item);
							_$_.pop(li_15);
						}

						_$_.append(__anchor, li_15);
					},
					4
				);

				_$_.pop(ul_15);
			}

			_$_.next();
			_$_.append(__anchor, fragment_23, true);
		}));

		_$_.append(__anchor, fragment_22);
	});
}

export function ForLoopAddInMiddle() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_16 = _$_.track(['A', 'C'], __block, '1bc60b46');
		var fragment_24 = root_63();
		var node_15 = _$_.first_child_frag(fragment_24);

		_$_.expression(node_15, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_25 = root_64();
			var button_16 = _$_.first_child_frag(fragment_25);

			button_16.__click = () => {
				const copy = [...lazy_16.value];

				_$_.with_scope(__block, () => copy.splice(1, 0, 'B'));
				_$_.set(lazy_16, copy);
			};

			var ul_16 = _$_.sibling(button_16);

			{
				_$_.for(
					ul_16,
					() => lazy_16.value,
					(__anchor, item) => {
						var li_16 = root_65();

						_$_.set_class(li_16, `item-${item}`, void 0, true);

						{
							var expression_26 = _$_.child(li_16);

							_$_.expression(expression_26, () => item);
							_$_.pop(li_16);
						}

						_$_.append(__anchor, li_16);
					},
					4
				);

				_$_.pop(ul_16);
			}

			_$_.next();
			_$_.append(__anchor, fragment_25, true);
		}));

		_$_.append(__anchor, fragment_24);
	});
}

export function ForLoopRemoveFromMiddle() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_17 = _$_.track(['A', 'B', 'C'], __block, '1c87f95f');
		var fragment_26 = root_66();
		var node_16 = _$_.first_child_frag(fragment_26);

		_$_.expression(node_16, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_27 = root_67();
			var button_17 = _$_.first_child_frag(fragment_27);

			button_17.__click = () => {
				_$_.set(lazy_17, _$_.with_scope(__block, () => lazy_17.value.filter((item) => item !== 'B')));
			};

			var ul_17 = _$_.sibling(button_17);

			{
				_$_.for(
					ul_17,
					() => lazy_17.value,
					(__anchor, item) => {
						var li_17 = root_68();

						_$_.set_class(li_17, `item-${item}`, void 0, true);

						{
							var expression_27 = _$_.child(li_17);

							_$_.expression(expression_27, () => item);
							_$_.pop(li_17);
						}

						_$_.append(__anchor, li_17);
					},
					4
				);

				_$_.pop(ul_17);
			}

			_$_.next();
			_$_.append(__anchor, fragment_27, true);
		}));

		_$_.append(__anchor, fragment_26);
	});
}

export function ForLoopLargeList() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = _$_.with_scope(__block, () => Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`));
		var ul_18 = root_69();

		{
			_$_.for(
				ul_18,
				() => items,
				(__anchor, item, i) => {
					var li_18 = root_70();

					{
						var expression_28 = _$_.child(li_18);

						_$_.expression(expression_28, () => item);
						_$_.pop(li_18);
					}

					_$_.render(() => {
						_$_.set_class(li_18, `item-${i.value}`, void 0, true);
					});

					_$_.append(__anchor, li_18);
				},
				12
			);

			_$_.pop(ul_18);
		}

		_$_.append(__anchor, ul_18);
	});
}

export function ForLoopSwap() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_18 = _$_.track(['A', 'B', 'C', 'D'], __block, '5f8d152f');
		var fragment_28 = root_71();
		var node_17 = _$_.first_child_frag(fragment_28);

		_$_.expression(node_17, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_29 = root_72();
			var button_18 = _$_.first_child_frag(fragment_29);

			button_18.__click = () => {
				const copy = [...lazy_18.value];

				[copy[0], copy[3]] = [copy[3], copy[0]];
				_$_.set(lazy_18, copy);
			};

			var ul_19 = _$_.sibling(button_18);

			{
				_$_.for(
					ul_19,
					() => lazy_18.value,
					(__anchor, item) => {
						var li_19 = root_73();

						_$_.set_class(li_19, `item-${item}`, void 0, true);

						{
							var expression_29 = _$_.child(li_19);

							_$_.expression(expression_29, () => item);
							_$_.pop(li_19);
						}

						_$_.append(__anchor, li_19);
					},
					4
				);

				_$_.pop(ul_19);
			}

			_$_.next();
			_$_.append(__anchor, fragment_29, true);
		}));

		_$_.append(__anchor, fragment_28);
	});
}

export function ForLoopReverse() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_19 = _$_.track(['A', 'B', 'C', 'D'], __block, '24602e64');
		var fragment_30 = root_74();
		var node_18 = _$_.first_child_frag(fragment_30);

		_$_.expression(node_18, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_31 = root_75();
			var button_19 = _$_.first_child_frag(fragment_31);

			button_19.__click = () => {
				_$_.set(lazy_19, _$_.with_scope(__block, () => [...lazy_19.value].reverse()));
			};

			var ul_20 = _$_.sibling(button_19);

			{
				_$_.for(
					ul_20,
					() => lazy_19.value,
					(__anchor, item) => {
						var li_20 = root_76();

						_$_.set_class(li_20, `item-${item}`, void 0, true);

						{
							var expression_30 = _$_.child(li_20);

							_$_.expression(expression_30, () => item);
							_$_.pop(li_20);
						}

						_$_.append(__anchor, li_20);
					},
					4
				);

				_$_.pop(ul_20);
			}

			_$_.next();
			_$_.append(__anchor, fragment_31, true);
		}));

		_$_.append(__anchor, fragment_30);
	});
}

_$_.delegate(['click', 'change']);