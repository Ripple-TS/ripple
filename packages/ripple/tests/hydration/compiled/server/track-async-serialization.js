// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { Money as _$_Money__ } from '../fixtures/money.js';
import { track, trackAsync, trackReadOnly } from 'ripple/server';
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
		const money = _$_.track_async(() => doubleMoney(new Money(count.value, 'USD')), 'csssmh');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<p class="result">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(money.value.format());
			}

			__out += '</p>';
			_$_.output_push(__out);
		});
	});
}

export function AsyncCustomType() {
	return _$_.tsrx_element(() => {
		const count = _$_.track(6, '1usw1lq');

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
						const args = [{ count }];

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
		const data = _$_.track_async(() => formatValue(count.value), 'lq8y0o');

		_$_.regular_block(() => {
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
	});
}

export function AsyncWithServerCall() {
	return _$_.tsrx_element(() => {
		const count = _$_.track(0, '5p4g2c');

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
						const args = [{ count }];

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

				const data = _$_.track_async(() => Promise.resolve('hydrated value'), '1vgpoju');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
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

				const count = _$_.track_async(() => Promise.resolve(42), '1bl4m1s');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<span class="count">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(count.value);
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

				const user = _$_.track_async(() => Promise.resolve({ name: 'Alice', age: 30 }), '1xrym8b');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<div class="user"><span class="name">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(user.value.name);
					}

					__out += '</span><span class="age">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(user.value.age);
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

				const first = _$_.track_async(() => Promise.resolve('alpha'), '16m7mxx');
				const second = _$_.track_async(() => Promise.resolve('beta'), '8atc3p');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<div class="multi"><span class="first">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(first.value);
					}

					__out += '</span><span class="second">';

					{
						_$_.output_push(__out);
						__out = '';
						_$_.render_expression(second.value);
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

				const data = _$_.track_async(() => Promise.reject(new Error('fetch failed')), '1jzw72n');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
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

				const data = _$_.track_async(() => Promise.reject(new Error('child error')), '1l3vago');

				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
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
		const data = _$_.track_async(() => Promise.resolve(`count-${count.value}`), '6vdwe2');

		_$_.regular_block(() => {
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
	});
}

export function AsyncWithReactiveDependency() {
	return _$_.tsrx_element(() => {
		const count = _$_.track(0, '1nc7lqr');

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
						const args = [{ count }];

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

export function AsyncWithReadOnlyDependency() {
	return _$_.tsrx_element(() => {
		const count = _$_.track(0, 'wnak4k');

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
						const args = [{ count: _$_.track_read_only(count) }];

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