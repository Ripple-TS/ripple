#!/usr/bin/env node

import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.join(path.dirname(__filename), '..');
const sourceDir = path.join(rootDir, 'grammars', 'tree-sitter', 'queries');

/** @typedef {'zed'|'nvim'} TreeSittableCodeEditor */
/** @typedef {`indents.{VariableEditor}.scm`} IndentVariant */
/**
 * @typedef {Object} Target
 * @property {string} name
 * @property {string} dir
 * @property {IndentVariant} indentVariant
 */
/**
 * @param {TreeSittableCodeEditor} name
 * @param {string} subdir
 * @return {Target}
 */
function createTarget(name, subdir) {
	return {
		name,
		dir: path.join(rootDir, 'packages', `${name}-plugin`, subdir, 'ripple'),
		indentVariant: `indents.${name}.scm`,
	};
}

/** @type {Target[]} */
const targets = [createTarget('zed', 'languages'), createTarget('nvim', 'queries')];

const extraIndentFiles = targets.map((v) => v.indentVariant);

/**
 * @param {string[]} files
 * @param {string} destinationDir
 * @returns {Promise<void>}
 */
async function copyAll(files, destinationDir) {
	await Promise.all(
		files.map((fileName) =>
			copyFile(path.join(sourceDir, fileName), path.join(destinationDir, fileName)),
		),
	);
}

try {
	const queryFiles = (await readdir(sourceDir)).filter((fileName) => fileName.endsWith('.scm'));

	for (const target of targets) {
		await mkdir(target.dir, { recursive: true });
		await copyAll(queryFiles, target.dir);

		await copyFile(
			path.join(sourceDir, target.indentVariant),
			path.join(target.dir, 'indents.scm'),
		);

		await Promise.all(
			extraIndentFiles.map((fileName) => rm(path.join(target.dir, fileName), { force: true })),
		);

		console.log(`[copy-tree-sitter-queries] Updated ${target.name} queries`);
	}
} catch (error) {
	console.error(`[copy-tree-sitter-queries] ${/** @type {Error} */ (error).message}`);
	process.exitCode = 1;
}
