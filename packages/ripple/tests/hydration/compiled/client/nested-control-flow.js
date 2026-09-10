// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<li> </li>`, 0);

function render(__prev) {
	var __a = `item item-${_$_.get(__prev._pattern).id}`;

	if (__prev.a !== __a) {
		_$_.set_class(__prev._li, __prev.a = __a, void 0, true);
	}
}

function consequent(__anchor, pattern) {
	var li = root_1();

	{
		var expression = _$_.hydrating ? _$_.hydrate_child() : li.firstChild;

		_$_.expression(expression, () => _$_.get(pattern).label);
		_$_.pop(li);
	}

	_$_.render(render, { a: _$_.UNINITIALIZED, _pattern: pattern, _li: li });
	_$_.append(__anchor, li);
}

function if_1(pattern) {
	if (_$_.get(pattern).show) return consequent;
}

var root = _$_.template(`<ul class="for-if"></ul>`, 0);

function ForIf_render(__anchor, __block) {
	const items = [
		{ id: 1, show: true, label: 'One' },
		{ id: 2, show: true, label: 'Two' },
		{ id: 3, show: false, label: 'Three' }
	];

	var ul = root();

	{
		_$_.for_keyed(
			ul,
			() => items,
			(__anchor, pattern) => {
				_$_.if(__anchor, if_1, true, pattern);
			},
			4,
			(pattern) => _$_.get(pattern).id
		);

		_$_.pop(ul);
	}

	_$_.append(__anchor, ul);
}

ForIf.$r = ForIf_render;

var root_3 = _$_.template(`<li> </li>`, 0);

function render_1(__prev) {
	var __pattern_1 = _$_.get(__prev._pattern_1);
	var __a = `A-${__pattern_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_1, __prev.a = __a);
	}

	var __b = `item item-${__pattern_1.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_1, __prev.b = __b, void 0, true);
	}
}

var root_4 = _$_.template(`<li> </li>`, 0);

function render_2(__prev) {
	var __pattern_1_1 = _$_.get(__prev._pattern_1);
	var __a = `B-${__pattern_1_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_2, __prev.a = __a);
	}

	var __b = `item item-${__pattern_1_1.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_2, __prev.b = __b, void 0, true);
	}
}

var root_2 = _$_.template(`<ul class="for-switch"></ul>`, 0);

function ForSwitch_render(__anchor, __block) {
	const items = [
		{ id: 1, kind: 'a' },
		{ id: 2, kind: 'b' },
		{ id: 3, kind: 'a' }
	];

	var ul_1 = root_2();

	{
		_$_.for_keyed(
			ul_1,
			() => items,
			(__anchor, pattern_1) => {
				{
					var switch_case_0 = (__anchor) => {
						var li_1 = root_3();

						{
							var expression_1 = _$_.hydrating ? _$_.hydrate_text() : li_1.firstChild;
						}

						_$_.render(render_1, {
							a: ' ',
							b: _$_.UNINITIALIZED,
							_pattern_1: pattern_1,
							_expression_1: expression_1,
							_li_1: li_1
						});

						_$_.append(__anchor, li_1);
					};

					var switch_case_default = (__anchor) => {
						var li_2 = root_4();

						{
							var expression_2 = _$_.hydrating ? _$_.hydrate_text() : li_2.firstChild;
						}

						_$_.render(render_2, {
							a: ' ',
							b: _$_.UNINITIALIZED,
							_pattern_1: pattern_1,
							_expression_2: expression_2,
							_li_2: li_2
						});

						_$_.append(__anchor, li_2);
					};

					_$_.switch(
						__anchor,
						() => {
							var result = [];

							switch (_$_.get(pattern_1).kind) {
								case 'a':
									result.push(switch_case_0);
									return result;

								default:
									result.push(switch_case_default);
									return result;
							}
						},
						true
					);
				}
			},
			4,
			(pattern_1) => _$_.get(pattern_1).id
		);

		_$_.pop(ul_1);
	}

	_$_.append(__anchor, ul_1);
}

ForSwitch.$r = ForSwitch_render;

