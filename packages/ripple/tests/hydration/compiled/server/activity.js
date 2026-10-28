// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import {
	Activity,
	bindValue,
	Context,
	createRenderObserver,
	effect,
	track,
	trackAsync
} from 'ripple/server';

export const calls = [];
export let controls;
export let initial = 'value';
export let fail = false;

let streamEffects = true;

export function setStreamEffects(value) {
	streamEffects = value;
}

export let duringInit;

export function setDuringInit(fn) {
	duringInit = fn;
}

export let stream = Promise.resolve('streamed');

export function setInitial(value) {
	initial = value;
}

export function setFail(value) {
	fail = value;
}

export function setStream(value) {
	stream = value;
}

const context = _$_.context();

function Child({ name }) {
	return _$_.tsrx_element(() => {
		const label = context.get();
		const value = _$_.track('server', '1rui9sa');

		calls.push(`init:${name}:${label}`);
		duringInit?.();

		_$_.effect(() => {
			calls.push(`effect:${name}`);

			return () => calls.push(`cleanup:${name}`);
		});

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div' + _$_.attr('data-name', name, false) + '><input /><span>';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(value.value);
			}

			__out += '</span></div>';
			_$_.output_push(__out);
		});
	});
}

export function App() {
	return _$_.tsrx_element(() => {
		const first = _$_.track('hidden', '12pscgx');
		const second = _$_.track('hidden', '1d6hl9l');
		const exists = _$_.track(true, '6tdlur');

		context.set('context');
		controls = { first, second, exists };

		_$_.regular_block(() => {
			let __out = '';

			__out += '<main>';

			if (exists.value) {
				_$_.output_push(__out);
				__out = '';
				_$_.branch_marker(0);

				{
					const comp = Activity;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							mode: first,
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									{
										const comp = Child;
										const args = [{ name: "first" }];

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

			__out += '<!--]-->';

			{
				const comp = Activity;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						mode: second,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Child;
									const args = [{ name: "second" }];

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

			{
				const comp = Child;
				const args = [{ name: "sibling" }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '</main>';
			_$_.output_push(__out);
		});
	});
}

export function Visible() {
	return _$_.tsrx_element(() => {
		context.set('context');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<main>';

			{
				{
					const comp = Activity;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									{
										const comp = Child;
										const args = [{ name: "visible" }];

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

				{
					const comp = Child;
					const args = [{ name: "sibling" }];

					_$_.output_push(__out);
					__out = '';
					_$_.render_component(comp, ...args);
				}
			}

			__out += '</main>';
			_$_.output_push(__out);
		});
	});
}

export function Nested() {
	return _$_.tsrx_element(() => {
		const mode = _$_.track('hidden', 'l2yess');

		context.set('context');
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
									const comp = Child;
									const args = [{ name: "parent" }];

									_$_.render_component(comp, ...args);
								}

								{
									const comp = Activity;

									const args = [
										{
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

export function Text() {
	return _$_.tsrx_element(() => {
		const mode = _$_.track('hidden', 'gzd6z1');

		controls = { mode };

		_$_.regular_block(() => {
			{
				const comp = Activity;

				const args = [
					{
						mode,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += 'a &lt; b &amp; c<span style="display:grid!important">grid</span>';
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

export function ClearedText() {
	return _$_.tsrx_element(() => {
		const mode = _$_.track('hidden', 'h0vg63');
		const inner = _$_.track('hidden', '18l51gx');
		const value = _$_.track('old', 'yk10ld');

		controls = { mode, inner, value };

		_$_.regular_block(() => {
			{
				const comp = Activity;

				const args = [
					{
						mode,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Activity;

									const args = [
										{
											mode: inner,
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													let __out = '';

													__out += _$_.escape(String(value.value));
													_$_.output_push(__out);
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
		const mode = _$_.track('hidden', 'www7if');
		const input = _$_.track(initial, 'c5yrg2');

		controls = { mode, input };

		function AsyncChild() {
			return _$_.tsrx_element(() => {
				const data = _$_.track_async(
					async () => {
						calls.push('fetch');

						return input.value;
					},
					'ddhrr4'
				);

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p>';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(data.value);
					}

					__out += '</p>';
					_$_.output_push(__out);
				});
			});
		}

		_$_.regular_block(() => {
			{
				const comp = Activity;

				const args = [
					{
						mode,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = AsyncChild;
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

export function Recovery() {
	return _$_.tsrx_element(() => {
		const mode = _$_.track('hidden', '1ow5dng');
		const changed = _$_.track(false, 'w38juv');

		controls = { mode, changed };

		_$_.regular_block(() => {
			let __out = '';

			__out += '<main>';

			{
				const comp = Activity;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						mode,
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

function Broken() {
	return _$_.tsrx_element(() => {
		if (fail) throw new Error('deferred failure');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p>ok</p>';
			_$_.output_push(__out);
		});
	});
}

export function Errors() {
	return _$_.tsrx_element(() => {
		context.set('context');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			{
				_$_.output_push(__out);
				__out = '';

				_$_.try_block(
					() => {
						let __out = '';

						__out += '<!--[-->';

						{
							const comp = Activity;

							_$_.output_push(__out);
							__out = '';

							const args = [
								{
									mode: "hidden",
									children: _$_.tsrx_element(() => {
										return _$_.tsrx_element(() => {
											{
												const comp = Broken;
												const args = [{}];

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

						__out += '<!--]-->';
						_$_.output_push(__out);
					},
					(error) => {
						let __out = '';

						__out += '<!--[--><strong>';

						{
							_$_.output_push(__out);
							__out = '';
							_$_.render_expression(error.message);
						}

						__out += '</strong><!--]-->';
						_$_.output_push(__out);
					},
					null
				);

				{
					const comp = Activity;

					_$_.output_push(__out);
					__out = '';

					const args = [
						{
							mode: "hidden",
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									{
										const comp = Child;
										const args = [{ name: "after-error" }];

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

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function Stream() {
	return _$_.tsrx_element(() => {
		const mode = _$_.track('hidden', 'i41ox9');

		controls = { mode, observer: createRenderObserver() };

		function Data() {
			return _$_.tsrx_element(() => {
				const data = _$_.track_async(() => stream, 'fqa6fw');

				if (streamEffects) _$_.effect(() => {
					calls.push('stream effect');
				});

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="stream-value">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(data.value);
					}

					__out += '</p>';
					_$_.output_push(__out);
				});
			});
		}

		_$_.regular_block(() => {
			let __out = '';

			{
				const comp = Activity;

				_$_.output_push(__out);
				__out = '';

				const args = [
					{
						mode,
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

			__out += '<button>ordinary sibling</button>';
			_$_.output_push(__out);
		});
	});
}