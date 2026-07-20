import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { URI } from 'vscode-uri';
import {
	classifyWorkspaceChanges,
	handleWorkspaceChanges,
	isPackageStateFile,
	isTypeDefinitionFile,
	isTypeScriptConfigFile,
	trackTypeScriptConfigDependencies,
	WORKSPACE_FILE_PATTERNS,
} from '../src/workspaceState.js';

const CHANGED = 2;

/** @param {string} file_name */
function change(file_name) {
	return {
		uri: URI.file(file_name).toString(),
		type: CHANGED,
	};
}

describe('language-server workspace state', () => {
	it('recognizes nested, shared, and named TypeScript configs', () => {
		expect(isTypeScriptConfigFile('/workspace/tsconfig.json')).toBe(true);
		expect(isTypeScriptConfigFile('/workspace/packages/app/tsconfig.json')).toBe(true);
		expect(isTypeScriptConfigFile('/workspace/tsconfig.base.json')).toBe(true);
		expect(isTypeScriptConfigFile('/workspace/configs/browser.tsconfig.json')).toBe(true);
		expect(isTypeScriptConfigFile('/workspace/jsconfig.test.json')).toBe(true);
		expect(isTypeScriptConfigFile('/workspace/package.json')).toBe(false);
	});

	it('watches TSRX sources, config variants, and package state', () => {
		// Closed or externally changed TSRX files need the same Volar filesystem
		// refresh as TypeScript and JavaScript source files.
		expect(WORKSPACE_FILE_PATTERNS).toContain('**/*.tsrx');

		// All JSON files are observed because TypeScript permits arbitrary names
		// for extended and project-reference configs. The handler filters them
		// against the config dependency graph before reloading.
		expect(WORKSPACE_FILE_PATTERNS).toContain('**/*.json');
		expect(WORKSPACE_FILE_PATTERNS).toContain('**/pnpm-lock.yaml');
	});

	it('classifies definition and package files independently', () => {
		expect(isTypeDefinitionFile('/workspace/types/runtime.d.ts')).toBe(true);
		expect(isTypeDefinitionFile('/workspace/types/runtime.d.mts')).toBe(true);
		expect(isTypeDefinitionFile('/workspace/types/runtime.d.cts')).toBe(true);
		expect(isTypeDefinitionFile('/workspace/src/runtime.ts')).toBe(false);
		expect(isPackageStateFile('/workspace/package.json')).toBe(true);
		expect(isPackageStateFile('/workspace/pnpm-lock.yaml')).toBe(true);
		expect(isPackageStateFile('/workspace/data.json')).toBe(false);
	});

	it('reloads all Volar projects for any nested or shared config change', () => {
		const effects = classifyWorkspaceChanges([
			change('/workspace/tsconfig.base.json'),
			change('/workspace/packages/a/tsconfig.json'),
			change('/workspace/packages/b/browser.tsconfig.json'),
		]);

		expect(effects).toEqual({
			reloadProjects: true,
			invalidateCompilerResolution: false,
			invalidateAllTypeDefinitions: false,
			changedTypeDefinitions: [],
		});
	});

	it('tracks arbitrary extended and project-reference config names', () => {
		const tracked_config_files = new Set();
		trackTypeScriptConfigDependencies(tracked_config_files, {
			configFileName: '/workspace/tsconfig.json',
			compilerOptions: {
				configFile: {
					extendedSourceFiles: ['/workspace/configs/shared-options.json'],
				},
			},
			projectReferences: [{ path: '/workspace/packages/lib/browser-project.json' }],
		});

		expect(tracked_config_files).toEqual(
			new Set([
				path.resolve('/workspace/tsconfig.json'),
				path.resolve('/workspace/configs/shared-options.json'),
				path.resolve('/workspace/packages/lib/browser-project.json'),
			]),
		);
		expect(
			classifyWorkspaceChanges(
				[change('/workspace/configs/shared-options.json')],
				tracked_config_files,
			).reloadProjects,
		).toBe(true);
		expect(
			classifyWorkspaceChanges([change('/workspace/data/unrelated.json')], tracked_config_files)
				.reloadProjects,
		).toBe(false);
	});

	it('invalidates package/compiler and definition state before reloading projects', () => {
		const calls = [];
		const hooks = {
			invalidateCompilerResolution: vi.fn(() => calls.push('compiler')),
			invalidateTypeDefinitions: vi.fn((file_name) =>
				calls.push(file_name ? `types:${file_name}` : 'types:all'),
			),
			reloadProjects: vi.fn(() => calls.push('reload')),
			requestRefresh: vi.fn(() => calls.push('refresh')),
		};

		const effects = handleWorkspaceChanges(
			[
				change('/workspace/package.json'),
				change('/workspace/types/runtime.d.ts'),
				change('/workspace/tsconfig.base.json'),
			],
			hooks,
		);

		expect(effects.reloadProjects).toBe(true);
		expect(hooks.invalidateTypeDefinitions).toHaveBeenCalledWith();
		expect(hooks.invalidateTypeDefinitions).toHaveBeenCalledTimes(1);
		expect(hooks.requestRefresh).toHaveBeenCalledWith(true);
		expect(calls).toEqual(['compiler', 'types:all', 'reload', 'refresh']);
	});

	it('invalidates only changed definition files without rebuilding projects', () => {
		const hooks = {
			invalidateCompilerResolution: vi.fn(),
			invalidateTypeDefinitions: vi.fn(),
			reloadProjects: vi.fn(),
			requestRefresh: vi.fn(),
		};

		handleWorkspaceChanges(
			[
				change('/workspace/types/a.d.ts'),
				change('/workspace/types/b.d.mts'),
				change('/workspace/src/app.ts'),
			],
			hooks,
		);

		expect(hooks.invalidateTypeDefinitions.mock.calls).toEqual([
			['/workspace/types/a.d.ts'],
			['/workspace/types/b.d.mts'],
		]);
		expect(hooks.invalidateCompilerResolution).not.toHaveBeenCalled();
		expect(hooks.reloadProjects).not.toHaveBeenCalled();
		expect(hooks.requestRefresh).not.toHaveBeenCalled();
	});
});