var root_6 = _$_.template(`<p class="case-a">Case A</p>`, 0);
var root_7 = _$_.template(`<p class="case-default">Default</p>`, 0);
var root_5 = _$_.template(`<div class="if-switch"><!></div>`, 0);

function IfSwitch_render(__anchor, __block) {
	const show = true;
	const kind = 'a';
	var div = root_5();

	{
		var node = _$_.hydrating ? _$_.hydrate_child() : div.firstChild;

		{
			var consequent_1 = (__anchor) => {
				{
					var switch_case_0_1 = (__anchor) => {
						var p = root_6();

						_$_.append(__anchor, p);
					};

					var switch_case_default_1 = (__anchor) => {
						var p_1 = root_7();

						_$_.append(__anchor, p_1);
					};

					_$_.switch(
						__anchor,
						() => {
							var result = [];

							switch (kind) {
								case 'a':
									result.push(switch_case_0_1);
									return result;

								default:
									result.push(switch_case_default_1);
									return result;
							}
						},
						true
					);
				}
			};

			_$_.if(node, () => {
				if (show) return consequent_1;
			});
		}

		_$_.pop(div);
	}

	_$_.append(__anchor, div);
}

IfSwitch.$r = IfSwitch_render;

var root_9 = _$_.template(`<p class="case-a">Case A</p>`, 0);
var root_10 = _$_.template(`<p class="case-default">Default</p>`, 0);
var root_8 = _$_.template(`<div class="if-switch-hidden"><!><p class="after">after</p></div>`, 0);

function IfSwitchHidden_render(__anchor, __block) {
	const show = false;
	const kind = 'a';
	var div_1 = root_8();

	{
		var node_1 = _$_.hydrating ? _$_.hydrate_child() : div_1.firstChild;

		{
			var consequent_2 = (__anchor) => {
				{
					var switch_case_0_2 = (__anchor) => {
						var p_2 = root_9();

						_$_.append(__anchor, p_2);
					};

					var switch_case_default_2 = (__anchor) => {
						var p_3 = root_10();

						_$_.append(__anchor, p_3);
					};

					_$_.switch(
						__anchor,
						() => {
							var result = [];

							switch (kind) {
								case 'a':
									result.push(switch_case_0_2);
									return result;

								default:
									result.push(switch_case_default_2);
									return result;
							}
						},
						true
					);
				}
			};

			_$_.if(node_1, () => {
				if (show) return consequent_2;
			});
		}

		_$_.pop(div_1);
	}

	_$_.append(__anchor, div_1);
}

IfSwitchHidden.$r = IfSwitchHidden_render;

var root_12 = _$_.template(`<li> </li>`, 0);

function render_3(__prev) {
	var __pattern_2 = _$_.get(__prev._pattern_2);
	var __a = `A-${__pattern_2.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_3, __prev.a = __a);
	}

	var __b = `item item-${__pattern_2.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_3, __prev.b = __b, void 0, true);
	}
}

var root_13 = _$_.template(`<li> </li>`, 0);

