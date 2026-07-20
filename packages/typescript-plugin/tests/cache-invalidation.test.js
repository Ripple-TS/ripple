import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	_reset_for_test,
	getCachedTypeDefinitionFile,
	getCachedTypeMatches,
	invalidateTypeDefinitionCaches,
} from '../src/language.js';

/** @type {string[]} */
const fixture_directories = [];

function create_fixture_directory() {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tsrx-language-cache-'));
	fixture_directories.push(directory);
	return directory;
}

describe('typescript-plugin cache invalidation', () => {
	beforeEach(() => {
		_reset_for_test();
	});

	afterEach(() => {
		_reset_for_test();
		while (fixture_directories.length > 0) {
			fs.rmSync(/** @type {string} */ (fixture_directories.pop()), {
				recursive: true,
				force: true,
			});
		}
	});

	it('refreshes cached type-definition content when the file changes', () => {
		const types_file = path.join(create_fixture_directory(), 'runtime.d.ts');
		fs.writeFileSync(types_file, 'export declare class First {}\n');

		expect(getCachedTypeDefinitionFile(types_file)).toContain('First');

		fs.writeFileSync(types_file, 'export declare class SecondLonger {}\n');

		expect(getCachedTypeDefinitionFile(types_file)).toContain('SecondLonger');
	});

	it('keeps type-name matches isolated by definition source', () => {
		const first = 'export declare class Shared {}\n';
		const second = '// a different prelude\nexport declare class Shared {}\n';

		const first_match = getCachedTypeMatches('Shared', first, '/workspace/first.d.ts');
		const second_match = getCachedTypeMatches('Shared', second, '/workspace/second.d.ts');

		expect(first_match?.index).toBe(0);
		expect(second_match?.index).toBeGreaterThan(0);
	});

	it('recomputes matches when one definition source gets new content', () => {
		const source_key = '/workspace/runtime.d.ts';
		const first = 'export declare class Shared {}\n';
		const second = '// moved\nexport declare class Shared {}\n';

		expect(getCachedTypeMatches('Shared', first, source_key)?.index).toBe(0);
		expect(getCachedTypeMatches('Shared', second, source_key)?.index).toBeGreaterThan(0);

		invalidateTypeDefinitionCaches(source_key);
		expect(getCachedTypeMatches('Shared', first, source_key)?.index).toBe(0);
	});

	it('invalidates Windows definition caches regardless of path casing', () => {
		const text = 'export declare class Shared {}\n';
		const first_match = getCachedTypeMatches('Shared', text, 'C:\\Workspace\\Types\\runtime.d.ts');

		invalidateTypeDefinitionCaches('c:\\workspace\\types\\runtime.d.ts');

		const second_match = getCachedTypeMatches('Shared', text, 'C:\\Workspace\\Types\\runtime.d.ts');
		expect(second_match).not.toBe(first_match);
	});
});
