import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../../../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'ripple-router-release-'));
const consumer = join(temporary, 'consumer');
const env = { ...process.env, CI: 'true' };
// Resolve executables in the consumer, never through the workspace's node_modules.
async function run(command, args, cwd = consumer) {
	console.log(`${command} ${args.join(' ')}`);
	try {
		const result = await exec(command, args, {
			cwd,
			env,
			maxBuffer: 20 * 1024 * 1024,
			timeout: 5 * 60_000,
		});
		process.stdout.write(result.stdout);
		process.stderr.write(result.stderr);
		return result.stdout;
	} catch (error) {
		process.stdout.write(error.stdout ?? '');
		process.stderr.write(error.stderr ?? '');
		throw error;
	}
}
try {
	const tarballs = {};
	// Test the pending Ripple/runtime/compiler release together, without symlinks.
	// Shared TSRX language packages remain ordinary published dependencies.
	for (const directory of ['tanstack-router', 'ripple', 'vite-plugin', 'tsrx-ripple', 'adapter']) {
		const cwd = join(root, 'packages', directory);
		const pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'));
		const filename = `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;
		await run('pnpm', ['pack', '--out', join(temporary, filename)], cwd);
		tarballs[pkg.name] = `file:${join(temporary, filename)}`;
	}
	await cp(join(root, 'packages/tanstack-router/examples/ssr'), consumer, {
		recursive: true,
		filter: (path) => !/\/(node_modules|dist)(\/|$)/.test(path),
	});
	const pkg = JSON.parse(await readFile(join(consumer, 'package.json'), 'utf8'));
	const lock = await readFile(join(root, 'pnpm-lock.yaml'), 'utf8');
	for (const group of ['dependencies', 'devDependencies']) {
		for (const name of Object.keys(pkg[group])) {
			if (tarballs[name]) pkg[group][name] = tarballs[name];
			else {
				// Match the tool versions in the reviewed workspace lockfile.
				const catalog = lock.slice(lock.indexOf('  default:\n'), lock.indexOf('  peer:\n'));
				const key = name.startsWith('@') ? `'${name}'` : name;
				const pattern = new RegExp(
					`    ${key}:\\n      specifier: [^\\n]+\\n      version: ([^\\n]+)`,
				);
				const version = catalog.match(pattern)?.[1];
				assert(version, `catalog version for ${name}`);
				pkg[group][name] = version.replaceAll("'", '');
			}
		}
	}
	await writeFile(join(consumer, 'package.json'), JSON.stringify(pkg, null, 2));
	await writeFile(
		join(consumer, 'pnpm-workspace.yaml'),
		`packages: []\nallowBuilds:\n  esbuild: true\noverrides:\n${Object.entries(tarballs)
			.map(([name, value]) => `  '${name}': '${value}'`)
			.join(
				'\n',
			)}\n  '@tanstack/router-core@1.171.39>seroval': 1.7.1\n  '@tanstack/router-core@1.171.39>seroval-plugins': 1.7.1\n`,
	);
	await run('pnpm', ['install', '--no-frozen-lockfile']);
	const installedRoot = join(consumer, 'node_modules/@ripple-ts/tanstack-router');
	const installed = JSON.parse(await readFile(join(installedRoot, 'package.json'), 'utf8'));
	assert(!installed.private);
	assert(!/workspace:|catalog:/.test(JSON.stringify(installed)));
	const graph = await run('pnpm', ['list', '--prod', '--depth', 'Infinity', '--json']);
	assert(
		!/"(?:react|react-dom|solid-js|@solidjs\/[^"]+)":/.test(graph),
		'no React or Solid production dependencies',
	);
	assert.match(installed.peerDependencies.ripple, /^\^\d/);
	assert.deepEqual(Object.keys(installed.dependencies).sort(), [
		'@tanstack/history',
		'@tanstack/router-core',
	]);
	assert.equal(installed.dependencies['@tanstack/router-core'], '1.171.39');
	assert(!(await realpath(installedRoot)).startsWith(root));
	const files = await readdir(installedRoot);
	for (const directory of ['tests', 'examples', 'scripts', 'dist']) {
		assert(!files.includes(directory));
	}
	for (const name of ['LICENSE', 'NOTICE', 'README.md', 'src', 'types'])
		assert(files.includes(name));
	for (const target of Object.values(installed.exports)) {
		if (typeof target === 'object')
			for (const path of Object.values(target)) await readFile(resolve(installedRoot, path));
	}
	await run('pnpm', ['typecheck']);
	await run('pnpm', ['build']);
	await run('node', [join(root, 'packages/tanstack-router/tests/browser/run.js'), consumer]);
	console.log(
		'Clean tarball consumer: declarations, optimization, both builds and browser matrix passed.',
	);
} finally {
	if (process.env.KEEP_RELEASE_CONSUMER) console.log(`Preserved clean consumer: ${temporary}`);
	else await rm(temporary, { recursive: true, force: true });
}