function render_4(__prev) {
	var __pattern_2_1 = _$_.get(__prev._pattern_2);
	var __a = `D-${__pattern_2_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_4, __prev.a = __a);
	}

	var __b = `item item-${__pattern_2_1.id} kind-default`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_4, __prev.b = __b, void 0, true);
	}
}

function consequent_3(__anchor, pattern_2) {
	{
		var switch_case_0_3 = (__anchor) => {
			var li_3 = root_12();

			{
				var expression_3 = _$_.hydrating ? _$_.hydrate_text() : li_3.firstChild;
			}

			_$_.render(render_3, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern_2: pattern_2,
				_expression_3: expression_3,
				_li_3: li_3
			});

			_$_.append(__anchor, li_3);
		};

		var switch_case_default_3 = (__anchor) => {
			var li_4 = root_13();

			{
				var expression_4 = _$_.hydrating ? _$_.hydrate_text() : li_4.firstChild;
			}

			_$_.render(render_4, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern_2: pattern_2,
				_expression_4: expression_4,
				_li_4: li_4
			});

			_$_.append(__anchor, li_4);
		};

		_$_.switch(
			__anchor,
			() => {
				var result = [];

				switch (_$_.get(pattern_2).kind) {
					case 'a':
						result.push(switch_case_0_3);
						return result;

					default:
						result.push(switch_case_default_3);
						return result;
				}
			},
			true
		);
	}
}

function if_2(pattern_2) {
	if (_$_.get(pattern_2).show) return consequent_3;
}

var root_11 = _$_.template(`<ul class="for-if-switch-single"></ul>`, 0);

function ForIfSwitchSingle_render(__anchor, __block) {
	const items = [{ id: 1, kind: 'a', show: true }];
	var ul_2 = root_11();

	{
		_$_.for_keyed(
			ul_2,
			() => items,
			(__anchor, pattern_2) => {
				_$_.if(__anchor, if_2, true, pattern_2);
			},
			4,
			(pattern_2) => _$_.get(pattern_2).id
		);

		_$_.pop(ul_2);
	}

	_$_.append(__anchor, ul_2);
}

ForIfSwitchSingle.$r = ForIfSwitchSingle_render;

var root_15 = _$_.template(`<li> </li>`, 0);

function render_5(__prev) {
	var __pattern_3 = _$_.get(__prev._pattern_3);
	var __a = `A-${__pattern_3.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_5, __prev.a = __a);
	}

	var __b = `item item-${__pattern_3.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_5, __prev.b = __b, void 0, true);
	}
}

var root_16 = _$_.template(`<li> </li>`, 0);

function render_6(__prev) {
	var __pattern_3_1 = _$_.get(__prev._pattern_3);
	var __a = `B-${__pattern_3_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_6, __prev.a = __a);
	}

	var __b = `item item-${__pattern_3_1.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_6, __prev.b = __b, void 0, true);
	}
}

function consequent_4(__anchor, pattern_3) {
	{
		var switch_case_0_4 = (__anchor) => {
			var li_5 = root_15();

			{
				var expression_5 = _$_.hydrating ? _$_.hydrate_text() : li_5.firstChild;
			}

			_$_.render(render_5, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern_3: pattern_3,
				_expression_5: expression_5,
				_li_5: li_5
			});

			_$_.append(__anchor, li_5);
		};

		var switch_case_default_4 = (__anchor) => {
			var li_6 = root_16();

			{
				var expression_6 = _$_.hydrating ? _$_.hydrate_text() : li_6.firstChild;
			}

			_$_.render(render_6, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern_3: pattern_3,
				_expression_6: expression_6,
				_li_6: li_6
			});

			_$_.append(__anchor, li_6);
		};

		_$_.switch(
			__anchor,
			() => {
				var result = [];

				switch (_$_.get(pattern_3).kind) {
					case 'a':
						result.push(switch_case_0_4);
						return result;

					default:
						result.push(switch_case_default_4);
						return result;
				}
			},
			true
		);
	}
}

function if_3(pattern_3) {
	if (_$_.get(pattern_3).show) return consequent_4;
}

var root_14 = _$_.template(`<ul class="for-if-switch-multi"></ul>`, 0);

function ForIfSwitchMulti_render(__anchor, __block) {
	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: true }
	];

	var ul_3 = root_14();

	{
		_$_.for_keyed(
			ul_3,
			() => items,
			(__anchor, pattern_3) => {
				_$_.if(__anchor, if_3, true, pattern_3);
			},
			4,
			(pattern_3) => _$_.get(pattern_3).id
		);

		_$_.pop(ul_3);
	}

	_$_.append(__anchor, ul_3);
}

ForIfSwitchMulti.$r = ForIfSwitchMulti_render;

var root_18 = _$_.template(`<li> </li>`, 0);

function render_7(__prev) {
	var __pattern_4 = _$_.get(__prev._pattern_4);
	var __a = `A-${__pattern_4.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_7, __prev.a = __a);
	}

	var __b = `item item-${__pattern_4.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_7, __prev.b = __b, void 0, true);
	}
}

var root_19 = _$_.template(`<li> </li>`, 0);

function render_8(__prev) {
	var __pattern_4_1 = _$_.get(__prev._pattern_4);
	var __a = `B-${__pattern_4_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_8, __prev.a = __a);
	}

	var __b = `item item-${__pattern_4_1.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_8, __prev.b = __b, void 0, true);
	}
}

function consequent_5(__anchor, pattern_4) {
	{
		var switch_case_0_5 = (__anchor) => {
			var li_7 = root_18();

			{
				var expression_7 = _$_.hydrating ? _$_.hydrate_text() : li_7.firstChild;
			}

			_$_.render(render_7, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern_4: pattern_4,
				_expression_7: expression_7,
				_li_7: li_7
			});

			_$_.append(__anchor, li_7);
		};

		var switch_case_default_5 = (__anchor) => {
			var li_8 = root_19();

			{
				var expression_8 = _$_.hydrating ? _$_.hydrate_text() : li_8.firstChild;
			}

			_$_.render(render_8, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern_4: pattern_4,
				_expression_8: expression_8,
				_li_8: li_8
			});

			_$_.append(__anchor, li_8);
		};

		_$_.switch(
			__anchor,
			() => {
				var result = [];

				switch (_$_.get(pattern_4).kind) {
					case 'a':
						result.push(switch_case_0_5);
						return result;

					default:
						result.push(switch_case_default_5);
						return result;
				}
			},
			true
		);
	}
}

function if_4(pattern_4) {
	if (_$_.get(pattern_4).show) return consequent_5;
}

var root_17 = _$_.template(`<ul class="for-if-switch-disabled"></ul>`, 0);

function ForIfSwitchWithDisabled_render(__anchor, __block) {
	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: false },
		{ id: 3, kind: 'a', show: true }
	];

	var ul_4 = root_17();

	{
		_$_.for_keyed(
			ul_4,
			() => items,
			(__anchor, pattern_4) => {
				_$_.if(__anchor, if_4, true, pattern_4);
			},
			4,
			(pattern_4) => _$_.get(pattern_4).id
		);

		_$_.pop(ul_4);
	}

	_$_.append(__anchor, ul_4);
}

ForIfSwitchWithDisabled.$r = ForIfSwitchWithDisabled_render;

var root_21 = _$_.template(`<p class="resolved-a">A resolved</p>`, 0);
var root_22 = _$_.template(`<p class="pending-a">A pending</p>`, 0);
var root_23 = _$_.template(`<p class="default">Default</p>`, 0);
var root_20 = _$_.template(`<div class="switch-try"><!></div>`, 0);

function SwitchTry_render(__anchor, __block) {
	const kind = 'a';
	var div_2 = root_20();

	{
		var node_2 = _$_.hydrating ? _$_.hydrate_child() : div_2.firstChild;

		{
			var switch_case_0_6 = (__anchor) => {
				_$_.try(
					__anchor,
					(__anchor) => {
						var p_4 = root_21();

						_$_.append(__anchor, p_4);
					},
					null,
					(__anchor) => {
						var p_5 = root_22();

						_$_.append(__anchor, p_5);
					},
					true
				);
			};

			var switch_case_default_6 = (__anchor) => {
				var p_6 = root_23();

				_$_.append(__anchor, p_6);
			};

			_$_.switch(node_2, () => {
				var result = [];

				switch (kind) {
					case 'a':
						result.push(switch_case_0_6);
						return result;

					default:
						result.push(switch_case_default_6);
						return result;
				}
			});
		}

		_$_.pop(div_2);
	}

	_$_.append(__anchor, div_2);
}

SwitchTry.$r = SwitchTry_render;

var root_25 = _$_.template(`<li> </li>`, 0);

function render_9(__prev) {
	var __pattern_5 = _$_.get(__prev._pattern_5);
	var __a = `A-${__pattern_5.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_9, __prev.a = __a);
	}

	var __b = `item item-${__pattern_5.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_9, __prev.b = __b, void 0, true);
	}
}

var root_26 = _$_.template(`<li> </li>`, 0);

function render_10(__prev) {
	var __pattern_5_1 = _$_.get(__prev._pattern_5);
	var __a = `pending ${__pattern_5_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_10, __prev.a = __a);
	}

	var __b = `pending pending-${__pattern_5_1.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_10, __prev.b = __b, void 0, true);
	}
}

var root_27 = _$_.template(`<li> </li>`, 0);

function render_11(__prev) {
	var __pattern_5_2 = _$_.get(__prev._pattern_5);
	var __a = `B-${__pattern_5_2.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_11, __prev.a = __a);
	}

	var __b = `item item-${__pattern_5_2.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_11, __prev.b = __b, void 0, true);
	}
}

var root_28 = _$_.template(`<li> </li>`, 0);

function render_12(__prev) {
	var __pattern_5_3 = _$_.get(__prev._pattern_5);
	var __a = `pending ${__pattern_5_3.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_12, __prev.a = __a);
	}

	var __b = `pending pending-${__pattern_5_3.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_12, __prev.b = __b, void 0, true);
	}
}

var root_24 = _$_.template(`<ul class="for-switch-try"></ul>`, 0);

function ForSwitchTry_render(__anchor, __block) {
	const items = [{ id: 1, kind: 'a' }, { id: 2, kind: 'b' }];
	var ul_5 = root_24();

	{
		_$_.for_keyed(
			ul_5,
			() => items,
			(__anchor, pattern_5) => {
				{
					var switch_case_0_7 = (__anchor) => {
						_$_.try(
							__anchor,
							(__anchor) => {
								var li_9 = root_25();

								{
									var expression_9 = _$_.hydrating ? _$_.hydrate_text() : li_9.firstChild;
								}

								_$_.render(render_9, {
									a: ' ',
									b: _$_.UNINITIALIZED,
									_pattern_5: pattern_5,
									_expression_9: expression_9,
									_li_9: li_9
								});

								_$_.append(__anchor, li_9);
							},
							null,
							(__anchor) => {
								var li_10 = root_26();

								{
									var expression_10 = _$_.hydrating ? _$_.hydrate_text() : li_10.firstChild;
								}

								_$_.render(render_10, {
									a: ' ',
									b: _$_.UNINITIALIZED,
									_pattern_5: pattern_5,
									_expression_10: expression_10,
									_li_10: li_10
								});

								_$_.append(__anchor, li_10);
							},
							true
						);
					};

					var switch_case_default_7 = (__anchor) => {
						_$_.try(
							__anchor,
							(__anchor) => {
								var li_11 = root_27();

								{
									var expression_11 = _$_.hydrating ? _$_.hydrate_text() : li_11.firstChild;
								}

								_$_.render(render_11, {
									a: ' ',
									b: _$_.UNINITIALIZED,
									_pattern_5: pattern_5,
									_expression_11: expression_11,
									_li_11: li_11
								});

								_$_.append(__anchor, li_11);
							},
							null,
							(__anchor) => {
								var li_12 = root_28();

								{
									var expression_12 = _$_.hydrating ? _$_.hydrate_text() : li_12.firstChild;
								}

								_$_.render(render_12, {
									a: ' ',
									b: _$_.UNINITIALIZED,
									_pattern_5: pattern_5,
									_expression_12: expression_12,
									_li_12: li_12
								});

								_$_.append(__anchor, li_12);
							},
							true
						);
					};

					_$_.switch(
						__anchor,
						() => {
							var result = [];

							switch (_$_.get(pattern_5).kind) {
								case 'a':
									result.push(switch_case_0_7);
									return result;

								default:
									result.push(switch_case_default_7);
									return result;
							}
						},
						true
					);
				}
			},
			4,
			(pattern_5) => _$_.get(pattern_5).id
		);

		_$_.pop(ul_5);
	}

	_$_.append(__anchor, ul_5);
}

ForSwitchTry.$r = ForSwitchTry_render;

var root_30 = _$_.template(`<li> </li>`, 0);

function render_13(__prev) {
	var __pattern_6 = _$_.get(__prev._pattern_6);
	var __a = `item-${__pattern_6.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_13, __prev.a = __a);
	}

	var __b = `item item-${__pattern_6.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_13, __prev.b = __b, void 0, true);
	}
}

var root_31 = _$_.template(`<li> </li>`, 0);

function render_14(__prev) {
	var __pattern_6_1 = _$_.get(__prev._pattern_6);
	var __a = `pending ${__pattern_6_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_14, __prev.a = __a);
	}

	var __b = `pending pending-${__pattern_6_1.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_14, __prev.b = __b, void 0, true);
	}
}

function consequent_6(__anchor, pattern_6) {
	_$_.try(
		__anchor,
		(__anchor) => {
			var li_13 = root_30();

			{
				var expression_13 = _$_.hydrating ? _$_.hydrate_text() : li_13.firstChild;
			}

			_$_.render(render_13, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern_6: pattern_6,
				_expression_13: expression_13,
				_li_13: li_13
			});

			_$_.append(__anchor, li_13);
		},
		null,
		(__anchor) => {
			var li_14 = root_31();

			{
				var expression_14 = _$_.hydrating ? _$_.hydrate_text() : li_14.firstChild;
			}

			_$_.render(render_14, {
				a: ' ',
				b: _$_.UNINITIALIZED,
				_pattern_6: pattern_6,
				_expression_14: expression_14,
				_li_14: li_14
			});

			_$_.append(__anchor, li_14);
		},
		true
	);
}

function if_5(pattern_6) {
	if (_$_.get(pattern_6).show) return consequent_6;
}

var root_29 = _$_.template(`<ul class="for-if-try"></ul>`, 0);

function ForIfTry_render(__anchor, __block) {
	const items = [{ id: 1, show: true }, { id: 2, show: true }];
	var ul_6 = root_29();

	{
		_$_.for_keyed(
			ul_6,
			() => items,
			(__anchor, pattern_6) => {
				_$_.if(__anchor, if_5, true, pattern_6);
			},
			4,
			(pattern_6) => _$_.get(pattern_6).id
		);

		_$_.pop(ul_6);
	}

	_$_.append(__anchor, ul_6);
}

ForIfTry.$r = ForIfTry_render;

var root_33 = _$_.template(`<li> </li>`, 0);

function render_15(__prev) {
	var __pattern_7 = _$_.get(__prev._pattern_7);
	var __a = `A-${__pattern_7.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_15, __prev.a = __a);
	}

	var __b = `item item-${__pattern_7.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_15, __prev.b = __b, void 0, true);
	}
}

var root_34 = _$_.template(`<li> </li>`, 0);

function render_16(__prev) {
	var __pattern_7_1 = _$_.get(__prev._pattern_7);
	var __a = `pending ${__pattern_7_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_16, __prev.a = __a);
	}

	var __b = `pending pending-${__pattern_7_1.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_16, __prev.b = __b, void 0, true);
	}
}

var root_35 = _$_.template(`<li> </li>`, 0);

function render_17(__prev) {
	var __pattern_7_2 = _$_.get(__prev._pattern_7);
	var __a = `D-${__pattern_7_2.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_17, __prev.a = __a);
	}

	var __b = `item item-${__pattern_7_2.id} kind-default`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_17, __prev.b = __b, void 0, true);
	}
}

