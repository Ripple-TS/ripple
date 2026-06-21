// @ts-nocheck
import * as _$_ from 'ripple/internal/server';

export function SimpleTemplateHtml() {
	return _$_.tsrx_element(() => {
		const data = 'test data';

		_$_.regular_block(() => {
			let __out = '';

			__out += '<template id="data1">' + String(data ?? '') + '</template>';
			_$_.output_push(__out);
		});
	});
}

export function TemplateWithJSON() {
	return _$_.tsrx_element(() => {
		const jsonData = JSON.stringify({ message: 'hello', count: 42 });

		_$_.regular_block(() => {
			let __out = '';

			__out += '<template id="data2">' + String(jsonData ?? '') + '</template>';
			_$_.output_push(__out);
		});
	});
}

export function TemplateAroundIfBlock() {
	return _$_.tsrx_element(() => {
		const show = true;

		_$_.regular_block(() => {
			let __out = '';

			__out += '<div><template id="before">before</template><!--[-->';

			if (show) {
				__out += '<span class="inside">inside</span>';
			}

			__out += '<!--]--><template id="after">after</template></div>';
			_$_.output_push(__out);
		});
	});
}