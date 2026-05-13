import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const extensionTomlPath = path.join(root, 'packages/zed-plugin/extension.toml');
const grammarPath = 'grammars/tree-sitter';

const currentRev = execFileSync('git', ['rev-parse', 'HEAD'], {
	cwd: root,
	encoding: 'utf8',
}).trim();

try {
	execFileSync('git', ['cat-file', '-e', `${currentRev}:${grammarPath}/src/node-types.json`], {
		cwd: root,
	});
} catch {
	console.error(`Current HEAD does not contain ${grammarPath}/src/node-types.json.`);
	console.error(
		'Commit generated tree-sitter grammar artifacts before updating the Zed grammar rev.',
	);
	process.exit(1);
}

const extensionToml = await readFile(extensionTomlPath, 'utf8');
const previousRev = extensionToml.match(/^\s*rev\s*=\s*"([^"]+)"/m)?.[1];

if (!previousRev) {
	console.error(`Could not find a grammar rev in ${path.relative(root, extensionTomlPath)}.`);
	process.exit(1);
}

if (previousRev === currentRev) {
	console.log(`Zed grammar rev already at ${currentRev}, skipping.`);
	process.exit(0);
}

await writeFile(
	extensionTomlPath,
	extensionToml.replace(/^(\s*rev\s*=\s*")[^"]+(")/m, `$1${currentRev}$2`),
);

console.log(`Zed grammar rev: ${previousRev} -> ${currentRev}`);
