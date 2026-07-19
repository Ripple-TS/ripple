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
		let lazy = _$_.track_async(() => controls.basic.promise, '703e438e');
		let lazy_1 = _$_.track(0, '928bce39');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="resolved"><span class="value">' + _$_.escape(lazy.value + ':' + lazy_1.value) + '</span><button class="inc">inc</button></div>';
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
		let lazy_2 = _$_.track_async(() => controls.catchOnly.promise, '50f939c6');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="resolved">' + _$_.escape(lazy_2.value) + '</p>';
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

					__out += '<!--[--><em class="caught">' + _$_.escape(e.message) + '</em><!--]-->';
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
		let lazy_3 = _$_.track_async(() => controls.rejects.promise, '96452a54');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="resolved">' + _$_.escape(lazy_3.value) + '</p>';
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

					__out += '<em class="caught">' + _$_.escape(e.message) + '</em>';
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
		let lazy_4 = _$_.track_async(() => controls.noCatch.promise, '6baa716b');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="resolved">' + _$_.escape(lazy_4.value) + '</p>';
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

			__out += '<section class="root-catch">' + _$_.escape(error.message) + '</section>';
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
		let lazy_5 = _$_.track_async(() => controls.head.promise, '9cd3c3cd');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			if (lazy_5.value) {
				__out += '<!--[--><p class="head-content">' + _$_.escape(lazy_5.value) + '</p>';
				_$_.output_push(__out);
				__out = '';
				_$_.set_output_target('head');
				__out += '<!--814bacd9--><title>' + _$_.escape('title:' + lazy_5.value) + '</title>';
				_$_.output_push(__out);
				__out = '';
				_$_.set_output_target(null);
				__out += '<!--]-->';
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
		let lazy_6 = _$_.track_async(() => controls.rootDirect.promise, 'bc9e61da');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="root-async">' + _$_.escape(lazy_6.value) + '</p>';
			_$_.output_push(__out);
		});
	});
}

function OuterContent() {
	return _$_.tsrx_element(() => {
		let lazy_7 = _$_.track_async(() => controls.outer.promise, '35931cce');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="outer">' + _$_.escape(lazy_7.value) + '</p>';
			_$_.output_push(__out);
		});
	});
}

function InnerContent() {
	return _$_.tsrx_element(() => {
		let lazy_8 = _$_.track_async(() => controls.inner.promise, '6c7d38ed');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="inner">' + _$_.escape(lazy_8.value) + '</p>';
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
						{
							const comp = OuterContent;
							const args = [{}];

							_$_.render_component(comp, ...args);
						}

						_$_.try_block(
							() => {
								let __out = '';

								__out += '<!--[-->';

								{
									const comp = InnerContent;
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

								__out += '<!--[--><p class="inner-loading">inner-loading</p><!--]-->';
								_$_.output_push(__out);
							}
						);
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

					__out += '<p class="outer-loading">outer-loading</p>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}