var root_36 = _$_.template(`<li> </li>`, 0);

function render_18(__prev) {
	var __pattern_7_3 = _$_.get(__prev._pattern_7);
	var __a = `pending ${__pattern_7_3.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_18, __prev.a = __a);
	}

	var __b = `pending pending-${__pattern_7_3.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_18, __prev.b = __b, void 0, true);
	}
}

function consequent_7(__anchor, pattern_7) {
	{
		var switch_case_0_8 = (__anchor) => {
			_$_.try(
				__anchor,
				(__anchor) => {
					var li_15 = root_33();

					{
						var expression_15 = _$_.hydrating ? _$_.hydrate_text() : li_15.firstChild;
					}

					_$_.render(render_15, {
						a: ' ',
						b: _$_.UNINITIALIZED,
						_pattern_7: pattern_7,
						_expression_15: expression_15,
						_li_15: li_15
					});

					_$_.append(__anchor, li_15);
				},
				null,
				(__anchor) => {
					var li_16 = root_34();

					{
						var expression_16 = _$_.hydrating ? _$_.hydrate_text() : li_16.firstChild;
					}

					_$_.render(render_16, {
						a: ' ',
						b: _$_.UNINITIALIZED,
						_pattern_7: pattern_7,
						_expression_16: expression_16,
						_li_16: li_16
					});

					_$_.append(__anchor, li_16);
				},
				true
			);
		};

		var switch_case_default_8 = (__anchor) => {
			_$_.try(
				__anchor,
				(__anchor) => {
					var li_17 = root_35();

					{
						var expression_17 = _$_.hydrating ? _$_.hydrate_text() : li_17.firstChild;
					}

					_$_.render(render_17, {
						a: ' ',
						b: _$_.UNINITIALIZED,
						_pattern_7: pattern_7,
						_expression_17: expression_17,
						_li_17: li_17
					});

					_$_.append(__anchor, li_17);
				},
				null,
				(__anchor) => {
					var li_18 = root_36();

					{
						var expression_18 = _$_.hydrating ? _$_.hydrate_text() : li_18.firstChild;
					}

					_$_.render(render_18, {
						a: ' ',
						b: _$_.UNINITIALIZED,
						_pattern_7: pattern_7,
						_expression_18: expression_18,
						_li_18: li_18
					});

					_$_.append(__anchor, li_18);
				},
				true
			);
		};

		_$_.switch(
			__anchor,
			() => {
				var result = [];

				switch (_$_.get(pattern_7).kind) {
					case 'a':
						result.push(switch_case_0_8);
						return result;

					default:
						result.push(switch_case_default_8);
						return result;
				}
			},
			true
		);
	}
}

