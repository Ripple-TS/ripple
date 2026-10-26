// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

import { track } from 'ripple/server';

export function App({ label, onClick }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<main>';

			{
				{
					const comp = Body;
					const args = [{ label, onClick }];

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

function Body({ label, onClick }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				{
					const comp = Row;
					const args = [{ label, onClick }];

					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

export function Row({ label, onClick }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			if (label) {
				__out += '<button' + _$_.attr('aria-label', label, false) + '>Press</button>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function FragmentRoot({ Child, label, onClick }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				{
					const comp = Child;
					const args = [{ label, onClick }];

					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

export function FragmentWithSiblings({ Child, label, onClick }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			{
				const comp = Child;
				const args = [{ label, onClick }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<button data-after="">After</button>';
			_$_.output_push(__out);
		});
	});
}

export function LoopChild({ label, onClick }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			for (const item of label ? [1, 2] : []) {
				__out += '<button' + _$_.attr('data-item', item, false) + _$_.attr('aria-label', label, false) + '>Press</button>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function SwitchChild({ label, onClick }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			switch (label) {
				case 'Click':
					__out += '<button' + _$_.attr('aria-label', label, false) + '>Press</button>';
					break;

				default:
					break;
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function TryChild({ label, onClick }) {
	return _$_.tsrx_element(() => {
		_$_.try_block(
			() => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<button' + _$_.attr('aria-label', label, false) + '>Press</button>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			(error) => {
				let __out = '';

				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.regular_block(() => {
					let __out = '';

					__out += '<span>Failed</span>';
					_$_.output_push(__out);
				});

				__out += '<!--]-->';
				_$_.output_push(__out);
			},
			null
		);
	});
}

export function PlainChild({ label, onClick }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<button' + _$_.attr('aria-label', label, false) + '>Press</button>';
			_$_.output_push(__out);
		});
	});
}

export function EmptyChild() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!---->';
			_$_.output_push(__out);
		});
	});
}

export function NestedChild({ label, onClick }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				{
					const comp = Body;
					const args = [{ label, onClick }];

					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

export function BranchLocalChild({ label, onClick }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			if (label) {
				function Local() {
					return _$_.tsrx_element(() => {
						let __out = '';

						__out += '<!--[-->';

						{
							{
								const comp = Row;
								const args = [{ label, onClick }];

								_$_.output_push(__out);
								__out = '';
								_$_.render_component(comp, ...args);
							}
						}

						__out += '<!--]-->';
						_$_.output_push(__out);
					});
				}

				{
					const comp = Local;
					const args = [{}];

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

export function ToggleChild() {
	return _$_.tsrx_element(() => {
		const visible = _$_.track(true, '69xkvl');

		_$_.regular_block(() => {
			let __out = '';

			__out += '<main>';

			{
				const comp = ReactiveBody;
				const args = [{ visible }];

				_$_.output_push(__out);
				__out = '';
				_$_.render_component(comp, ...args);
			}

			__out += '<button data-after="">Restore</button></main>';
			_$_.output_push(__out);
		});
	});
}

function ReactiveBody({ visible }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				{
					const comp = ReactiveRow;
					const args = [{ visible }];

					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

function ReactiveRow({ visible }) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';

			if (visible.value) {
				__out += '<button aria-label="Click">Press</button>';
			}

			__out += '<!--]-->';
			_$_.output_push(__out);
		});
	});
}