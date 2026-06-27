// @ts-nocheck
import * as _$_ from 'ripple/internal/client';

var root_3 = _$_.template(`<p class="muze"> </p>`, 0);
var root_2 = _$_.template(`<!><span class="after">after</span>`, 1, 2);
var root_1 = _$_.template(`<!>`, 1, 1);
var root = _$_.template(`<div class="feed-c"><!></div>`, 0);
var root_7 = _$_.template(`<p class="muze"> </p>`, 0);
var root_8 = _$_.template(`<span class="has-items">has items</span>`, 0);
var root_9 = _$_.template(`<span class="empty">empty</span>`, 0);
var root_6 = _$_.template(`<!><!><!>`, 1, 3);
var root_5 = _$_.template(`<!>`, 1, 1);
var root_4 = _$_.template(`<div class="feed"><!></div>`, 0);
var root_12 = _$_.template(`<p class="muze">b</p><p class="muze">c</p>`, 1, 2);
var root_11 = _$_.template(`<!>`, 1, 1);
var root_10 = _$_.template(`<div class="feed-b"><!></div>`, 0);
var root_15 = _$_.template(`<p class="muze"> </p>`, 0);
var root_14 = _$_.template(`<!><span class="after">after</span>`, 1, 2);
var root_13 = _$_.template(`<!>`, 1, 1);
var root_17 = _$_.template(`<p class="muze"> </p>`, 0);
var root_18 = _$_.template(`<!><span class="after">after</span>`, 1, 2);
var root_16 = _$_.template(`<!>`, 1, 1);
var root_21 = _$_.template(`<p class="muze"> </p>`, 0);
var root_22 = _$_.template(`<!><span class="after">after</span>`, 1, 2);
var root_20 = _$_.template(`<!>`, 1, 1);
var root_19 = _$_.template(`<div class="feed-f"><!></div>`, 0);
var root_24 = _$_.template(`<span class="loading">loading</span>`, 0);
var root_27 = _$_.template(`<p class="muze"> </p>`, 0);
var root_26 = _$_.template(`<!><span class="after">after</span>`, 1, 2);
var root_25 = _$_.template(`<!>`, 1, 1);
var root_23 = _$_.template(`<div class="feed-d"><!></div>`, 0);
var root_31 = _$_.template(`<p class="muze"> </p>`, 0);
var root_30 = _$_.template(`<!><span class="after">after</span>`, 1, 2);
var root_29 = _$_.template(`<section><!></section>`, 0);
var root_28 = _$_.template(`<div class="feed-e"><!></div>`, 0);

export function IfFragmentForElement() {
	return _$_.tsrx_element((__anchor, __block) => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		const hasLoaded = true;
		var div_1 = root();

		{
			var node = _$_.child(div_1);

			{
				var consequent = (__anchor) => {
					var fragment = root_1();
					var node_2 = _$_.first_child_frag(fragment);

					_$_.expression(node_2, () => _$_.tsrx_element((__anchor, __block) => {
						var fragment_1 = root_2();
						var node_1 = _$_.first_child_frag(fragment_1);

						_$_.for_keyed(
							node_1,
							() => muzes,
							(__anchor, pattern) => {
								var p_1 = root_3();

								{
									var expression = _$_.child(p_1);

									_$_.expression(expression, () => _$_.get(pattern).muzeId);
									_$_.pop(p_1);
								}

								_$_.append(__anchor, p_1);
							},
							0,
							(pattern) => _$_.get(pattern).muzeId
						);

						_$_.append(__anchor, fragment_1);
					}));

					_$_.append(__anchor, fragment);
				};

				_$_.if(node, (__render) => {
					if (hasLoaded) __render(consequent);
				});
			}

			_$_.pop(div_1);
		}

		_$_.append(__anchor, div_1);
	});
}

