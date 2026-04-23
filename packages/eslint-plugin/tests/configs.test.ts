import { describe, expect, it } from 'vitest';
import plugin from '../src/index.ts';

describe('eslint-plugin configs', () => {
	it('includes .tsrx files in Ripple configs', () => {
		const recommended_ripple_config = plugin.configs.recommended[0];
		const strict_ripple_config = plugin.configs.strict[0];

		expect(recommended_ripple_config.files).toContain('**/*.tsrx');
		expect(strict_ripple_config.files).toContain('**/*.tsrx');
	});
});
