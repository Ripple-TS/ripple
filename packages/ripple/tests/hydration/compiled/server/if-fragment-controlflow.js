// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function IfFragmentForElement() {
	return _$_.tsrx_element(() => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		const hasLoaded = true;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="feed-c"><!--[-->';

			if (hasLoaded) {
				__out += '<!--[--><!--[-->';

				for (const muze of muzes) {
					__out += '<p class="muze">' + _$_.escape(muze.muzeId) + '</p>';
				}

				__out += '<!--]--><span class="after">after</span><!--]-->';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function IfFragmentForIfIf() {
	return _$_.tsrx_element(() => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		const hasLoaded = true;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="feed"><!--[-->';

			if (hasLoaded) {
				__out += '<!--[--><!--[-->';

				for (const muze of muzes) {
					__out += '<p class="muze">' + _$_.escape(muze.muzeId) + '</p>';
				}

				__out += '<!--]--><!--[-->';

				if (muzes.length > 0) {
					__out += '<span class="has-items">has items</span>';
				}

				__out += '<!--]--><!--[-->';

				if (muzes.length === 0) {
					__out += '<span class="empty">empty</span>';
				}

				__out += '<!--]--><!--]-->';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function IfFragmentElements() {
	return _$_.tsrx_element(() => {
		const hasLoaded = true;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="feed-b"><!--[-->';

			if (hasLoaded) {
				__out += '<!--[--><p class="muze">b</p><p class="muze">c</p><!--]-->';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function ComponentBodyFragmentControlFlow() {
	return _$_.tsrx_element(() => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[--><!--[-->';

			for (const muze of muzes) {
				__out += '<p class="muze">' + _$_.escape(muze.muzeId) + '</p>';
			}

			__out += '<!--]--><span class="after">after</span><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function ComponentBodyCodeBlockControlFlow() {
	return _$_.tsrx_element(() => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<!--[-->';
			_$_.output_push(__out);
			__out = '';

			_$_.render_expression(_$_.tsrx_element(() => {
				let __out = '';
				const rows = muzes;

				__out += '<!--[-->';

				for (const muze of rows) {
					__out += '<p class="muze">' + _$_.escape(muze.muzeId) + '</p>';
				}

				__out += '<!--]-->';
				_$_.output_push(__out);
			}));

			__out += '<span class="after">after</span><!--]-->';
			_$_.output_push(__out);
		});
	});
}

export function IfCodeBlockControlFlow() {
	return _$_.tsrx_element(() => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		const hasLoaded = true;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="feed-f"><!--[-->';

			if (hasLoaded) {
				__out += '<!--[-->';
				_$_.output_push(__out);
				__out = '';

				_$_.render_expression(_$_.tsrx_element(() => {
					let __out = '';
					const rows = muzes;

					__out += '<!--[-->';

					for (const muze of rows) {
						__out += '<p class="muze">' + _$_.escape(muze.muzeId) + '</p>';
					}

					__out += '<!--]-->';
					_$_.output_push(__out);
				}));

				__out += '<span class="after">after</span><!--]-->';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function IfElseFragment() {
	return _$_.tsrx_element(() => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		const hasLoaded = false;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="feed-d"><!--[-->';

			if (hasLoaded) {
				__out += '<span class="loading">loading</span>';
			} else {
				__out += '<!--[--><!--[-->';

				for (const muze of muzes) {
					__out += '<p class="muze">' + _$_.escape(muze.muzeId) + '</p>';
				}

				__out += '<!--]--><span class="after">after</span><!--]-->';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function IfDivFragment() {
	return _$_.tsrx_element(() => {
		const muzes = [{ muzeId: 'b' }, { muzeId: 'c' }];
		const hasLoaded = true;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="feed-e"><!--[-->';

			if (hasLoaded) {
				__out += '<section><!--[--><!--[-->';

				for (const muze of muzes) {
					__out += '<p class="muze">' + _$_.escape(muze.muzeId) + '</p>';
				}

				__out += '<!--]--><span class="after">after</span><!--]--></section>';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}