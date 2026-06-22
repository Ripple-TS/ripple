// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_1 = _$_.template(`<li> </li>`, 0);
var root = _$_.template(`<ul class="for-if"></ul>`, 0);
var root_3 = _$_.template(`<li> </li>`, 0);
var root_4 = _$_.template(`<li> </li>`, 0);
var root_2 = _$_.template(`<ul class="for-switch"></ul>`, 0);
var root_6 = _$_.template(`<p class="case-a">Case A</p>`, 0);
var root_7 = _$_.template(`<p class="case-default">Default</p>`, 0);
var root_5 = _$_.template(`<div class="if-switch"><!></div>`, 0);
var root_9 = _$_.template(`<p class="case-a">Case A</p>`, 0);
var root_10 = _$_.template(`<p class="case-default">Default</p>`, 0);
var root_8 = _$_.template(`<div class="if-switch-hidden"><!><p class="after">after</p></div>`, 0);
var root_12 = _$_.template(`<li> </li>`, 0);
var root_13 = _$_.template(`<li> </li>`, 0);
var root_11 = _$_.template(`<ul class="for-if-switch-single"></ul>`, 0);
var root_15 = _$_.template(`<li> </li>`, 0);
var root_16 = _$_.template(`<li> </li>`, 0);
var root_14 = _$_.template(`<ul class="for-if-switch-multi"></ul>`, 0);
var root_18 = _$_.template(`<li> </li>`, 0);
var root_19 = _$_.template(`<li> </li>`, 0);
var root_17 = _$_.template(`<ul class="for-if-switch-disabled"></ul>`, 0);
var root_21 = _$_.template(`<p class="resolved-a">A resolved</p>`, 0);
var root_22 = _$_.template(`<p class="pending-a">A pending</p>`, 0);
var root_23 = _$_.template(`<p class="default">Default</p>`, 0);
var root_20 = _$_.template(`<div class="switch-try"><!></div>`, 0);
var root_25 = _$_.template(`<li> </li>`, 0);
var root_26 = _$_.template(`<li> </li>`, 0);
var root_27 = _$_.template(`<li> </li>`, 0);
var root_28 = _$_.template(`<li> </li>`, 0);
var root_24 = _$_.template(`<ul class="for-switch-try"></ul>`, 0);
var root_30 = _$_.template(`<li> </li>`, 0);
var root_31 = _$_.template(`<li> </li>`, 0);
var root_29 = _$_.template(`<ul class="for-if-try"></ul>`, 0);
var root_33 = _$_.template(`<li> </li>`, 0);
var root_34 = _$_.template(`<li> </li>`, 0);
var root_35 = _$_.template(`<li> </li>`, 0);
var root_36 = _$_.template(`<li> </li>`, 0);
var root_32 = _$_.template(`<ul class="for-if-switch-try-single"></ul>`, 0);
var root_38 = _$_.template(`<li> </li>`, 0);
var root_39 = _$_.template(`<li> </li>`, 0);
var root_40 = _$_.template(`<li> </li>`, 0);
var root_41 = _$_.template(`<li> </li>`, 0);
var root_37 = _$_.template(`<ul class="for-if-switch-try-multi"></ul>`, 0);

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
					{
						var consequent = (__anchor) => {
							var li_1 = root_1();

							{
								var expression = _$_.child(li_1);

								_$_.expression(expression, () => _$_.get(pattern).label);
								_$_.pop(li_1);
							}

							_$_.render(() => {
								_$_.set_class(li_1, `item item-${_$_.get(pattern).id}`, void 0, true);
							});

							_$_.append(__anchor, li_1);
						};

						_$_.if(
							__anchor,
							(__render) => {
								if (_$_.get(pattern).show) __render(consequent);
							},
							true
						);
					}
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

		var ul_2 = root_2();

		{
			_$_.for_keyed(
				ul_2,
				() => items,
				(__anchor, pattern_1) => {
					{
						var switch_case_0 = (__anchor) => {
							var li_2 = root_3();

							{
								var expression_1 = _$_.child(li_2, true);

								_$_.pop(li_2);
							}

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

							_$_.append(__anchor, li_2);
						};

						var switch_case_default = (__anchor) => {
							var li_3 = root_4();

							{
								var expression_2 = _$_.child(li_3, true);

								_$_.pop(li_3);
							}

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

							_$_.append(__anchor, li_3);
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

			_$_.pop(ul_2);
		}

		_$_.append(__anchor, ul_2);
	});
}

export function IfSwitch() {
	return _$_.tsrx_element((__anchor, __block) => {
		const show = true;
		const kind = 'a';
		var div_1 = root_5();

		{
			var node = _$_.child(div_1);

			{
				var consequent_1 = (__anchor) => {
					{
						var switch_case_0_1 = (__anchor) => {
							var p_1 = root_6();

							_$_.append(__anchor, p_1);
						};

						var switch_case_default_1 = (__anchor) => {
							var p_2 = root_7();

							_$_.append(__anchor, p_2);
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

				_$_.if(node, (__render) => {
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
		var div_2 = root_8();

		{
			var node_1 = _$_.child(div_2);

			{
				var consequent_2 = (__anchor) => {
					{
						var switch_case_0_2 = (__anchor) => {
							var p_3 = root_9();

							_$_.append(__anchor, p_3);
						};

						var switch_case_default_2 = (__anchor) => {
							var p_4 = root_10();

							_$_.append(__anchor, p_4);
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

				_$_.if(node_1, (__render) => {
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
		var ul_3 = root_11();

		{
			_$_.for_keyed(
				ul_3,
				() => items,
				(__anchor, pattern_2) => {
					{
						var consequent_3 = (__anchor) => {
							{
								var switch_case_0_3 = (__anchor) => {
									var li_4 = root_12();

									{
										var expression_3 = _$_.child(li_4, true);

										_$_.pop(li_4);
									}

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

									_$_.append(__anchor, li_4);
								};

								var switch_case_default_3 = (__anchor) => {
									var li_5 = root_13();

									{
										var expression_4 = _$_.child(li_5, true);

										_$_.pop(li_5);
									}

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

									_$_.append(__anchor, li_5);
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
						};

						_$_.if(
							__anchor,
							(__render) => {
								if (_$_.get(pattern_2).show) __render(consequent_3);
							},
							true
						);
					}
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

		var ul_4 = root_14();

		{
			_$_.for_keyed(
				ul_4,
				() => items,
				(__anchor, pattern_3) => {
					{
						var consequent_4 = (__anchor) => {
							{
								var switch_case_0_4 = (__anchor) => {
									var li_6 = root_15();

									{
										var expression_5 = _$_.child(li_6, true);

										_$_.pop(li_6);
									}

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

									_$_.append(__anchor, li_6);
								};

								var switch_case_default_4 = (__anchor) => {
									var li_7 = root_16();

									{
										var expression_6 = _$_.child(li_7, true);

										_$_.pop(li_7);
									}

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

									_$_.append(__anchor, li_7);
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
						};

						_$_.if(
							__anchor,
							(__render) => {
								if (_$_.get(pattern_3).show) __render(consequent_4);
							},
							true
						);
					}
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

		var ul_5 = root_17();

		{
			_$_.for_keyed(
				ul_5,
				() => items,
				(__anchor, pattern_4) => {
					{
						var consequent_5 = (__anchor) => {
							{
								var switch_case_0_5 = (__anchor) => {
									var li_8 = root_18();

									{
										var expression_7 = _$_.child(li_8, true);

										_$_.pop(li_8);
									}

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

									_$_.append(__anchor, li_8);
								};

								var switch_case_default_5 = (__anchor) => {
									var li_9 = root_19();

									{
										var expression_8 = _$_.child(li_9, true);

										_$_.pop(li_9);
									}

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

									_$_.append(__anchor, li_9);
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
						};

						_$_.if(
							__anchor,
							(__render) => {
								if (_$_.get(pattern_4).show) __render(consequent_5);
							},
							true
						);
					}
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
		var div_3 = root_20();

		{
			var node_2 = _$_.child(div_3);

			{
				var switch_case_0_6 = (__anchor) => {
					_$_.try(
						__anchor,
						(__anchor) => {
							var p_5 = root_21();

							_$_.append(__anchor, p_5);
						},
						null,
						(__anchor) => {
							var p_6 = root_22();

							_$_.append(__anchor, p_6);
						},
						true
					);
				};

				var switch_case_default_6 = (__anchor) => {
					var p_7 = root_23();

					_$_.append(__anchor, p_7);
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

			_$_.pop(div_3);
		}

		_$_.append(__anchor, div_3);
	});
}

export function ForSwitchTry() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [{ id: 1, kind: 'a' }, { id: 2, kind: 'b' }];
		var ul_6 = root_24();

		{
			_$_.for_keyed(
				ul_6,
				() => items,
				(__anchor, pattern_5) => {
					{
						var switch_case_0_7 = (__anchor) => {
							_$_.try(
								__anchor,
								(__anchor) => {
									var li_10 = root_25();

									{
										var expression_9 = _$_.child(li_10, true);

										_$_.pop(li_10);
									}

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

									_$_.append(__anchor, li_10);
								},
								null,
								(__anchor) => {
									var li_11 = root_26();

									{
										var expression_10 = _$_.child(li_11, true);

										_$_.pop(li_11);
									}

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

									_$_.append(__anchor, li_11);
								},
								true
							);
						};

						var switch_case_default_7 = (__anchor) => {
							_$_.try(
								__anchor,
								(__anchor) => {
									var li_12 = root_27();

									{
										var expression_11 = _$_.child(li_12, true);

										_$_.pop(li_12);
									}

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

									_$_.append(__anchor, li_12);
								},
								null,
								(__anchor) => {
									var li_13 = root_28();

									{
										var expression_12 = _$_.child(li_13, true);

										_$_.pop(li_13);
									}

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

									_$_.append(__anchor, li_13);
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

			_$_.pop(ul_6);
		}

		_$_.append(__anchor, ul_6);
	});
}

export function ForIfTry() {
	return _$_.tsrx_element((__anchor, __block) => {
		const items = [{ id: 1, show: true }, { id: 2, show: true }];
		var ul_7 = root_29();

		{
			_$_.for_keyed(
				ul_7,
				() => items,
				(__anchor, pattern_6) => {
					{
						var consequent_6 = (__anchor) => {
							_$_.try(
								__anchor,
								(__anchor) => {
									var li_14 = root_30();

									{
										var expression_13 = _$_.child(li_14, true);

										_$_.pop(li_14);
									}

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

									_$_.append(__anchor, li_14);
								},
								null,
								(__anchor) => {
									var li_15 = root_31();

									{
										var expression_14 = _$_.child(li_15, true);

										_$_.pop(li_15);
									}

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

									_$_.append(__anchor, li_15);
								},
								true
							);
						};

						_$_.if(
							__anchor,
							(__render) => {
								if (_$_.get(pattern_6).show) __render(consequent_6);
							},
							true
						);
					}
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
		var ul_8 = root_32();

		{
			_$_.for_keyed(
				ul_8,
				() => items,
				(__anchor, pattern_7) => {
					{
						var consequent_7 = (__anchor) => {
							{
								var switch_case_0_8 = (__anchor) => {
									_$_.try(
										__anchor,
										(__anchor) => {
											var li_16 = root_33();

											{
												var expression_15 = _$_.child(li_16, true);

												_$_.pop(li_16);
											}

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

											_$_.append(__anchor, li_16);
										},
										null,
										(__anchor) => {
											var li_17 = root_34();

											{
												var expression_16 = _$_.child(li_17, true);

												_$_.pop(li_17);
											}

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

											_$_.append(__anchor, li_17);
										},
										true
									);
								};

								var switch_case_default_8 = (__anchor) => {
									_$_.try(
										__anchor,
										(__anchor) => {
											var li_18 = root_35();

											{
												var expression_17 = _$_.child(li_18, true);

												_$_.pop(li_18);
											}

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

											_$_.append(__anchor, li_18);
										},
										null,
										(__anchor) => {
											var li_19 = root_36();

											{
												var expression_18 = _$_.child(li_19, true);

												_$_.pop(li_19);
											}

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

											_$_.append(__anchor, li_19);
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
						};

						_$_.if(
							__anchor,
							(__render) => {
								if (_$_.get(pattern_7).show) __render(consequent_7);
							},
							true
						);
					}
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

		var ul_9 = root_37();

		{
			_$_.for_keyed(
				ul_9,
				() => items,
				(__anchor, pattern_8) => {
					{
						var consequent_8 = (__anchor) => {
							{
								var switch_case_0_9 = (__anchor) => {
									_$_.try(
										__anchor,
										(__anchor) => {
											var li_20 = root_38();

											{
												var expression_19 = _$_.child(li_20, true);

												_$_.pop(li_20);
											}

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

											_$_.append(__anchor, li_20);
										},
										null,
										(__anchor) => {
											var li_21 = root_39();

											{
												var expression_20 = _$_.child(li_21, true);

												_$_.pop(li_21);
											}

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

											_$_.append(__anchor, li_21);
										},
										true
									);
								};

								var switch_case_default_9 = (__anchor) => {
									_$_.try(
										__anchor,
										(__anchor) => {
											var li_22 = root_40();

											{
												var expression_21 = _$_.child(li_22, true);

												_$_.pop(li_22);
											}

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

											_$_.append(__anchor, li_22);
										},
										null,
										(__anchor) => {
											var li_23 = root_41();

											{
												var expression_22 = _$_.child(li_23, true);

												_$_.pop(li_23);
											}

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

											_$_.append(__anchor, li_23);
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
						};

						_$_.if(
							__anchor,
							(__render) => {
								if (_$_.get(pattern_8).show) __render(consequent_8);
							},
							true
						);
					}
				},
				4,
				(pattern_8) => _$_.get(pattern_8).id
			);

			_$_.pop(ul_9);
		}

		_$_.append(__anchor, ul_9);
	});
}