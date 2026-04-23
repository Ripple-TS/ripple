// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function ForIf() {
	_$_.push_component();

	const items = [
		{ id: 1, show: true, label: 'One' },
		{ id: 2, show: true, label: 'Two' },
		{ id: 3, show: false, label: 'Three' }
	];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="for-if"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<!--[-->');

				if (item.show) {
					_$_.output_push('<li');
					_$_.output_push(_$_.attr('class', `item item-${item.id}`));
					_$_.output_push('>');

					{
						_$_.output_push(_$_.escape(item.label));
					}

					_$_.output_push('</li>');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForSwitch() {
	_$_.push_component();

	const items = [
		{ id: 1, kind: 'a' },
		{ id: 2, kind: 'b' },
		{ id: 3, kind: 'a' }
	];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="for-switch"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<!--[-->');

				switch (item.kind) {
					case 'a':
						_$_.output_push('<li');
						_$_.output_push(_$_.attr('class', `item item-${item.id} kind-a`));
						_$_.output_push('>');
						{
							_$_.output_push(_$_.escape(`A-${item.id}`));
						}
						_$_.output_push('</li>');
						break;

					default:
						_$_.output_push('<li');
						_$_.output_push(_$_.attr('class', `item item-${item.id} kind-b`));
						_$_.output_push('>');
						{
							_$_.output_push(_$_.escape(`B-${item.id}`));
						}
						_$_.output_push('</li>');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function IfSwitch() {
	_$_.push_component();

	const show = true;
	const kind = 'a';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="if-switch"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			if (show) {
				_$_.output_push('<!--[-->');

				switch (kind) {
					case 'a':
						_$_.output_push('<p');
						_$_.output_push(' class="case-a"');
						_$_.output_push('>');
						{
							_$_.output_push('Case A');
						}
						_$_.output_push('</p>');
						break;

					default:
						_$_.output_push('<p');
						_$_.output_push(' class="case-default"');
						_$_.output_push('>');
						{
							_$_.output_push('Default');
						}
						_$_.output_push('</p>');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function IfSwitchHidden() {
	_$_.push_component();

	const show = false;
	const kind = 'a';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="if-switch-hidden"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			if (show) {
				_$_.output_push('<!--[-->');

				switch (kind) {
					case 'a':
						_$_.output_push('<p');
						_$_.output_push(' class="case-a"');
						_$_.output_push('>');
						{
							_$_.output_push('Case A');
						}
						_$_.output_push('</p>');
						break;

					default:
						_$_.output_push('<p');
						_$_.output_push(' class="case-default"');
						_$_.output_push('>');
						{
							_$_.output_push('Default');
						}
						_$_.output_push('</p>');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
			_$_.output_push('<p');
			_$_.output_push(' class="after"');
			_$_.output_push('>');

			{
				_$_.output_push('after');
			}

			_$_.output_push('</p>');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function ForIfSwitchSingle() {
	_$_.push_component();

	const items = [{ id: 1, kind: 'a', show: true }];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="for-if-switch-single"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<!--[-->');

				if (item.show) {
					_$_.output_push('<!--[-->');

					switch (item.kind) {
						case 'a':
							_$_.output_push('<li');
							_$_.output_push(_$_.attr('class', `item item-${item.id} kind-a`));
							_$_.output_push('>');
							{
								_$_.output_push(_$_.escape(`A-${item.id}`));
							}
							_$_.output_push('</li>');
							break;

						default:
							_$_.output_push('<li');
							_$_.output_push(_$_.attr('class', `item item-${item.id} kind-default`));
							_$_.output_push('>');
							{
								_$_.output_push(_$_.escape(`D-${item.id}`));
							}
							_$_.output_push('</li>');
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForIfSwitchMulti() {
	_$_.push_component();

	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: true }
	];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="for-if-switch-multi"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<!--[-->');

				if (item.show) {
					_$_.output_push('<!--[-->');

					switch (item.kind) {
						case 'a':
							_$_.output_push('<li');
							_$_.output_push(_$_.attr('class', `item item-${item.id} kind-a`));
							_$_.output_push('>');
							{
								_$_.output_push(_$_.escape(`A-${item.id}`));
							}
							_$_.output_push('</li>');
							break;

						default:
							_$_.output_push('<li');
							_$_.output_push(_$_.attr('class', `item item-${item.id} kind-b`));
							_$_.output_push('>');
							{
								_$_.output_push(_$_.escape(`B-${item.id}`));
							}
							_$_.output_push('</li>');
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForIfSwitchWithDisabled() {
	_$_.push_component();

	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: false },
		{ id: 3, kind: 'a', show: true }
	];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="for-if-switch-disabled"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<!--[-->');

				if (item.show) {
					_$_.output_push('<!--[-->');

					switch (item.kind) {
						case 'a':
							_$_.output_push('<li');
							_$_.output_push(_$_.attr('class', `item item-${item.id} kind-a`));
							_$_.output_push('>');
							{
								_$_.output_push(_$_.escape(`A-${item.id}`));
							}
							_$_.output_push('</li>');
							break;

						default:
							_$_.output_push('<li');
							_$_.output_push(_$_.attr('class', `item item-${item.id} kind-b`));
							_$_.output_push('>');
							{
								_$_.output_push(_$_.escape(`B-${item.id}`));
							}
							_$_.output_push('</li>');
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function SwitchTry() {
	_$_.push_component();

	const kind = 'a';

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push(' class="switch-try"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			switch (kind) {
				case 'a':
					_$_.try_block(
						() => {
							_$_.output_push('<!--[-->');
							_$_.output_push('<p');
							_$_.output_push(' class="resolved-a"');
							_$_.output_push('>');

							{
								_$_.output_push('A resolved');
							}

							_$_.output_push('</p>');
							_$_.output_push('<!--]-->');
						},
						null,
						() => {
							_$_.output_push('<!--[-->');
							_$_.output_push('<p');
							_$_.output_push(' class="pending-a"');
							_$_.output_push('>');

							{
								_$_.output_push('A pending');
							}

							_$_.output_push('</p>');
							_$_.output_push('<!--]-->');
						}
					);
					break;

				default:
					_$_.output_push('<p');
					_$_.output_push(' class="default"');
					_$_.output_push('>');
					{
						_$_.output_push('Default');
					}
					_$_.output_push('</p>');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}

export function ForSwitchTry() {
	_$_.push_component();

	const items = [{ id: 1, kind: 'a' }, { id: 2, kind: 'b' }];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="for-switch-try"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<!--[-->');

				switch (item.kind) {
					case 'a':
						_$_.try_block(
							() => {
								_$_.output_push('<!--[-->');
								_$_.output_push('<li');
								_$_.output_push(_$_.attr('class', `item item-${item.id} kind-a`));
								_$_.output_push('>');

								{
									_$_.output_push(_$_.escape(`A-${item.id}`));
								}

								_$_.output_push('</li>');
								_$_.output_push('<!--]-->');
							},
							null,
							() => {
								_$_.output_push('<!--[-->');
								_$_.output_push('<li');
								_$_.output_push(_$_.attr('class', `pending pending-${item.id}`));
								_$_.output_push('>');

								{
									_$_.output_push(_$_.escape(`pending ${item.id}`));
								}

								_$_.output_push('</li>');
								_$_.output_push('<!--]-->');
							}
						);
						break;

					default:
						_$_.try_block(
							() => {
								_$_.output_push('<!--[-->');
								_$_.output_push('<li');
								_$_.output_push(_$_.attr('class', `item item-${item.id} kind-b`));
								_$_.output_push('>');

								{
									_$_.output_push(_$_.escape(`B-${item.id}`));
								}

								_$_.output_push('</li>');
								_$_.output_push('<!--]-->');
							},
							null,
							() => {
								_$_.output_push('<!--[-->');
								_$_.output_push('<li');
								_$_.output_push(_$_.attr('class', `pending pending-${item.id}`));
								_$_.output_push('>');

								{
									_$_.output_push(_$_.escape(`pending ${item.id}`));
								}

								_$_.output_push('</li>');
								_$_.output_push('<!--]-->');
							}
						);
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForIfTry() {
	_$_.push_component();

	const items = [{ id: 1, show: true }, { id: 2, show: true }];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="for-if-try"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<!--[-->');

				if (item.show) {
					_$_.try_block(
						() => {
							_$_.output_push('<!--[-->');
							_$_.output_push('<li');
							_$_.output_push(_$_.attr('class', `item item-${item.id}`));
							_$_.output_push('>');

							{
								_$_.output_push(_$_.escape(`item-${item.id}`));
							}

							_$_.output_push('</li>');
							_$_.output_push('<!--]-->');
						},
						null,
						() => {
							_$_.output_push('<!--[-->');
							_$_.output_push('<li');
							_$_.output_push(_$_.attr('class', `pending pending-${item.id}`));
							_$_.output_push('>');

							{
								_$_.output_push(_$_.escape(`pending ${item.id}`));
							}

							_$_.output_push('</li>');
							_$_.output_push('<!--]-->');
						}
					);
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForIfSwitchTrySingle() {
	_$_.push_component();

	const items = [{ id: 1, kind: 'a', show: true }];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="for-if-switch-try-single"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<!--[-->');

				if (item.show) {
					_$_.output_push('<!--[-->');

					switch (item.kind) {
						case 'a':
							_$_.try_block(
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<li');
									_$_.output_push(_$_.attr('class', `item item-${item.id} kind-a`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`A-${item.id}`));
									}

									_$_.output_push('</li>');
									_$_.output_push('<!--]-->');
								},
								null,
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<li');
									_$_.output_push(_$_.attr('class', `pending pending-${item.id}`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`pending ${item.id}`));
									}

									_$_.output_push('</li>');
									_$_.output_push('<!--]-->');
								}
							);
							break;

						default:
							_$_.try_block(
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<li');
									_$_.output_push(_$_.attr('class', `item item-${item.id} kind-default`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`D-${item.id}`));
									}

									_$_.output_push('</li>');
									_$_.output_push('<!--]-->');
								},
								null,
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<li');
									_$_.output_push(_$_.attr('class', `pending pending-${item.id}`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`pending ${item.id}`));
									}

									_$_.output_push('</li>');
									_$_.output_push('<!--]-->');
								}
							);
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}

export function ForIfSwitchTryMulti() {
	_$_.push_component();

	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: true }
	];

	_$_.regular_block(() => {
		_$_.output_push('<ul');
		_$_.output_push(' class="for-if-switch-try-multi"');
		_$_.output_push('>');

		{
			_$_.output_push('<!--[-->');

			for (const item of items) {
				_$_.output_push('<!--[-->');

				if (item.show) {
					_$_.output_push('<!--[-->');

					switch (item.kind) {
						case 'a':
							_$_.try_block(
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<li');
									_$_.output_push(_$_.attr('class', `item item-${item.id} kind-a`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`A-${item.id}`));
									}

									_$_.output_push('</li>');
									_$_.output_push('<!--]-->');
								},
								null,
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<li');
									_$_.output_push(_$_.attr('class', `pending pending-${item.id}`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`pending ${item.id}`));
									}

									_$_.output_push('</li>');
									_$_.output_push('<!--]-->');
								}
							);
							break;

						default:
							_$_.try_block(
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<li');
									_$_.output_push(_$_.attr('class', `item item-${item.id} kind-b`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`B-${item.id}`));
									}

									_$_.output_push('</li>');
									_$_.output_push('<!--]-->');
								},
								null,
								() => {
									_$_.output_push('<!--[-->');
									_$_.output_push('<li');
									_$_.output_push(_$_.attr('class', `pending pending-${item.id}`));
									_$_.output_push('>');

									{
										_$_.output_push(_$_.escape(`pending ${item.id}`));
									}

									_$_.output_push('</li>');
									_$_.output_push('<!--]-->');
								}
							);
					}

					_$_.output_push('<!--]-->');
				}

				_$_.output_push('<!--]-->');
			}

			_$_.output_push('<!--]-->');
		}

		_$_.output_push('</ul>');
	});

	_$_.pop_component();
}