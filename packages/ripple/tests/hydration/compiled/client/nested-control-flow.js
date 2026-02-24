// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_2 = _$_.template(`<li> </li>`, 0);
var root_1 = _$_.template(`<!>`, 1, 1);
var root = _$_.template(`<ul class="for-if"></ul>`, 0);
var root_5 = _$_.template(`<li> </li>`, 1, 1);
var root_6 = _$_.template(`<li> </li>`, 0);
var root_4 = _$_.template(`<!>`, 1, 1);
var root_3 = _$_.template(`<ul class="for-switch"></ul>`, 0);
var root_9 = _$_.template(`<p class="case-a">Case A</p>`, 1, 1);
var root_10 = _$_.template(`<p class="case-default">Default</p>`, 0);
var root_8 = _$_.template(`<!>`, 1, 1);
var root_7 = _$_.template(`<div class="if-switch"><!></div>`, 0);
var root_13 = _$_.template(`<p class="case-a">Case A</p>`, 1, 1);
var root_14 = _$_.template(`<p class="case-default">Default</p>`, 0);
var root_12 = _$_.template(`<!>`, 1, 1);
var root_11 = _$_.template(`<div class="if-switch-hidden"><!><p class="after">after</p></div>`, 0);
var root_18 = _$_.template(`<li> </li>`, 1, 1);
var root_19 = _$_.template(`<li> </li>`, 0);
var root_17 = _$_.template(`<!>`, 1, 1);
var root_16 = _$_.template(`<!>`, 1, 1);
var root_15 = _$_.template(`<ul class="for-if-switch-single"></ul>`, 0);
var root_23 = _$_.template(`<li> </li>`, 1, 1);
var root_24 = _$_.template(`<li> </li>`, 0);
var root_22 = _$_.template(`<!>`, 1, 1);
var root_21 = _$_.template(`<!>`, 1, 1);
var root_20 = _$_.template(`<ul class="for-if-switch-multi"></ul>`, 0);
var root_28 = _$_.template(`<li> </li>`, 1, 1);
var root_29 = _$_.template(`<li> </li>`, 0);
var root_27 = _$_.template(`<!>`, 1, 1);
var root_26 = _$_.template(`<!>`, 1, 1);
var root_25 = _$_.template(`<ul class="for-if-switch-disabled"></ul>`, 0);
var root_32 = _$_.template(`<p class="resolved-a">A resolved</p>`, 0);
var root_33 = _$_.template(`<p class="pending-a">A pending</p>`, 0);
var root_31 = _$_.template(`<!>`, 1, 1);
var root_34 = _$_.template(`<p class="default">Default</p>`, 0);
var root_30 = _$_.template(`<div class="switch-try"><!></div>`, 0);
var root_38 = _$_.template(`<li> </li>`, 0);
var root_39 = _$_.template(`<li> </li>`, 0);
var root_37 = _$_.template(`<!>`, 1, 1);
var root_41 = _$_.template(`<li> </li>`, 0);
var root_42 = _$_.template(`<li> </li>`, 0);
var root_40 = _$_.template(`<!>`, 1, 1);
var root_36 = _$_.template(`<!>`, 1, 1);
var root_35 = _$_.template(`<ul class="for-switch-try"></ul>`, 0);
var root_46 = _$_.template(`<li> </li>`, 0);
var root_47 = _$_.template(`<li> </li>`, 0);
var root_45 = _$_.template(`<!>`, 1, 1);
var root_44 = _$_.template(`<!>`, 1, 1);
var root_43 = _$_.template(`<ul class="for-if-try"></ul>`, 0);
var root_52 = _$_.template(`<li> </li>`, 0);
var root_53 = _$_.template(`<li> </li>`, 0);
var root_51 = _$_.template(`<!>`, 1, 1);
var root_55 = _$_.template(`<li> </li>`, 0);
var root_56 = _$_.template(`<li> </li>`, 0);
var root_54 = _$_.template(`<!>`, 1, 1);
var root_50 = _$_.template(`<!>`, 1, 1);
var root_49 = _$_.template(`<!>`, 1, 1);
var root_48 = _$_.template(`<ul class="for-if-switch-try-single"></ul>`, 0);
var root_61 = _$_.template(`<li> </li>`, 0);
var root_62 = _$_.template(`<li> </li>`, 0);
var root_60 = _$_.template(`<!>`, 1, 1);
var root_64 = _$_.template(`<li> </li>`, 0);
var root_65 = _$_.template(`<li> </li>`, 0);
var root_63 = _$_.template(`<!>`, 1, 1);
var root_59 = _$_.template(`<!>`, 1, 1);
var root_58 = _$_.template(`<!>`, 1, 1);
var root_57 = _$_.template(`<ul class="for-if-switch-try-multi"></ul>`, 0);

