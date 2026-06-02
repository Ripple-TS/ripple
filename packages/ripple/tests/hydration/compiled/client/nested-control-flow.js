// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_2 = _$_.template(`<li> </li>`, 1, 1);
var root_1 = _$_.template(`<!>`, 1, 1);
var root = _$_.template(`<ul class="for-if"></ul>`, 0);
var root_5 = _$_.template(`<li> </li>`, 1, 1);
var root_6 = _$_.template(`<li> </li>`, 1, 1);
var root_4 = _$_.template(`<!>`, 1, 1);
var root_3 = _$_.template(`<ul class="for-switch"></ul>`, 0);
var root_9 = _$_.template(`<p class="case-a">Case A</p>`, 1, 1);
var root_10 = _$_.template(`<p class="case-default">Default</p>`, 1, 1);
var root_8 = _$_.template(`<!>`, 1, 1);
var root_7 = _$_.template(`<div class="if-switch"><!></div>`, 0);
var root_13 = _$_.template(`<p class="case-a">Case A</p>`, 1, 1);
var root_14 = _$_.template(`<p class="case-default">Default</p>`, 1, 1);
var root_12 = _$_.template(`<!>`, 1, 1);
var root_11 = _$_.template(`<div class="if-switch-hidden"><!><p class="after">after</p></div>`, 0);
var root_18 = _$_.template(`<li> </li>`, 1, 1);
var root_19 = _$_.template(`<li> </li>`, 1, 1);
var root_17 = _$_.template(`<!>`, 1, 1);
var root_16 = _$_.template(`<!>`, 1, 1);
var root_15 = _$_.template(`<ul class="for-if-switch-single"></ul>`, 0);
var root_23 = _$_.template(`<li> </li>`, 1, 1);
var root_24 = _$_.template(`<li> </li>`, 1, 1);
var root_22 = _$_.template(`<!>`, 1, 1);
var root_21 = _$_.template(`<!>`, 1, 1);
var root_20 = _$_.template(`<ul class="for-if-switch-multi"></ul>`, 0);
var root_28 = _$_.template(`<li> </li>`, 1, 1);
var root_29 = _$_.template(`<li> </li>`, 1, 1);
var root_27 = _$_.template(`<!>`, 1, 1);
var root_26 = _$_.template(`<!>`, 1, 1);
var root_25 = _$_.template(`<ul class="for-if-switch-disabled"></ul>`, 0);
var root_32 = _$_.template(`<p class="resolved-a">A resolved</p>`, 1, 1);
var root_33 = _$_.template(`<p class="pending-a">A pending</p>`, 1, 1);
var root_31 = _$_.template(`<!>`, 1, 1);
var root_34 = _$_.template(`<p class="default">Default</p>`, 1, 1);
var root_30 = _$_.template(`<div class="switch-try"><!></div>`, 0);
var root_38 = _$_.template(`<li> </li>`, 1, 1);
var root_39 = _$_.template(`<li> </li>`, 1, 1);
var root_37 = _$_.template(`<!>`, 1, 1);
var root_41 = _$_.template(`<li> </li>`, 1, 1);
var root_42 = _$_.template(`<li> </li>`, 1, 1);
var root_40 = _$_.template(`<!>`, 1, 1);
var root_36 = _$_.template(`<!>`, 1, 1);
var root_35 = _$_.template(`<ul class="for-switch-try"></ul>`, 0);
var root_46 = _$_.template(`<li> </li>`, 1, 1);
var root_47 = _$_.template(`<li> </li>`, 1, 1);
var root_45 = _$_.template(`<!>`, 1, 1);
var root_44 = _$_.template(`<!>`, 1, 1);
var root_43 = _$_.template(`<ul class="for-if-try"></ul>`, 0);
var root_52 = _$_.template(`<li> </li>`, 1, 1);
var root_53 = _$_.template(`<li> </li>`, 1, 1);
var root_51 = _$_.template(`<!>`, 1, 1);
var root_55 = _$_.template(`<li> </li>`, 1, 1);
var root_56 = _$_.template(`<li> </li>`, 1, 1);
var root_54 = _$_.template(`<!>`, 1, 1);
var root_50 = _$_.template(`<!>`, 1, 1);
var root_49 = _$_.template(`<!>`, 1, 1);
var root_48 = _$_.template(`<ul class="for-if-switch-try-single"></ul>`, 0);
var root_61 = _$_.template(`<li> </li>`, 1, 1);
var root_62 = _$_.template(`<li> </li>`, 1, 1);
var root_60 = _$_.template(`<!>`, 1, 1);
var root_64 = _$_.template(`<li> </li>`, 1, 1);
var root_65 = _$_.template(`<li> </li>`, 1, 1);
var root_63 = _$_.template(`<!>`, 1, 1);
var root_59 = _$_.template(`<!>`, 1, 1);
var root_58 = _$_.template(`<!>`, 1, 1);
var root_57 = _$_.template(`<ul class="for-if-switch-try-multi"></ul>`, 0);