export function IfFragmentForIfIf() {
	return _$_.tsrx_element((__anchor, __block) => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		const hasLoaded = true;
		var div_2 = root_4();

		{
			var node_3 = _$_.child(div_2);

			{
				var consequent_3 = (__anchor) => {
					var fragment_2 = root_5();
					var node_7 = _$_.first_child_frag(fragment_2);

					_$_.expression(node_7, () => _$_.tsrx_element((__anchor, __block) => {
						var fragment_3 = root_6();
						var node_4 = _$_.first_child_frag(fragment_3);

						_$_.for_keyed(
							node_4,
							() => muzes,
							(__anchor, pattern_1) => {
								var p_2 = root_7();

								{
									var expression_1 = _$_.child(p_2);

									_$_.expression(expression_1, () => _$_.get(pattern_1).muzeId);
									_$_.pop(p_2);
								}

								_$_.append(__anchor, p_2);
							},
							0,
							(pattern_1) => _$_.get(pattern_1).muzeId
						);

						var node_5 = _$_.sibling(node_4);

						{
							var consequent_1 = (__anchor) => {
								var span_1 = root_8();

								_$_.append(__anchor, span_1);
							};

							_$_.if(node_5, (__render) => {
								if (muzes.length > 0) __render(consequent_1);
							});
						}

						var node_6 = _$_.sibling(node_5);

						{
							var consequent_2 = (__anchor) => {
								var span_2 = root_9();

								_$_.append(__anchor, span_2);
							};

							_$_.if(node_6, (__render) => {
								if (muzes.length === 0) __render(consequent_2);
							});
						}

						_$_.append(__anchor, fragment_3);
					}));

					_$_.append(__anchor, fragment_2);
				};

				_$_.if(node_3, (__render) => {
					if (hasLoaded) __render(consequent_3);
				});
			}

			_$_.pop(div_2);
		}

		_$_.append(__anchor, div_2);
	});
}

export function IfFragmentElements() {
	return _$_.tsrx_element((__anchor, __block) => {
		const hasLoaded = true;
		var div_3 = root_10();

		{
			var node_8 = _$_.child(div_3);

			{
				var consequent_4 = (__anchor) => {
					var fragment_4 = root_11();
					var node_9 = _$_.first_child_frag(fragment_4);

					_$_.expression(node_9, () => _$_.tsrx_element((__anchor, __block) => {
						var fragment_5 = root_12();

						_$_.append(__anchor, fragment_5);
					}));

					_$_.append(__anchor, fragment_4);
				};

				_$_.if(node_8, (__render) => {
					if (hasLoaded) __render(consequent_4);
				});
			}

			_$_.pop(div_3);
		}

		_$_.append(__anchor, div_3);
	});
}

export function ComponentBodyFragmentControlFlow() {
	return _$_.tsrx_element((__anchor, __block) => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		var fragment_6 = root_13();
		var node_11 = _$_.first_child_frag(fragment_6);

		_$_.expression(node_11, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_7 = root_14();
			var node_10 = _$_.first_child_frag(fragment_7);

			_$_.for_keyed(
				node_10,
				() => muzes,
				(__anchor, pattern_2) => {
					var p_3 = root_15();

					{
						var expression_2 = _$_.child(p_3);

						_$_.expression(expression_2, () => _$_.get(pattern_2).muzeId);
						_$_.pop(p_3);
					}

					_$_.append(__anchor, p_3);
				},
				0,
				(pattern_2) => _$_.get(pattern_2).muzeId
			);

			_$_.append(__anchor, fragment_7);
		}));

		_$_.append(__anchor, fragment_6);
	});
}

export function ComponentBodyCodeBlockControlFlow() {
	return _$_.tsrx_element((__anchor, __block) => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		var fragment_8 = root_16();
		var node_12 = _$_.first_child_frag(fragment_8);

		_$_.expression(node_12, () => _$_.tsrx_element((__anchor, __block) => {
			var fragment_9 = root_18();
			var expression_4 = _$_.first_child_frag(fragment_9);

			_$_.expression(expression_4, () => _$_.tsrx_element((__anchor, __block) => {
				const rows = muzes;

				_$_.for_keyed(
					__anchor,
					() => rows,
					(__anchor, pattern_3) => {
						var p_4 = root_17();

						{
							var expression_3 = _$_.child(p_4);

							_$_.expression(expression_3, () => _$_.get(pattern_3).muzeId);
							_$_.pop(p_4);
						}

						_$_.append(__anchor, p_4);
					},
					16,
					(pattern_3) => _$_.get(pattern_3).muzeId
				);
			}));

			_$_.append(__anchor, fragment_9);
		}));

		_$_.append(__anchor, fragment_8);
	});
}

