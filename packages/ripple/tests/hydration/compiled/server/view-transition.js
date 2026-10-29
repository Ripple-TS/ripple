// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import {
	ViewTransition,
	Activity,
	createViewTransition,
	track,
	trackAsync,
	Hydrate
} from 'ripple/server';

import { condition } from 'ripple/hydration';

export let transition;
export let count;
export let reveal;
export let mode;
export let pending = Promise.withResolvers();

export function reset() {
	pending = Promise.withResolvers();
}

export function Plain() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<button>hello</button>';
			_$_.output_push(__out);
		});
	});
}

export function Wrapped() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = ViewTransition;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<button>hello</button>';
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

export function App() {
	return _$_.tsrx_element(() => {
		transition = createViewTransition();
		count = _$_.track(0, 'vsl822');

		_$_.regular_block(() => {
			{
				const comp = ViewTransition;

				const args = [
					{
						name: "counter",
						update: "counter-update",
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<button class="counter">' + _$_.escape(count.value) + '</button>';
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

function AsyncContent() {
	return _$_.tsrx_element(() => {
		const data = _$_.track_async(() => pending.promise, '9h55rr');

		_$_.regular_block(() => {
			{
				const comp = ViewTransition;

				const args = [
					{
						name: "result",
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += '<p class="result">';

								{
									_$_.output_push(__out);
									__out = '';
									_$_.render_expression(data.value);
								}

								__out += '</p>';
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

export function Stream() {
	return _$_.tsrx_element(() => {
		transition = createViewTransition();
		count = _$_.track(0, 'zmgaxu');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="counter">' + _$_.escape(count.value) + '</button>';
			_$_.output_push(__out);
			__out = '';

			_$_.try_block(
				() => {
					let __out = '';

					__out += '<!--[-->';

					{
						const comp = AsyncContent;
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

					__out += '<!--[--><p class="loading">loading</p><!--]-->';
					_$_.output_push(__out);
				}
			);

			_$_.output_push(__out);
		});
	});
}

export function WrappedStream() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = ViewTransition;

				const args = [
					{
						name: "stream",
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Stream;
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

export function Deferred() {
	return _$_.tsrx_element(() => {
		transition = createViewTransition();
		reveal = _$_.track(false, '1uqpwf6');

		_$_.regular_block(() => {
			{
				const comp = Hydrate;

				const args = [
					{
						when: condition(() => reveal.value),
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = ViewTransition;

									const args = [
										{
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													let __out = '';

													__out += '<input value="server" />';
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

export function WrappedActivity({ initial = 'visible' }) {
	return _$_.tsrx_element(() => {
		transition = createViewTransition();
		mode = _$_.track(initial, '1ke0m6y');
		count = _$_.track(0, '10vql9x');

		_$_.regular_block(() => {
			{
				const comp = ViewTransition;

				const args = [
					{
						name: "activity",
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = Activity;

									const args = [
										{
											mode,
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													let __out = '';

													__out += '<input value="draft" /><button>' + _$_.escape(count.value) + '</button>';
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

export function ActivityAroundTransition({ initial = 'visible' }) {
	return _$_.tsrx_element(() => {
		transition = createViewTransition();
		mode = _$_.track(initial, '6wtv2t');
		count = _$_.track(0, '1xjynqc');

		_$_.regular_block(() => {
			{
				const comp = Activity;

				const args = [
					{
						mode,
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = ViewTransition;

									const args = [
										{
											name: "activity",
											children: _$_.tsrx_element(() => {
												return _$_.tsrx_element(() => {
													let __out = '';

													__out += '<input value="draft" /><button>' + _$_.escape(count.value) + '</button>';
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

export function Scoped({ value = 'auto' }) {
	return _$_.tsrx_element(() => {
		_$_.output_register_css('tsrx-79a67cbe');
		transition = createViewTransition();
		count = _$_.track(0, 'bm7o44');

		_$_.regular_block(() => {
			{
				{
					const comp = ViewTransition;

					const args = [
						{
							name: "scoped",
							default: value,
							children: _$_.tsrx_element(() => {
								return _$_.tsrx_element(() => {
									let __out = '';

									__out += '<button class="tsrx-79a67cbe">' + _$_.escape(count.value) + '</button>';
									_$_.output_push(__out);
								});
							}),
							$v: 'tsrx-79a67cbe'
						}
					];

					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

_$_.register_css('tsrx-79a67cbe', '\n			::view-transition-group(*.tsrx-79a67cbe) {\n				animation-duration: 100ms;\n			}\n			::view-transition-new(.notice.tsrx-79a67cbe) {\n				opacity: 1;\n			}\n		');