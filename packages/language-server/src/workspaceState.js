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
	const is_windows_path =
		process.platform === 'win32' || /^[a-z]:[\\/]/i.test(file_name) || file_name.startsWith('\\\\');
	const path_api = is_windows_path ? path.win32 : path;
	const normalized = path_api.normalize(path_api.resolve(file_name));
	return is_windows_path ? normalized.toLowerCase() : normalized;
}

/**
 * Record every config file that contributed to a parsed TypeScript project.
 * This set is intentionally additive across project reloads because Volar
 * recreates projects lazily. TypeScript allows both `extends` and
 * project-reference configs to use names other than tsconfig.json, so filename
 * matching alone is not sufficient.
 * @param {Set<string>} config_files
 * @param {{
 *   configFileName?: string,
 *   compilerOptions?: import('typescript').CompilerOptions,
 *   projectReferences?: readonly import('typescript').ProjectReference[],
 *   configDependencies?: Iterable<string>,
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

	for (const dependency of project.configDependencies ?? []) {
		config_files.add(normalizeFileName(dependency));
	}
}

/**
 * Classify watched changes before mutating project state. Package changes need
 * a process restart because Node does not expose a supported way to evict a
 * loaded ESM compiler and its transitive module graph.
 * @param {import('@volar/language-server').FileEvent[]} changes
 * @param {ReadonlySet<string>} [tracked_config_files]
 */
export function classifyWorkspaceChanges(changes, tracked_config_files = new Set()) {
	let reloadProjects = false;
	let restartLanguageServer = false;
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
			restartLanguageServer = true;
		} else if (isTypeDefinitionFile(file_name)) {
			changedTypeDefinitions.add(file_name);
		}
	}

	return {
		restartLanguageServer,
		reloadProjects: reloadProjects && !restartLanguageServer,
		changedTypeDefinitions: restartLanguageServer ? [] : [...changedTypeDefinitions],
	};
}

/**
 * @param {import('@volar/language-server').FileEvent[]} changes
 * @param {{
 *   restartLanguageServer: () => void,
 *   invalidateCompilerResolutionCaches?: () => void,
 *   reloadProjects: () => void,
 *   requestRefresh: (clearDiagnostics: boolean) => unknown,
 *   invalidateTypeDefinitions: (file_name?: string) => void,
 * }} hooks
 * @param {ReadonlySet<string>} [tracked_config_files]
 */
export function handleWorkspaceChanges(changes, hooks, tracked_config_files) {
	const effects = classifyWorkspaceChanges(changes, tracked_config_files);

	if (effects.restartLanguageServer) {
		hooks.restartLanguageServer();
		return effects;
	}

	for (const file_name of effects.changedTypeDefinitions) {
		hooks.invalidateTypeDefinitions(file_name);
	}

	if (effects.reloadProjects) {
		hooks.invalidateCompilerResolutionCaches?.();
		hooks.reloadProjects();
		void hooks.requestRefresh(true);
	}

	return effects;
}
