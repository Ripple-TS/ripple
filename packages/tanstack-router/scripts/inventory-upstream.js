import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export const upstreamCommit = 'da2adec76dbe6c0da6d6a0d5640f7b9388217f45';
const outputFor = (framework) =>
	new URL(
		framework === 'react' ? '../upstream/react-tests.json' : '../upstream/tests.json',
		import.meta.url,
	);

// Inventory declarations, not expanded test.each rows or assertions. TypeScript's
// parser excludes commented-out tests and retains the original source locations.
export function inventoryTests(source, filename) {
	const file = ts.createSourceFile(
		filename,
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TSX,
	);
	if (file.parseDiagnostics.length) throw new Error(`Cannot inventory invalid source: ${filename}`);
	const tests = [];
	function callee(node, modifiers = []) {
		if (ts.isIdentifier(node)) return { name: node.text, modifiers };
		if (ts.isPropertyAccessExpression(node))
			return callee(node.expression, [...modifiers, node.name.text]);
		if (ts.isCallExpression(node)) return callee(node.expression, modifiers);
		if (ts.isTaggedTemplateExpression(node)) return callee(node.tag, modifiers);
		return { name: '', modifiers };
	}
	function visit(node, suites) {
		if (ts.isCallExpression(node)) {
			const { name, modifiers } = callee(node.expression);
			const title = node.arguments[0];
			const callback = node.arguments
				.slice(1)
				.find((arg) => ts.isArrowFunction(arg) || ts.isFunctionExpression(arg));
			if (title && (callback || modifiers.includes('todo'))) {
				const label = ts.isStringLiteralLike(title) ? title.text : title.getText(file);
				if (name === 'describe') {
					ts.forEachChild(node, (child) => visit(child, [...suites, { title: label, modifiers }]));
					return;
				}
				if (name === 'test' || name === 'it') {
					tests.push({
						line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1,
						title: [...suites.map((suite) => suite.title), label].join(' > '),
						modifiers: [
							...new Set([...suites.flatMap((suite) => suite.modifiers), ...modifiers]),
						].sort(),
					});
				}
			}
		}
		ts.forEachChild(node, (child) => visit(child, suites));
	}
	visit(file, []);
	return tests;
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(directory, entry.name);
		return entry.isDirectory() ? walk(path) : [path];
	});
}

export function createInventory(checkout, framework = 'solid') {
	if (!['solid', 'react'].includes(framework)) throw new Error('Expected solid or react framework');
	const output = outputFor(framework);
	const sourceRoot = `packages/${framework}-router/tests`;
	const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
		cwd: checkout,
		encoding: 'utf8',
	}).trim();
	if (commit !== upstreamCommit)
		throw new Error(`Expected upstream ${upstreamCommit}, received ${commit}`);
	const testRoot = resolve(checkout, sourceRoot);
	const dirty = execFileSync('git', ['status', '--porcelain', '--', sourceRoot], {
		cwd: checkout,
		encoding: 'utf8',
	});
	if (dirty.trim()) throw new Error('The upstream test tree must be unmodified');
	let previous;
	try {
		previous = JSON.parse(readFileSync(output, 'utf8'));
	} catch (error) {
		if (error.code !== 'ENOENT') throw error;
	}
	if (previous && previous.commit !== commit)
		throw new Error(
			'Baseline changed: audit upstream sources and explicitly migrate the reviewed manifest before regenerating.',
		);
	const paths = walk(testRoot);
	for (const old of previous?.files ?? []) {
		if (!paths.some((path) => relative(checkout, path).replaceAll('\\', '/') === old.file))
			throw new Error(
				`Upstream source removed: ${old.file}; review mappings before updating the baseline`,
			);
	}
	const files = paths.sort().map((path) => {
		const source = readFileSync(path, 'utf8');
		const file = relative(checkout, path).replaceAll('\\', '/');
		const isTest = /\.test(?:-d)?\.[jt]sx?$/.test(file);
		const kind = file.includes('.test-d.')
			? 'types'
			: isTest
				? file.includes('/server/')
					? 'server'
					: 'client'
				: 'support';
		const old = previous?.files.find((entry) => entry.file === file);
		const sha256 = createHash('sha256').update(source).digest('hex');
		if (old && old.sha256 !== sha256)
			throw new Error(
				`Upstream source changed: ${file}; review mappings before updating the baseline`,
			);
		const milestone = /\/fileRoute\.test/.test(file)
			? 7
			: kind === 'server' ||
				  /(?:hydration|renderRouterToStream|router-client-stream|Scripts)/i.test(file)
				? 5
				: /(?:transitioner|retained-pending|store-updates|presentation-lane)/i.test(file)
					? 2
					: 4;
		return {
			file,
			sha256,
			kind,
			...(isTest
				? {
						// Every declaration inherits this mapping unless overrides[line] exists.
						mapping: old?.mapping ?? {
							status: 'deferred',
							milestone,
							reason: `Adapter behavior is scheduled for milestone ${milestone}.`,
							rippleTests: [],
						},
						tests: inventoryTests(source, file),
						overrides: old?.overrides ?? {},
					}
				: {}),
		};
	});
	return {
		schemaVersion: 1,
		repository: 'https://github.com/TanStack/router',
		commit,
		versions: {
			'@tanstack/router-core': '1.171.39',
			'@tanstack/history': '1.162.5',
			...(framework === 'solid'
				? { '@tanstack/solid-router': '1.170.43', 'solid-js': '1.9.10' }
				: { '@tanstack/react-router (source audit)': '1.170.46' }),
		},
		files,
	};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const checkout = process.argv[2];
	if (!checkout) throw new Error('Usage: pnpm upstream:inventory /path/to/pinned/TanStack-router');
	const framework = process.argv[3] ?? 'solid';
	const inventory = createInventory(resolve(checkout), framework);
	const output = outputFor(framework);
	writeFileSync(output, JSON.stringify(inventory, null, 2) + '\n');
	console.log(
		`Recorded ${inventory.files.filter((file) => file.tests).length} test files and ${inventory.files.reduce((count, file) => count + (file.tests?.length ?? 0), 0)} test declarations.`,
	);
}
