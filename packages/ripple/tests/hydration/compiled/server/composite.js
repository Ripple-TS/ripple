// @ts-nocheck
import * as _$_ from 'ripple/internal/server';
import { Dynamic as TsrxDynamic } from 'ripple/server';

export function Layout(__props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="layout"');
			_$_.output_push('>');

			{
				_$_.render_expression(__props.children);
			}

			_$_.output_push('</div>');
		});
	});
}

export function TextWrappedLayout(__props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="layout"');
			_$_.output_push('>');

			{
				_$_.output_push('before');
				_$_.render_expression(__props.children);
				_$_.output_push('after');
			}

			_$_.output_push('</div>');
		});
	});
}

export function SingleChild() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push(' class="single"');
			_$_.output_push('>');

			{
				_$_.output_push('single');
			}

			_$_.output_push('</div>');
		});
	});
}

export function MultiRootChild() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				_$_.output_push('<h1');
				_$_.output_push('>');

				{
					_$_.output_push('title');
				}

				_$_.output_push('</h1>');
				_$_.output_push('<p');
				_$_.output_push('>');

				{
					_$_.output_push('description');
				}

				_$_.output_push('</p>');
			}
		});
	});
}

export function EmptyLayout() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = Layout;
				const args = [{}];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function LayoutWithSingleChild() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = Layout;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = SingleChild;
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

export function LayoutWithMultipleChildren() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = Layout;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = SingleChild;
									const args = [{}];

									_$_.render_component(comp, ...args);
								}

								_$_.output_push('<div');
								_$_.output_push(' class="extra"');
								_$_.output_push('>');

								{
									_$_.output_push('extra');
								}

								_$_.output_push('</div>');
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
			}
		});
	});
}

export function LayoutWithMultiRootChild() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = Layout;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = MultiRootChild;
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

export function LayoutWithTextAroundChildren() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			{
				const comp = TextWrappedLayout;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = SingleChild;
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

export function DynamicTagElement() {
	return _$_.tsrx_element(() => {
		const Tag = 'section';

		_$_.regular_block(() => {
			{
				const comp = TsrxDynamic;

				const args = [
					{
						is: Tag,
						class: "host",
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								_$_.output_push('hello');
							});
						})
					}
				];

				if (comp) {
					_$_.render_component(comp, ...args);
				}
			}
		});
	});
}

export function DynamicTagComponent() {
	return _$_.tsrx_element(() => {
		const Comp = SingleChild;

		_$_.regular_block(() => {
			{
				const comp = Layout;

				const args = [
					{
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								{
									const comp = TsrxDynamic;
									const args = [{ is: Comp }];

									if (comp) {
										_$_.render_component(comp, ...args);
									}
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