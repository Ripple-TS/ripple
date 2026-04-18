// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function SimpleTemplateHtml() {
	_$_.push_component();

	const data = 'test data';

	_$_.regular_block(() => {
		_$_.output_push('<template');
		_$_.output_push(' id="data1"');
		_$_.output_push('>');

		{
			const html_value = String(data ?? '');

			_$_.output_push('<!--' + _$_.hash(html_value) + '-->');
			_$_.output_push(html_value);
			_$_.output_push('<!---->');
		}

		_$_.output_push('</template>');
	});

	_$_.pop_component();
}

export function TemplateWithJSON() {
	_$_.push_component();

	const jsonData = JSON.stringify({ message: 'hello', count: 42 });

	_$_.regular_block(() => {
		_$_.output_push('<template');
		_$_.output_push(' id="data2"');
		_$_.output_push('>');

		{
			const html_value_1 = String(jsonData ?? '');

			_$_.output_push('<!--' + _$_.hash(html_value_1) + '-->');
			_$_.output_push(html_value_1);
			_$_.output_push('<!---->');
		}

		_$_.output_push('</template>');
	});

	_$_.pop_component();
}

export function TemplateAroundIfBlock() {
	_$_.push_component();

	const show = true;

	_$_.regular_block(() => {
		_$_.output_push('<div');
		_$_.output_push('>');

		{
			_$_.output_push('<template');
			_$_.output_push(' id="before"');
			_$_.output_push('>');

			{
				_$_.output_push('<!--14v3bl2-->');
				_$_.output_push('before');
				_$_.output_push('<!---->');
			}

			_$_.output_push('</template>');
			_$_.output_push('<!--[-->');

			if (show) {
				_$_.output_push('<span');
				_$_.output_push(' class="inside"');
				_$_.output_push('>');

				{
					_$_.output_push('inside');
				}

				_$_.output_push('</span>');
			}

			_$_.output_push('<!--]-->');
			_$_.output_push('<template');
			_$_.output_push(' id="after"');
			_$_.output_push('>');

			{
				_$_.output_push('<!--1qvtvs1-->');
				_$_.output_push('after');
				_$_.output_push('<!---->');
			}

			_$_.output_push('</template>');
		}

		_$_.output_push('</div>');
	});

	_$_.pop_component();
}