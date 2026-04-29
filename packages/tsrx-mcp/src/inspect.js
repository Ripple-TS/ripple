import fs from 'node:fs';
import path from 'node:path';
import { CONFIG_FILES, detect_target, TARGET_CANDIDATES } from './target.js';

const DEPENDENCY_FIELDS = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
];

const TOOLING_PACKAGES = [
	'@tsrx/prettier-plugin',
	'@tsrx/eslint-plugin',
	'@tsrx/typescript-plugin',
	'@tsrx/language-server',
	'@tsrx/vscode-plugin',
];

const PACKAGE_MANAGER_LOCKFILES = [
	{ file: 'pnpm-lock.yaml', packageManager: 'pnpm' },
	{ file: 'package-lock.json', packageManager: 'npm' },
	{ file: 'yarn.lock', packageManager: 'yarn' },
	{ file: 'bun.lock', packageManager: 'bun' },
	{ file: 'bun.lockb', packageManager: 'bun' },
];

/**
 * @param {Record<string, unknown>} package_json
 */
function get_dependencies(package_json) {
	const dependencies = [];
	for (const field of DEPENDENCY_FIELDS) {
		const values = package_json[field];
		if (!values || typeof values !== 'object') continue;
		for (const [name, version] of Object.entries(values)) {
			dependencies.push({
				name,
				version: typeof version === 'string' ? version : String(version),
				field,
			});
		}
	}
	return dependencies.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @param {string} root
 */
function find_config_files(root) {
	return CONFIG_FILES.filter((file) => fs.existsSync(path.join(root, file)));
}

/**
 * @param {string} root
 * @param {Record<string, unknown>} package_json
 */
function detect_package_manager(root, package_json) {
	if (typeof package_json.packageManager === 'string') {
		return package_json.packageManager.split('@')[0] || package_json.packageManager;
	}
	const match = PACKAGE_MANAGER_LOCKFILES.find(({ file }) => fs.existsSync(path.join(root, file)));
	return match?.packageManager ?? null;
}

/**
 * @param {string | null} package_manager
 */
function runner(package_manager) {
	if (package_manager === 'npm') return 'npm run';
	if (package_manager === 'yarn') return 'yarn';
	if (package_manager === 'bun') return 'bun run';
	return 'pnpm';
}

/**
 * @param {Record<string, unknown>} package_json
 */
function get_scripts(package_json) {
	const scripts = package_json.scripts;
	if (!scripts || typeof scripts !== 'object') return {};
	/** @type {Record<string, string>} */
	const normalized = {};
	for (const [name, command] of Object.entries(scripts)) {
		if (typeof command === 'string') normalized[name] = command;
	}
	return normalized;
}

/**
 * @param {Record<string, string>} scripts
 * @param {string | null} package_manager
 */
function get_likely_commands(scripts, package_manager) {
	const run = runner(package_manager);
	return {
		format: scripts.format ? `${run} format` : null,
		formatCheck: scripts['format:check'] ? `${run} format:check` : null,
		typecheck: scripts.typecheck ? `${run} typecheck` : null,
		test: scripts.test ? `${run} test` : null,
	};
}

/**
 * @param {Array<{ name: string, version: string, field: string }>} dependencies
 */
function get_tsrx_packages(dependencies) {
	return dependencies.filter(
		({ name }) =>
			name === 'ripple' ||
			name.startsWith('@tsrx/') ||
			name.startsWith('@ripple-ts/') ||
			name.includes('tsrx'),
	);
}

/**
 * @param {Array<{ name: string, version: string, field: string }>} dependencies
 */
function get_tooling(dependencies) {
	return TOOLING_PACKAGES.map((name) => {
		const dependency = dependencies.find((item) => item.name === name);
		return {
			name,
			present: Boolean(dependency),
			version: dependency?.version ?? null,
			field: dependency?.field ?? null,
		};
	});
}

/**
 * @param {Array<{ name: string, version: string, field: string }>} dependencies
 */
function get_target_package_status(dependencies) {
	return TARGET_CANDIDATES.map((candidate) => {
		const packages = [];
		for (const signal of candidate.signals) {
			const dependency = dependencies.find((item) => item.name === signal);
			if (dependency) packages.push(dependency);
		}
		return {
			target: candidate.target,
			compilerPackage: candidate.compilerPackage,
			present: packages.length > 0,
			packages: packages.map((dependency) => ({
				name: dependency.name,
				version: dependency.version,
				field: dependency.field,
			})),
		};
	});
}

/**
 * @param {{ cwd?: string }} input
 */
export function inspect_project(input = {}) {
	const detection = detect_target(input.cwd);
	const cwd = detection.cwd;
	const package_json_path = detection.packageJsonPath;

	if (!package_json_path) {
		return {
			cwd,
			root: null,
			packageJsonPath: null,
			packageName: null,
			packageManager: null,
			target: detection,
			configFiles: [],
			tsrxPackages: [],
			targetPackages: [],
			tooling: [],
			scripts: {},
			commands: {
				format: null,
				formatCheck: null,
				typecheck: null,
				test: null,
			},
			message: detection.message,
		};
	}

	const root = path.dirname(package_json_path);
	/** @type {Record<string, unknown>} */
	let package_json;
	try {
		package_json = JSON.parse(fs.readFileSync(package_json_path, 'utf8'));
	} catch (error) {
		return {
			cwd,
			root,
			packageJsonPath: package_json_path,
			packageName: null,
			packageManager: null,
			target: detection,
			configFiles: find_config_files(root),
			tsrxPackages: [],
			targetPackages: [],
			tooling: [],
			scripts: {},
			commands: {
				format: null,
				formatCheck: null,
				typecheck: null,
				test: null,
			},
			message: `Could not parse package.json: ${error instanceof Error ? error.message : String(error)}`,
		};
	}

	const dependencies = get_dependencies(package_json);
	const scripts = get_scripts(package_json);
	const package_manager = detect_package_manager(root, package_json);
	const tsrx_packages = get_tsrx_packages(dependencies);
	const target_packages = get_target_package_status(dependencies);

	return {
		cwd,
		root,
		packageJsonPath: package_json_path,
		packageName: typeof package_json.name === 'string' ? package_json.name : null,
		packageManager: package_manager,
		target: detection,
		configFiles: find_config_files(root),
		tsrxPackages: tsrx_packages,
		targetPackages: target_packages,
		tooling: get_tooling(dependencies),
		scripts,
		commands: get_likely_commands(scripts, package_manager),
		message: `${detection.message} Found ${tsrx_packages.length} TSRX-related package${tsrx_packages.length === 1 ? '' : 's'}.`,
	};
}