export function ForIf(__anchor, _, __block) {
	_$_.push_component();

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
						var li_1 = root_2();

						{
							var text = _$_.child(li_1, true);

							_$_.pop(li_1);
						}

						_$_.render(
							(__prev) => {
								var __a = _$_.get(pattern).label;

								if (__prev.a !== __a) {
									_$_.set_text(text, __prev.a = __a);
								}

								var __b = `item item-${_$_.get(pattern).id}`;

								if (__prev.b !== __b) {
									_$_.set_class(li_1, __prev.b = __b, void 0, true);
								}
							},
							{ a: ' ', b: Symbol() }
						);

						_$_.append(__anchor, li_1);
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
	_$_.pop_component();
}

export function ForSwitch(__anchor, _, __block) {
	_$_.push_component();

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
				var fragment_1 = root_4();
				var node_1 = _$_.first_child_frag(fragment_1);

				{
					var switch_case_0 = (__anchor) => {
						var fragment_2 = root_5();
						var li_2 = _$_.first_child_frag(fragment_2);

						{
							var text_1 = _$_.child(li_2, true);

							_$_.pop(li_2);
						}

						_$_.render(
							(__prev) => {
								var __a = `A-${_$_.get(pattern_1).id}`;

								if (__prev.a !== __a) {
									_$_.set_text(text_1, __prev.a = __a);
								}

								var __b = `item item-${_$_.get(pattern_1).id} kind-a`;

								if (__prev.b !== __b) {
									_$_.set_class(li_2, __prev.b = __b, void 0, true);
								}
							},
							{ a: ' ', b: Symbol() }
						);

						_$_.append(__anchor, fragment_2);
					};

					var switch_case_default = (__anchor) => {
						var li_3 = root_6();

						{
							var text_2 = _$_.child(li_3, true);

							_$_.pop(li_3);
						}

						_$_.render(
							(__prev) => {
								var __a = `B-${_$_.get(pattern_1).id}`;

								if (__prev.a !== __a) {
									_$_.set_text(text_2, __prev.a = __a);
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

				_$_.append(__anchor, fragment_1);
			},
			4,
			(pattern_1) => _$_.get(pattern_1).id
		);

		_$_.pop(ul_2);
	}

	_$_.append(__anchor, ul_2);
	_$_.pop_component();
}

export function IfSwitch(__anchor, _, __block) {
	_$_.push_component();

	const show = true;
	const kind = 'a';
	var div_1 = root_7();

	{
		var node_2 = _$_.child(div_1);

		{
			var consequent_1 = (__anchor) => {
				var fragment_3 = root_8();
				var node_3 = _$_.first_child_frag(fragment_3);

				{
					var switch_case_0_1 = (__anchor) => {
						var fragment_4 = root_9();

						_$_.append(__anchor, fragment_4);
					};

					var switch_case_default_1 = (__anchor) => {
						var p_1 = root_10();

						_$_.append(__anchor, p_1);
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

				_$_.append(__anchor, fragment_3);
			};

			_$_.if(node_2, (__render) => {
				if (show) __render(consequent_1);
			});
		}

		_$_.pop(div_1);
	}

	_$_.append(__anchor, div_1);
	_$_.pop_component();
}

export function IfSwitchHidden(__anchor, _, __block) {
	_$_.push_component();

	const show = false;
	const kind = 'a';
	var div_2 = root_11();

	{
		var node_4 = _$_.child(div_2);

		{
			var consequent_2 = (__anchor) => {
				var fragment_5 = root_12();
				var node_5 = _$_.first_child_frag(fragment_5);

				{
					var switch_case_0_2 = (__anchor) => {
						var fragment_6 = root_13();

						_$_.append(__anchor, fragment_6);
					};

					var switch_case_default_2 = (__anchor) => {
						var p_2 = root_14();

						_$_.append(__anchor, p_2);
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

				_$_.append(__anchor, fragment_5);
			};

			_$_.if(node_4, (__render) => {
				if (show) __render(consequent_2);
			});
		}

		_$_.pop(div_2);
	}

	_$_.append(__anchor, div_2);
	_$_.pop_component();
}

export function ForIfSwitchSingle(__anchor, _, __block) {
	_$_.push_component();

	const items = [{ id: 1, kind: 'a', show: true }];
	var ul_3 = root_15();

	{
		_$_.for_keyed(
			ul_3,
			() => items,
			(__anchor, pattern_2) => {
				var fragment_7 = root_16();
				var node_6 = _$_.first_child_frag(fragment_7);

				{
					var consequent_3 = (__anchor) => {
						var fragment_8 = root_17();
						var node_7 = _$_.first_child_frag(fragment_8);

						{
							var switch_case_0_3 = (__anchor) => {
								var fragment_9 = root_18();
								var li_4 = _$_.first_child_frag(fragment_9);

								{
									var text_3 = _$_.child(li_4, true);

									_$_.pop(li_4);
								}

								_$_.render(
									(__prev) => {
										var __a = `A-${_$_.get(pattern_2).id}`;

										if (__prev.a !== __a) {
											_$_.set_text(text_3, __prev.a = __a);
										}

										var __b = `item item-${_$_.get(pattern_2).id} kind-a`;

										if (__prev.b !== __b) {
											_$_.set_class(li_4, __prev.b = __b, void 0, true);
										}
									},
									{ a: ' ', b: Symbol() }
								);

								_$_.append(__anchor, fragment_9);
							};

							var switch_case_default_3 = (__anchor) => {
								var li_5 = root_19();

								{
									var text_4 = _$_.child(li_5, true);

									_$_.pop(li_5);
								}

								_$_.render(
									(__prev) => {
										var __a = `D-${_$_.get(pattern_2).id}`;

										if (__prev.a !== __a) {
											_$_.set_text(text_4, __prev.a = __a);
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

						_$_.append(__anchor, fragment_8);
					};

					_$_.if(node_6, (__render) => {
						if (_$_.get(pattern_2).show) __render(consequent_3);
					});
				}

				_$_.append(__anchor, fragment_7);
			},
			4,
			(pattern_2) => _$_.get(pattern_2).id
		);

		_$_.pop(ul_3);
	}

	_$_.append(__anchor, ul_3);
	_$_.pop_component();
}

export function ForIfSwitchMulti(__anchor, _, __block) {
	_$_.push_component();

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
				var fragment_10 = root_21();
				var node_8 = _$_.first_child_frag(fragment_10);

				{
					var consequent_4 = (__anchor) => {
						var fragment_11 = root_22();
						var node_9 = _$_.first_child_frag(fragment_11);

						{
							var switch_case_0_4 = (__anchor) => {
								var fragment_12 = root_23();
								var li_6 = _$_.first_child_frag(fragment_12);

								{
									var text_5 = _$_.child(li_6, true);

									_$_.pop(li_6);
								}

								_$_.render(
									(__prev) => {
										var __a = `A-${_$_.get(pattern_3).id}`;

										if (__prev.a !== __a) {
											_$_.set_text(text_5, __prev.a = __a);
										}

										var __b = `item item-${_$_.get(pattern_3).id} kind-a`;

										if (__prev.b !== __b) {
											_$_.set_class(li_6, __prev.b = __b, void 0, true);
										}
									},
									{ a: ' ', b: Symbol() }
								);

								_$_.append(__anchor, fragment_12);
							};

							var switch_case_default_4 = (__anchor) => {
								var li_7 = root_24();

								{
									var text_6 = _$_.child(li_7, true);

									_$_.pop(li_7);
								}

								_$_.render(
									(__prev) => {
										var __a = `B-${_$_.get(pattern_3).id}`;

										if (__prev.a !== __a) {
											_$_.set_text(text_6, __prev.a = __a);
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

						_$_.append(__anchor, fragment_11);
					};

					_$_.if(node_8, (__render) => {
						if (_$_.get(pattern_3).show) __render(consequent_4);
					});
				}

				_$_.append(__anchor, fragment_10);
			},
			4,
			(pattern_3) => _$_.get(pattern_3).id
		);

		_$_.pop(ul_4);
	}

	_$_.append(__anchor, ul_4);
	_$_.pop_component();
}

export function ForIfSwitchWithDisabled(__anchor, _, __block) {
	_$_.push_component();

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
				var fragment_13 = root_26();
				var node_10 = _$_.first_child_frag(fragment_13);

				{
					var consequent_5 = (__anchor) => {
						var fragment_14 = root_27();
						var node_11 = _$_.first_child_frag(fragment_14);

						{
							var switch_case_0_5 = (__anchor) => {
								var fragment_15 = root_28();
								var li_8 = _$_.first_child_frag(fragment_15);

								{
									var text_7 = _$_.child(li_8, true);

									_$_.pop(li_8);
								}

								_$_.render(
									(__prev) => {
										var __a = `A-${_$_.get(pattern_4).id}`;

										if (__prev.a !== __a) {
											_$_.set_text(text_7, __prev.a = __a);
										}

										var __b = `item item-${_$_.get(pattern_4).id} kind-a`;

										if (__prev.b !== __b) {
											_$_.set_class(li_8, __prev.b = __b, void 0, true);
										}
									},
									{ a: ' ', b: Symbol() }
								);

								_$_.append(__anchor, fragment_15);
							};

							var switch_case_default_5 = (__anchor) => {
								var li_9 = root_29();

								{
									var text_8 = _$_.child(li_9, true);

									_$_.pop(li_9);
								}

								_$_.render(
									(__prev) => {
										var __a = `B-${_$_.get(pattern_4).id}`;

										if (__prev.a !== __a) {
											_$_.set_text(text_8, __prev.a = __a);
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

						_$_.append(__anchor, fragment_14);
					};

					_$_.if(node_10, (__render) => {
						if (_$_.get(pattern_4).show) __render(consequent_5);
					});
				}

				_$_.append(__anchor, fragment_13);
			},
			4,
			(pattern_4) => _$_.get(pattern_4).id
		);

		_$_.pop(ul_5);
	}

	_$_.append(__anchor, ul_5);
	_$_.pop_component();
}

export function SwitchTry(__anchor, _, __block) {
	_$_.push_component();

	const kind = 'a';
	var div_3 = root_30();

	{
		var node_12 = _$_.child(div_3);

		{
			var switch_case_0_6 = (__anchor) => {
				var fragment_16 = root_31();
				var node_13 = _$_.first_child_frag(fragment_16);

				_$_.try(
					node_13,
					(__anchor) => {
						_$_.async(async () => {
							var p_3 = root_32();

							_$_.append(__anchor, p_3);
						});
					},
					null,
					(__anchor) => {
						var p_4 = root_33();

						_$_.append(__anchor, p_4);
					}
				);

				_$_.append(__anchor, fragment_16);
			};

			var switch_case_default_6 = (__anchor) => {
				var p_5 = root_34();

				_$_.append(__anchor, p_5);
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
	_$_.pop_component();
}

export function ForSwitchTry(__anchor, _, __block) {
	_$_.push_component();

	const items = [{ id: 1, kind: 'a' }, { id: 2, kind: 'b' }];
	var ul_6 = root_35();

	{
		_$_.for_keyed(
			ul_6,
			() => items,
			(__anchor, pattern_5) => {
				var fragment_17 = root_36();
				var node_14 = _$_.first_child_frag(fragment_17);

				{
					var switch_case_0_7 = (__anchor) => {
						var fragment_18 = root_37();
						var node_15 = _$_.first_child_frag(fragment_18);

						_$_.try(
							node_15,
							(__anchor) => {
								_$_.async(async () => {
									var li_10 = root_38();

									{
										var text_9 = _$_.child(li_10, true);

										_$_.pop(li_10);
									}

									_$_.render(
										(__prev) => {
											var __a = `A-${_$_.get(pattern_5).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(text_9, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_5).id} kind-a`;

											if (__prev.b !== __b) {
												_$_.set_class(li_10, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, li_10);
								});
							},
							null,
							(__anchor) => {
								var li_11 = root_39();

								{
									var text_10 = _$_.child(li_11, true);

									_$_.pop(li_11);
								}

								_$_.render(
									(__prev) => {
										var __a = `pending ${_$_.get(pattern_5).id}`;

										if (__prev.a !== __a) {
											_$_.set_text(text_10, __prev.a = __a);
										}

										var __b = `pending pending-${_$_.get(pattern_5).id}`;

										if (__prev.b !== __b) {
											_$_.set_class(li_11, __prev.b = __b, void 0, true);
										}
									},
									{ a: ' ', b: Symbol() }
								);

								_$_.append(__anchor, li_11);
							}
						);

						_$_.append(__anchor, fragment_18);
					};

					var switch_case_default_7 = (__anchor) => {
						var fragment_19 = root_40();
						var node_16 = _$_.first_child_frag(fragment_19);

						_$_.try(
							node_16,
							(__anchor) => {
								_$_.async(async () => {
									var li_12 = root_41();

									{
										var text_11 = _$_.child(li_12, true);

										_$_.pop(li_12);
									}

									_$_.render(
										(__prev) => {
											var __a = `B-${_$_.get(pattern_5).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(text_11, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_5).id} kind-b`;

											if (__prev.b !== __b) {
												_$_.set_class(li_12, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, li_12);
								});
							},
							null,
							(__anchor) => {
								var li_13 = root_42();

								{
									var text_12 = _$_.child(li_13, true);

									_$_.pop(li_13);
								}

								_$_.render(
									(__prev) => {
										var __a = `pending ${_$_.get(pattern_5).id}`;

										if (__prev.a !== __a) {
											_$_.set_text(text_12, __prev.a = __a);
										}

										var __b = `pending pending-${_$_.get(pattern_5).id}`;

										if (__prev.b !== __b) {
											_$_.set_class(li_13, __prev.b = __b, void 0, true);
										}
									},
									{ a: ' ', b: Symbol() }
								);

								_$_.append(__anchor, li_13);
							}
						);

						_$_.append(__anchor, fragment_19);
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

				_$_.append(__anchor, fragment_17);
			},
			4,
			(pattern_5) => _$_.get(pattern_5).id
		);

		_$_.pop(ul_6);
	}

	_$_.append(__anchor, ul_6);
	_$_.pop_component();
}

export function ForIfTry(__anchor, _, __block) {
	_$_.push_component();

	const items = [{ id: 1, show: true }, { id: 2, show: true }];
	var ul_7 = root_43();

	{
		_$_.for_keyed(
			ul_7,
			() => items,
			(__anchor, pattern_6) => {
				var fragment_20 = root_44();
				var node_17 = _$_.first_child_frag(fragment_20);

				{
					var consequent_6 = (__anchor) => {
						var fragment_21 = root_45();
						var node_18 = _$_.first_child_frag(fragment_21);

						_$_.try(
							node_18,
							(__anchor) => {
								_$_.async(async () => {
									var li_14 = root_46();

									{
										var text_13 = _$_.child(li_14, true);

										_$_.pop(li_14);
									}

									_$_.render(
										(__prev) => {
											var __a = `item-${_$_.get(pattern_6).id}`;

											if (__prev.a !== __a) {
												_$_.set_text(text_13, __prev.a = __a);
											}

											var __b = `item item-${_$_.get(pattern_6).id}`;

											if (__prev.b !== __b) {
												_$_.set_class(li_14, __prev.b = __b, void 0, true);
											}
										},
										{ a: ' ', b: Symbol() }
									);

									_$_.append(__anchor, li_14);
								});
							},
							null,
							(__anchor) => {
								var li_15 = root_47();

								{
									var text_14 = _$_.child(li_15, true);

									_$_.pop(li_15);
								}

								_$_.render(
									(__prev) => {
										var __a = `pending ${_$_.get(pattern_6).id}`;

										if (__prev.a !== __a) {
											_$_.set_text(text_14, __prev.a = __a);
										}

										var __b = `pending pending-${_$_.get(pattern_6).id}`;

										if (__prev.b !== __b) {
											_$_.set_class(li_15, __prev.b = __b, void 0, true);
										}
									},
									{ a: ' ', b: Symbol() }
								);

								_$_.append(__anchor, li_15);
							}
						);

						_$_.append(__anchor, fragment_21);
					};

					_$_.if(node_17, (__render) => {
						if (_$_.get(pattern_6).show) __render(consequent_6);
					});
				}

				_$_.append(__anchor, fragment_20);
			},
			4,
			(pattern_6) => _$_.get(pattern_6).id
		);

		_$_.pop(ul_7);
	}

	_$_.append(__anchor, ul_7);
	_$_.pop_component();
}

export function ForIfSwitchTrySingle(__anchor, _, __block) {
	_$_.push_component();

	const items = [{ id: 1, kind: 'a', show: true }];
	var ul_8 = root_48();

	{
		_$_.for_keyed(
			ul_8,
			() => items,
			(__anchor, pattern_7) => {
				var fragment_22 = root_49();
				var node_19 = _$_.first_child_frag(fragment_22);

				{
					var consequent_7 = (__anchor) => {
						var fragment_23 = root_50();
						var node_20 = _$_.first_child_frag(fragment_23);

						{
							var switch_case_0_8 = (__anchor) => {
								var fragment_24 = root_51();
								var node_21 = _$_.first_child_frag(fragment_24);

								_$_.try(
									node_21,
									(__anchor) => {
										_$_.async(async () => {
											var li_16 = root_52();

											{
												var text_15 = _$_.child(li_16, true);

												_$_.pop(li_16);
											}

											_$_.render(
												(__prev) => {
													var __a = `A-${_$_.get(pattern_7).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(text_15, __prev.a = __a);
													}

													var __b = `item item-${_$_.get(pattern_7).id} kind-a`;

													if (__prev.b !== __b) {
														_$_.set_class(li_16, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, li_16);
										});
									},
									null,
									(__anchor) => {
										var li_17 = root_53();

										{
											var text_16 = _$_.child(li_17, true);

											_$_.pop(li_17);
										}

										_$_.render(
											(__prev) => {
												var __a = `pending ${_$_.get(pattern_7).id}`;

												if (__prev.a !== __a) {
													_$_.set_text(text_16, __prev.a = __a);
												}

												var __b = `pending pending-${_$_.get(pattern_7).id}`;

												if (__prev.b !== __b) {
													_$_.set_class(li_17, __prev.b = __b, void 0, true);
												}
											},
											{ a: ' ', b: Symbol() }
										);

										_$_.append(__anchor, li_17);
									}
								);

								_$_.append(__anchor, fragment_24);
							};

							var switch_case_default_8 = (__anchor) => {
								var fragment_25 = root_54();
								var node_22 = _$_.first_child_frag(fragment_25);

								_$_.try(
									node_22,
									(__anchor) => {
										_$_.async(async () => {
											var li_18 = root_55();

											{
												var text_17 = _$_.child(li_18, true);

												_$_.pop(li_18);
											}

											_$_.render(
												(__prev) => {
													var __a = `D-${_$_.get(pattern_7).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(text_17, __prev.a = __a);
													}

													var __b = `item item-${_$_.get(pattern_7).id} kind-default`;

													if (__prev.b !== __b) {
														_$_.set_class(li_18, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, li_18);
										});
									},
									null,
									(__anchor) => {
										var li_19 = root_56();

										{
											var text_18 = _$_.child(li_19, true);

											_$_.pop(li_19);
										}

										_$_.render(
											(__prev) => {
												var __a = `pending ${_$_.get(pattern_7).id}`;

												if (__prev.a !== __a) {
													_$_.set_text(text_18, __prev.a = __a);
												}

												var __b = `pending pending-${_$_.get(pattern_7).id}`;

												if (__prev.b !== __b) {
													_$_.set_class(li_19, __prev.b = __b, void 0, true);
												}
											},
											{ a: ' ', b: Symbol() }
										);

										_$_.append(__anchor, li_19);
									}
								);

								_$_.append(__anchor, fragment_25);
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

						_$_.append(__anchor, fragment_23);
					};

					_$_.if(node_19, (__render) => {
						if (_$_.get(pattern_7).show) __render(consequent_7);
					});
				}

				_$_.append(__anchor, fragment_22);
			},
			4,
			(pattern_7) => _$_.get(pattern_7).id
		);

		_$_.pop(ul_8);
	}

	_$_.append(__anchor, ul_8);
	_$_.pop_component();
}

export function ForIfSwitchTryMulti(__anchor, _, __block) {
	_$_.push_component();

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
				var fragment_26 = root_58();
				var node_23 = _$_.first_child_frag(fragment_26);

				{
					var consequent_8 = (__anchor) => {
						var fragment_27 = root_59();
						var node_24 = _$_.first_child_frag(fragment_27);

						{
							var switch_case_0_9 = (__anchor) => {
								var fragment_28 = root_60();
								var node_25 = _$_.first_child_frag(fragment_28);

								_$_.try(
									node_25,
									(__anchor) => {
										_$_.async(async () => {
											var li_20 = root_61();

											{
												var text_19 = _$_.child(li_20, true);

												_$_.pop(li_20);
											}

											_$_.render(
												(__prev) => {
													var __a = `A-${_$_.get(pattern_8).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(text_19, __prev.a = __a);
													}

													var __b = `item item-${_$_.get(pattern_8).id} kind-a`;

													if (__prev.b !== __b) {
														_$_.set_class(li_20, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, li_20);
										});
									},
									null,
									(__anchor) => {
										var li_21 = root_62();

										{
											var text_20 = _$_.child(li_21, true);

											_$_.pop(li_21);
										}

										_$_.render(
											(__prev) => {
												var __a = `pending ${_$_.get(pattern_8).id}`;

												if (__prev.a !== __a) {
													_$_.set_text(text_20, __prev.a = __a);
												}

												var __b = `pending pending-${_$_.get(pattern_8).id}`;

												if (__prev.b !== __b) {
													_$_.set_class(li_21, __prev.b = __b, void 0, true);
												}
											},
											{ a: ' ', b: Symbol() }
										);

										_$_.append(__anchor, li_21);
									}
								);

								_$_.append(__anchor, fragment_28);
							};

							var switch_case_default_9 = (__anchor) => {
								var fragment_29 = root_63();
								var node_26 = _$_.first_child_frag(fragment_29);

								_$_.try(
									node_26,
									(__anchor) => {
										_$_.async(async () => {
											var li_22 = root_64();

											{
												var text_21 = _$_.child(li_22, true);

												_$_.pop(li_22);
											}

											_$_.render(
												(__prev) => {
													var __a = `B-${_$_.get(pattern_8).id}`;

													if (__prev.a !== __a) {
														_$_.set_text(text_21, __prev.a = __a);
													}

													var __b = `item item-${_$_.get(pattern_8).id} kind-b`;

													if (__prev.b !== __b) {
														_$_.set_class(li_22, __prev.b = __b, void 0, true);
													}
												},
												{ a: ' ', b: Symbol() }
											);

											_$_.append(__anchor, li_22);
										});
									},
									null,
									(__anchor) => {
										var li_23 = root_65();

										{
											var text_22 = _$_.child(li_23, true);

											_$_.pop(li_23);
										}

										_$_.render(
											(__prev) => {
												var __a = `pending ${_$_.get(pattern_8).id}`;

												if (__prev.a !== __a) {
													_$_.set_text(text_22, __prev.a = __a);
												}

												var __b = `pending pending-${_$_.get(pattern_8).id}`;

												if (__prev.b !== __b) {
													_$_.set_class(li_23, __prev.b = __b, void 0, true);
												}
											},
											{ a: ' ', b: Symbol() }
										);

										_$_.append(__anchor, li_23);
									}
								);

								_$_.append(__anchor, fragment_29);
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

						_$_.append(__anchor, fragment_27);
					};

					_$_.if(node_23, (__render) => {
						if (_$_.get(pattern_8).show) __render(consequent_8);
					});
				}

				_$_.append(__anchor, fragment_26);
			},
			4,
			(pattern_8) => _$_.get(pattern_8).id
		);

		_$_.pop(ul_9);
	}

	_$_.append(__anchor, ul_9);
	_$_.pop_component();
}