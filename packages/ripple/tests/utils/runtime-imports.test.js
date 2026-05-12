import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const runtime_dir = new URL('../../src/runtime/', import.meta.url);

/** @param {string} dir */
async function get_js_files(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await get_js_files(path)));
		} else if (entry.isFile() && entry.name.endsWith('.js')) {
			files.push(path);
		}
	}

	return files;
}

describe('runtime imports', () => {
	it('does not import the @tsrx/core compiler barrel', async () => {
		const files = await get_js_files(runtime_dir.pathname);
		const barrel_imports = [];

		for (const file of files) {
			const source = await readFile(file, 'utf8');
			if (/from\s+['"]@tsrx\/core['"]/.test(source)) {
				barrel_imports.push(file);
			}
		}

		expect(barrel_imports).toEqual([]);
	});
});