export function ForIf() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [
			{ id: 1, show: true, label: 'One' },
			{ id: 2, show: true, label: 'Two' },
			{ id: 3, show: false, label: 'Three' }
		];

		var ul_1 = root();

		{
			_$_.for_keyed(
				ul_1,
				() => items,
				(__anchor, pattern) => {
					var fragment = root_1();
					var node = _$_.first_child_frag(fragment);

					{
						var consequent = (__anchor) => {
							var return_guard = false;
							var fragment_1 = root_2();
							var li_1 = _$_.first_child_frag(fragment_1);

							{
								var expression = _$_.child(li_1);

								_$_.expression(expression, () => _$_.get(pattern).label);
								_$_.pop(li_1);
							}

							return_guard = true;

							_$_.render(() => {
								_$_.set_class(li_1, `item item-${_$_.get(pattern).id}`, void 0, true);
							});

							_$_.append(__anchor, fragment_1);
						};

						_$_.if(node, (__render) => {
							if (_$_.get(pattern).show) __render(consequent);
						});
					}

					_$_.append(__anchor, fragment);
				},
				4,
				(pattern) => _$_.get(pattern).id
			);

			_$_.pop(ul_1);
		}

		_$_.append(__anchor, ul_1);
	});
}

export function ForSwitch() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [
			{ id: 1, kind: 'a' },
			{ id: 2, kind: 'b' },
			{ id: 3, kind: 'a' }
		];

		var ul_2 = root_3();

		{
			_$_.for_keyed(
				ul_2,
				() => items,
				(__anchor, pattern_1) => {
					var fragment_2 = root_4();
					var node_1 = _$_.first_child_frag(fragment_2);

					{
						var switch_case_0 = (__anchor) => {
							var return_guard = false;
							var fragment_3 = root_5();
							var li_2 = _$_.first_child_frag(fragment_3);

							{
								var expression_1 = _$_.child(li_2, true);

								_$_.pop(li_2);
							}

							return_guard = true;

							_$_.render(
								(__prev) => {
									var __a = `A-${_$_.get(pattern_1).id}`;

									if (__prev.a !== __a) {
										_$_.set_text(expression_1, __prev.a = __a);
									}

									var __b = `item item-${_$_.get(pattern_1).id} kind-a`;

									if (__prev.b !== __b) {
										_$_.set_class(li_2, __prev.b = __b, void 0, true);
									}
								},
								{ a: ' ', b: Symbol() }
							);

							_$_.append(__anchor, fragment_3);
						};

						var switch_case_default = (__anchor) => {
							var return_guard_1 = false;
							var fragment_4 = root_6();
							var li_3 = _$_.first_child_frag(fragment_4);

							{
								var expression_2 = _$_.child(li_3, true);

								_$_.pop(li_3);
							}

							return_guard_1 = true;

							_$_.render(
								(__prev) => {
									var __a = `B-${_$_.get(pattern_1).id}`;

									if (__prev.a !== __a) {
										_$_.set_text(expression_2, __prev.a = __a);
									}

									var __b = `item item-${_$_.get(pattern_1).id} kind-b`;

									if (__prev.b !== __b) {
										_$_.set_class(li_3, __prev.b = __b, void 0, true);
									}
								},
								{ a: ' ', b: Symbol() }
							);

							_$_.append(__anchor, fragment_4);
						};

						_$_.switch(node_1, () => {
							var result = [];

							switch (_$_.get(pattern_1).kind) {
								case 'a':
									result.push(switch_case_0);
									return result;

								default:
									result.push(switch_case_default);
									return result;
							}
						});
					}

					_$_.append(__anchor, fragment_2);
				},
				4,
				(pattern_1) => _$_.get(pattern_1).id
			);

			_$_.pop(ul_2);
		}

		_$_.append(__anchor, ul_2);
	});
}

