// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import {
	Hydrate,
	Activity,
	Context,
	bindValue,
	effect,
	track,
	trackAsync
} from 'ripple/server';

import { condition, interaction, never, load } from 'ripple/hydration';

export const calls = [];
export let controls;
export let initial = 'server';
export let when = condition(false);
export let nested = interaction();
export let fail = false;
export let duringInit;
export let stream = Promise.resolve('streamed');

export function configure(options = {}) {
	when = options.when ?? condition(false);
	nested = options.nested ?? interaction();
	initial = options.initial ?? 'server';
	fail = options.fail ?? false;
	duringInit = options.duringInit;
	stream = options.stream ?? Promise.resolve('streamed');
	calls.length = 0;
}

const context = _$_.context();

function Child({ name }) {
	return _$_.tsrx_element(() => {
		calls.push('init:' + name + ':' + context.get());
		duringInit?.();

		if (fail) throw new Error('hydrate failure');

		const value = _$_.track('server', '1tm5kuu');

		_$_.effect(() => {
			calls.push('effect:' + name);

			return () => {
				calls.push('cleanup:' + name);
			};
		});

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div' + _$_.attr('data-child', name, false) + '><input /><span>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(value.value);
			}

			__out += '</span><button>press</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function App() {
	return _$_.tsrx_element(() => {
		const strategy = _$_.track({ value: when }, '14brm6e');
		const enabled = _$_.track(false, 'mhty7a');
		const exists = _$_.track(true, '1i2j1mh');

		context.set('context');
		controls = { strategy, enabled, exists };

		_$_.regular_block(() => {
			let __out = '';

			__out += '<main>';

			if (exists.value) {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(0);

				{
					const comp = Hydrate;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							when: () => {
								const value = strategy.value.value;

								return typeof value === 'function' ? value() : value;
							},
							onHydrated: () => calls.push('hydrated'),
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									{
										const comp = Child;
										const args = [{ name: "deferred" }];

										_$_.render_component(comp, ...args);
									}
								});
							})
						}
					];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			} else {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(-1);
			}

			__out += '<!--]--><footer>untouched</footer></main>';
			_$_.output_push(__out);
		});
	});
}

