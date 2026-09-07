// Production benchmark runner. Workloads and timing contracts are ported from
// Octane; dependency selection, process ownership, and result gates live here.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { selectTargets } from './lib/targets.mjs';
import { selectSuites } from './lib/suites.mjs';
import { sourceHash } from './lib/fingerprint.mjs';
import {
	validateResult,
	validateRippleCoverage,
	compareResults,
	checkRatios,
} from './lib/results.mjs';

const BENCH = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(BENCH);
const manifest = JSON.parse(fs.readFileSync(path.join(BENCH, 'suites.json'), 'utf8'));
const args = process.argv.slice(2).filter((a) => a !== '--');
const flags = new Set(args.filter((a) => a.startsWith('--') && !a.includes('=')));
const options = new Map(
	args
		.filter((a) => a.startsWith('--') && a.includes('='))
		.map((a) => {
			const i = a.indexOf('=');
			return [a.slice(2, i), a.slice(i + 1)];
		}),
);
const allowedFlags = ['--list', '--quick', '--record', '--compare', '--ratios'];
for (const f of flags) if (!allowedFlags.includes(f)) throw Error(`Unknown flag: ${f}`);
for (const k of options.keys())
	if (!['targets', 'results-dir', 'baseline-dir', 'timeout', 'cpu-throttle'].includes(k))
		throw Error(`Unknown option: ${k}`);
if (flags.has('--list')) {
	for (const s of manifest)
		console.log(
			`${s.name}${s.optional ? ' (opt-in)' : ''}: ${s.targets.map((t) => t.name).join(', ')}`,
		);
	process.exit(0);
}
const names = args.filter((a) => !a.startsWith('--'));
const suites = selectSuites(manifest, names);
const requested = options
	.get('targets')
	?.split(',')
	.map((name) => name.trim())
	.filter(Boolean);
if (requested && !requested.length) throw Error('Target selection must not be empty');
const known = new Set(manifest.flatMap((s) => s.targets.map((t) => t.name)));
for (const name of requested ?? []) if (!known.has(name)) throw Error(`Unknown target: ${name}`);
const cpuThrottle = Number(options.get('cpu-throttle') ?? process.env.CPU_THROTTLE ?? 1);
if (!Number.isFinite(cpuThrottle) || cpuThrottle < 1)
	throw Error('CPU throttle must be a number >= 1');
if (
	cpuThrottle !== 1 &&
	suites.some((suite) => suite.cwd !== 'js-framework' || suite.script !== 'run.mjs')
) {
	throw Error('CPU throttling is supported only by js-framework and js-framework-clear-1k');
}
const QUICK = flags.has('--quick');
const OUT = path.resolve(ROOT, options.get('results-dir') ?? 'benchmarks/results');
const BASE = path.resolve(ROOT, options.get('baseline-dir') ?? 'benchmarks/baselines/local');
const timeout = Number(options.get('timeout') ?? 1800000);
if (!Number.isFinite(timeout) || timeout <= 0) throw Error('Invalid timeout');
fs.mkdirSync(OUT, { recursive: true });
const children = new Set();
const built = new Set();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function stop(child) {
	if (!child.pid) return;
	try {
		process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGTERM');
	} catch {}
}
async function cleanup() {
	const pending = [...children];
	for (const child of pending) stop(child);
	await sleep(300);
	for (const child of pending) {
		try {
			process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGKILL');
		} catch {}
		children.delete(child);
	}
}
for (const signal of ['SIGINT', 'SIGTERM'])
	process.on(signal, () => {
		void cleanup().then(() => process.exit(signal === 'SIGINT' ? 130 : 143));
	});
