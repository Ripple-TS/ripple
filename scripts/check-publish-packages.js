import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const PACKAGES_DIR = path.resolve('packages');
const PUBLISH_ALLOWLIST = new Map([
	['adapter', '@ripple-ts/adapter'],
	['adapter-bun', '@ripple-ts/adapter-bun'],
	['adapter-node', '@ripple-ts/adapter-node'],
	['adapter-vercel', '@ripple-ts/adapter-vercel'],
	['cli', '@ripple-ts/cli'],
	['create-ripple', 'create-ripple'],
	['ripple', 'ripple'],
	['rollup-plugin', '@ripple-ts/rollup-plugin'],
	['tsrx-ripple', '@tsrx/ripple'],
	['vite-plugin', '@ripple-ts/vite-plugin'],
]);

const entries = await readdir(PACKAGES_DIR, { withFileTypes: true });
const errors = [];
const found = new Set();

for (const entry of entries) {
	if (!entry.isDirectory()) continue;

	let package_json;
	try {
		package_json = JSON.parse(
			await readFile(path.join(PACKAGES_DIR, entry.name, 'package.json'), 'utf8'),
		);
	} catch (error) {
		if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') continue;
		throw error;
	}

	if (package_json.private === true) continue;

	const expected_name = PUBLISH_ALLOWLIST.get(entry.name);
	if (package_json.name !== expected_name) {
		errors.push(
			`packages/${entry.name} is publishable as ${JSON.stringify(package_json.name)}, expected ${JSON.stringify(expected_name)}`,
		);
		continue;
	}

	found.add(entry.name);
}

for (const [directory, package_name] of PUBLISH_ALLOWLIST) {
	if (!found.has(directory)) {
		errors.push(`allowlisted package ${package_name} is missing from packages/${directory}`);
	}
}

if (errors.length > 0) {
	console.error('Ripple publishing is restricted to the reviewed Ripple-owned package allowlist.');
	for (const error of errors) console.error(`- ${error}`);
	process.exit(1);
}

console.log(`Verified ${found.size} Ripple-owned publishable packages.`);
