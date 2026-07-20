import path from 'node:path';
import { URI } from 'vscode-uri';

export const WORKSPACE_FILE_PATTERNS = [
	// Volar consumes source-file events itself to refresh filesystem snapshots
	// and TypeScript project versions. These do not trigger the explicit cache
	// invalidation or project reloads classified below.
	'**/*.tsrx',
	'**/*.ts',
	'**/*.tsx',
	'**/*.cts',
	'**/*.mts',
	'**/*.js',
	'**/*.jsx',
	'**/*.cjs',
	'**/*.mjs',
	'**/*.json',
	'**/pnpm-lock.yaml',
	'**/pnpm-workspace.yaml',
	'**/yarn.lock',
	'**/bun.lock',
	'**/bun.lockb',
];

const PACKAGE_STATE_FILE_NAMES = new Set([
	'package.json',
	'package-lock.json',
	'pnpm-lock.yaml',
	'pnpm-workspace.yaml',
	'yarn.lock',
	'bun.lock',
	'bun.lockb',
]);

/**
 * @param {string} file_name
 */
export function isTypeScriptConfigFile(file_name) {
	const base_name = path.basename(file_name).toLowerCase();
	return (
		base_name.endsWith('.json') &&
		(base_name.includes('tsconfig') || base_name.includes('jsconfig'))
	);
}

/**
 * @param {string} file_name
 */
export function isTypeDefinitionFile(file_name) {
	return /\.d\.[cm]?ts$/i.test(file_name);
}

/**
 * @param {string} file_name
 */
export function isPackageStateFile(file_name) {
	return PACKAGE_STATE_FILE_NAMES.has(path.basename(file_name).toLowerCase());
}

/**
 * @param {string} file_name
 */
function normalizeFileName(file_name) {
	return path.normalize(path.resolve(file_name));
}

/**
 * Record every config file that contributed to a parsed TypeScript project.
 * TypeScript allows both `extends` and project-reference configs to use names
 * other than tsconfig.json, so filename matching alone is not sufficient.
 * @param {Set<string>} config_files
 * @param {{
 *   configFileName?: string,
 *   compilerOptions?: import('typescript').CompilerOptions,
 *   projectReferences?: readonly import('typescript').ProjectReference[],
 * }} project
 */
export function trackTypeScriptConfigDependencies(config_files, project) {
	if (project.configFileName) {
		config_files.add(normalizeFileName(project.configFileName));
	}

	const config_file = /** @type {import('typescript').TsConfigSourceFile | undefined} */ (
		project.compilerOptions?.configFile
	);
	for (const extended_file of config_file?.extendedSourceFiles ?? []) {
		config_files.add(normalizeFileName(extended_file));
	}

	for (const reference of project.projectReferences ?? []) {
		config_files.add(normalizeFileName(reference.path));
	}
}

/**
 * Classify watched changes before mutating project state. Package changes are
 * broader than config changes: they can change both the selected TSRX compiler
 * and the compiler module loaded at that path.
 * @param {import('@volar/language-server').FileEvent[]} changes
 * @param {ReadonlySet<string>} [tracked_config_files]
 */
export function classifyWorkspaceChanges(changes, tracked_config_files = new Set()) {
	let reloadProjects = false;
	let invalidateCompilerResolution = false;
	let invalidateAllTypeDefinitions = false;
	/** @type {Set<string>} */
	const changedTypeDefinitions = new Set();

	for (const change of changes) {
		const uri = URI.parse(change.uri);
		const file_name = uri.scheme === 'file' ? uri.fsPath : uri.path;

		if (
			isTypeScriptConfigFile(file_name) ||
			tracked_config_files.has(normalizeFileName(file_name))
		) {
			reloadProjects = true;
		}

		if (isPackageStateFile(file_name)) {
			reloadProjects = true;
			invalidateCompilerResolution = true;
			invalidateAllTypeDefinitions = true;
		} else if (isTypeDefinitionFile(file_name)) {
			changedTypeDefinitions.add(file_name);
		}
	}

	return {
		reloadProjects,
		invalidateCompilerResolution,
		invalidateAllTypeDefinitions,
		changedTypeDefinitions: [...changedTypeDefinitions],
	};
}

/**
 * @param {import('@volar/language-server').FileEvent[]} changes
 * @param {{
 *   reloadProjects: () => void,
 *   requestRefresh: (clearDiagnostics: boolean) => unknown,
 *   invalidateCompilerResolution: () => void,
 *   invalidateTypeDefinitions: (file_name?: string) => void,
 * }} hooks
 * @param {ReadonlySet<string>} [tracked_config_files]
 */
export function handleWorkspaceChanges(changes, hooks, tracked_config_files) {
	const effects = classifyWorkspaceChanges(changes, tracked_config_files);

	if (effects.invalidateCompilerResolution) {
		hooks.invalidateCompilerResolution();
	}

	if (effects.invalidateAllTypeDefinitions) {
		hooks.invalidateTypeDefinitions();
	} else {
		for (const file_name of effects.changedTypeDefinitions) {
			hooks.invalidateTypeDefinitions(file_name);
		}
	}

	if (effects.reloadProjects) {
		hooks.reloadProjects();
		void hooks.requestRefresh(true);
	}

	return effects;
}
