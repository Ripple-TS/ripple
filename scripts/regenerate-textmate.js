#!/usr/bin/env node
import { cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @param {string[]} targets
 * @param {string} sourcePath
 * @returns {Promise<void[]>}
 */
function writeTargets(targets, sourcePath) {
	return Promise.all(
		targets.map(async (targetPath) => {
			console.log(`[write] ${targetPath}`);
			targetPath = path.join(rootDir, targetPath);
			await cp(sourcePath, targetPath, { recursive: true });
		}),
	);
}

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.join(path.dirname(__filename), '..');

const sourceJson = path.join(rootDir, 'grammars/textmate/ripple.tmLanguage.json');
const sourcePlist = path.join(rootDir, 'grammars/textmate/info.plist');
const assetBundleGrammar = path.join(rootDir, 'assets/Ripple.tmbundle/Syntaxes/ripple.tmLanguage');

const jsonTargetFiles = [
	'packages/vscode-plugin/syntaxes/tsrx.tmLanguage.json',
	'packages/intellij-plugin/src/main/resources/textmate/Syntaxes/ripple.tmLanguage.json',
];

const plistTargetFiles = ['packages/intellij-plugin/src/main/resources/textmate/info.plist'];

const main = async () => {
	console.log('Copying TextMate grammar files...\n');

	await writeTargets(jsonTargetFiles, sourceJson);
	await writeTargets(plistTargetFiles, sourcePlist);
	await writeAssetBundleGrammar(sourceJson, assetBundleGrammar);

	console.log('\nTextMate grammar regeneration complete.');
};

/**
 * @param {string} sourcePath
 * @param {string} targetPath
 * @returns {Promise<void>}
 */
async function writeAssetBundleGrammar(sourcePath, targetPath) {
	const grammar = JSON.parse(await readFile(sourcePath, 'utf8'));
	console.log(`[write] ${path.relative(rootDir, targetPath)}`);
	await writeFile(targetPath, toPlist(grammar), 'utf8');
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function toPlist(value) {
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
		'<plist version="1.0">',
		formatPlistValue(value, 0),
		'</plist>',
		'',
	].join('\n');
}

/**
 * @param {unknown} value
 * @param {number} depth
 * @returns {string}
 */
function formatPlistValue(value, depth) {
	const indent = '\t'.repeat(depth);
	const childIndent = '\t'.repeat(depth + 1);

	if (Array.isArray(value)) {
		if (value.length === 0) return `${indent}<array/>`;

		return [
			`${indent}<array>`,
			...value.map((item) => formatPlistValue(item, depth + 1)),
			`${indent}</array>`,
		].join('\n');
	}

	if (value && typeof value === 'object') {
		const entries = Object.entries(value).sort(comparePlistKeys);
		if (entries.length === 0) return `${indent}<dict/>`;

		return [
			`${indent}<dict>`,
			...entries.flatMap(([key, item]) => [
				`${childIndent}<key>${escapeXml(key)}</key>`,
				formatPlistValue(item, depth + 1),
			]),
			`${indent}</dict>`,
		].join('\n');
	}

	if (typeof value === 'boolean') {
		return `${indent}<${value ? 'true' : 'false'}/>`;
	}

	if (typeof value === 'number') {
		return Number.isInteger(value)
			? `${indent}<integer>${value}</integer>`
			: `${indent}<real>${value}</real>`;
	}

	if (value == null) {
		return `${indent}<string></string>`;
	}

	return `${indent}<string>${escapeXml(String(value))}</string>`;
}

/**
 * @param {[string, unknown]} left
 * @param {[string, unknown]} right
 * @returns {number}
 */
function comparePlistKeys(left, right) {
	if (left[0] === 'jsx-tag-tsx' && right[0] === 'jsx-tag-tsrx') return -1;
	if (left[0] === 'jsx-tag-tsrx' && right[0] === 'jsx-tag-tsx') return 1;
	return left[0].localeCompare(right[0]);
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeXml(value) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

main().catch((error) => {
	console.error('TextMate grammar regeneration failed.');
	console.error(error);
	process.exitCode = 1;
});
