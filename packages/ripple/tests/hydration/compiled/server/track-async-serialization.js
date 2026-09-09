// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Money as _$_Money__ } from '../fixtures/money.js';
import { track, trackAsync } from 'ripple/server';
import { Money } from '../fixtures/money.js';

export const transport = {
	Money: {
		encode: (value) => value instanceof Money && [value.amount, value.currency],
		decode: ([amount, currency]) => new Money(amount, currency)
	}
};

export const _$_server_$_ = (() => {
	var _$_server_$_ = {};
	const Money = _$_Money__;

	_$_server_$_.formatValue = async function formatValue(n) {
		return `server-${n}`;
	};

	_$_server_$_.doubleMoney = async function doubleMoney(value) {
		if (!(value instanceof Money)) throw new Error('RPC argument was not revived');

		return new Money(value.amount * 2, value.currency);
	};

	return _$_server_$_;
})();

const doubleMoney = function (...args) {
	return _$_server_$_.doubleMoney(...args);
};

const formatValue = function (...args) {
	return _$_server_$_.formatValue(...args);
};

function MoneyResult({ count }) {
	return _$_.tsrx_element(() => {
		let lazy = _$_.track_async(() => doubleMoney(new Money(count.value, 'USD')), '2e21cbe9');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="result">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(lazy.value.format());
			}

			__out += '</p>';
			_$_.output_push(__out);
		});
	});
}

export function AsyncCustomType() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(6, 'f0c2b41e');

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
						const comp = MoneyResult;
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

function ServerCallResult({ count }) {
	return _$_.tsrx_element(() => {
		let lazy_2 = _$_.track_async(() => formatValue(count.value), '4e502c38');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="result">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(lazy_2.value);
			}

			__out += '</p>';
			_$_.output_push(__out);
		});
	});
}

export function AsyncWithServerCall() {
	return _$_.tsrx_element(() => {
		let lazy_3 = _$_.track(0, '14891754');

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
						const args = [{ count: lazy_3 }];

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

				let lazy_4 = _$_.track_async(() => Promise.resolve('hydrated value'), 'f325448a');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="result">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(lazy_4.value);
					}

					__out += '</p>';
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

				let lazy_5 = _$_.track_async(() => Promise.resolve(42), 'ab8199a0');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<span class="count">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(lazy_5.value);
					}

					__out += '</span>';
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

				let lazy_6 = _$_.track_async(() => Promise.resolve({ name: 'Alice', age: 30 }), 'fb7ad40b');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<div class="user"><span class="name">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(lazy_6.value.name);
					}

					__out += '</span><span class="age">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(lazy_6.value.age);
					}

					__out += '</span></div>';
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

				let lazy_7 = _$_.track_async(() => Promise.resolve('alpha'), '99982de5');
				let lazy_8 = _$_.track_async(() => Promise.resolve('beta'), '1dea4c85');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<div class="multi"><span class="first">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(lazy_7.value);
					}

					__out += '</span><span class="second">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(lazy_8.value);
					}

					__out += '</span></div>';
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

				let lazy_9 = _$_.track_async(() => Promise.reject(new Error('fetch failed')), 'c9d12acf');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="result">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(lazy_9.value);
					}

					__out += '</p>';
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

					__out += '<p class="error">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(e.message);
					}

					__out += '</p>';
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

				let lazy_10 = _$_.track_async(() => Promise.reject(new Error('child error')), 'cdd1adb8');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<p class="result">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(lazy_10.value);
					}

					__out += '</p>';
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

					__out += '<p class="parent-error">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(e.message);
					}

					__out += '</p>';
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
		let lazy_11 = _$_.track_async(() => Promise.resolve(`count-${count.value}`), '18c43c3a');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="result">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(lazy_11.value);
			}

			__out += '</p>';
			_$_.output_push(__out);
		});
	});
}

export function AsyncWithReactiveDependency() {
	return _$_.tsrx_element(() => {
		let lazy_12 = _$_.track(0, 'd5dcc1d3');

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
						const args = [{ count: lazy_12 }];

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