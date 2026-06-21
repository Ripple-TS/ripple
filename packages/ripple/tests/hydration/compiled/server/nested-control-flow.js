// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function ForIf() {
	return _$_.tsrx_element(() => {
		const items = [
			{ id: 1, show: true, label: 'One' },
			{ id: 2, show: true, label: 'Two' },
			{ id: 3, show: false, label: 'Three' }
		];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="for-if"><!--[-->';

			for (const item of items) {
				__out += '<!--[-->';

				if (item.show) {
					__out += '<li' + _$_.attr('class', `item item-${item.id}`) + '>' + _$_.escape(item.label) + '</li>';
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForSwitch() {
	return _$_.tsrx_element(() => {
		const items = [
			{ id: 1, kind: 'a' },
			{ id: 2, kind: 'b' },
			{ id: 3, kind: 'a' }
		];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="for-switch"><!--[-->';

			for (const item of items) {
				__out += '<!--[-->';

				switch (item.kind) {
					case 'a':
						__out += '<li' + _$_.attr('class', `item item-${item.id} kind-a`) + '>' + _$_.escape(`A-${item.id}`) + '</li>';
						break;

					default:
						__out += '<li' + _$_.attr('class', `item item-${item.id} kind-b`) + '>' + _$_.escape(`B-${item.id}`) + '</li>';
						break;
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function IfSwitch() {
	return _$_.tsrx_element(() => {
		const show = true;
		const kind = 'a';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="if-switch"><!--[-->';

			if (show) {
				__out += '<!--[-->';

				switch (kind) {
					case 'a':
						__out += '<p class="case-a">Case A</p>';
						break;

					default:
						__out += '<p class="case-default">Default</p>';
						break;
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function IfSwitchHidden() {
	return _$_.tsrx_element(() => {
		const show = false;
		const kind = 'a';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="if-switch-hidden"><!--[-->';

			if (show) {
				__out += '<!--[-->';

				switch (kind) {
					case 'a':
						__out += '<p class="case-a">Case A</p>';
						break;

					default:
						__out += '<p class="case-default">Default</p>';
						break;
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--><p class="after">after</p></div>';
			_$_.output_push(__out);
		});
	});
}

export function ForIfSwitchSingle() {
	return _$_.tsrx_element(() => {
		const items = [{ id: 1, kind: 'a', show: true }];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="for-if-switch-single"><!--[-->';

			for (const item of items) {
				__out += '<!--[-->';

				if (item.show) {
					__out += '<!--[-->';

					switch (item.kind) {
						case 'a':
							__out += '<li' + _$_.attr('class', `item item-${item.id} kind-a`) + '>' + _$_.escape(`A-${item.id}`) + '</li>';
							break;

						default:
							__out += '<li' + _$_.attr('class', `item item-${item.id} kind-default`) + '>' + _$_.escape(`D-${item.id}`) + '</li>';
							break;
					}

					__out += '<!--]-->';
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForIfSwitchMulti() {
	return _$_.tsrx_element(() => {
		const items = [
			{ id: 1, kind: 'a', show: true },
			{ id: 2, kind: 'b', show: true }
		];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="for-if-switch-multi"><!--[-->';

			for (const item of items) {
				__out += '<!--[-->';

				if (item.show) {
					__out += '<!--[-->';

					switch (item.kind) {
						case 'a':
							__out += '<li' + _$_.attr('class', `item item-${item.id} kind-a`) + '>' + _$_.escape(`A-${item.id}`) + '</li>';
							break;

						default:
							__out += '<li' + _$_.attr('class', `item item-${item.id} kind-b`) + '>' + _$_.escape(`B-${item.id}`) + '</li>';
							break;
					}

					__out += '<!--]-->';
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForIfSwitchWithDisabled() {
	return _$_.tsrx_element(() => {
		const items = [
			{ id: 1, kind: 'a', show: true },
			{ id: 2, kind: 'b', show: false },
			{ id: 3, kind: 'a', show: true }
		];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="for-if-switch-disabled"><!--[-->';

			for (const item of items) {
				__out += '<!--[-->';

				if (item.show) {
					__out += '<!--[-->';

					switch (item.kind) {
						case 'a':
							__out += '<li' + _$_.attr('class', `item item-${item.id} kind-a`) + '>' + _$_.escape(`A-${item.id}`) + '</li>';
							break;

						default:
							__out += '<li' + _$_.attr('class', `item item-${item.id} kind-b`) + '>' + _$_.escape(`B-${item.id}`) + '</li>';
							break;
					}

					__out += '<!--]-->';
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function SwitchTry() {
	return _$_.tsrx_element(() => {
		const kind = 'a';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div class="switch-try"><!--[-->';

			switch (kind) {
				case 'a':
					_$_.output_push(__out);
					__out = '';
					_$_.try_block(
						() => {
							let __out = '';

							__out += '<!--[--><p class="resolved-a">A resolved</p><!--]-->';
							_$_.output_push(__out);
						},
						null,
						() => {
							let __out = '';

							__out += '<!--[--><p class="pending-a">A pending</p><!--]-->';
							_$_.output_push(__out);
						}
					);
					break;

				default:
					__out += '<p class="default">Default</p>';
					break;
			}

			__out += '<!--]--></div>';
			_$_.output_push(__out);
		});
	});
}

export function ForSwitchTry() {
	return _$_.tsrx_element(() => {
		const items = [{ id: 1, kind: 'a' }, { id: 2, kind: 'b' }];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="for-switch-try"><!--[-->';

			for (const item of items) {
				__out += '<!--[-->';

				switch (item.kind) {
					case 'a':
						_$_.output_push(__out);
						__out = '';
						_$_.try_block(
							() => {
								let __out = '';

								__out += '<!--[--><li' + _$_.attr('class', `item item-${item.id} kind-a`) + '>' + _$_.escape(`A-${item.id}`) + '</li><!--]-->';
								_$_.output_push(__out);
							},
							null,
							() => {
								let __out = '';

								__out += '<!--[--><li' + _$_.attr('class', `pending pending-${item.id}`) + '>' + _$_.escape(`pending ${item.id}`) + '</li><!--]-->';
								_$_.output_push(__out);
							}
						);
						break;

					default:
						_$_.output_push(__out);
						__out = '';
						_$_.try_block(
							() => {
								let __out = '';

								__out += '<!--[--><li' + _$_.attr('class', `item item-${item.id} kind-b`) + '>' + _$_.escape(`B-${item.id}`) + '</li><!--]-->';
								_$_.output_push(__out);
							},
							null,
							() => {
								let __out = '';

								__out += '<!--[--><li' + _$_.attr('class', `pending pending-${item.id}`) + '>' + _$_.escape(`pending ${item.id}`) + '</li><!--]-->';
								_$_.output_push(__out);
							}
						);
						break;
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForIfTry() {
	return _$_.tsrx_element(() => {
		const items = [{ id: 1, show: true }, { id: 2, show: true }];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="for-if-try"><!--[-->';

			for (const item of items) {
				__out += '<!--[-->';

				if (item.show) {
					_$_.output_push(__out);
					__out = '';

					_$_.try_block(
						() => {
							let __out = '';

							__out += '<!--[--><li' + _$_.attr('class', `item item-${item.id}`) + '>' + _$_.escape(`item-${item.id}`) + '</li><!--]-->';
							_$_.output_push(__out);
						},
						null,
						() => {
							let __out = '';

							__out += '<!--[--><li' + _$_.attr('class', `pending pending-${item.id}`) + '>' + _$_.escape(`pending ${item.id}`) + '</li><!--]-->';
							_$_.output_push(__out);
						}
					);
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForIfSwitchTrySingle() {
	return _$_.tsrx_element(() => {
		const items = [{ id: 1, kind: 'a', show: true }];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="for-if-switch-try-single"><!--[-->';

			for (const item of items) {
				__out += '<!--[-->';

				if (item.show) {
					__out += '<!--[-->';

					switch (item.kind) {
						case 'a':
							_$_.output_push(__out);
							__out = '';
							_$_.try_block(
								() => {
									let __out = '';

									__out += '<!--[--><li' + _$_.attr('class', `item item-${item.id} kind-a`) + '>' + _$_.escape(`A-${item.id}`) + '</li><!--]-->';
									_$_.output_push(__out);
								},
								null,
								() => {
									let __out = '';

									__out += '<!--[--><li' + _$_.attr('class', `pending pending-${item.id}`) + '>' + _$_.escape(`pending ${item.id}`) + '</li><!--]-->';
									_$_.output_push(__out);
								}
							);
							break;

						default:
							_$_.output_push(__out);
							__out = '';
							_$_.try_block(
								() => {
									let __out = '';

									__out += '<!--[--><li' + _$_.attr('class', `item item-${item.id} kind-default`) + '>' + _$_.escape(`D-${item.id}`) + '</li><!--]-->';
									_$_.output_push(__out);
								},
								null,
								() => {
									let __out = '';

									__out += '<!--[--><li' + _$_.attr('class', `pending pending-${item.id}`) + '>' + _$_.escape(`pending ${item.id}`) + '</li><!--]-->';
									_$_.output_push(__out);
								}
							);
							break;
					}

					__out += '<!--]-->';
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}

export function ForIfSwitchTryMulti() {
	return _$_.tsrx_element(() => {
		const items = [
			{ id: 1, kind: 'a', show: true },
			{ id: 2, kind: 'b', show: true }
		];

		_$_.regular_block(() => {
			let __out = '';

			__out += '<ul class="for-if-switch-try-multi"><!--[-->';

			for (const item of items) {
				__out += '<!--[-->';

				if (item.show) {
					__out += '<!--[-->';

					switch (item.kind) {
						case 'a':
							_$_.output_push(__out);
							__out = '';
							_$_.try_block(
								() => {
									let __out = '';

									__out += '<!--[--><li' + _$_.attr('class', `item item-${item.id} kind-a`) + '>' + _$_.escape(`A-${item.id}`) + '</li><!--]-->';
									_$_.output_push(__out);
								},
								null,
								() => {
									let __out = '';

									__out += '<!--[--><li' + _$_.attr('class', `pending pending-${item.id}`) + '>' + _$_.escape(`pending ${item.id}`) + '</li><!--]-->';
									_$_.output_push(__out);
								}
							);
							break;

						default:
							_$_.output_push(__out);
							__out = '';
							_$_.try_block(
								() => {
									let __out = '';

									__out += '<!--[--><li' + _$_.attr('class', `item item-${item.id} kind-b`) + '>' + _$_.escape(`B-${item.id}`) + '</li><!--]-->';
									_$_.output_push(__out);
								},
								null,
								() => {
									let __out = '';

									__out += '<!--[--><li' + _$_.attr('class', `pending pending-${item.id}`) + '>' + _$_.escape(`pending ${item.id}`) + '</li><!--]-->';
									_$_.output_push(__out);
								}
							);
							break;
					}

					__out += '<!--]-->';
				}

				__out += '<!--]-->';
			}

			__out += '<!--]--></ul>';
			_$_.output_push(__out);
		});
	});
}