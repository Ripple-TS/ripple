// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function Layout(__props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="layout">';

			{
				_$_.output_push(__out);
				__out = '';
				_$_.render_expression(__props.children);
			}

			__out += '</div>';
			_$_.output_push(__out);
		});
	});
}

export function TextWrappedLayout(__props) {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="layout">before';
			_$_.output_push(__out);
			__out = '';
			_$_.render_expression(__props.children);
			__out += 'after</div>';
			_$_.output_push(__out);
		});
	});
}

export function SingleChild() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="single">single</div>';
			_$_.output_push(__out);
		});
	});
}

export function MultiRootChild() {
	return _$_.tsrx_element(() => {
		_$_.regular_block(() => {
			let __out = '';

			__out += '<h1>title</h1><p>description</p>';
			_$_.output_push(__out);
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
								let __out = '';

								{
									const comp = SingleChild;
									const args = [{}];

									_$_.output_push(__out);
									__out = '';
									_$_.render_component(comp, ...args);
								}

								__out += '<div class="extra">extra</div>';
								_$_.output_push(__out);
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
				const comp = _$_.dynamic_element;

				const args = [
					{
						is: Tag,
						class: "host",
						children: _$_.tsrx_element(() => {
							return _$_.tsrx_element(() => {
								let __out = '';

								__out += 'hello';
								_$_.output_push(__out);
							});
						})
					}
				];

				_$_.render_component(comp, ...args);
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
									const comp = _$_.dynamic_element;
									const args = [{ is: Comp }];

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