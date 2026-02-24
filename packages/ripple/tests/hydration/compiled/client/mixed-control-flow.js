// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_4 = _$_.template(`<div> </div>`, 0);
var root_5 = _$_.template(`<div>pending a</div>`, 0);
var root_3 = _$_.template(`<!>`, 1, 1);
var root_7 = _$_.template(`<div> </div>`, 0);
var root_8 = _$_.template(`<div>pending b</div>`, 0);
var root_6 = _$_.template(`<!>`, 1, 1);
var root_2 = _$_.template(`<!>`, 1, 1);
var root_1 = _$_.template(`<!>`, 1, 1);
var root = _$_.template(`<section class="mixed-static"></section>`, 0);
var root_13 = _$_.template(`<p> </p>`, 0);
var root_14 = _$_.template(`<p class="pending">pending a</p>`, 0);
var root_12 = _$_.template(`<!>`, 1, 1);
var root_16 = _$_.template(`<p> </p>`, 0);
var root_17 = _$_.template(`<p class="pending">pending b</p>`, 0);
var root_15 = _$_.template(`<!>`, 1, 1);
var root_11 = _$_.template(`<!>`, 1, 1);
var root_10 = _$_.template(`<div class="mixed-reactive-list"></div>`, 0);
var root_9 = _$_.template(`<button class="toggle-show">Toggle Show</button><button class="toggle-mode">Toggle Mode</button><button class="add-item">Add Item</button><!>`, 1, 4);
var root_22 = _$_.template(`<!>`, 1, 1);
var root_23 = _$_.template(`<div> </div>`, 0);
var root_21 = _$_.template(`<!>`, 1, 1);
var root_24 = _$_.template(`<div class="unexpected">unexpected</div>`, 0);
var root_20 = _$_.template(`<!>`, 1, 1);
var root_19 = _$_.template(`<!>`, 1, 1);
var root_18 = _$_.template(`<div class="before">before</div><!>`, 1, 2);
var root_25 = _$_.template(`<div class="resolved-row"> </div>`, 0);

import { track } from 'ripple';

