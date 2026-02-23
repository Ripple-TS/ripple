// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function SimpleTemplateHtml(__output) {
	_$_.push_component();

	const data = 'test data';

	__output.push('<template');
	__output.push(' id="data1"');
	__output.push('>');

	{
		const html_value = String(data ?? '');

		__output.push('<!--' + _$_.hash(html_value) + '-->');
		__output.push(html_value);
		__output.push('<!---->');
	}

	__output.push('</template>');
	_$_.pop_component();
}

export function TemplateWithJSON(__output) {
	_$_.push_component();

	const jsonData = JSON.stringify({ message: 'hello', count: 42 });

	__output.push('<template');
	__output.push(' id="data2"');
	__output.push('>');

	{
		const html_value_1 = String(jsonData ?? '');

		__output.push('<!--' + _$_.hash(html_value_1) + '-->');
		__output.push(html_value_1);
		__output.push('<!---->');
	}

	__output.push('</template>');
	_$_.pop_component();
}

export function TemplateAroundIfBlock(__output) {
	_$_.push_component();

	const show = true;

	__output.push('<div');
	__output.push('>');

	{
		__output.push('<template');
		__output.push(' id="before"');
		__output.push('>');

		{
			__output.push('<!--14v3bl2-->');
			__output.push('before');
			__output.push('<!---->');
		}

		__output.push('</template>');
		__output.push('<!--[-->');

		if (show) {
			__output.push('<span');
			__output.push(' class="inside"');
			__output.push('>');

			{
				__output.push('inside');
			}

			__output.push('</span>');
		}

		__output.push('<!--]-->');
		__output.push('<template');
		__output.push(' id="after"');
		__output.push('>');

		{
			__output.push('<!--1qvtvs1-->');
			__output.push('after');
			__output.push('<!---->');
		}

		__output.push('</template>');
	}

	__output.push('</div>');
	_$_.pop_component();
}