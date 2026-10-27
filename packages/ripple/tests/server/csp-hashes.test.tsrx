import { createHash } from 'node:crypto';
import { getCspHashes } from 'ripple/server';

it(
	'hashes final inline text with HTML newline normalization, UTF-8 and stable deduplication',
	async () => {
		const script = 'window.message = "café";\n';
		const style = 'h1 { color: red; }\n';
		const hash = (value: string) => `'sha256-${createHash('sha256').update(value).digest(
			'base64',
		)}'`;
		expect(
			await getCspHashes({
				scripts: [script, script.replace('\n', '\r\n'), '', String.fromCharCode(0)],
				styles: new Set([style.replace('\n', '\r'), style]),
			}),
		).toEqual({ scripts: [hash(script), hash(''), hash('�')], styles: [hash(style)] });
		expect(await getCspHashes({})).toEqual({ scripts: [], styles: [] });
	},
);
