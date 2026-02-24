// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function ForIf(__output) {
	_$_.push_component();

	const items = [
		{ id: 1, show: true, label: 'One' },
		{ id: 2, show: true, label: 'Two' },
		{ id: 3, show: false, label: 'Three' }
	];

	__output.push('<ul');
	__output.push(' class="for-if"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of items) {
			__output.push('<!--[-->');

			if (item.show) {
				__output.push('<li');
				__output.push(_$_.attr('class', `item item-${item.id}`));
				__output.push('>');

				{
					__output.push(_$_.escape(item.label));
				}

				__output.push('</li>');
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForSwitch(__output) {
	_$_.push_component();

	const items = [
		{ id: 1, kind: 'a' },
		{ id: 2, kind: 'b' },
		{ id: 3, kind: 'a' }
	];

	__output.push('<ul');
	__output.push(' class="for-switch"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of items) {
			__output.push('<!--[-->');

			switch (item.kind) {
				case 'a':
					__output.push('<li');
					__output.push(_$_.attr('class', `item item-${item.id} kind-a`));
					__output.push('>');
					{
						__output.push(_$_.escape(`A-${item.id}`));
					}
					__output.push('</li>');
					break;

				default:
					__output.push('<li');
					__output.push(_$_.attr('class', `item item-${item.id} kind-b`));
					__output.push('>');
					{
						__output.push(_$_.escape(`B-${item.id}`));
					}
					__output.push('</li>');
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function IfSwitch(__output) {
	_$_.push_component();

	const show = true;
	const kind = 'a';

	__output.push('<div');
	__output.push(' class="if-switch"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		if (show) {
			__output.push('<!--[-->');

			switch (kind) {
				case 'a':
					__output.push('<p');
					__output.push(' class="case-a"');
					__output.push('>');
					{
						__output.push('Case A');
					}
					__output.push('</p>');
					break;

				default:
					__output.push('<p');
					__output.push(' class="case-default"');
					__output.push('>');
					{
						__output.push('Default');
					}
					__output.push('</p>');
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function IfSwitchHidden(__output) {
	_$_.push_component();

	const show = false;
	const kind = 'a';

	__output.push('<div');
	__output.push(' class="if-switch-hidden"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		if (show) {
			__output.push('<!--[-->');

			switch (kind) {
				case 'a':
					__output.push('<p');
					__output.push(' class="case-a"');
					__output.push('>');
					{
						__output.push('Case A');
					}
					__output.push('</p>');
					break;

				default:
					__output.push('<p');
					__output.push(' class="case-default"');
					__output.push('>');
					{
						__output.push('Default');
					}
					__output.push('</p>');
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
		__output.push('<p');
		__output.push(' class="after"');
		__output.push('>');

		{
			__output.push('after');
		}

		__output.push('</p>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function ForIfSwitchSingle(__output) {
	_$_.push_component();

	const items = [{ id: 1, kind: 'a', show: true }];

	__output.push('<ul');
	__output.push(' class="for-if-switch-single"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of items) {
			__output.push('<!--[-->');

			if (item.show) {
				__output.push('<!--[-->');

				switch (item.kind) {
					case 'a':
						__output.push('<li');
						__output.push(_$_.attr('class', `item item-${item.id} kind-a`));
						__output.push('>');
						{
							__output.push(_$_.escape(`A-${item.id}`));
						}
						__output.push('</li>');
						break;

					default:
						__output.push('<li');
						__output.push(_$_.attr('class', `item item-${item.id} kind-default`));
						__output.push('>');
						{
							__output.push(_$_.escape(`D-${item.id}`));
						}
						__output.push('</li>');
				}

				__output.push('<!--]-->');
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForIfSwitchMulti(__output) {
	_$_.push_component();

	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: true }
	];

	__output.push('<ul');
	__output.push(' class="for-if-switch-multi"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of items) {
			__output.push('<!--[-->');

			if (item.show) {
				__output.push('<!--[-->');

				switch (item.kind) {
					case 'a':
						__output.push('<li');
						__output.push(_$_.attr('class', `item item-${item.id} kind-a`));
						__output.push('>');
						{
							__output.push(_$_.escape(`A-${item.id}`));
						}
						__output.push('</li>');
						break;

					default:
						__output.push('<li');
						__output.push(_$_.attr('class', `item item-${item.id} kind-b`));
						__output.push('>');
						{
							__output.push(_$_.escape(`B-${item.id}`));
						}
						__output.push('</li>');
				}

				__output.push('<!--]-->');
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export function ForIfSwitchWithDisabled(__output) {
	_$_.push_component();

	const items = [
		{ id: 1, kind: 'a', show: true },
		{ id: 2, kind: 'b', show: false },
		{ id: 3, kind: 'a', show: true }
	];

	__output.push('<ul');
	__output.push(' class="for-if-switch-disabled"');
	__output.push('>');

	{
		__output.push('<!--[-->');

		for (const item of items) {
			__output.push('<!--[-->');

			if (item.show) {
				__output.push('<!--[-->');

				switch (item.kind) {
					case 'a':
						__output.push('<li');
						__output.push(_$_.attr('class', `item item-${item.id} kind-a`));
						__output.push('>');
						{
							__output.push(_$_.escape(`A-${item.id}`));
						}
						__output.push('</li>');
						break;

					default:
						__output.push('<li');
						__output.push(_$_.attr('class', `item item-${item.id} kind-b`));
						__output.push('>');
						{
							__output.push(_$_.escape(`B-${item.id}`));
						}
						__output.push('</li>');
				}

				__output.push('<!--]-->');
			}

			__output.push('<!--]-->');
		}

		__output.push('<!--]-->');
	}

	__output.push('</ul>');
	_$_.pop_component();
}

export async function SwitchTry(__output) {
	return _$_.async(async () => {
		_$_.push_component();

		const kind = 'a';

		__output.push('<div');
		__output.push(' class="switch-try"');
		__output.push('>');

		{
			__output.push('<!--[-->');

			switch (kind) {
				case 'a':
					__output.push('<!--[-->');
					var __pending_pos = __output.body.length;
					__output.push('<p');
					__output.push(' class="pending-a"');
					__output.push('>');
					{
						__output.push('A pending');
					}
					__output.push('</p>');
					await _$_.async(async () => {
						__output.body = __output.body.slice(0, __pending_pos);
						__output.push('<p');
						__output.push(' class="resolved-a"');
						__output.push('>');

						{
							__output.push('A resolved');
						}

						__output.push('</p>');
					});
					__output.push('<!--]-->');
					break;

				default:
					__output.push('<p');
					__output.push(' class="default"');
					__output.push('>');
					{
						__output.push('Default');
					}
					__output.push('</p>');
			}

			__output.push('<!--]-->');
		}

		__output.push('</div>');
		_$_.pop_component();
	});
}

SwitchTry.async = true;

export async function ForSwitchTry(__output) {
	return _$_.async(async () => {
		_$_.push_component();

		const items = [{ id: 1, kind: 'a' }, { id: 2, kind: 'b' }];

		__output.push('<ul');
		__output.push(' class="for-switch-try"');
		__output.push('>');

		{
			__output.push('<!--[-->');

			for (const item of items) {
				__output.push('<!--[-->');

				switch (item.kind) {
					case 'a':
						__output.push('<!--[-->');
						var __pending_pos_1 = __output.body.length;
						__output.push('<li');
						__output.push(_$_.attr('class', `pending pending-${item.id}`));
						__output.push('>');
						{
							__output.push(_$_.escape(`pending ${item.id}`));
						}
						__output.push('</li>');
						await _$_.async(async () => {
							__output.body = __output.body.slice(0, __pending_pos_1);
							__output.push('<li');
							__output.push(_$_.attr('class', `item item-${item.id} kind-a`));
							__output.push('>');

							{
								__output.push(_$_.escape(`A-${item.id}`));
							}

							__output.push('</li>');
						});
						__output.push('<!--]-->');
						break;

					default:
						__output.push('<!--[-->');
						var __pending_pos_2 = __output.body.length;
						__output.push('<li');
						__output.push(_$_.attr('class', `pending pending-${item.id}`));
						__output.push('>');
						{
							__output.push(_$_.escape(`pending ${item.id}`));
						}
						__output.push('</li>');
						await _$_.async(async () => {
							__output.body = __output.body.slice(0, __pending_pos_2);
							__output.push('<li');
							__output.push(_$_.attr('class', `item item-${item.id} kind-b`));
							__output.push('>');

							{
								__output.push(_$_.escape(`B-${item.id}`));
							}

							__output.push('</li>');
						});
						__output.push('<!--]-->');
				}

				__output.push('<!--]-->');
			}

			__output.push('<!--]-->');
		}

		__output.push('</ul>');
		_$_.pop_component();
	});
}

ForSwitchTry.async = true;

export async function ForIfTry(__output) {
	return _$_.async(async () => {
		_$_.push_component();

		const items = [{ id: 1, show: true }, { id: 2, show: true }];

		__output.push('<ul');
		__output.push(' class="for-if-try"');
		__output.push('>');

		{
			__output.push('<!--[-->');

			for (const item of items) {
				__output.push('<!--[-->');

				if (item.show) {
					__output.push('<!--[-->');

					var __pending_pos_3 = __output.body.length;

					__output.push('<li');
					__output.push(_$_.attr('class', `pending pending-${item.id}`));
					__output.push('>');

					{
						__output.push(_$_.escape(`pending ${item.id}`));
					}

					__output.push('</li>');

					await _$_.async(async () => {
						__output.body = __output.body.slice(0, __pending_pos_3);
						__output.push('<li');
						__output.push(_$_.attr('class', `item item-${item.id}`));
						__output.push('>');

						{
							__output.push(_$_.escape(`item-${item.id}`));
						}

						__output.push('</li>');
					});

					__output.push('<!--]-->');
				}

				__output.push('<!--]-->');
			}

			__output.push('<!--]-->');
		}

		__output.push('</ul>');
		_$_.pop_component();
	});
}

ForIfTry.async = true;

export async function ForIfSwitchTrySingle(__output) {
	return _$_.async(async () => {
		_$_.push_component();

		const items = [{ id: 1, kind: 'a', show: true }];

		__output.push('<ul');
		__output.push(' class="for-if-switch-try-single"');
		__output.push('>');

		{
			__output.push('<!--[-->');

			for (const item of items) {
				__output.push('<!--[-->');

				if (item.show) {
					__output.push('<!--[-->');

					switch (item.kind) {
						case 'a':
							__output.push('<!--[-->');
							var __pending_pos_4 = __output.body.length;
							__output.push('<li');
							__output.push(_$_.attr('class', `pending pending-${item.id}`));
							__output.push('>');
							{
								__output.push(_$_.escape(`pending ${item.id}`));
							}
							__output.push('</li>');
							await _$_.async(async () => {
								__output.body = __output.body.slice(0, __pending_pos_4);
								__output.push('<li');
								__output.push(_$_.attr('class', `item item-${item.id} kind-a`));
								__output.push('>');

								{
									__output.push(_$_.escape(`A-${item.id}`));
								}

								__output.push('</li>');
							});
							__output.push('<!--]-->');
							break;

						default:
							__output.push('<!--[-->');
							var __pending_pos_5 = __output.body.length;
							__output.push('<li');
							__output.push(_$_.attr('class', `pending pending-${item.id}`));
							__output.push('>');
							{
								__output.push(_$_.escape(`pending ${item.id}`));
							}
							__output.push('</li>');
							await _$_.async(async () => {
								__output.body = __output.body.slice(0, __pending_pos_5);
								__output.push('<li');
								__output.push(_$_.attr('class', `item item-${item.id} kind-default`));
								__output.push('>');

								{
									__output.push(_$_.escape(`D-${item.id}`));
								}

								__output.push('</li>');
							});
							__output.push('<!--]-->');
					}

					__output.push('<!--]-->');
				}

				__output.push('<!--]-->');
			}

			__output.push('<!--]-->');
		}

		__output.push('</ul>');
		_$_.pop_component();
	});
}

ForIfSwitchTrySingle.async = true;

export async function ForIfSwitchTryMulti(__output) {
	return _$_.async(async () => {
		_$_.push_component();

		const items = [
			{ id: 1, kind: 'a', show: true },
			{ id: 2, kind: 'b', show: true }
		];

		__output.push('<ul');
		__output.push(' class="for-if-switch-try-multi"');
		__output.push('>');

		{
			__output.push('<!--[-->');

			for (const item of items) {
				__output.push('<!--[-->');

				if (item.show) {
					__output.push('<!--[-->');

					switch (item.kind) {
						case 'a':
							__output.push('<!--[-->');
							var __pending_pos_6 = __output.body.length;
							__output.push('<li');
							__output.push(_$_.attr('class', `pending pending-${item.id}`));
							__output.push('>');
							{
								__output.push(_$_.escape(`pending ${item.id}`));
							}
							__output.push('</li>');
							await _$_.async(async () => {
								__output.body = __output.body.slice(0, __pending_pos_6);
								__output.push('<li');
								__output.push(_$_.attr('class', `item item-${item.id} kind-a`));
								__output.push('>');

								{
									__output.push(_$_.escape(`A-${item.id}`));
								}

								__output.push('</li>');
							});
							__output.push('<!--]-->');
							break;

						default:
							__output.push('<!--[-->');
							var __pending_pos_7 = __output.body.length;
							__output.push('<li');
							__output.push(_$_.attr('class', `pending pending-${item.id}`));
							__output.push('>');
							{
								__output.push(_$_.escape(`pending ${item.id}`));
							}
							__output.push('</li>');
							await _$_.async(async () => {
								__output.body = __output.body.slice(0, __pending_pos_7);
								__output.push('<li');
								__output.push(_$_.attr('class', `item item-${item.id} kind-b`));
								__output.push('>');

								{
									__output.push(_$_.escape(`B-${item.id}`));
								}

								__output.push('</li>');
							});
							__output.push('<!--]-->');
					}

					__output.push('<!--]-->');
				}

				__output.push('<!--]-->');
			}

			__output.push('<!--]-->');
		}

		__output.push('</ul>');
		_$_.pop_component();
	});
}

ForIfSwitchTryMulti.async = true;