function launch(command, argv, { cwd = ROOT, env = {}, log } = {}) {
	const fd = log ? fs.openSync(log, 'w') : null;
	const child = spawn(command, argv, {
		cwd,
		env: { ...process.env, NODE_ENV: 'production', ...env },
		detached: process.platform !== 'win32',
		stdio: fd === null ? 'inherit' : ['ignore', fd, fd],
	});
	if (fd !== null) fs.closeSync(fd);
	children.add(child);
	child.completion = new Promise((resolve, reject) => {
		child.once('error', reject);
		child.once('exit', (code, signal) => resolve({ code, signal }));
	});
	// Server failures are observed by readiness/exit checks as well.
	child.completion.catch(() => {});
	return child;
}
async function run(command, argv, opts) {
	const child = launch(command, argv, opts);
	const timer = setTimeout(() => stop(child), timeout);
	const killTimer = setTimeout(() => {
		try {
			process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGKILL');
		} catch {}
	}, timeout + 2000);
	try {
		const { code, signal } = await child.completion;
		if (code !== 0)
			throw Error(
				`${command} ${argv.join(' ')} failed (${signal ?? code})${opts?.log ? `; see ${path.relative(ROOT, opts.log)}` : ''}`,
			);
	} finally {
		clearTimeout(timer);
		clearTimeout(killTimer);
		stop(child);
		await sleep(50);
		try {
			process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGKILL');
		} catch {}
		children.delete(child);
	}
}
function probePort(port, host) {
	return new Promise((resolve) => {
		const socket = net.connect({ port, host });
		socket.setTimeout(1000);
		const done = (value) => {
			socket.destroy();
			resolve(value);
		};
		socket.once('connect', () => done(true));
		socket.once('error', () => done(false));
		socket.once('timeout', () => done(false));
	});
}
async function portBusy(port) {
	return (await Promise.all(['127.0.0.1', '::1'].map((host) => probePort(port, host)))).some(
		Boolean,
	);
}
async function ready(child, target) {
	const until = Date.now() + 90000;
	while (Date.now() < until) {
		if (child.exitCode !== null || child.signalCode) throw Error(`${target.name} preview exited`);
		try {
			const response = await fetch(target.url, { signal: AbortSignal.timeout(1000) });
			await response.arrayBuffer();
			if (response.ok) return;
		} catch {}
		await sleep(200);
	}
	throw Error(`${target.name} preview not ready`);
}
function git(...argv) {
	try {
		return execFileSync('git', argv, { cwd: ROOT, encoding: 'utf8' }).trim();
	} catch {
		return null;
	}
}
const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const require = createRequire(import.meta.url);
const playwrightRequire = createRequire(require.resolve('playwright'));
const browserManifest = JSON.parse(
	fs.readFileSync(
		path.join(
			path.dirname(playwrightRequire.resolve('playwright-core/package.json')),
			'browsers.json',
		),
		'utf8',
	),
);
const chromiumBuild = browserManifest.browsers.find((browser) => browser.name === 'chromium');
const packageVersions = {};
for (const [fixture, names] of [
	['js-framework/ripple', ['ripple', '@ripple-ts/vite-plugin']],
	['news/ripple', ['@tsrx/ripple']],
	['js-framework/octane-tsrx', ['octane']],
	['js-framework/solid', ['solid-js', '@solidjs/web', 'vite-plugin-solid']],
	['js-framework/vue-vapor', ['vue', '@vue/runtime-vapor']],
	['js-framework/react', ['react', 'react-dom']],
	['js-framework/preact', ['preact']],
	['js-framework/svelte', ['svelte']],
	['js-framework/inferno', ['inferno']],
	['', ['vite', 'babel-plugin-react-compiler']],
])
	for (const name of names) {
		const file = path.join(BENCH, fixture, 'node_modules', name, 'package.json');
		packageVersions[name] = JSON.parse(fs.readFileSync(file, 'utf8')).version;
	}