export function IfCodeBlockControlFlow() {
	return _$_.tsrx_element((__anchor, __block) => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		const hasLoaded = true;
		var div_4 = root_19();

		{
			var node_13 = _$_.child(div_4);

			{
				var consequent_5 = (__anchor) => {
					var fragment_10 = root_20();
					var node_14 = _$_.first_child_frag(fragment_10);

					_$_.expression(node_14, () => _$_.tsrx_element((__anchor, __block) => {
						var fragment_11 = root_22();
						var expression_6 = _$_.first_child_frag(fragment_11);

						_$_.expression(expression_6, () => _$_.tsrx_element((__anchor, __block) => {
							const rows = muzes;

							_$_.for_keyed(
								__anchor,
								() => rows,
								(__anchor, pattern_4) => {
									var p_5 = root_21();

									{
										var expression_5 = _$_.child(p_5);

										_$_.expression(expression_5, () => _$_.get(pattern_4).muzeId);
										_$_.pop(p_5);
									}

									_$_.append(__anchor, p_5);
								},
								16,
								(pattern_4) => _$_.get(pattern_4).muzeId
							);
						}));

						_$_.append(__anchor, fragment_11);
					}));

					_$_.append(__anchor, fragment_10);
				};

				_$_.if(node_13, (__render) => {
					if (hasLoaded) __render(consequent_5);
				});
			}

			_$_.pop(div_4);
		}

		_$_.append(__anchor, div_4);
	});
}

export function IfElseFragment() {
	return _$_.tsrx_element((__anchor, __block) => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		const hasLoaded = false;
		var div_5 = root_23();

		{
			var node_15 = _$_.child(div_5);

			{
				var consequent_6 = (__anchor) => {
					var span_3 = root_24();

					_$_.append(__anchor, span_3);
				};

				var alternate = (__anchor) => {
					var fragment_12 = root_25();
					var node_17 = _$_.first_child_frag(fragment_12);

					_$_.expression(node_17, () => _$_.tsrx_element((__anchor, __block) => {
						var fragment_13 = root_26();
						var node_16 = _$_.first_child_frag(fragment_13);

						_$_.for_keyed(
							node_16,
							() => muzes,
							(__anchor, pattern_5) => {
								var p_6 = root_27();

								{
									var expression_7 = _$_.child(p_6);

									_$_.expression(expression_7, () => _$_.get(pattern_5).muzeId);
									_$_.pop(p_6);
								}

								_$_.append(__anchor, p_6);
							},
							0,
							(pattern_5) => _$_.get(pattern_5).muzeId
						);

						_$_.append(__anchor, fragment_13);
					}));

					_$_.append(__anchor, fragment_12);
				};

				_$_.if(node_15, (__render) => {
					if (hasLoaded) __render(consequent_6); else __render(alternate, false);
				});
			}

			_$_.pop(div_5);
		}

		_$_.append(__anchor, div_5);
	});
}

export function IfDivFragment() {
	return _$_.tsrx_element((__anchor, __block) => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		const hasLoaded = true;
		var div_6 = root_28();

		{
			var node_18 = _$_.child(div_6);

			{
				var consequent_7 = (__anchor) => {
					var section_1 = root_29();

					{
						var node_20 = _$_.child(section_1);

						_$_.expression(node_20, () => _$_.tsrx_element((__anchor, __block) => {
							var fragment_14 = root_30();
							var node_19 = _$_.first_child_frag(fragment_14);

							_$_.for_keyed(
								node_19,
								() => muzes,
								(__anchor, pattern_6) => {
									var p_7 = root_31();

									{
										var expression_8 = _$_.child(p_7);

										_$_.expression(expression_8, () => _$_.get(pattern_6).muzeId);
										_$_.pop(p_7);
									}

									_$_.append(__anchor, p_7);
								},
								0,
								(pattern_6) => _$_.get(pattern_6).muzeId
							);

							_$_.append(__anchor, fragment_14);
						}));

						_$_.pop(section_1);
					}

					_$_.append(__anchor, section_1);
				};

				_$_.if(node_18, (__render) => {
					if (hasLoaded) __render(consequent_7);
				});
			}

			_$_.pop(div_6);
		}

		_$_.append(__anchor, div_6);
	});
}