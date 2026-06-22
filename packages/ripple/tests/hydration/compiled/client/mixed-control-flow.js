// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<div> </div>`, 0);
var root_2 = _$_.template(`<div>pending a</div>`, 0);
var root_3 = _$_.template(`<div> </div>`, 0);
var root_4 = _$_.template(`<div>pending b</div>`, 0);
var root = _$_.template(`<section class="mixed-static"></section>`, 0);
var root_8 = _$_.template(`<p> </p>`, 0);
var root_9 = _$_.template(`<p class="pending">pending a</p>`, 0);
var root_10 = _$_.template(`<p> </p>`, 0);
var root_11 = _$_.template(`<p class="pending">pending b</p>`, 0);
var root_7 = _$_.template(`<div class="mixed-reactive-list"></div>`, 0);
var root_6 = _$_.template(`<button class="toggle-show">Toggle Show</button><button class="toggle-mode">Toggle Mode</button><button class="add-item">Add Item</button><!>`, 1, 4);
var root_5 = _$_.template(`<!>`, 1, 1);
var root_14 = _$_.template(`<div> </div>`, 0);
var root_15 = _$_.template(`<div class="unexpected">unexpected</div>`, 0);
var root_13 = _$_.template(`<div class="before">before</div><!>`, 1, 2);
var root_12 = _$_.template(`<!>`, 1, 1);
var root_16 = _$_.template(`<div class="resolved-row"> </div>`, 0);

import { track, trackAsync } from 'ripple';