const metadata = {
	startedAt: new Date().toISOString(),
	packageVersions,
	revision: git('rev-parse', 'HEAD'),
	dirty: !!git('status', '--porcelain'),
	node: process.version,
	pnpm: execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim(),
	platform: os.platform(),
	release: os.release(),
	arch: os.arch(),
	cpu: os.cpus()[0]?.model,
	lockfileSha256: sha(path.join(ROOT, 'pnpm-lock.yaml')),
	workloadSha256: sourceHash(ROOT, [BENCH], { workload: true }),
	runnerSha256: sha(fileURLToPath(import.meta.url)),
	metadataVersion: 2,
	rippleSourceSha256: sourceHash(ROOT, [
		path.join(ROOT, 'packages/ripple/src'),
		path.join(ROOT, 'packages/tsrx-ripple/src'),
	]),
	quick: QUICK,
	cpuThrottle,
	buildMode: 'upstream-production',
	playwright: require('playwright/package.json').version,
	chromium: chromiumBuild,
	browserExecutable: chromium.executablePath(),
};
const guardsFile = path.join(BENCH, 'baselines/ratios.json');
const guards = fs.existsSync(guardsFile) ? JSON.parse(fs.readFileSync(guardsFile, 'utf8')) : [];
const summary = [];
for (const suite of suites) {
	const targets = selectTargets(suite.targets, requested?.join(',') ?? '');
	const unsupported =
		requested?.filter((name) => !suite.targets.some((t) => t.name === name)) ?? [];
	if (!targets.length) {
		const required = flags.has('--ratios') && guards.some((guard) => guard.suite === suite.name);
		summary.push({
			suite: suite.name,
			status: required ? 'FAIL' : 'N/A',
			unsupported,
			...(required ? { error: 'Required ratio targets were not selected' } : {}),
		});
		continue;
	}
	console.log(`\n=== ${suite.name} (${targets.map((t) => t.name).join(', ')}) ===`);
	const result = {
		suite: suite.name,
		iterations: suite.iter[QUICK ? 'quick' : 'normal'],
		targets: [],
		meta: {
			...metadata,
			buildMode: suite.name === 'bundle-size' ? 'normalized-esbuild' : 'upstream-production',
			targets: targets.map((t) => t.name),
			unsupported,
			unit: suite.name === 'bundle-size' ? 'bytes' : 'ms',
		},
	};
	try {
		if (suite.kind === 'browser') {
			for (const target of targets) {
				if (await portBusy(target.port))
					throw Error(`Port ${target.port} is occupied; refusing to stop an unrelated process`);
				if (!built.has(target.filter)) {
					console.log(`Building ${target.filter}`);
					await run('pnpm', ['--filter', target.filter, 'build'], {
						log: path.join(OUT, `build-${target.filter}.log`),
					});
					built.add(target.filter);
				}
				const child = launch('pnpm', ['--filter', target.filter, 'preview'], {
					log: path.join(OUT, `preview-${target.port}.log`),
				});
				await ready(child, target);
			}
		}
		const runs = suite.kind === 'per-target' ? targets : [null];
		for (const target of runs) {
			const out = path.join(OUT, `_part-${suite.name}-${target?.name ?? 'all'}.json`);
			fs.rmSync(out, { force: true });
			const n = String(result.iterations);
			const argv = [
				suite.script,
				...(target ? [target.name, n] : suite.name === 'bundle-size' ? [] : [n]),
				...(suite.name === 'ssr-throughput' && QUICK ? ['--quick'] : []),
			];
			const env = {
				...(suite.env ?? {}),
				CLEAR_1K: suite.env?.CLEAR_1K ?? '0',
				CPU_THROTTLE: String(cpuThrottle),
				BENCH_JSON: out,
				BENCH_QUICK: QUICK ? '1' : '0',
				BENCH_TARGETS: targets.map((t) => t.name).join(','),
			};
			if (suite.kind === 'browser') env.TARGETS = JSON.stringify(targets);
			if (suite.name === 'streaming-ssr') env.TARGETS = targets.map((t) => t.name).join(',');
			let failure;
			try {
				await run(process.execPath, argv, { cwd: path.join(BENCH, suite.cwd), env });
			} catch (error) {
				failure = error;
			}
			if (!fs.existsSync(out)) throw failure ?? Error(`Missing BENCH_JSON: ${suite.name}`);
			const part = JSON.parse(fs.readFileSync(out, 'utf8'));
			if (part.suite !== suite.name) throw Error(`Unexpected suite: ${part.suite}`);
			result.targets.push(...(part.targets ?? []));
			if (part.failed) throw Error(part.failed);
			if (failure) throw failure;
			fs.rmSync(out);
		}
		for (const target of result.targets)
			for (const [op, stat] of Object.entries(target.ops ?? {})) {
				stat.unit ??=
					suite.name === 'bundle-size'
						? 'bytes'
						: /^(nodes|elements|text|comments|empty_text|whitespace_text|live_inserts|fragment_commits|row_class_writes)_/.test(
									op,
							  )
							? 'count'
							: 'ms';
				stat.direction ??= 'lower';
			}
		const expected =
			suite.name === 'ssr-throughput'
				? targets.flatMap((t) => (QUICK ? [50] : [50, 500]).map((n) => `news-${n}/${t.name}`))
				: targets.map((t) => t.name);
		validateResult(result, expected, suite.operations);
		if (targets.some((target) => target.name === 'ripple')) validateRippleCoverage(result);
		for (const target of targets)
			if (target.operations) {
				const row = result.targets.find((t) => t.name === target.name);
				for (const op of target.operations)
					if (!row?.ops[op]) throw Error(`Missing required operation: ${target.name}/${op}`);
			}
		if (flags.has('--ratios')) {
			const failures = checkRatios(result, guards);
			if (failures.length) throw Error(failures.join('\n'));
		}
		const baseline = path.join(BASE, `${suite.name}.json`);
		if (flags.has('--compare')) {
			if (!fs.existsSync(baseline)) throw Error(`Missing local baseline: ${baseline}`);
			const previous = JSON.parse(fs.readFileSync(baseline, 'utf8'));
			if (previous.meta.quick !== QUICK) throw Error('Cannot compare quick and normal baselines');
			if ((previous.meta.cpuThrottle ?? 1) !== cpuThrottle)
				throw Error('Cannot compare different CPU throttle rates');
			const failures = compareResults(result, previous);
			if (failures.length) throw Error(failures.join('\n'));
		}
		if (flags.has('--record')) {
			fs.mkdirSync(BASE, { recursive: true });
			fs.writeFileSync(baseline, JSON.stringify(result, null, 2) + '\n');
		}
		summary.push({ suite: suite.name, status: 'PASS', targets: targets.map((t) => t.name) });
	} catch (error) {
		result.failed = error.stack ?? String(error);
		summary.push({ suite: suite.name, status: 'FAIL', error: error.message });
		console.error(result.failed);
	} finally {
		await cleanup();
		fs.writeFileSync(path.join(OUT, `${suite.name}.json`), JSON.stringify(result, null, 2) + '\n');
	}
}
fs.writeFileSync(
	path.join(OUT, 'summary.json'),
	JSON.stringify({ metadata, summary }, null, 2) + '\n',
);
console.table(summary.map(({ suite, status, error }) => ({ suite, status, error: error ?? '' })));
process.exitCode = summary.some((s) => s.status === 'FAIL') ? 1 : 0;
