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
			'@tsrx/bun-plugin-react',
		],
	},
	{
		target: 'preact',
		compilerPackage: '@tsrx/preact',
		signals: [
			'@tsrx/preact',
			'@tsrx/vite-plugin-preact',
			'@tsrx/rspack-plugin-preact',
			'@tsrx/bun-plugin-preact',
		],
	},
	{
		target: 'solid',
		compilerPackage: '@tsrx/solid',
		signals: ['@tsrx/solid', '@tsrx/vite-plugin-solid', '@tsrx/rspack-plugin-solid'],
	},
	{
		target: 'vue',
		compilerPackage: '@tsrx/vue',
		signals: ['@tsrx/vue', '@tsrx/vite-plugin-vue', '@tsrx/rspack-plugin-vue'],
	},
];

export const CONFIG_FILES = [
	'vite.config.js',
	'vite.config.ts',
	'vite.config.mjs',
	'vite.config.mts',
	'rspack.config.js',
	'rspack.config.ts',
	'next.config.js',
	'next.config.mjs',
	'next.config.ts',
	'tsconfig.json',
	'prettier.config.js',
	'prettier.config.mjs',
	'prettier.config.cjs',
	'.prettierrc',
	'eslint.config.js',
	'eslint.config.mjs',
	'eslint.config.cjs',
];

/**
 * @param {string | undefined} [cwd]
 */
export function resolve_cwd(cwd) {
	return path.resolve(cwd ?? process.cwd());
}

/**
 * @param {string | undefined} [cwd]
 */
export function resolve_cwd_context(cwd) {
	const cwd_specified = cwd !== undefined;
	const resolved_cwd = resolve_cwd(cwd);
	return {
		cwd: resolved_cwd,
		hint: cwd_hint(resolved_cwd, cwd_specified) || null,
	};
}

/**
 * @param {string} start
 */
export function find_package_json(start) {
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
 * @param {string} resolved_cwd
 * @param {boolean} cwd_specified
 */
function cwd_hint(resolved_cwd, cwd_specified) {
	if (cwd_specified) return '';
	return ` Hint: cwd was not supplied, so this defaulted to ${resolved_cwd}. Pass cwd pointing at your project root for accurate target detection.`;
}

/**
 * @param {string | undefined} [cwd]
 */
export function detect_target(cwd) {
	const cwd_context = resolve_cwd_context(cwd);
	const package_json_path = find_package_json(cwd_context.cwd);
	if (!package_json_path) {
		return {
			cwd: cwd_context.cwd,
			packageJsonPath: null,
			detectedTarget: null,
			confidence: /** @type {'none'} */ ('none'),
			matches: [],
			message:
				'No package.json found from the supplied cwd or its ancestors.' + (cwd_context.hint ?? ''),
		};
	}

	const root = path.dirname(package_json_path);
	/** @type {Record<string, unknown>} */
	let package_json;
	try {
		package_json = JSON.parse(fs.readFileSync(package_json_path, 'utf8'));
	} catch (error) {
		return {
			cwd: cwd_context.cwd,
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
	const detected_target = tied.length === 1 ? detected.target : null;

	const base_message =
		tied.length > 1
			? `Multiple TSRX targets matched equally: ${tied.map((match) => match.target).join(', ')}.`
			: detected
				? `Detected TSRX target "${detected.target}" from ${detected.signals.join(', ')}.`
				: 'No TSRX target packages were found in package.json or common bundler configs.';

	return {
		cwd: cwd_context.cwd,
		packageJsonPath: package_json_path,
		detectedTarget: detected_target,
		confidence: /** @type {'high' | 'ambiguous' | 'none'} */ (
			detected ? (tied.length === 1 ? 'high' : 'ambiguous') : 'none'
		),
		matches,
		message: base_message + (cwd_context.hint ?? ''),
	};
}
