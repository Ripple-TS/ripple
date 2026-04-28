import fs from 'node:fs';
import path from 'node:path';

export const TARGET_CANDIDATES = [
	{
		target: 'ripple',
		compilerPackage: '@tsrx/ripple',
		signals: ['@tsrx/ripple', 'ripple', '@ripple-ts/vite-plugin', '@ripple-ts/compat-react'],
	},
	{
		target: 'react',
		compilerPackage: '@tsrx/react',
		signals: [
			'@tsrx/react',
			'@tsrx/vite-plugin-react',
			'@tsrx/rspack-plugin-react',
			'@tsrx/turbopack-plugin-react',
		],
	},
	{
		target: 'preact',
		compilerPackage: '@tsrx/preact',
		signals: ['@tsrx/preact', '@tsrx/vite-plugin-preact', '@tsrx/rspack-plugin-preact'],
	},
	{
		target: 'solid',
		compilerPackage: '@tsrx/solid',
		signals: ['@tsrx/solid', '@tsrx/vite-plugin-solid'],
	},
	{
		target: 'vue',
		compilerPackage: '@tsrx/vue',
		signals: ['@tsrx/vue', '@tsrx/vite-plugin-vue'],
	},
];

const CONFIG_FILES = [
	'vite.config.js',
	'vite.config.ts',
	'vite.config.mjs',
	'vite.config.mts',
	'rspack.config.js',
	'rspack.config.ts',
	'next.config.js',
	'next.config.mjs',
	'next.config.ts',
];

/**
 * @param {string} start
 */
function find_package_json(start) {
	let current = path.resolve(start);
	for (;;) {
		const candidate = path.join(current, 'package.json');
		if (fs.existsSync(candidate)) return candidate;
		const parent = path.dirname(current);
		if (parent === current) return null;
		current = parent;
	}
}

/**
 * @param {Record<string, unknown>} package_json
 */
function get_dependency_names(package_json) {
	const names = new Set();
	for (const field of [
		'dependencies',
		'devDependencies',
		'peerDependencies',
		'optionalDependencies',
	]) {
		const deps = package_json[field];
		if (deps && typeof deps === 'object') {
			for (const name of Object.keys(deps)) names.add(name);
		}
	}
	return names;
}

/**
 * @param {string} root
 */
function read_config_text(root) {
	let text = '';
	for (const file of CONFIG_FILES) {
		const filename = path.join(root, file);
		if (fs.existsSync(filename)) {
			try {
				text += `\n${fs.readFileSync(filename, 'utf8')}`;
			} catch {
				// Best-effort context only.
			}
		}
	}
	return text;
}

/**
 * @param {string} cwd
 */
export function detect_target(cwd = process.cwd()) {
	const package_json_path = find_package_json(cwd);
	if (!package_json_path) {
		return {
			cwd: path.resolve(cwd),
			packageJsonPath: null,
			detectedTarget: null,
			confidence: 'none',
			matches: [],
			message: 'No package.json found from the supplied cwd or its ancestors.',
		};
	}

	const root = path.dirname(package_json_path);
	/** @type {Record<string, unknown>} */
	let package_json;
	try {
		package_json = JSON.parse(fs.readFileSync(package_json_path, 'utf8'));
	} catch (error) {
		return {
			cwd: path.resolve(cwd),
			packageJsonPath: package_json_path,
			detectedTarget: null,
			confidence: 'none',
			matches: [],
			message: `Could not parse package.json: ${error instanceof Error ? error.message : String(error)}`,
		};
	}

	const dependency_names = get_dependency_names(package_json);
	const config_text = read_config_text(root);
	const matches = [];

	for (const candidate of TARGET_CANDIDATES) {
		const matched_signals = candidate.signals.filter(
			(signal) => dependency_names.has(signal) || config_text.includes(signal),
		);
		if (matched_signals.length > 0) {
			matches.push({
				target: candidate.target,
				compilerPackage: candidate.compilerPackage,
				signals: matched_signals,
				score: matched_signals.length,
			});
		}
	}

	matches.sort((a, b) => b.score - a.score || a.target.localeCompare(b.target));
	const detected = matches[0] ?? null;
	const tied = detected ? matches.filter((match) => match.score === detected.score) : [];

	return {
		cwd: path.resolve(cwd),
		packageJsonPath: package_json_path,
		detectedTarget: tied.length === 1 ? detected.target : null,
		confidence: detected ? (tied.length === 1 ? 'high' : 'ambiguous') : 'none',
		matches,
		message:
			tied.length > 1
				? `Multiple TSRX targets matched equally: ${tied.map((match) => match.target).join(', ')}.`
				: detected
					? `Detected TSRX target "${detected.target}" from ${detected.signals.join(', ')}.`
					: 'No TSRX target packages were found in package.json or common bundler configs.',
	};
}