export function MixedControlFlowStatic(__anchor, _, __block) {
	_$_.push_component();

	const rows = [
		{ id: 1, kind: 'a', enabled: true },
		{ id: 2, kind: 'b', enabled: true },
		{ id: 3, kind: 'a', enabled: false }
	];

	var section_1 = root();

	{
		_$_.for_keyed(
			section_1,
			() => rows,
			(__anchor, pattern) => {
				var fragment = root_1();
				var node = _$_.first_child_frag(fragment);

				{
					var consequent = (__anchor) => {
						var fragment_1 = root_2();
						var node_1 = _$_.first_child_frag(fragment_1);

						{
							var switch_case_0 = (__anchor) => {
								var fragment_2 = root_3();
								var node_2 = _$_.first_child_frag(fragment_2);

								_$_.try(
									node_2,
									(__anchor) => {
										_$_.async(async () => {
											var div_1 = root_4();

											{
												var text = _$_.child(div_1, true);

												_$_.pop(div_1);
											}

											_$_.render(
												(__prev) => {
													var __a = `A-${_$_.get(pattern).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(text, __prev.a = __a);
													}

													var __b = `row row-${_$_.get(pattern).id} kind-a`;

													if (__prev.b !== __b) {
														_$_.set_class(div_1, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, div_1);
										});
									},
									null,
									(__anchor) => {
										var div_2 = root_5();

										_$_.render(() => {
											_$_.set_class(div_2, `pending pending-${_$_.get(pattern).id}`, void 0, true);
										});

										_$_.append(__anchor, div_2);
									}
								);

								_$_.append(__anchor, fragment_2);
							};

							var switch_case_default = (__anchor) => {
								var fragment_3 = root_6();
								var node_3 = _$_.first_child_frag(fragment_3);

								_$_.try(
									node_3,
									(__anchor) => {
										_$_.async(async () => {
											var div_3 = root_7();

											{
												var text_1 = _$_.child(div_3, true);

												_$_.pop(div_3);
											}

											_$_.render(
												(__prev) => {
													var __a = `B-${_$_.get(pattern).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(text_1, __prev.a = __a);
													}

													var __b = `row row-${_$_.get(pattern).id} kind-b`;

													if (__prev.b !== __b) {
														_$_.set_class(div_3, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, div_3);
										});
									},
									null,
									(__anchor) => {
										var div_4 = root_8();

										_$_.render(() => {
											_$_.set_class(div_4, `pending pending-${_$_.get(pattern).id}`, void 0, true);
										});

										_$_.append(__anchor, div_4);
									}
								);

								_$_.append(__anchor, fragment_3);
							};

							_$_.switch(node_1, () => {
								var result = [];

								switch (_$_.get(pattern).kind) {
									case 'a':
										result.push(switch_case_0);
										return result;

									default:
										result.push(switch_case_default);
										return result;
								}
							});
						}

						_$_.append(__anchor, fragment_1);
					};

					_$_.if(node, (__render) => {
						if (_$_.get(pattern).enabled) __render(consequent);
					});
				}

				_$_.append(__anchor, fragment);
			},
			4,
			(pattern) => _$_.get(pattern).id
		);

		_$_.pop(section_1);
	}

	_$_.append(__anchor, section_1);
	_$_.pop_component();
}

export function MixedControlFlowReactive(__anchor, _, __block) {
	_$_.push_component();

	let show = track(true, void 0, void 0, __block);
	let mode = track('a', void 0, void 0, __block);
	let items = track([{ id: 1, label: 'One' }, { id: 2, label: 'Two' }], void 0, void 0, __block);
	var fragment_4 = root_9();
	var button_1 = _$_.first_child_frag(fragment_4);

	button_1.__click = () => {
		_$_.set(show, !_$_.get(show));
	};

	var button_2 = _$_.sibling(button_1);

	button_2.__click = () => {
		_$_.set(mode, _$_.get(mode) === 'a' ? 'b' : 'a');
	};

	var button_3 = _$_.sibling(button_2);

	button_3.__click = () => {
		_$_.set(items, [..._$_.get(items), { id: 3, label: 'Three' }]);
	};

	var node_4 = _$_.sibling(button_3);

	{
		var consequent_1 = (__anchor) => {
			var div_5 = root_10();

			{
				_$_.for_keyed(
					div_5,
					() => _$_.get(items),
					(__anchor, pattern_1) => {
						var fragment_5 = root_11();
						var node_5 = _$_.first_child_frag(fragment_5);

						{
							var switch_case_0_1 = (__anchor) => {
								var fragment_6 = root_12();
								var node_6 = _$_.first_child_frag(fragment_6);

								_$_.try(
									node_6,
									(__anchor) => {
										_$_.async(async () => {
											var p_1 = root_13();

											{
												var text_2 = _$_.child(p_1, true);

												_$_.pop(p_1);
											}

											_$_.render(
												(__prev) => {
													var __a = `A:${_$_.get(pattern_1).label}`;

													if (__prev.a !== __a) {
														_$_.set_text(text_2, __prev.a = __a);
													}

													var __b = `item item-${_$_.get(pattern_1).id}`;

													if (__prev.b !== __b) {
														_$_.set_class(p_1, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, p_1);
										});
									},
									null,
									(__anchor) => {
										var p_2 = root_14();

										_$_.append(__anchor, p_2);
									}
								);

								_$_.append(__anchor, fragment_6);
							};

							var switch_case_default_1 = (__anchor) => {
								var fragment_7 = root_15();
								var node_7 = _$_.first_child_frag(fragment_7);

								_$_.try(
									node_7,
									(__anchor) => {
										_$_.async(async () => {
											var p_3 = root_16();

											{
												var text_3 = _$_.child(p_3, true);

												_$_.pop(p_3);
											}

											_$_.render(
												(__prev) => {
													var __a = `B:${_$_.get(pattern_1).label}`;

													if (__prev.a !== __a) {
														_$_.set_text(text_3, __prev.a = __a);
													}

													var __b = `item item-${_$_.get(pattern_1).id}`;

													if (__prev.b !== __b) {
														_$_.set_class(p_3, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, p_3);
										});
									},
									null,
									(__anchor) => {
										var p_4 = root_17();

										_$_.append(__anchor, p_4);
									}
								);

								_$_.append(__anchor, fragment_7);
							};

							_$_.switch(node_5, () => {
								var result = [];

								switch (_$_.get(mode)) {
									case 'a':
										result.push(switch_case_0_1);
										return result;

									default:
										result.push(switch_case_default_1);
										return result;
								}
							});
						}

						_$_.append(__anchor, fragment_5);
					},
					4,
					(pattern_1) => _$_.get(pattern_1).id
				);

				_$_.pop(div_5);
			}

			_$_.append(__anchor, div_5);
		};

		_$_.if(node_4, (__render) => {
			if (_$_.get(show)) __render(consequent_1);
		});
	}

	_$_.append(__anchor, fragment_4);
	_$_.pop_component();
}

export function MixedControlFlowAsyncPending(__anchor, _, __block) {
	_$_.push_component();

	const rows = [1, 2];
	const state = 'slow';
	var fragment_8 = root_18();
	var div_6 = _$_.first_child_frag(fragment_8);
	var node_8 = _$_.sibling(div_6);

	_$_.for(
		node_8,
		() => rows,
		(__anchor, row) => {
			var fragment_9 = root_19();
			var node_9 = _$_.first_child_frag(fragment_9);

			{
				var consequent_2 = (__anchor) => {
					var fragment_10 = root_20();
					var node_10 = _$_.first_child_frag(fragment_10);

					{
						var switch_case_0_2 = (__anchor) => {
							var fragment_11 = root_21();
							var node_11 = _$_.first_child_frag(fragment_11);

							_$_.try(
								node_11,
								(__anchor) => {
									_$_.async(async () => {
										var fragment_12 = root_22();
										var node_12 = _$_.first_child_frag(fragment_12);

										AsyncRow(node_12, { label: `row-${row}` }, _$_.active_block);
										_$_.append(__anchor, fragment_12);
									});
								},
								null,
								(__anchor) => {
									var div_7 = root_23();

									_$_.set_class(div_7, `pending-row pending-row-${row}`, void 0, true);

									{
										var text_4 = _$_.child(div_7, true);

										text_4.nodeValue = `pending ${row}`;
										_$_.pop(div_7);
									}

									_$_.append(__anchor, div_7);
								}
							);

							_$_.append(__anchor, fragment_11);
						};

						var switch_case_default_2 = (__anchor) => {
							var div_8 = root_24();

							_$_.append(__anchor, div_8);
						};

						_$_.switch(node_10, () => {
							var result = [];

							switch (state) {
								case 'slow':
									result.push(switch_case_0_2);
									return result;

								default:
									result.push(switch_case_default_2);
									return result;
							}
						});
					}

					_$_.append(__anchor, fragment_10);
				};

				_$_.if(node_9, (__render) => {
					if (row === 1) __render(consequent_2);
				});
			}

			_$_.append(__anchor, fragment_9);
		},
		0
	);

	_$_.append(__anchor, fragment_8);
	_$_.pop_component();
}

function AsyncRow(__anchor, __props, __block) {
	_$_.async(async () => {
		_$_.push_component();

		let value = (await _$_.maybe_tracked(_$_.with_scope(__block, async () => Promise.resolve(__props.label))))();

		if (_$_.aborted()) return;

		var div_9 = root_25();

		{
			var text_5 = _$_.child(div_9, true);

			text_5.nodeValue = value;
			_$_.pop(div_9);
		}

		_$_.append(__anchor, div_9);
		_$_.pop_component();
	});
}

_$_.delegate(['click']);