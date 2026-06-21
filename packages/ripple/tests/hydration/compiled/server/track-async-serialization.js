// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track, trackAsync } from 'ripple/server';

export const _$_server_$_ = (() => {
	var _$_server_$_ = {};

	_$_server_$_.formatValue = async function formatValue(n) {
		return `server-${n}`;
	};

	return _$_server_$_;
})();

const formatValue = function (...args) {
	return _$_server_$_.formatValue(...args);
};

function ServerCallResult({ count }) {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track_async(() => formatValue(count.value), '2e21cbe9');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="result">' + _$_.escape(lazy.value) + '</p>';
			_$_.output_push(__out);
		});
	});
}

export function AsyncWithServerCall() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(0, 'f0c2b41e');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="increment">increment</button>';
			_$_.output_push(__out);
			__out = '';

			_$_.try_block(
				() => {
					let __out = '';

					__out += '<!--[-->';

					{
						const comp = ServerCallResult;
						const args = [{ count: lazy_1 }];

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

					__out += '<!--[--><p class="loading">loading...</p><!--]-->';
					_$_.output_push(__out);
				}
			);

			_$_.output_push(__out);
		});
	});
}

export function AsyncSimpleValue() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';

				let lazy_2 = _$_.track_async(() => Promise.resolve('hydrated value'), '4e502c38');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="result">' + _$_.escape(lazy_2.value) + '</p>';
					_$_.output_push(__out);
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

export function AsyncNumericValue() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';

				let lazy_3 = _$_.track_async(() => Promise.resolve(42), '14891754');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<span class="count">' + _$_.escape(lazy_3.value) + '</span>';
					_$_.output_push(__out);
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

					__out += '<span class="pending">...</span>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}

export function AsyncObjectValue() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';

				let lazy_4 = _$_.track_async(() => Promise.resolve({ name: 'Alice', age: 30 }), 'f325448a');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<div class="user"><span class="name">' + _$_.escape(lazy_4.value.name) + '</span><span class="age">' + _$_.escape(lazy_4.value.age) + '</span></div>';
					_$_.output_push(__out);
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

					__out += '<div class="loading">loading user...</div>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}

export function AsyncMultipleValues() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';

				let lazy_5 = _$_.track_async(() => Promise.resolve('alpha'), 'ab8199a0');
				let lazy_6 = _$_.track_async(() => Promise.resolve('beta'), 'fb7ad40b');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<div class="multi"><span class="first">' + _$_.escape(lazy_5.value) + '</span><span class="second">' + _$_.escape(lazy_6.value) + '</span></div>';
					_$_.output_push(__out);
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

					__out += '<div class="loading">loading...</div>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}

export function AsyncWithCatch() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';

				let lazy_7 = _$_.track_async(() => Promise.reject(new Error('fetch failed')), '99982de5');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="result">' + _$_.escape(lazy_7.value) + '</p>';
					_$_.output_push(__out);
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

					__out += '<p class="error">' + _$_.escape(e.message) + '</p>';
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

export function ChildWithError() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';

				let lazy_8 = _$_.track_async(() => Promise.reject(new Error('child error')), '1dea4c85');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="result">' + _$_.escape(lazy_8.value) + '</p>';
					_$_.output_push(__out);
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

					__out += '<p class="pending">loading...</p>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			}
		);
	});
}

export function ParentWithCatch() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					{
						const comp = ChildWithError;
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

					__out += '<p class="parent-error">' + _$_.escape(e.message) + '</p>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			null
		);
	});
}

function ReactiveDependencyResult({ count }) {
	return _$_.tsrx_element(() => {
		let lazy_9 = _$_.track_async(() => Promise.resolve(`count-${count.value}`), 'c9d12acf');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="result">' + _$_.escape(lazy_9.value) + '</p>';
			_$_.output_push(__out);
		});
	});
}

export function AsyncWithReactiveDependency() {
	return _$_.tsrx_element(() => {
		let lazy_10 = _$_.track(0, 'cdd1adb8');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<button class="increment">increment</button>';
			_$_.output_push(__out);
			__out = '';

			_$_.try_block(
				() => {
					let __out = '';

					__out += '<!--[-->';

					{
						const comp = ReactiveDependencyResult;
						const args = [{ count: lazy_10 }];

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

					__out += '<!--[--><p class="loading">loading...</p><!--]-->';
					_$_.output_push(__out);
				}
			);

			_$_.output_push(__out);
		});
	});
}