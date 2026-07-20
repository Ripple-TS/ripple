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
			restartLanguageServer: false,
			reloadProjects: true,
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

	it('retains prior config dependencies while projects are lazily recreated', () => {
		const tracked_config_files = new Set();
		trackTypeScriptConfigDependencies(tracked_config_files, {
			configFileName: '/workspace/tsconfig.json',
			compilerOptions: {
				configFile: {
					extendedSourceFiles: ['/workspace/configs/previous-options.json'],
				},
			},
		});

		trackTypeScriptConfigDependencies(tracked_config_files, {
			configFileName: '/workspace/tsconfig.json',
			compilerOptions: {
				configFile: {
					extendedSourceFiles: ['/workspace/configs/current-options.json'],
				},
			},
		});

		expect(tracked_config_files).toEqual(
			new Set([
				path.resolve('/workspace/tsconfig.json'),
				path.resolve('/workspace/configs/previous-options.json'),
				path.resolve('/workspace/configs/current-options.json'),
			]),
		);
	});

	it('matches Windows config dependencies regardless of path casing', () => {
		const tracked_config_files = new Set();
		trackTypeScriptConfigDependencies(tracked_config_files, {
			configFileName: 'C:\\Workspace\\tsconfig.json',
			compilerOptions: {
				configFile: {
					extendedSourceFiles: ['C:\\Workspace\\Configs\\shared-options.json'],
				},
			},
		});

		const effects = classifyWorkspaceChanges(
			[
				{
					uri: 'file:///c:/workspace/configs/shared-options.json',
					type: CHANGED,
				},
			],
			tracked_config_files,
		);

		expect(effects.reloadProjects).toBe(true);
	});

	it('restarts the language server when package state changes', () => {
		const calls = [];
		const hooks = {
			restartLanguageServer: vi.fn(() => calls.push('restart')),
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

		expect(effects).toEqual({
			restartLanguageServer: true,
			reloadProjects: false,
			changedTypeDefinitions: [],
		});
		expect(calls).toEqual(['restart']);
	});

	it('invalidates only changed definition files without rebuilding projects', () => {
		const hooks = {
			restartLanguageServer: vi.fn(),
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
		expect(hooks.restartLanguageServer).not.toHaveBeenCalled();
		expect(hooks.reloadProjects).not.toHaveBeenCalled();
		expect(hooks.requestRefresh).not.toHaveBeenCalled();
	});
});
