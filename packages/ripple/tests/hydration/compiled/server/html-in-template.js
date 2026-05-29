// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function SimpleTemplateHtml() {
	return _$_.tsrx_element(() => {
		const data = 'test data';

		_$_.regular_block(() => {
			_$_.output_push('<template');
			_$_.output_push(' id="data1"');
			_$_.output_push('>');
			_$_.output_push(String(data ?? ''));
			_$_.output_push('</template>');
		});
	});
}

export function TemplateWithJSON() {
	return _$_.tsrx_element(() => {
		const jsonData = JSON.stringify({ message: 'hello', count: 42 });

		_$_.regular_block(() => {
			_$_.output_push('<template');
			_$_.output_push(' id="data2"');
			_$_.output_push('>');
			_$_.output_push(String(jsonData ?? ''));
			_$_.output_push('</template>');
		});
	});
}

export function TemplateAroundIfBlock() {
	return _$_.tsrx_element(() => {
		const show = true;

		_$_.regular_block(() => {
			_$_.output_push('<div');
			_$_.output_push('>');

			{
				_$_.output_push('<template');
				_$_.output_push(' id="before"');
				_$_.output_push('>');
				_$_.output_push('before');
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
				_$_.output_push('after');
				_$_.output_push('</template>');
			}

			_$_.output_push('</div>');
		});
	});
}