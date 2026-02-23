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