import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const extensionTomlPath = path.join(root, 'packages/zed-plugin/extension.toml');
const queryDir = path.join(root, 'packages/zed-plugin/languages/tsrx');
const nodeTypesPath = 'grammars/tree-sitter/src/node-types.json';

const extensionToml = await readFile(extensionTomlPath, 'utf8');
const rev = extensionToml.match(/^\s*rev\s*=\s*"([^"]+)"/m)?.[1];

if (!rev) {
	console.error(`Could not find a grammar rev in ${path.relative(root, extensionTomlPath)}.`);
	process.exit(1);
}

let nodeTypesJson;
try {
	nodeTypesJson = execFileSync('git', ['show', `${rev}:${nodeTypesPath}`], {
		cwd: root,
		encoding: 'utf8',
	});
} catch {
	console.error(`Could not read ${nodeTypesPath} at Zed grammar rev ${rev}.`);
	console.error('Run pnpm sync-zed-grammar-rev after committing grammar changes.');
	process.exit(1);
}

const nodeTypes = new Set(JSON.parse(nodeTypesJson).map((node) => node.type));
const queryFiles = (await readdir(queryDir)).filter((file) => file.endsWith('.scm')).sort();
const missing = [];

for (const file of queryFiles) {
	const queryPath = path.join(queryDir, file);
	const query = await readFile(queryPath, 'utf8');
	const queryWithoutComments = query.replace(/;.*$/gm, '');
	const nodeNames = queryWithoutComments.matchAll(/(?<![#@])\(([A-Za-z_][A-Za-z0-9_]*)/g);

	for (const match of nodeNames) {
		const nodeName = match[1];
		if (nodeName === '_') continue;
		if (!nodeTypes.has(nodeName)) {
			missing.push({
				file: path.relative(root, queryPath),
				nodeName,
			});
		}
	}
}

if (missing.length > 0) {
	console.error(`Zed grammar rev ${rev} is incompatible with the checked-in TSRX queries.`);
	console.error('');
	for (const { file, nodeName } of missing) {
		console.error(`- ${file} references missing node type "${nodeName}"`);
	}
	console.error('');
	console.error('Run pnpm sync-zed-grammar-rev after committing grammar changes.');
	process.exit(1);
}

console.log(`Zed grammar rev ${rev} matches checked-in TSRX query node types.`);
