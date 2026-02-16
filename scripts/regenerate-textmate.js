#!/usr/bin/env node
import { cp } from 'node:fs/promises';
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

const jsonTargetFiles = [
	'packages/vscode-plugin/syntaxes/ripple.tmLanguage.json',
	'packages/intellij-plugin/src/main/resources/textmate/Syntaxes/ripple.tmLanguage.json',
];

const plistTargetFiles = ['packages/intellij-plugin/src/main/resources/textmate/info.plist'];

const main = async () => {
	console.log('Copying TextMate grammar files...\n');

	await writeTargets(jsonTargetFiles, sourceJson);
	await writeTargets(plistTargetFiles, sourcePlist);

	console.log('\nTextMate grammar regeneration complete.');
};

main().catch((error) => {
	console.error('TextMate grammar successfully copied to destinations.');
	console.error(error);
	process.exitCode = 1;
});
