import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup_fixture_workspaces, create_fixture_workspace } from './workspace-fixtures.js';
import fs from 'fs';

/** @import { WORKSPACE_CONFIGS } from './workspace-fixtures.js'; */

const {
	is_ripple_file,
	find_workspace_compiler_entry_for_file,
	COMPILER_CANDIDATES,
	RIPPLE_EXTENSIONS,
	_reset_for_test,
} = require('../src/language.js');

describe('typescript-plugin compiler resolution', () => {
	beforeEach(() => {
		_reset_for_test();
	});

	afterEach(() => {
		cleanup_fixture_workspaces();
	});

	describe('extension metadata', () => {
		it('recognizes .tsrx as the only supported extension', () => {
			expect(RIPPLE_EXTENSIONS).toEqual(['.tsrx']);
		});

		it('maps all compiler candidates to .tsrx', () => {
			const ripple_candidate = COMPILER_CANDIDATES.find(
				([package_name]) => package_name === '@tsrx/ripple',
			);
			const react_candidate = COMPILER_CANDIDATES.find(
				([package_name]) => package_name === '@tsrx/react',
			);
			const vue_candidate = COMPILER_CANDIDATES.find(
				([package_name]) => package_name === '@tsrx/vue',
			);
			const solid_candidate = COMPILER_CANDIDATES.find(
				([package_name]) => package_name === '@tsrx/solid',
			);
			const preact_candidate = COMPILER_CANDIDATES.find(
				([package_name]) => package_name === '@tsrx/preact',
			);

			if (
				!ripple_candidate ||
				!react_candidate ||
				!solid_candidate ||
				!preact_candidate ||
				!vue_candidate
			) {
				throw new Error('Missing compiler candidates');
			}

			expect(ripple_candidate[2]).toEqual(['.tsrx']);
			expect(react_candidate[2]).toEqual(['.tsrx']);
			expect(vue_candidate[2]).toEqual(['.tsrx']);
			expect(solid_candidate[2]).toEqual(['.tsrx']);
			expect(preact_candidate[2]).toEqual(['.tsrx']);
		});
	});

	describe('is_ripple_file', () => {
		it.each([
			['Component.tsrx', true],
			['/path/to/Component.tsrx', true],
			['Component.ripple', false],
			['Component.rsrx', false],
			['Component.ts', false],
			['Component.tsx', false],
			['Component.js', false],
			['Component.jsx', false],
			['', false],
		])('returns %j for %j', (file_name, expected) => {
			expect(is_ripple_file(file_name)).toBe(expected);
		});
	});

	describe('workspace resolution', () => {
		it('selects the ripple compiler in a ripple-only project', () => {
			const workspace = create_fixture_workspace('ripple-only');
			const file_name = path.join(workspace, 'src', 'App.tsrx');
			const expected = path.join(workspace, 'node_modules', '@tsrx', 'ripple', 'src', 'index.js');

			expect(find_workspace_compiler_entry_for_file(file_name, fs.existsSync, new Map())).toBe(
				expected,
			);
		});

		it('selects the react compiler in a react-only project', () => {
			const workspace = create_fixture_workspace('react-only');
			const file_name = path.join(workspace, 'src', 'App.tsrx');
			const expected = path.join(workspace, 'node_modules', '@tsrx', 'react', 'src', 'index.js');

			expect(find_workspace_compiler_entry_for_file(file_name, fs.existsSync, new Map())).toBe(
				expected,
			);
		});

		it('selects the solid compiler in a solid-only project', () => {
			const workspace = create_fixture_workspace('solid-only');
			const file_name = path.join(workspace, 'src', 'App.tsrx');
			const expected = path.join(workspace, 'node_modules', '@tsrx', 'solid', 'src', 'index.js');

			expect(find_workspace_compiler_entry_for_file(file_name, fs.existsSync, new Map())).toBe(
				expected,
			);
		});

		it('selects the preact compiler in a preact-only project', () => {
			const workspace = create_fixture_workspace('preact-only');
			const file_name = path.join(workspace, 'src', 'App.tsrx');
			const expected = path.join(workspace, 'node_modules', '@tsrx', 'preact', 'src', 'index.js');

			expect(find_workspace_compiler_entry_for_file(file_name, fs.existsSync, new Map())).toBe(
				expected,
			);
		});

		it('selects the vue compiler in a vue-only project', () => {
			const workspace = create_fixture_workspace('vue-only');
			const file_name = path.join(workspace, 'src', 'App.tsrx');
			const expected = path.join(workspace, 'node_modules', '@tsrx', 'vue', 'src', 'index.js');

			expect(find_workspace_compiler_entry_for_file(file_name, fs.existsSync, new Map())).toBe(
				expected,
			);
		});

		it('prefers the ripple compiler when both compilers exist in a ripple project', () => {
			const workspace = create_fixture_workspace('both');
			const file_name = path.join(workspace, 'src', 'App.tsrx');
			const expected = path.join(workspace, 'node_modules', '@tsrx', 'ripple', 'src', 'index.js');

			expect(find_workspace_compiler_entry_for_file(file_name, fs.existsSync, new Map())).toBe(
				expected,
			);
		});

		it('prefers the react compiler when both compilers exist in a react project', () => {
			const workspace = create_fixture_workspace('both-react');
			const file_name = path.join(workspace, 'src', 'App.tsrx');
			const expected = path.join(workspace, 'node_modules', '@tsrx', 'react', 'src', 'index.js');

			expect(find_workspace_compiler_entry_for_file(file_name, fs.existsSync, new Map())).toBe(
				expected,
			);
		});

		it('prefers the preact compiler when multiple compilers exist in a preact project', () => {
			const workspace = create_fixture_workspace('both-preact');
			const file_name = path.join(workspace, 'src', 'App.tsrx');
			const expected = path.join(workspace, 'node_modules', '@tsrx', 'preact', 'src', 'index.js');

			expect(find_workspace_compiler_entry_for_file(file_name, fs.existsSync, new Map())).toBe(
				expected,
			);
		});

		it('prefers the vue compiler when multiple compilers exist in a vue project', () => {
			const workspace = create_fixture_workspace('both-vue');
			const file_name = path.join(workspace, 'src', 'App.tsrx');
			const expected = path.join(workspace, 'node_modules', '@tsrx', 'vue', 'src', 'index.js');

			expect(find_workspace_compiler_entry_for_file(file_name, fs.existsSync, new Map())).toBe(
				expected,
			);
		});

		it('walks up nested directories to find the nearest compiler', () => {
			const workspace = create_fixture_workspace('ripple-only');
			const file_name = path.join(workspace, 'src', 'nested', 'components', 'App.tsrx');
			const expected = path.join(workspace, 'node_modules', '@tsrx', 'ripple', 'src', 'index.js');

			expect(find_workspace_compiler_entry_for_file(file_name, fs.existsSync, new Map())).toBe(
				expected,
			);
		});

		it('returns undefined when no compiler exists', () => {
			expect(
				find_workspace_compiler_entry_for_file('/workspace/src/App.tsrx', () => false, new Map()),
			).toBeUndefined();
		});
	});

	describe('cache behavior', () => {
		it('reuses the cached result for repeated lookups in the same directory', () => {
			const workspace = create_fixture_workspace('ripple-only');
			const compiler_path_map = new Map();
			const expected = path.join(workspace, 'node_modules', '@tsrx', 'ripple', 'src', 'index.js');
			let exists_sync_calls = 0;

			/** @param {import('fs').PathLike} file_path */
			const exists_sync = (file_path) => {
				exists_sync_calls += 1;
				return fs.existsSync(file_path);
			};

			expect(
				find_workspace_compiler_entry_for_file(
					path.join(workspace, 'src', 'A.tsrx'),
					exists_sync,
					compiler_path_map,
				),
			).toBe(expected);
			expect(
				find_workspace_compiler_entry_for_file(
					path.join(workspace, 'src', 'B.tsrx'),
					exists_sync,
					compiler_path_map,
				),
			).toBe(expected);
			expect(exists_sync_calls).toBeGreaterThan(0);
		});
	});

	describe('project permutation matrix', () => {
		/** @type {{ name: keyof typeof WORKSPACE_CONFIGS, expected: string[] }[]} */
		const cases = [
			{ name: 'ripple-only', expected: ['@tsrx', 'ripple'] },
			{ name: 'react-only', expected: ['@tsrx', 'react'] },
			{ name: 'solid-only', expected: ['@tsrx', 'solid'] },
			{ name: 'preact-only', expected: ['@tsrx', 'preact'] },
			{ name: 'vue-only', expected: ['@tsrx', 'vue'] },
			{ name: 'both', expected: ['@tsrx', 'ripple'] },
			{ name: 'both-react', expected: ['@tsrx', 'react'] },
			{ name: 'both-preact', expected: ['@tsrx', 'preact'] },
			{ name: 'both-vue', expected: ['@tsrx', 'vue'] },
		];

		for (const test_case of cases) {
			it(`${test_case.name} resolves App.tsrx to the expected compiler`, () => {
				const workspace = create_fixture_workspace(test_case.name);
				const compiler_path = find_workspace_compiler_entry_for_file(
					path.join(workspace, 'src', 'App.tsrx'),
					fs.existsSync,
					new Map(),
				);

				expect(compiler_path).toContain(path.join(...test_case.expected));
			});
		}
	});
});