export function IfSwitch() {
	return _$_.tsrx_element((__anchor, __block) => {
		const show = true;
		const kind = 'a';
		var div_1 = root_7();

		{
			var node_2 = _$_.child(div_1);

			{
				var consequent_1 = (__anchor) => {
					var fragment_5 = root_8();
					var node_3 = _$_.first_child_frag(fragment_5);

					{
						var switch_case_0_1 = (__anchor) => {
							var return_guard = false;
							var fragment_6 = root_9();

							return_guard = true;
							_$_.append(__anchor, fragment_6);
						};

						var switch_case_default_1 = (__anchor) => {
							var return_guard_1 = false;
							var fragment_7 = root_10();

							return_guard_1 = true;
							_$_.append(__anchor, fragment_7);
						};

						_$_.switch(node_3, () => {
							var result = [];

							switch (kind) {
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
				};

				_$_.if(node_2, (__render) => {
					if (show) __render(consequent_1);
				});
			}

			_$_.pop(div_1);
		}

		_$_.append(__anchor, div_1);
	});
}

export function IfSwitchHidden() {
	return _$_.tsrx_element((__anchor, __block) => {
		const show = false;
		const kind = 'a';
		var div_2 = root_11();

		{
			var node_4 = _$_.child(div_2);

			{
				var consequent_2 = (__anchor) => {
					var fragment_8 = root_12();
					var node_5 = _$_.first_child_frag(fragment_8);

					{
						var switch_case_0_2 = (__anchor) => {
							var return_guard = false;
							var fragment_9 = root_13();

							return_guard = true;
							_$_.append(__anchor, fragment_9);
						};

						var switch_case_default_2 = (__anchor) => {
							var return_guard_1 = false;
							var fragment_10 = root_14();

							return_guard_1 = true;
							_$_.append(__anchor, fragment_10);
						};

						_$_.switch(node_5, () => {
							var result = [];

							switch (kind) {
								case 'a':
									result.push(switch_case_0_2);
									return result;

								default:
									result.push(switch_case_default_2);
									return result;
							}
						});
					}

					_$_.append(__anchor, fragment_8);
				};

				_$_.if(node_4, (__render) => {
					if (show) __render(consequent_2);
				});
			}

			_$_.pop(div_2);
		}

		_$_.append(__anchor, div_2);
	});
}

export function ForIfSwitchSingle() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [{ id: 1, kind: 'a', show: true }];
		var ul_3 = root_15();

		{
			_$_.for_keyed(
				ul_3,
				() => items,
				(__anchor, pattern_2) => {
					var fragment_11 = root_16();
					var node_6 = _$_.first_child_frag(fragment_11);

					{
						var consequent_3 = (__anchor) => {
							var fragment_12 = root_17();
							var node_7 = _$_.first_child_frag(fragment_12);

							{
								var switch_case_0_3 = (__anchor) => {
									var return_guard = false;
									var fragment_13 = root_18();
									var li_4 = _$_.first_child_frag(fragment_13);

									{
										var expression_3 = _$_.child(li_4, true);

										_$_.pop(li_4);
									}

									return_guard = true;

									_$_.render(
										(__prev) => {
											var __a = `A-${_$_.get(pattern_2).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_3, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_2).id} kind-a`;

											if (__prev.b !== __b) {
												_$_.set_class(li_4, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_13);
								};

								var switch_case_default_3 = (__anchor) => {
									var return_guard_1 = false;
									var fragment_14 = root_19();
									var li_5 = _$_.first_child_frag(fragment_14);

									{
										var expression_4 = _$_.child(li_5, true);

										_$_.pop(li_5);
									}

									return_guard_1 = true;

									_$_.render(
										(__prev) => {
											var __a = `D-${_$_.get(pattern_2).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_4, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_2).id} kind-default`;

											if (__prev.b !== __b) {
												_$_.set_class(li_5, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_14);
								};

								_$_.switch(node_7, () => {
									var result = [];

									switch (_$_.get(pattern_2).kind) {
										case 'a':
											result.push(switch_case_0_3);
											return result;

										default:
											result.push(switch_case_default_3);
											return result;
									}
								});
							}

							_$_.append(__anchor, fragment_12);
						};

						_$_.if(node_6, (__render) => {
							if (_$_.get(pattern_2).show) __render(consequent_3);
						});
					}

					_$_.append(__anchor, fragment_11);
				},
				4,
				(pattern_2) => _$_.get(pattern_2).id
			);

			_$_.pop(ul_3);
		}

		_$_.append(__anchor, ul_3);
	});
}

export function ForIfSwitchMulti() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [
			{ id: 1, kind: 'a', show: true },
			{ id: 2, kind: 'b', show: true }
		];

		var ul_4 = root_20();

		{
			_$_.for_keyed(
				ul_4,
				() => items,
				(__anchor, pattern_3) => {
					var fragment_15 = root_21();
					var node_8 = _$_.first_child_frag(fragment_15);

					{
						var consequent_4 = (__anchor) => {
							var fragment_16 = root_22();
							var node_9 = _$_.first_child_frag(fragment_16);

							{
								var switch_case_0_4 = (__anchor) => {
									var return_guard = false;
									var fragment_17 = root_23();
									var li_6 = _$_.first_child_frag(fragment_17);

									{
										var expression_5 = _$_.child(li_6, true);

										_$_.pop(li_6);
									}

									return_guard = true;

									_$_.render(
										(__prev) => {
											var __a = `A-${_$_.get(pattern_3).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_5, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_3).id} kind-a`;

											if (__prev.b !== __b) {
												_$_.set_class(li_6, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_17);
								};

								var switch_case_default_4 = (__anchor) => {
									var return_guard_1 = false;
									var fragment_18 = root_24();
									var li_7 = _$_.first_child_frag(fragment_18);

									{
										var expression_6 = _$_.child(li_7, true);

										_$_.pop(li_7);
									}

									return_guard_1 = true;

									_$_.render(
										(__prev) => {
											var __a = `B-${_$_.get(pattern_3).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_6, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_3).id} kind-b`;

											if (__prev.b !== __b) {
												_$_.set_class(li_7, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_18);
								};

								_$_.switch(node_9, () => {
									var result = [];

									switch (_$_.get(pattern_3).kind) {
										case 'a':
											result.push(switch_case_0_4);
											return result;

										default:
											result.push(switch_case_default_4);
											return result;
									}
								});
							}

							_$_.append(__anchor, fragment_16);
						};

						_$_.if(node_8, (__render) => {
							if (_$_.get(pattern_3).show) __render(consequent_4);
						});
					}

					_$_.append(__anchor, fragment_15);
				},
				4,
				(pattern_3) => _$_.get(pattern_3).id
			);

			_$_.pop(ul_4);
		}

		_$_.append(__anchor, ul_4);
	});
}

export function ForIfSwitchWithDisabled() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [
			{ id: 1, kind: 'a', show: true },
			{ id: 2, kind: 'b', show: false },
			{ id: 3, kind: 'a', show: true }
		];

		var ul_5 = root_25();

		{
			_$_.for_keyed(
				ul_5,
				() => items,
				(__anchor, pattern_4) => {
					var fragment_19 = root_26();
					var node_10 = _$_.first_child_frag(fragment_19);

					{
						var consequent_5 = (__anchor) => {
							var fragment_20 = root_27();
							var node_11 = _$_.first_child_frag(fragment_20);

							{
								var switch_case_0_5 = (__anchor) => {
									var return_guard = false;
									var fragment_21 = root_28();
									var li_8 = _$_.first_child_frag(fragment_21);

									{
										var expression_7 = _$_.child(li_8, true);

										_$_.pop(li_8);
									}

									return_guard = true;

									_$_.render(
										(__prev) => {
											var __a = `A-${_$_.get(pattern_4).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_7, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_4).id} kind-a`;

											if (__prev.b !== __b) {
												_$_.set_class(li_8, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_21);
								};

								var switch_case_default_5 = (__anchor) => {
									var return_guard_1 = false;
									var fragment_22 = root_29();
									var li_9 = _$_.first_child_frag(fragment_22);

									{
										var expression_8 = _$_.child(li_9, true);

										_$_.pop(li_9);
									}

									return_guard_1 = true;

									_$_.render(
										(__prev) => {
											var __a = `B-${_$_.get(pattern_4).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_8, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_4).id} kind-b`;

											if (__prev.b !== __b) {
												_$_.set_class(li_9, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_22);
								};

								_$_.switch(node_11, () => {
									var result = [];

									switch (_$_.get(pattern_4).kind) {
										case 'a':
											result.push(switch_case_0_5);
											return result;

										default:
											result.push(switch_case_default_5);
											return result;
									}
								});
							}

							_$_.append(__anchor, fragment_20);
						};

						_$_.if(node_10, (__render) => {
							if (_$_.get(pattern_4).show) __render(consequent_5);
						});
					}

					_$_.append(__anchor, fragment_19);
				},
				4,
				(pattern_4) => _$_.get(pattern_4).id
			);

			_$_.pop(ul_5);
		}

		_$_.append(__anchor, ul_5);
	});
}

export function SwitchTry() {
	return _$_.tsrx_element((__anchor, __block) => {
		const kind = 'a';
		var div_3 = root_30();

		{
			var node_12 = _$_.child(div_3);

			{
				var switch_case_0_6 = (__anchor) => {
					var fragment_23 = root_31();
					var node_13 = _$_.first_child_frag(fragment_23);

					_$_.try(
						node_13,
						(__anchor) => {
							var return_guard = false;
							var fragment_24 = root_32();

							return_guard = true;
							_$_.append(__anchor, fragment_24);
						},
						null,
						(__anchor) => {
							var return_guard_1 = false;
							var fragment_25 = root_33();

							return_guard_1 = true;
							_$_.append(__anchor, fragment_25);
						}
					);

					_$_.append(__anchor, fragment_23);
				};

				var switch_case_default_6 = (__anchor) => {
					var return_guard_2 = false;
					var fragment_26 = root_34();

					return_guard_2 = true;
					_$_.append(__anchor, fragment_26);
				};

				_$_.switch(node_12, () => {
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

			_$_.pop(div_3);
		}

		_$_.append(__anchor, div_3);
	});
}

export function ForSwitchTry() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [{ id: 1, kind: 'a' }, { id: 2, kind: 'b' }];
		var ul_6 = root_35();

		{
			_$_.for_keyed(
				ul_6,
				() => items,
				(__anchor, pattern_5) => {
					var fragment_27 = root_36();
					var node_14 = _$_.first_child_frag(fragment_27);

					{
						var switch_case_0_7 = (__anchor) => {
							var fragment_28 = root_37();
							var node_15 = _$_.first_child_frag(fragment_28);

							_$_.try(
								node_15,
								(__anchor) => {
									var return_guard = false;
									var fragment_29 = root_38();
									var li_10 = _$_.first_child_frag(fragment_29);

									{
										var expression_9 = _$_.child(li_10, true);

										_$_.pop(li_10);
									}

									return_guard = true;

									_$_.render(
										(__prev) => {
											var __a = `A-${_$_.get(pattern_5).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_9, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_5).id} kind-a`;

											if (__prev.b !== __b) {
												_$_.set_class(li_10, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_29);
								},
								null,
								(__anchor) => {
									var return_guard_1 = false;
									var fragment_30 = root_39();
									var li_11 = _$_.first_child_frag(fragment_30);

									{
										var expression_10 = _$_.child(li_11, true);

										_$_.pop(li_11);
									}

									return_guard_1 = true;

									_$_.render(
										(__prev) => {
											var __a = `pending ${_$_.get(pattern_5).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_10, __prev.a = __a);
											}

											var __b = `pending pending-${_$_.get(pattern_5).id}`;

											if (__prev.b !== __b) {
												_$_.set_class(li_11, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_30);
								}
							);

							_$_.append(__anchor, fragment_28);
						};

						var switch_case_default_7 = (__anchor) => {
							var fragment_31 = root_40();
							var node_16 = _$_.first_child_frag(fragment_31);

							_$_.try(
								node_16,
								(__anchor) => {
									var return_guard_2 = false;
									var fragment_32 = root_41();
									var li_12 = _$_.first_child_frag(fragment_32);

									{
										var expression_11 = _$_.child(li_12, true);

										_$_.pop(li_12);
									}

									return_guard_2 = true;

									_$_.render(
										(__prev) => {
											var __a = `B-${_$_.get(pattern_5).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_11, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_5).id} kind-b`;

											if (__prev.b !== __b) {
												_$_.set_class(li_12, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_32);
								},
								null,
								(__anchor) => {
									var return_guard_3 = false;
									var fragment_33 = root_42();
									var li_13 = _$_.first_child_frag(fragment_33);

									{
										var expression_12 = _$_.child(li_13, true);

										_$_.pop(li_13);
									}

									return_guard_3 = true;

									_$_.render(
										(__prev) => {
											var __a = `pending ${_$_.get(pattern_5).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_12, __prev.a = __a);
											}

											var __b = `pending pending-${_$_.get(pattern_5).id}`;

											if (__prev.b !== __b) {
												_$_.set_class(li_13, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_33);
								}
							);

							_$_.append(__anchor, fragment_31);
						};

						_$_.switch(node_14, () => {
							var result = [];

							switch (_$_.get(pattern_5).kind) {
								case 'a':
									result.push(switch_case_0_7);
									return result;

								default:
									result.push(switch_case_default_7);
									return result;
							}
						});
					}

					_$_.append(__anchor, fragment_27);
				},
				4,
				(pattern_5) => _$_.get(pattern_5).id
			);

			_$_.pop(ul_6);
		}

		_$_.append(__anchor, ul_6);
	});
}

export function ForIfTry() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [{ id: 1, show: true }, { id: 2, show: true }];
		var ul_7 = root_43();

		{
			_$_.for_keyed(
				ul_7,
				() => items,
				(__anchor, pattern_6) => {
					var fragment_34 = root_44();
					var node_17 = _$_.first_child_frag(fragment_34);

					{
						var consequent_6 = (__anchor) => {
							var fragment_35 = root_45();
							var node_18 = _$_.first_child_frag(fragment_35);

							_$_.try(
								node_18,
								(__anchor) => {
									var return_guard = false;
									var fragment_36 = root_46();
									var li_14 = _$_.first_child_frag(fragment_36);

									{
										var expression_13 = _$_.child(li_14, true);

										_$_.pop(li_14);
									}

									return_guard = true;

									_$_.render(
										(__prev) => {
											var __a = `item-${_$_.get(pattern_6).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_13, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_6).id}`;

											if (__prev.b !== __b) {
												_$_.set_class(li_14, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_36);
								},
								null,
								(__anchor) => {
									var return_guard_1 = false;
									var fragment_37 = root_47();
									var li_15 = _$_.first_child_frag(fragment_37);

									{
										var expression_14 = _$_.child(li_15, true);

										_$_.pop(li_15);
									}

									return_guard_1 = true;

									_$_.render(
										(__prev) => {
											var __a = `pending ${_$_.get(pattern_6).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(expression_14, __prev.a = __a);
											}

											var __b = `pending pending-${_$_.get(pattern_6).id}`;

											if (__prev.b !== __b) {
												_$_.set_class(li_15, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, fragment_37);
								}
							);

							_$_.append(__anchor, fragment_35);
						};

						_$_.if(node_17, (__render) => {
							if (_$_.get(pattern_6).show) __render(consequent_6);
						});
					}

					_$_.append(__anchor, fragment_34);
				},
				4,
				(pattern_6) => _$_.get(pattern_6).id
			);

			_$_.pop(ul_7);
		}

		_$_.append(__anchor, ul_7);
	});
}

export function ForIfSwitchTrySingle() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [{ id: 1, kind: 'a', show: true }];
		var ul_8 = root_48();

		{
			_$_.for_keyed(
				ul_8,
				() => items,
				(__anchor, pattern_7) => {
					var fragment_38 = root_49();
					var node_19 = _$_.first_child_frag(fragment_38);

					{
						var consequent_7 = (__anchor) => {
							var fragment_39 = root_50();
							var node_20 = _$_.first_child_frag(fragment_39);

							{
								var switch_case_0_8 = (__anchor) => {
									var fragment_40 = root_51();
									var node_21 = _$_.first_child_frag(fragment_40);

									_$_.try(
										node_21,
										(__anchor) => {
											var return_guard = false;
											var fragment_41 = root_52();
											var li_16 = _$_.first_child_frag(fragment_41);

											{
												var expression_15 = _$_.child(li_16, true);

												_$_.pop(li_16);
											}

											return_guard = true;

											_$_.render(
												(__prev) => {
													var __a = `A-${_$_.get(pattern_7).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(expression_15, __prev.a = __a);
													}

													var __b = `item item-${_$_.get(pattern_7).id} kind-a`;

													if (__prev.b !== __b) {
														_$_.set_class(li_16, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, fragment_41);
										},
										null,
										(__anchor) => {
											var return_guard_1 = false;
											var fragment_42 = root_53();
											var li_17 = _$_.first_child_frag(fragment_42);

											{
												var expression_16 = _$_.child(li_17, true);

												_$_.pop(li_17);
											}

											return_guard_1 = true;

											_$_.render(
												(__prev) => {
													var __a = `pending ${_$_.get(pattern_7).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(expression_16, __prev.a = __a);
													}

													var __b = `pending pending-${_$_.get(pattern_7).id}`;

													if (__prev.b !== __b) {
														_$_.set_class(li_17, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, fragment_42);
										}
									);

									_$_.append(__anchor, fragment_40);
								};

								var switch_case_default_8 = (__anchor) => {
									var fragment_43 = root_54();
									var node_22 = _$_.first_child_frag(fragment_43);

									_$_.try(
										node_22,
										(__anchor) => {
											var return_guard_2 = false;
											var fragment_44 = root_55();
											var li_18 = _$_.first_child_frag(fragment_44);

											{
												var expression_17 = _$_.child(li_18, true);

												_$_.pop(li_18);
											}

											return_guard_2 = true;

											_$_.render(
												(__prev) => {
													var __a = `D-${_$_.get(pattern_7).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(expression_17, __prev.a = __a);
													}

													var __b = `item item-${_$_.get(pattern_7).id} kind-default`;

													if (__prev.b !== __b) {
														_$_.set_class(li_18, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, fragment_44);
										},
										null,
										(__anchor) => {
											var return_guard_3 = false;
											var fragment_45 = root_56();
											var li_19 = _$_.first_child_frag(fragment_45);

											{
												var expression_18 = _$_.child(li_19, true);

												_$_.pop(li_19);
											}

											return_guard_3 = true;

											_$_.render(
												(__prev) => {
													var __a = `pending ${_$_.get(pattern_7).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(expression_18, __prev.a = __a);
													}

													var __b = `pending pending-${_$_.get(pattern_7).id}`;

													if (__prev.b !== __b) {
														_$_.set_class(li_19, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, fragment_45);
										}
									);

									_$_.append(__anchor, fragment_43);
								};

								_$_.switch(node_20, () => {
									var result = [];

									switch (_$_.get(pattern_7).kind) {
										case 'a':
											result.push(switch_case_0_8);
											return result;

										default:
											result.push(switch_case_default_8);
											return result;
									}
								});
							}

							_$_.append(__anchor, fragment_39);
						};

						_$_.if(node_19, (__render) => {
							if (_$_.get(pattern_7).show) __render(consequent_7);
						});
					}

					_$_.append(__anchor, fragment_38);
				},
				4,
				(pattern_7) => _$_.get(pattern_7).id
			);

			_$_.pop(ul_8);
		}

		_$_.append(__anchor, ul_8);
	});
}

export function ForIfSwitchTryMulti() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [
			{ id: 1, kind: 'a', show: true },
			{ id: 2, kind: 'b', show: true }
		];

		var ul_9 = root_57();

		{
			_$_.for_keyed(
				ul_9,
				() => items,
				(__anchor, pattern_8) => {
					var fragment_46 = root_58();
					var node_23 = _$_.first_child_frag(fragment_46);

					{
						var consequent_8 = (__anchor) => {
							var fragment_47 = root_59();
							var node_24 = _$_.first_child_frag(fragment_47);

							{
								var switch_case_0_9 = (__anchor) => {
									var fragment_48 = root_60();
									var node_25 = _$_.first_child_frag(fragment_48);

									_$_.try(
										node_25,
										(__anchor) => {
											var return_guard = false;
											var fragment_49 = root_61();
											var li_20 = _$_.first_child_frag(fragment_49);

											{
												var expression_19 = _$_.child(li_20, true);

												_$_.pop(li_20);
											}

											return_guard = true;

											_$_.render(
												(__prev) => {
													var __a = `A-${_$_.get(pattern_8).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(expression_19, __prev.a = __a);
													}

													var __b = `item item-${_$_.get(pattern_8).id} kind-a`;

													if (__prev.b !== __b) {
														_$_.set_class(li_20, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, fragment_49);
										},
										null,
										(__anchor) => {
											var return_guard_1 = false;
											var fragment_50 = root_62();
											var li_21 = _$_.first_child_frag(fragment_50);

											{
												var expression_20 = _$_.child(li_21, true);

												_$_.pop(li_21);
											}

											return_guard_1 = true;

											_$_.render(
												(__prev) => {
													var __a = `pending ${_$_.get(pattern_8).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(expression_20, __prev.a = __a);
													}

													var __b = `pending pending-${_$_.get(pattern_8).id}`;

													if (__prev.b !== __b) {
														_$_.set_class(li_21, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, fragment_50);
										}
									);

									_$_.append(__anchor, fragment_48);
								};

								var switch_case_default_9 = (__anchor) => {
									var fragment_51 = root_63();
									var node_26 = _$_.first_child_frag(fragment_51);

									_$_.try(
										node_26,
										(__anchor) => {
											var return_guard_2 = false;
											var fragment_52 = root_64();
											var li_22 = _$_.first_child_frag(fragment_52);

											{
												var expression_21 = _$_.child(li_22, true);

												_$_.pop(li_22);
											}

											return_guard_2 = true;

											_$_.render(
												(__prev) => {
													var __a = `B-${_$_.get(pattern_8).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(expression_21, __prev.a = __a);
													}

													var __b = `item item-${_$_.get(pattern_8).id} kind-b`;

													if (__prev.b !== __b) {
														_$_.set_class(li_22, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, fragment_52);
										},
										null,
										(__anchor) => {
											var return_guard_3 = false;
											var fragment_53 = root_65();
											var li_23 = _$_.first_child_frag(fragment_53);

											{
												var expression_22 = _$_.child(li_23, true);

												_$_.pop(li_23);
											}

											return_guard_3 = true;

											_$_.render(
												(__prev) => {
													var __a = `pending ${_$_.get(pattern_8).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(expression_22, __prev.a = __a);
													}

													var __b = `pending pending-${_$_.get(pattern_8).id}`;

													if (__prev.b !== __b) {
														_$_.set_class(li_23, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, fragment_53);
										}
									);

									_$_.append(__anchor, fragment_51);
								};

								_$_.switch(node_24, () => {
									var result = [];

									switch (_$_.get(pattern_8).kind) {
										case 'a':
											result.push(switch_case_0_9);
											return result;

										default:
											result.push(switch_case_default_9);
											return result;
									}
								});
							}

							_$_.append(__anchor, fragment_47);
						};

						_$_.if(node_23, (__render) => {
							if (_$_.get(pattern_8).show) __render(consequent_8);
						});
					}

					_$_.append(__anchor, fragment_46);
				},
				4,
				(pattern_8) => _$_.get(pattern_8).id
			);

			_$_.pop(ul_9);
		}

		_$_.append(__anchor, ul_9);
	});
}