function if_6(pattern_7) {
	if (_$_.get(pattern_7).show) return consequent_7;
}

var root_32 = _$_.template(`<ul class="for-if-switch-try-single"></ul>`, 0);

function ForIfSwitchTrySingle_render(__anchor, __block) {
	const items = [{ id: 1, kind: 'a', show: true }];
	var ul_7 = root_32();

	{
		_$_.for_keyed(
			ul_7,
			() => items,
			(__anchor, pattern_7) => {
				_$_.if(__anchor, if_6, true, pattern_7);
			},
			4,
			(pattern_7) => _$_.get(pattern_7).id
		);

		_$_.pop(ul_7);
	}

	_$_.append(__anchor, ul_7);
}

ForIfSwitchTrySingle.$r = ForIfSwitchTrySingle_render;

var root_38 = _$_.template(`<li> </li>`, 0);

function render_19(__prev) {
	var __pattern_8 = _$_.get(__prev._pattern_8);
	var __a = `A-${__pattern_8.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_19, __prev.a = __a);
	}

	var __b = `item item-${__pattern_8.id} kind-a`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_19, __prev.b = __b, void 0, true);
	}
}

var root_39 = _$_.template(`<li> </li>`, 0);

function render_20(__prev) {
	var __pattern_8_1 = _$_.get(__prev._pattern_8);
	var __a = `pending ${__pattern_8_1.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_20, __prev.a = __a);
	}

	var __b = `pending pending-${__pattern_8_1.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_20, __prev.b = __b, void 0, true);
	}
}

var root_40 = _$_.template(`<li> </li>`, 0);

function render_21(__prev) {
	var __pattern_8_2 = _$_.get(__prev._pattern_8);
	var __a = `B-${__pattern_8_2.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_21, __prev.a = __a);
	}

	var __b = `item item-${__pattern_8_2.id} kind-b`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_21, __prev.b = __b, void 0, true);
	}
}