export function MixedControlFlowStatic() {
	return _$_.tsrx_element((__anchor, __block) => {
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
					{
						var consequent = (__anchor) => {
							{
								var switch_case_0 = (__anchor) => {
									_$_.try(
										__anchor,
										(__anchor) => {
											var div_1 = root_1();

											{
												var expression = _$_.child(div_1, true);

												_$_.pop(div_1);
											}

											_$_.render(
												(__prev) => {
													var __a = `A-${_$_.get(pattern).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(expression, __prev.a = __a);
													}

													var __b = `row row-${_$_.get(pattern).id} kind-a`;

													if (__prev.b !== __b) {
														_$_.set_class(div_1, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, div_1);
										},
										null,
										(__anchor) => {
											var div_2 = root_2();

											_$_.render(() => {
												_$_.set_class(div_2, `pending pending-${_$_.get(pattern).id}`, void 0, true);
											});

											_$_.append(__anchor, div_2);
										},
										true
									);
								};

								var switch_case_default = (__anchor) => {
									_$_.try(
										__anchor,
										(__anchor) => {
											var div_3 = root_3();

											{
												var expression_1 = _$_.child(div_3, true);

												_$_.pop(div_3);
											}

											_$_.render(
												(__prev) => {
													var __a = `B-${_$_.get(pattern).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(expression_1, __prev.a = __a);
													}

													var __b = `row row-${_$_.get(pattern).id} kind-b`;

													if (__prev.b !== __b) {
														_$_.set_class(div_3, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, div_3);
										},
										null,
										(__anchor) => {
											var div_4 = root_4();

											_$_.render(() => {
												_$_.set_class(div_4, `pending pending-${_$_.get(pattern).id}`, void 0, true);
											});

											_$_.append(__anchor, div_4);
										},
										true
									);
								};

								_$_.switch(
									__anchor,
									() => {
										var result = [];

										switch (_$_.get(pattern).kind) {
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
						};

						_$_.if(
							__anchor,
							(__render) => {
								if (_$_.get(pattern).enabled) __render(consequent);
							},
							true
						);
					}
				},
				4,
				(pattern) => _$_.get(pattern).id
			);

			_$_.pop(section_1);
		}

		_$_.append(__anchor, section_1);
	});
}

export function MixedControlFlowReactive() {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy = _$_.track(true, __block, '5ae53d26');
		let lazy_1 = _$_.track('a', __block, '5b53eda2');
		let lazy_2 = _$_.track([{ id: 1, label: 'One' }, { id: 2, label: 'Two' }], __block, '7890dad6');
		var fragment = root_5();
		var node_1 = _$_.first_child_frag(fragment);

		_$_.expression(node_1, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_1 = root_6();
			var button_1 = _$_.first_child_frag(fragment_1);

			button_1.__click = () => {
				_$_.set(lazy, !lazy.value);
			};

			var button_2 = _$_.sibling(button_1);

			button_2.__click = () => {
				_$_.set(lazy_1, lazy_1.value === 'a' ? 'b' : 'a');
			};

			var button_3 = _$_.sibling(button_2);

			button_3.__click = () => {
				_$_.set(lazy_2, [...lazy_2.value, { id: 3, label: 'Three' }]);
			};

			var node = _$_.sibling(button_3);

			{
				var consequent_1 = (__anchor) => {
					var div_5 = root_7();

					{
						_$_.for_keyed(
							div_5,
							() => lazy_2.value,
							(__anchor, pattern_1) => {
								{
									var switch_case_0_1 = (__anchor) => {
										_$_.try(
											__anchor,
											(__anchor) => {
												var p_1 = root_8();

												{
													var expression_2 = _$_.child(p_1, true);

													_$_.pop(p_1);
												}

												_$_.render(
													(__prev) => {
														var __a = `A:${_$_.get(pattern_1).label}`;

														if (__prev.a !== __a) {
															_$_.set_text(expression_2, __prev.a = __a);
														}

														var __b = `item item-${_$_.get(pattern_1).id}`;

														if (__prev.b !== __b) {
															_$_.set_class(p_1, __prev.b = __b, void 0, true);
														}
													},
													{ a: ' ', b: Symbol() }
												);

												_$_.append(__anchor, p_1);
											},
											null,
											(__anchor) => {
												var p_2 = root_9();

												_$_.append(__anchor, p_2);
											},
											true
										);
									};

									var switch_case_default_1 = (__anchor) => {
										_$_.try(
											__anchor,
											(__anchor) => {
												var p_3 = root_10();

												{
													var expression_3 = _$_.child(p_3, true);

													_$_.pop(p_3);
												}

												_$_.render(
													(__prev) => {
														var __a = `B:${_$_.get(pattern_1).label}`;

														if (__prev.a !== __a) {
															_$_.set_text(expression_3, __prev.a = __a);
														}

														var __b = `item item-${_$_.get(pattern_1).id}`;

														if (__prev.b !== __b) {
															_$_.set_class(p_3, __prev.b = __b, void 0, true);
														}
													},
													{ a: ' ', b: Symbol() }
												);

												_$_.append(__anchor, p_3);
											},
											null,
											(__anchor) => {
												var p_4 = root_11();

												_$_.append(__anchor, p_4);
											},
											true
										);
									};

									_$_.switch(
										__anchor,
										() => {
											var result = [];

											switch (lazy_1.value) {
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
							},
							4,
							(pattern_1) => _$_.get(pattern_1).id
						);

						_$_.pop(div_5);
					}

					_$_.append(__anchor, div_5);
				};

				_$_.if(node, (__render) => {
					if (lazy.value) __render(consequent_1);
				});
			}

			_$_.append(__anchor, fragment_1);
		}));

		_$_.append(__anchor, fragment);
	});
}

export function MixedControlFlowAsyncPending() {
	return _$_.tsrx_element((__anchor, __block) => {
		const rows = [1, 2];
		const state = 'slow';
		var fragment_2 = root_12();
		var node_3 = _$_.first_child_frag(fragment_2);

		_$_.expression(node_3, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_3 = root_13();
			var div_6 = _$_.first_child_frag(fragment_3);
			var node_2 = _$_.sibling(div_6);

			_$_.for(
				node_2,
				() => rows,
				(__anchor, row) => {
					{
						var consequent_2 = (__anchor) => {
							{
								var switch_case_0_2 = (__anchor) => {
									_$_.try(
										__anchor,
										(__anchor) => {
											_$_.render_component(AsyncRow, __anchor, { label: `row-${row}` });
										},
										null,
										(__anchor) => {
											var div_7 = root_14();

											_$_.set_class(div_7, `pending-row pending-row-${row}`, void 0, true);

											{
												var expression_4 = _$_.child(div_7, true);

												expression_4.nodeValue = `pending ${row}`;
												_$_.pop(div_7);
											}

											_$_.append(__anchor, div_7);
										},
										true
									);
								};

								var switch_case_default_2 = (__anchor) => {
									var div_8 = root_15();

									_$_.append(__anchor, div_8);
								};

								_$_.switch(
									__anchor,
									() => {
										var result = [];

										switch (state) {
											case 'slow':
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

						_$_.if(
							__anchor,
							(__render) => {
								if (row === 1) __render(consequent_2);
							},
							true
						);
					}
				},
				0
			);

			_$_.append(__anchor, fragment_3);
		}));

		_$_.append(__anchor, fragment_2);
	});
}

function AsyncRow({ label }) {
	return _$_.tsrx_element((__anchor, __block) => {
		let lazy_3 = _$_.track_async(() => _$_.with_scope(__block, () => Promise.resolve(label)), __block, '10cc79a0');
		var div_9 = root_16();

		{
			var expression_5 = _$_.child(div_9);

			_$_.expression(expression_5, () => lazy_3.value);
			_$_.pop(div_9);
		}

		_$_.append(__anchor, div_9);
	});
}

_$_.delegate(['click']);