import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { staticDocument } from './dist/server/server.js';

const manifest = JSON.parse(
	await readFile(new URL('./dist/client/.vite/manifest.json', import.meta.url), 'utf8'),
);
const entry = manifest['security-client.js'];
const assets = {
	entry: `/app/${entry.file}`,
	css: (entry.css ?? []).map((file) => `/app/${file}`),
};
const document = await staticDocument(assets);
// Root IDs in inert hydration records can vary; executable text and hashes must not.
assert.equal(
	(await staticDocument(assets)).policy,
	document.policy,
	'executable output and style hashes are deterministic',
);
// Publish this pair atomically. Never hash personalized or partially streamed HTML.
await writeFile(new URL('./dist/client/security.html', import.meta.url), document.html);
await writeFile(
	new URL('./dist/client/security-policy.json', import.meta.url),
	JSON.stringify({
		'Content-Security-Policy': document.policy,
		'Cache-Control': 'public, max-age=0, must-revalidate',
	}),
);
