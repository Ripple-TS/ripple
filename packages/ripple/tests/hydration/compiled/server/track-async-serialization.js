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
			_$_.output_push('<p');
			_$_.output_push(' class="result"');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(lazy.value));
			}

			_$_.output_push('</p>');
		});
	});
}

export function AsyncWithServerCall() {
	return _$_.tsrx_element(() => {
		let lazy_1 = _$_.track(0, 'f0c2b41e');

		_$_.regular_block(() => {
			{
				_$_.output_push('<button');
				_$_.output_push(' class="increment"');
				_$_.output_push('>');

				{
					_$_.output_push('increment');
				}

				_$_.output_push('</button>');

				_$_.try_block(
					() => {
						_$_.output_push('<!--[-->');

						{
							const comp = ServerCallResult;
							const args = [{ count: lazy_1 }];

							_$_.render_component(comp, ...args);
						}

						_$_.output_push('<!--]-->');
					},
					null,
					() => {
						_$_.output_push('<!--[-->');
						_$_.output_push('<p');
						_$_.output_push(' class="loading"');
						_$_.output_push('>');

						{
							_$_.output_push('loading...');
						}

						_$_.output_push('</p>');
						_$_.output_push('<!--]-->');
					}
				);
			}
		});
	});
}

export function AsyncSimpleValue() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				_$_.output_push('<!--[-->');

				let lazy_2 = _$_.track_async(() => Promise.resolve('hydrated value'), '4e502c38');

				_$_.regular_block(() => {
					_$_.output_push('<p');
					_$_.output_push(' class="result"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(lazy_2.value));
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
	});
}

export function AsyncNumericValue() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				_$_.output_push('<!--[-->');

				let lazy_3 = _$_.track_async(() => Promise.resolve(42), '14891754');

				_$_.regular_block(() => {
					_$_.output_push('<span');
					_$_.output_push(' class="count"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(lazy_3.value));
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
	});
}

export function AsyncObjectValue() {
	return _$_.tsrx_element(() => {
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
							_$_.output_push(_$_.escape(lazy_4.value.name));
						}

						_$_.output_push('</span>');
						_$_.output_push('<span');
						_$_.output_push(' class="age"');
						_$_.output_push('>');

						{
							_$_.output_push(_$_.escape(lazy_4.value.age));
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
	});
}

export function AsyncMultipleValues() {
	return _$_.tsrx_element(() => {
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
							_$_.output_push(_$_.escape(lazy_5.value));
						}

						_$_.output_push('</span>');
						_$_.output_push('<span');
						_$_.output_push(' class="second"');
						_$_.output_push('>');

						{
							_$_.output_push(_$_.escape(lazy_6.value));
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
	});
}

export function AsyncWithCatch() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				_$_.output_push('<!--[-->');

				let lazy_7 = _$_.track_async(() => Promise.reject(new Error('fetch failed')), '99982de5');

				_$_.regular_block(() => {
					_$_.output_push('<p');
					_$_.output_push(' class="result"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(lazy_7.value));
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
	});
}

export function ChildWithError() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				_$_.output_push('<!--[-->');

				let lazy_8 = _$_.track_async(() => Promise.reject(new Error('child error')), '1dea4c85');

				_$_.regular_block(() => {
					_$_.output_push('<p');
					_$_.output_push(' class="result"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(lazy_8.value));
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
	});
}

export function ParentWithCatch() {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				_$_.output_push('<!--[-->');

				_$_.regular_block(() => {
					{
						const comp = ChildWithError;
						const args = [{}];

						_$_.render_component(comp, ...args);
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
	});
}

function ReactiveDependencyResult({ count }) {
	return _$_.tsrx_element(() => {
		let lazy_9 = _$_.track_async(() => Promise.resolve(`count-${count.value}`), 'c9d12acf');

		_$_.regular_block(() => {
			_$_.output_push('<p');
			_$_.output_push(' class="result"');
			_$_.output_push('>');

			{
				_$_.output_push(_$_.escape(lazy_9.value));
			}

			_$_.output_push('</p>');
		});
	});
}

export function AsyncWithReactiveDependency() {
	return _$_.tsrx_element(() => {
		let lazy_10 = _$_.track(0, 'cdd1adb8');

		_$_.regular_block(() => {
			{
				_$_.output_push('<button');
				_$_.output_push(' class="increment"');
				_$_.output_push('>');

				{
					_$_.output_push('increment');
				}

				_$_.output_push('</button>');

				_$_.try_block(
					() => {
						_$_.output_push('<!--[-->');

						{
							const comp = ReactiveDependencyResult;
							const args = [{ count: lazy_10 }];

							_$_.render_component(comp, ...args);
						}

						_$_.output_push('<!--]-->');
					},
					null,
					() => {
						_$_.output_push('<!--[-->');
						_$_.output_push('<p');
						_$_.output_push(' class="loading"');
						_$_.output_push('>');

						{
							_$_.output_push('loading...');
						}

						_$_.output_push('</p>');
						_$_.output_push('<!--]-->');
					}
				);
			}
		});
	});
}