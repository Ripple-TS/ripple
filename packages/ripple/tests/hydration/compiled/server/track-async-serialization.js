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

export function AsyncWithServerCall() {
	_$_.push_component();

	let lazy = _$_.track(0, '2e21cbe9');

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="increment"');
		_$_.output_push('>');

		{
			_$_.output_push('increment');
		}

		_$_.output_push('</button>');
	});

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			let lazy_1 = _$_.track_async(() => formatValue(_$_.get(lazy)), 'f0c2b41e');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="result"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(_$_.get(lazy_1)));
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		},
		null,
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="loading"');
				_$_.output_push('>');

				{
					_$_.output_push('loading...');
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		}
	);

	_$_.pop_component();
}

export function AsyncSimpleValue() {
	_$_.push_component();

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			let lazy_2 = _$_.track_async(() => Promise.resolve('hydrated value'), '4e502c38');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="result"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(_$_.get(lazy_2)));
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		},
		null,
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="loading"');
				_$_.output_push('>');

				{
					_$_.output_push('loading...');
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		}
	);

	_$_.pop_component();
}

export function AsyncNumericValue() {
	_$_.push_component();

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			let lazy_3 = _$_.track_async(() => Promise.resolve(42), '14891754');

			_$_.regular_block(() => {
				_$_.output_push('<span');
				_$_.output_push(' class="count"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(_$_.get(lazy_3)));
				}

				_$_.output_push('</span>');
			});

			_$_.output_push('<!--]-->');
		},
		null,
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<span');
				_$_.output_push(' class="pending"');
				_$_.output_push('>');

				{
					_$_.output_push('...');
				}

				_$_.output_push('</span>');
			});

			_$_.output_push('<!--]-->');
		}
	);

	_$_.pop_component();
}

export function AsyncObjectValue() {
	_$_.push_component();

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			let lazy_4 = _$_.track_async(() => Promise.resolve({ name: 'Alice', age: 30 }), 'f325448a');

			_$_.regular_block(() => {
				_$_.output_push('<div');
				_$_.output_push(' class="user"');
				_$_.output_push('>');

				{
					_$_.output_push('<span');
					_$_.output_push(' class="name"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(_$_.get(lazy_4).name));
					}

					_$_.output_push('</span>');
					_$_.output_push('<span');
					_$_.output_push(' class="age"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(_$_.get(lazy_4).age));
					}

					_$_.output_push('</span>');
				}

				_$_.output_push('</div>');
			});

			_$_.output_push('<!--]-->');
		},
		null,
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<div');
				_$_.output_push(' class="loading"');
				_$_.output_push('>');

				{
					_$_.output_push('loading user...');
				}

				_$_.output_push('</div>');
			});

			_$_.output_push('<!--]-->');
		}
	);

	_$_.pop_component();
}

export function AsyncMultipleValues() {
	_$_.push_component();

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			let lazy_5 = _$_.track_async(() => Promise.resolve('alpha'), 'ab8199a0');
			let lazy_6 = _$_.track_async(() => Promise.resolve('beta'), 'fb7ad40b');

			_$_.regular_block(() => {
				_$_.output_push('<div');
				_$_.output_push(' class="multi"');
				_$_.output_push('>');

				{
					_$_.output_push('<span');
					_$_.output_push(' class="first"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(_$_.get(lazy_5)));
					}

					_$_.output_push('</span>');
					_$_.output_push('<span');
					_$_.output_push(' class="second"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(_$_.get(lazy_6)));
					}

					_$_.output_push('</span>');
				}

				_$_.output_push('</div>');
			});

			_$_.output_push('<!--]-->');
		},
		null,
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<div');
				_$_.output_push(' class="loading"');
				_$_.output_push('>');

				{
					_$_.output_push('loading...');
				}

				_$_.output_push('</div>');
			});

			_$_.output_push('<!--]-->');
		}
	);

	_$_.pop_component();
}

export function AsyncWithCatch() {
	_$_.push_component();

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			let lazy_7 = _$_.track_async(() => Promise.reject(new Error('fetch failed')), '99982de5');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="result"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(_$_.get(lazy_7)));
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		},
		(e) => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="error"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(e.message));
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		},
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="loading"');
				_$_.output_push('>');

				{
					_$_.output_push('loading...');
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		}
	);

	_$_.pop_component();
}

export function ChildWithError() {
	_$_.push_component();

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			let lazy_8 = _$_.track_async(() => Promise.reject(new Error('child error')), '1dea4c85');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="result"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(_$_.get(lazy_8)));
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		},
		null,
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="pending"');
				_$_.output_push('>');

				{
					_$_.output_push('loading...');
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		}
	);

	_$_.pop_component();
}

export function ParentWithCatch() {
	_$_.push_component();

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				{
					const comp = ChildWithError;
					const args = [{}];

					comp(...args);
				}
			});

			_$_.output_push('<!--]-->');
		},
		(e) => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="parent-error"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(e.message));
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		},
		null
	);

	_$_.pop_component();
}

export function AsyncWithReactiveDependency() {
	_$_.push_component();

	let lazy_9 = _$_.track(0, 'c9d12acf');

	_$_.regular_block(() => {
		_$_.output_push('<button');
		_$_.output_push(' class="increment"');
		_$_.output_push('>');

		{
			_$_.output_push('increment');
		}

		_$_.output_push('</button>');
	});

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			let lazy_10 = _$_.track_async(() => Promise.resolve(`count-${_$_.get(lazy_9)}`), 'cdd1adb8');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="result"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(_$_.get(lazy_10)));
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		},
		null,
		() => {
			_$_.output_push('<!--[-->');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="loading"');
				_$_.output_push('>');

				{
					_$_.output_push('loading...');
				}

				_$_.output_push('</p>');
			});

			_$_.output_push('<!--]-->');
		}
	);

	_$_.pop_component();
}