var root_41 = _$_.template(`<li> </li>`, 0);

function render_22(__prev) {
	var __pattern_8_3 = _$_.get(__prev._pattern_8);
	var __a = `pending ${__pattern_8_3.id}`;

	if (__prev.a !== __a) {
		_$_.set_text(__prev._expression_22, __prev.a = __a);
	}

	var __b = `pending pending-${__pattern_8_3.id}`;

	if (__prev.b !== __b) {
		_$_.set_class(__prev._li_22, __prev.b = __b, void 0, true);
	}
}

function consequent_8(__anchor, pattern_8) {
	{
		var switch_case_0_9 = (__anchor) => {
			_$_.try(
				__anchor,
				(__anchor) => {
					var li_19 = root_38();

					{
						var expression_19 = _$_.hydrating ? _$_.hydrate_text() : li_19.firstChild;
					}

					_$_.render(render_19, {
						a: ' ',
						b: _$_.UNINITIALIZED,
						_pattern_8: pattern_8,
						_expression_19: expression_19,
						_li_19: li_19
					});

					_$_.append(__anchor, li_19);
				},
				null,
				(__anchor) => {
					var li_20 = root_39();

					{
						var expression_20 = _$_.hydrating ? _$_.hydrate_text() : li_20.firstChild;
					}

					_$_.render(render_20, {
						a: ' ',
						b: _$_.UNINITIALIZED,
						_pattern_8: pattern_8,
						_expression_20: expression_20,
						_li_20: li_20
					});

					_$_.append(__anchor, li_20);
				},
				true
			);
		};

		var switch_case_default_9 = (__anchor) => {
			_$_.try(
				__anchor,
				(__anchor) => {
					var li_21 = root_40();

					{
						var expression_21 = _$_.hydrating ? _$_.hydrate_text() : li_21.firstChild;
					}

					_$_.render(render_21, {
						a: ' ',
						b: _$_.UNINITIALIZED,
						_pattern_8: pattern_8,
						_expression_21: expression_21,
						_li_21: li_21
					});

					_$_.append(__anchor, li_21);
				},
				null,
				(__anchor) => {
					var li_22 = root_41();

					{
						var expression_22 = _$_.hydrating ? _$_.hydrate_text() : li_22.firstChild;
					}

					_$_.render(render_22, {
						a: ' ',
						b: _$_.UNINITIALIZED,
						_pattern_8: pattern_8,
						_expression_22: expression_22,
						_li_22: li_22
					});

					_$_.append(__anchor, li_22);
				},
				true
			);
		};

		_$_.switch(
			__anchor,
			() => {
				var result = [];

				switch (_$_.get(pattern_8).kind) {
					case 'a':
						result.push(switch_case_0_9);
						return result;

					default:
						result.push(switch_case_default_9);
						return result;
				}
			},
			true
		);
	}
}

