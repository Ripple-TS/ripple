// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { trackAsync } from 'ripple/server';

export function AsyncSimpleValue() {
	_$_.push_component();

	_$_.try_block(
		() => {
			_$_.output_push('<!--[-->');

			let lazy = _$_.track_async(() => Promise.resolve('hydrated value'), '2e21cbe9');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="result"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(_$_.get(lazy)));
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

			let lazy_1 = _$_.track_async(() => Promise.resolve(42), 'f0c2b41e');

			_$_.regular_block(() => {
				_$_.output_push('<span');
				_$_.output_push(' class="count"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(_$_.get(lazy_1)));
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

			let lazy_2 = _$_.track_async(() => Promise.resolve({ name: 'Alice', age: 30 }), '4e502c38');

			_$_.regular_block(() => {
				_$_.output_push('<div');
				_$_.output_push(' class="user"');
				_$_.output_push('>');

				{
					_$_.output_push('<span');
					_$_.output_push(' class="name"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(_$_.get(lazy_2).name));
					}

					_$_.output_push('</span>');
					_$_.output_push('<span');
					_$_.output_push(' class="age"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(_$_.get(lazy_2).age));
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

			let lazy_3 = _$_.track_async(() => Promise.resolve('alpha'), '14891754');
			let lazy_4 = _$_.track_async(() => Promise.resolve('beta'), 'f325448a');

			_$_.regular_block(() => {
				_$_.output_push('<div');
				_$_.output_push(' class="multi"');
				_$_.output_push('>');

				{
					_$_.output_push('<span');
					_$_.output_push(' class="first"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(_$_.get(lazy_3)));
					}

					_$_.output_push('</span>');
					_$_.output_push('<span');
					_$_.output_push(' class="second"');
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(_$_.get(lazy_4)));
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

			let lazy_5 = _$_.track_async(() => Promise.reject(new Error('fetch failed')), 'ab8199a0');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="result"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(_$_.get(lazy_5)));
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

			let lazy_6 = _$_.track_async(() => Promise.reject(new Error('child error')), 'fb7ad40b');

			_$_.regular_block(() => {
				_$_.output_push('<p');
				_$_.output_push(' class="result"');
				_$_.output_push('>');

				{
					_$_.output_push(_$_.escape(_$_.get(lazy_6)));
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