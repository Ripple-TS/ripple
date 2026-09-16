// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track, trackAsync } from 'ripple/server';

function make() {
	let resolve = () => {};
	let reject = () => {};

	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

export const controls = {};

export function resetControls() {
	controls.basic = make();
	controls.catchOnly = make();
	controls.rejects = make();
	controls.noCatch = make();
	controls.outer = make();
	controls.inner = make();
	controls.rootDirect = make();
	controls.head = make();
}

resetControls();

function BasicContent() {
	return _$_.tsrx_element(() => {
		const data = _$_.track_async(() => controls.basic.promise, 'v55zf2');
		const count = _$_.track(0, '14nt3jt');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="resolved"><span class="value">' + _$_.escape(data.value + ':' + count.value) + '</span><button class="inc">inc</button></div>';
			_$_.output_push(__out);
		});
	});
}

export function StreamPending() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<span class="before">before</span>';
			_$_.output_push(__out);
			__out = '';

			_$_.try_block(
				() => {
					let __out = '';

					__out += '<!--[-->';

					{
						const comp = BasicContent;
						const args = [{}];

						_$_.output_push(__out);
						__out = '';
						_$_.render_component(comp, ...args);
					}

					__out += '<footer class="after-async">after-async</footer><!--]-->';
					_$_.output_push(__out);
				},
				null,
				() => {
					let __out = '';

					__out += '<!--[--><p class="loading">loading...</p><!--]-->';
					_$_.output_push(__out);
				}
			);

			__out += '<span class="sibling-after">sibling-after</span>';
			_$_.output_push(__out);
		});
	});
}

function CatchOnlyContent() {
	return _$_.tsrx_element(() => {
		const data = _$_.track_async(() => controls.catchOnly.promise, 'mgtlfq');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="resolved">';

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

export function StreamCatchOnly() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<span class="before">before</span>';
			_$_.output_push(__out);
			__out = '';

			_$_.try_block(
				() => {
					let __out = '';

					__out += '<!--[-->';

					{
						const comp = CatchOnlyContent;
						const args = [{}];

						_$_.output_push(__out);
						__out = '';
						_$_.render_component(comp, ...args);
					}

					__out += '<!--]-->';
					_$_.output_push(__out);
				},
				(e) => {
					let __out = '';

					__out += '<!--[--><em class="caught">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(e.message);
					}

					__out += '</em><!--]-->';
					_$_.output_push(__out);
				},
				null
			);

			_$_.output_push(__out);
		});
	});
}

function RejectContent() {
	return _$_.tsrx_element(() => {
		const data = _$_.track_async(() => controls.rejects.promise, '15p08yc');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="resolved">';

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

export function StreamRejects() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					{
						const comp = RejectContent;
						const args = [{}];

						_$_.render_component(comp, ...args);
					}
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			(e) => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<em class="caught">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(e.message);
					}

					__out += '</em>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="loading">loading...</p>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}

function NoCatchContent() {
	return _$_.tsrx_element(() => {
		const data = _$_.track_async(() => controls.noCatch.promise, 'tvfywb');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="resolved">';

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

export function StreamNoCatch() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					{
						const comp = NoCatchContent;
						const args = [{}];

						_$_.render_component(comp, ...args);
					}
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			null,
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="loading">loading...</p>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}

export function RootCatch({ error, reset }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<section class="root-catch">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(error.message);
			}

			__out += '</section>';
			_$_.output_push(__out);
		});
	});
}

export function RootPending() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="root-pending">root-loading</p>';
			_$_.output_push(__out);
		});
	});
}

function HeadContent() {
	return _$_.tsrx_element(() => {
		const data = _$_.track_async(() => controls.head.promise, '17ii47h');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			if (data.value) {
				__out += '<p class="head-content">';

				{
					_$_.output_push(__out);
					__out = '';
					_$_.render_expression(data.value);
				}

				__out += '</p>';
				_$_.output_push(__out);
				__out = '';
				_$_.set_output_target('head');
				__out += '<!--1ad4258e--><title>' + _$_.escape('title:' + data.value) + '</title>';
				_$_.output_push(__out);
				__out = '';
				_$_.set_output_target(null);
			}

			__out += '<!--]--><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function StreamHead() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					{
						const comp = HeadContent;
						const args = [{}];

						_$_.render_component(comp, ...args);
					}
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			null,
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="loading">loading...</p>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}

export function StreamRootDirect() {
	return _$_.tsrx_element(() => {
		const data = _$_.track_async(() => controls.rootDirect.promise, '1gc250a');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="root-async">';

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

function OuterContent() {
	return _$_.tsrx_element(() => {
		const data = _$_.track_async(() => controls.outer.promise, 'ev54ge');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="outer">';

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

function InnerContent() {
	return _$_.tsrx_element(() => {
		const data = _$_.track_async(() => controls.inner.promise, 'u3o1kd');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="inner">';

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

export function StreamNested() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					{
						const comp = OuterContent;
						const args = [{}];

						_$_.render_component(comp, ...args);
					}
				});

				_$_.output_push(__out);
				__out = '';

				_$_.try_block(
					() => {
						let __out = '';

						__out += '<!--[-->';
						_$_.output_push(__out);
						__out = '';

						_$_.regular_block(() => {
							{
								const comp = InnerContent;
								const args = [{}];

								_$_.render_component(comp, ...args);
							}
						});

						__out += '<!--]-->';
						_$_.output_push(__out);
					},
					null,
					() => {
						let __out = '';

						__out += '<!--[-->';
						_$_.output_push(__out);
						__out = '';

						_$_.regular_block(() => {
							let __out = '';

							__out += '<p class="inner-loading">inner-loading</p>';
							_$_.output_push(__out);
						});

						__out += '<!--]-->';
						_$_.output_push(__out);
					}
				);

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			null,
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="outer-loading">outer-loading</p>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}