import { describe, expect, it } from 'vitest';
import { compile } from '@tsrx/ripple';

describe('double-quoted text children', () => {
	it('decodes JSX-style entities before server text escaping', () => {
		const result = compile(
			`component App() {
				<div>"Rock &amp; &quot;Roll&quot;"</div>
			}`,
			'/src/App.tsrx',
			{ mode: 'server' },
		);

		expect(result.js.code).toContain(`_$_.output_push('Rock &amp; "Roll"')`);
	});
});
