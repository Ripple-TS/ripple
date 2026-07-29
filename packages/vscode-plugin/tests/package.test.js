import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const package_json = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));

describe('@ripple-ts/vscode-plugin package contract', () => {
	it('enables Emmet completions for TSRX files by default', () => {
		const languages = /** @type {{ id: string, extensions: string[] }[]} */ (
			package_json.contributes.languages
		);
		const tsrx_language = languages.find((language) => language.extensions.includes('.tsrx'));

		expect(tsrx_language?.id).toBe('ripple');
		expect(package_json.contributes.configurationDefaults).toMatchObject({
			'emmet.includeLanguages': {
				ripple: 'html',
			},
			'emmet.showExpandedAbbreviation': 'always',
		});
	});
});