function if_7(pattern_8) {
	if (_$_.get(pattern_8).show) return consequent_8;
}

var root_37 = _$_.template(`<ul class="for-if-switch-try-multi"></ul>`, 0);

function ForIfSwitchTryMulti_render(__anchor, __block) {
	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: true }
	];

	var ul_8 = root_37();

	{
		_$_.for_keyed(
			ul_8,
			() => items,
			(__anchor, pattern_8) => {
				_$_.if(__anchor, if_7, true, pattern_8);
			},
			4,
			(pattern_8) => _$_.get(pattern_8).id
		);

		_$_.pop(ul_8);
	}

	_$_.append(__anchor, ul_8);
}

ForIfSwitchTryMulti.$r = ForIfSwitchTryMulti_render;

export function ForIf() {
	return _$_.tsrx_element(ForIf_render);
}

export function ForSwitch() {
	return _$_.tsrx_element(ForSwitch_render);
}

export function IfSwitch() {
	return _$_.tsrx_element(IfSwitch_render);
}

export function IfSwitchHidden() {
	return _$_.tsrx_element(IfSwitchHidden_render);
}

export function ForIfSwitchSingle() {
	return _$_.tsrx_element(ForIfSwitchSingle_render);
}

export function ForIfSwitchMulti() {
	return _$_.tsrx_element(ForIfSwitchMulti_render);
}

export function ForIfSwitchWithDisabled() {
	return _$_.tsrx_element(ForIfSwitchWithDisabled_render);
}

export function SwitchTry() {
	return _$_.tsrx_element(SwitchTry_render);
}

export function ForSwitchTry() {
	return _$_.tsrx_element(ForSwitchTry_render);
}

export function ForIfTry() {
	return _$_.tsrx_element(ForIfTry_render);
}

export function ForIfSwitchTrySingle() {
	return _$_.tsrx_element(ForIfSwitchTrySingle_render);
}

export function ForIfSwitchTryMulti() {
	return _$_.tsrx_element(ForIfSwitchTryMulti_render);
}