export function Condition() {
	return _$_.tsrx_element(() => {
		const enabled = _$_.track(false, '1j1wrv2');

		context.set('context');
		controls = { enabled };

		_$_.regular_block(() => {
			{
				const comp = Hydrate;

				const args = [
					{
						when: condition(() => enabled.value),
						onHydrated: () => calls.push('hydrated'),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Child;
									const args = [{ name: "condition" }];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function Nested() {
	return _$_.tsrx_element(() => {
		context.set('context');

		_$_.regular_block(() => {
			{
				const comp = Hydrate;

				const args = [
					{
						when,
						onHydrated: () => calls.push('outer hydrated'),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Child;
									const args = [{ name: "parent" }];

									_$_.render_component(comp, ...args);
								}

								{
									const comp = Hydrate;

									const args = [
										{
											when: nested,
											onHydrated: () => calls.push('inner hydrated'),
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													{
														const comp = Child;
														const args = [{ name: "nested" }];

														_$_.render_component(comp, ...args);
													}
												});
											})
										}
									];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function Hidden() {
	return _$_.tsrx_element(() => {
		context.set('context');

		const mode = _$_.track('hidden', '1lfui4w');

		controls = { mode };

		_$_.regular_block(() => {
			{
				const comp = Activity;

				const args = [
					{
						mode,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Hydrate;

									const args = [
										{
											when,
											onHydrated: () => calls.push('hydrated'),
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													{
														const comp = Child;
														const args = [{ name: "hidden" }];

														_$_.render_component(comp, ...args);
													}
												});
											})
										}
									];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function Async() {
	return _$_.tsrx_element(() => {
		const input = _$_.track(initial, '1mwkssf');

		controls = { input };

		function Data() {
			return _$_.tsrx_element(() => {
				const value = _$_.track_async(
					async () => {
						calls.push('fetch');

						return input.value;
					},
					'16xwy8k'
				);

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p>';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(value.value);
					}

					__out += '</p>';
					_$_.output_push(__out);
				});
			});
		}

		_$_.regular_block(() => {
			{
				const comp = Hydrate;

				const args = [
					{
						when,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Data;
									const args = [{}];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function Stream() {
	return _$_.tsrx_element(() => {
		function Data() {
			return _$_.tsrx_element(() => {
				const value = _$_.track_async(() => stream, '1jo36cv');

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="stream-value">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(value.value);
					}

					__out += '</p>';
					_$_.output_push(__out);
				});
			});
		}

		_$_.regular_block(() => {
			let __out = '';

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								_$_.try_block(
									() => {
										let __out = '';

										__out += '<!--[-->';

										{
											const comp = Data;
											const args = [{}];

											_$_.output_push(__out);
											__out = '';
											_$_.render_component(comp, ...args);
										}

										__out += '<!--]-->';
										_$_.output_push(__out);
									},
									null,
									() => {
										let __out = '';

										__out += '<!--[--><span class="stream-pending">waiting</span><!--]-->';
										_$_.output_push(__out);
									}
								);
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<footer>untouched</footer>';
			_$_.output_push(__out);
		});
	});
}

export function Recovery() {
	return _$_.tsrx_element(() => {
		const changed = _$_.track(false, 'uzdiok');

		controls = { changed };

		_$_.regular_block(() => {
			let __out = '';

			__out += '<main>';

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								if (changed.value) {
									_$_.output_push(__out);
									__out = '';
									_$_.branch_marker(0);
									__out += '<section>new</section>';
								} else {
									_$_.output_push(__out);
									__out = '';
									_$_.branch_marker(1);
									__out += '<p>old</p>';
								}

								__out += '<!--]-->';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<footer>untouched</footer></main>';
			_$_.output_push(__out);
		});
	});
}

export function Errors() {
	return _$_.tsrx_element(() => {
		context.set('context');

		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					{
						const comp = Hydrate;

						const args = [
							{
								when,
								onHydrated: () => calls.push('hydrated'),
								children: _$_.tsrx_element(() => {
									return _$_.tsrx_element(() => {
										{
											const comp = Child;
											const args = [{ name: "broken" }];

											_$_.render_component(comp, ...args);
										}
									});
								})
							}
						];

						_$_.render_component(comp, ...args);
					}
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			(error) => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<strong>';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(error.message);
					}

					__out += '</strong>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			null
		);
	});
}

export function Shapes() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			{
				const comp = Hydrate;
				const args = [{ when }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [{ when, children: _$_.normalize_children("text") }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			{
				const comp = Hydrate;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						when,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<b>one</b><b>two</b>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<svg>';

			{
				{
					const comp = Hydrate;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							when,
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									let __out = '';

									__out += '<circle r="2"></circle>';
									_$_.output_push(__out);
								});
							})
						}
					];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '</svg><table><tbody>';

			{
				{
					const comp = Hydrate;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							when,
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									let __out = '';

									__out += '<tr><td>cell</td></tr>';
									_$_.output_push(__out);
								});
							})
						}
					];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '</tbody></table>';
			_$_.output_push(__out);
		});
	});
}

export function Replacement() {
	return _$_.tsrx_element(() => {
		const children = _$_.track('old', 'pqdvv9');
		const strategy = _$_.track({ value: when }, '1vudbxq');

		controls = { children, strategy };

		_$_.regular_block(() => {
			{
				const comp = Hydrate;

				const args = [
					{
						when: () => {
							const value = strategy.value.value;

							return typeof value === 'function' ? value() : value;
						},
						children: _$_.normalize_children(children),
						onHydrated: () => calls.push('hydrated')
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

const storeContext = _$_.context();

export function Current() {
	return _$_.tsrx_element(() => {
		const store = _$_.track({ title: 'old' }, 'vany8e');
		const provided = _$_.track('old', 'ts8wl9');
		const changed = _$_.track(false, 'rroytf');
		const enabled = _$_.track(false, '1i50l4');
		const input = _$_.track('server', 'f5ruzx');

		storeContext.set(provided);
		controls = { store, provided, changed, enabled, input };

		function Data({ value }) {
			return _$_.tsrx_element(() => {
				const shared = storeContext.get();

				calls.push('current init');

				_$_.regular_block(() => {
					let __out = '';

					__out += '<input /><span>';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(input.value);
					}

					__out += '</span><b>' + _$_.escape(value.value.title + ':' + shared.value) + '</b>';

					if (changed.value) {
						_$_.output_push(__out);
						__out = '';
						_$_.branch_marker(0);
						__out += '<section>new</section>';
					} else {
						_$_.output_push(__out);
						__out = '';
						_$_.branch_marker(1);
						__out += '<p>old</p>';
					}

					__out += '<!--]-->';
					_$_.output_push(__out);
				});
			});
		}

		_$_.regular_block(() => {
			{
				const comp = Hydrate;

				const args = [
					{
						when: condition(() => enabled.value),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Data;
									const args = [{ value: store }];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function Navigation() {
	return _$_.tsrx_element(() => {
		const exists = _$_.track(false, 'gk3542');

		controls = { exists };

		_$_.regular_block(() => {
			let __out = '';

			if (exists.value) {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(0);

				{
					const comp = Hydrate;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							when: never(),
							onHydrated: () => calls.push('hydrated'),
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									let __out = '';

									__out += '<button>live</button>';
									_$_.output_push(__out);
								});
							})
						}
					];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			} else {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(-1);
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function Priority() {
	return _$_.tsrx_element(() => {
		context.set('context');

		_$_.regular_block(() => {
			{
				{
					const comp = Activity;

					const args = [
						{
							mode: "hidden",
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									{
										const comp = Child;
										const args = [{ name: "background" }];

										_$_.render_component(comp, ...args);
									}
								});
							})
						}
					];

					_$_.render_component(comp, ...args);
				}

				{
					const comp = Hydrate;

					const args = [
						{
							when,
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									{
										const comp = Child;
										const args = [{ name: "urgent" }];

										_$_.render_component(comp, ...args);
									}
								});
							})
						}
					];

					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

export function DynamicFactory() {
	return _$_.tsrx_element(() => {
		context.set('context');

		_$_.regular_block(() => {
			{
				const comp = Hydrate;

				const args = [
					{
						when,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Hydrate;

									const args = [
										{
											when: () => nested,
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													{
														const comp = Child;
														const args = [{ name: "dynamic" }];

														_$_.render_component(comp, ...args);
													}
												});
											})
										}
									];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function CallbackError() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					{
						const comp = Hydrate;

						const args = [
							{
								when,
								onHydrated: () => {
									throw new Error('completion failure');
								},

								children: _$_.tsrx_element(() => {
									return _$_.tsrx_element(() => {
										let __out = '';

										__out += '<button>button</button>';
										_$_.output_push(__out);
									});
								})
							}
						];

						_$_.render_component(comp, ...args);
					}
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			(error) => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<strong>';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(error.message);
					}

					__out += '</strong>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			null
		);
	});
}

export function Branches() {
	return _$_.tsrx_element(() => {
		const choice = _$_.track(Number(initial) || 0, '4du39z');
		const enabled = _$_.track(false, '126n282');

		controls = { choice, enabled };

		_$_.regular_block(() => {
			{
				const comp = Hydrate;

				const args = [
					{
						when: condition(() => enabled.value),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<div id="if-chain">';

								if (choice.value === 0) {
									_$_.output_push(__out);
									__out = '';
									_$_.branch_marker(0);
									__out += '<p>first</p>';
								} else {
									if (choice.value === 1) {
										_$_.output_push(__out);
										__out = '';
										_$_.branch_marker(1);
										__out += '<p>second</p>';
									} else {
										if (choice.value === 2) {
											_$_.output_push(__out);
											__out = '';
											_$_.branch_marker(2);
											__out += '<p>third</p>';
										} else {
											_$_.output_push(__out);
											__out = '';
											_$_.branch_marker(-1);
										}
									}
								}

								__out += '<!--]--></div><div id="switch">';

								switch (choice.value) {
									case 0:
										_$_.output_push(__out);
										__out = '';
										_$_.branch_marker(0);
										__out += '<p>first</p>';
										break;

									case 1:
										_$_.output_push(__out);
										__out = '';
										_$_.branch_marker(1);
										__out += '<p>second</p>';
										break;

									case 2:
										_$_.output_push(__out);
										__out = '';
										_$_.branch_marker(2);
										__out += '<p>third</p>';
										break;

									default:
										_$_.output_push(__out);
										__out = '';
										_$_.branch_marker(-1);
								}

								__out += '<!--]--></div>';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function DerivedChildren() {
	return _$_.tsrx_element(() => {
		const enabled = _$_.track(false, '9zhlv3');
		const value = _$_.track('old', 'v2bq16');

		const children = _$_.track(
			() => {
				calls.push('children read');

				return value.value;
			},
			'hw1lpe'
		);

		controls = { enabled, value };

		_$_.regular_block(() => {
			{
				const comp = Hydrate;

				const args = [
					{
						when: condition(() => enabled.value),
						children: _$_.normalize_children(children)
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

function ActivityComposition({ activityOutside }) {
	return _$_.tsrx_element(() => {
		const mode = _$_.track(initial === 'visible' ? 'visible' : 'hidden', '1cneavi');
		const enabled = _$_.track(false, '13c2lr2');
		const exists = _$_.track(true, '1jlq8y6');

		context.set('context');
		controls = { mode, enabled, exists };

		_$_.regular_block(() => {
			let __out = '';

			__out += '<main>';

			if (exists.value) {
				if (activityOutside) {
					_$_.output_push(__out);
					__out = '';
					_$_.branch_marker(0);

					{
						const comp = Activity;

						_$_.output_push(__out);
						__out = '';

						const args = [
							{
								mode,
								children: _$_.tsrx_element(() => {
									return _$_.tsrx_element(() => {
										{
											const comp = Hydrate;

											const args = [
												{
													when,
													onHydrated: () => calls.push('hydrated'),
													children: _$_.tsrx_element(() => {
														return _$_.tsrx_element(() => {
															{
																const comp = Child;
																const args = [{ name: "composed" }];

																_$_.render_component(comp, ...args);
															}
														});
													})
												}
											];

											_$_.render_component(comp, ...args);
										}
									});
								})
							}
						];

						_$_.output_push(__out);
						__out = '';
						_$_.render_component(comp, ...args);
					}
				} else {
					_$_.output_push(__out);
					__out = '';
					_$_.branch_marker(1);

					{
						const comp = Hydrate;

						_$_.output_push(__out);
						__out = '';

						const args = [
							{
								when,
								onHydrated: () => calls.push('hydrated'),
								children: _$_.tsrx_element(() => {
									return _$_.tsrx_element(() => {
										{
											const comp = Activity;

											const args = [
												{
													mode,
													children: _$_.tsrx_element(() => {
														return _$_.tsrx_element(() => {
															{
																const comp = Child;
																const args = [{ name: "composed" }];

																_$_.render_component(comp, ...args);
															}
														});
													})
												}
											];

											_$_.render_component(comp, ...args);
										}
									});
								})
							}
						];

						_$_.output_push(__out);
						__out = '';
						_$_.render_component(comp, ...args);
					}
				}
			} else {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(-1);
			}

			__out += '<!--]--><footer>untouched</footer></main>';
			_$_.output_push(__out);
		});
	});
}

export function ActivityOutsideHydrate() {
	return _$_.tsrx_element(() => {
		{
			const comp = ActivityComposition;
			const args = [{ activityOutside: true }];

			_$_.render_component(comp, ...args);
		}
	});
}

export function HydrateOutsideActivity() {
	return _$_.tsrx_element(() => {
		{
			const comp = ActivityComposition;
			const args = [{ activityOutside: false }];

			_$_.render_component(comp, ...args);
		}
	});
}

export function HydrateActivityHydrate() {
	return _$_.tsrx_element(() => {
		context.set('context');

		_$_.regular_block(() => {
			{
				const comp = Hydrate;

				const args = [
					{
						when,
						onHydrated: () => calls.push('outer hydrated'),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Activity;

									const args = [
										{
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													{
														const comp = Hydrate;

														const args = [
															{
																when: nested,
																onHydrated: () => calls.push('inner hydrated'),
																children: _$_.tsrx_element(() => {
																	return _$_.tsrx_element(() => {
																		{
																			const comp = Child;
																			const args = [{ name: "composed" }];

																			_$_.render_component(comp, ...args);
																		}
																	});
																})
															}
														];

														_$_.render_component(comp, ...args);
													}
												});
											})
										}
									];

									_$_.render_component(comp, ...args);
								}
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}