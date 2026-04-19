#!/usr/bin/env node

/**
 * Build packages only if their source files have changed since the last build.
 *
 * Usage: node scripts/build-if-changed.js <package-dir> [<package-dir> ...]
 *
 * Each package-dir is relative to the workspace root (e.g. "packages/vscode-plugin").
 * Source dirs are auto-detected: src/ is always included, bin/ is included if it exists.
 * A hash of all source files is stored in <package-dir>/dist/.build-hash.
 * If the hash matches, the build is skipped.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const package_dirs = process.argv.slice(2);

if (package_dirs.length === 0) {
	console.error('Usage: node scripts/build-if-changed.js <package-dir> [<package-dir> ...]');
	process.exit(1);
}

/**
 * Recursively collect all file paths under a directory, sorted for determinism.
 * @param {string} dir
 * @returns {string[]}
 */
function collect_files(dir) {
	if (!fs.existsSync(dir)) return [];
	const results = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...collect_files(full));
		} else {
			results.push(full);
		}
	}
	return results;
}

/**
 * Compute a SHA-256 hash of all source files in a package.
 * @param {string} pkg_path - Absolute path to the package
 * @returns {string}
 */
function compute_hash(pkg_path) {
	const hash = crypto.createHash('sha256');
	const src_dirs = ['src', 'bin'].filter((d) => fs.existsSync(path.join(pkg_path, d)));
	const files = src_dirs.flatMap((d) => collect_files(path.join(pkg_path, d))).sort();

	for (const file of files) {
		// Include relative path in hash so renames are detected
		hash.update(path.relative(pkg_path, file));
		hash.update(fs.readFileSync(file));
	}
	return hash.digest('hex');
}

const to_build = [];

for (const dir of package_dirs) {
	const pkg_path = path.resolve(root, dir);
	const hash_file = path.join(pkg_path, 'dist', '.build-hash');
	const current_hash = compute_hash(pkg_path);

	let stored_hash = '';
	try {
		stored_hash = fs.readFileSync(hash_file, 'utf8').trim();
	} catch {}

	if (current_hash === stored_hash) {
		console.log(`✔ ${dir} — no changes, skipping build`);
	} else {
		console.log(`⟳ ${dir} — changes detected, will build`);
		to_build.push({ dir, pkg_path, hash_file, current_hash });
	}
}

if (to_build.length === 0) {
	console.log('All packages up to date.');
	process.exit(0);
}

const filters = to_build.map(({ pkg_path }) => {
	const pkg_json = JSON.parse(fs.readFileSync(path.join(pkg_path, 'package.json'), 'utf8'));
	return `--filter ${pkg_json.name}`;
});

const cmd = `pnpm ${filters.join(' ')} build`;
console.log(`\n▶ ${cmd}\n`);
execSync(cmd, { stdio: 'inherit', cwd: root });

// Write hashes after successful build
for (const { hash_file, current_hash } of to_build) {
	fs.writeFileSync(hash_file, current_hash + '\n');
}
