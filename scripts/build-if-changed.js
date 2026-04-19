#!/usr/bin/env node

/**
 * Incremental build for packages that bundle workspace dependencies.
 *
 * Usage: node scripts/build-if-changed.js <package-dir> [<package-dir> ...]
 *
 * Computes a SHA-256 hash of src/ and bin/ for each package under packages/
 * and writes it to <package>/.build-hash (gitignored). These per-package
 * hashes can be reused by other scripts.
 *
 * To decide whether the specified build targets need rebuilding, all
 * per-package hashes are combined. If the combined hash differs from the
 * last successful build, only the specified packages are rebuilt.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');
const packages_dir = path.join(root, 'packages');

const build_targets = process.argv.slice(2);

if (build_targets.length === 0) {
	console.error('Usage: node scripts/build-if-changed.js <package-dir> [<package-dir> ...]');
	process.exit(1);
}

/**
 * Recursively collect all file paths under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function collect_files(dir) {
	if (!fs.existsSync(dir)) return [];
	const results = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === 'node_modules') continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...collect_files(full));
		} else if (!entry.name.endsWith('-lock.json') && entry.name !== 'yarn.lock') {
			results.push(full);
		}
	}
	return results;
}

// Compute and write per-package hashes
const all_packages = fs
	.readdirSync(packages_dir, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => e.name)
	.sort();

const combined = crypto.createHash('sha256');

for (const name of all_packages) {
	const pkg_path = path.join(packages_dir, name);
	const src_dirs = ['src', 'bin'].filter((d) => fs.existsSync(path.join(pkg_path, d)));
	if (src_dirs.length === 0) continue;

	const hash = crypto.createHash('sha256');
	const files = src_dirs.flatMap((d) => collect_files(path.join(pkg_path, d))).sort();
	for (const file of files) {
		hash.update(path.relative(pkg_path, file));
		hash.update(fs.readFileSync(file));
	}

	const pkg_hash = hash.digest('hex');
	fs.writeFileSync(path.join(pkg_path, '.build-hash'), pkg_hash + '\n');
	combined.update(name);
	combined.update(pkg_hash);
}

const combined_hash = combined.digest('hex');

// Check if any build target needs rebuilding
const build_hash_files = build_targets.map((dir) => path.join(root, dir, '.build-hash-built'));
const needs_build = build_hash_files.some((f) => {
	try {
		return fs.readFileSync(f, 'utf8').trim() !== combined_hash;
	} catch {
		return true;
	}
});

if (!needs_build) {
	console.log('All packages up to date.');
	process.exit(0);
}

console.log('Changes detected, rebuilding specified packages...\n');

const filters = build_targets.map((dir) => {
	const pkg_json = JSON.parse(fs.readFileSync(path.join(root, dir, 'package.json'), 'utf8'));
	return `--filter ${pkg_json.name}`;
});

const cmd = `pnpm ${filters.join(' ')} build`;
console.log(`▶ ${cmd}\n`);
execSync(cmd, { stdio: 'inherit', cwd: root });

// Write combined hash to build targets after successful build
for (const f of build_hash_files) {
	fs.writeFileSync(f, combined_hash + '\n');
}
