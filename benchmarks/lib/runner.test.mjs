import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../..', import.meta.url));
const runner = fileURLToPath(new URL('../bench.mjs', import.meta.url));
function run(args) {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [runner, ...args], {
			cwd: root,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		let text = '';
		child.stdout.on('data', (data) => (text += data));
		child.stderr.on('data', (data) => (text += data));
		child.on('error', reject);
		child.on('exit', (code) => resolve({ code, text }));
	});
}
test('unknown and empty target selections fail before building', async () => {
	for (const arg of ['--targets=missing', '--targets=']) {
		const result = await run(['--quick', arg, 'js-framework']);
		assert.notEqual(result.code, 0);
		assert.match(result.text, /Unknown target|must not be empty/);
	}
});
test('occupied preview ports fail without terminating their owner', async (t) => {
	const server = net.createServer((socket) => {
		socket.on('error', () => {});
		socket.end('still alive');
	});
	try {
		await new Promise((resolve, reject) => {
			server.once('error', reject);
			server.listen(5178, '127.0.0.1', resolve);
		});
	} catch (error) {
		if (error.code === 'EADDRINUSE') {
			t.skip('fixture port already in use');
			return;
		}
		throw error;
	}
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ripple-bench-test-'));
	try {
		const result = await run([
			'--quick',
			'--targets=ripple',
			`--results-dir=${dir}`,
			'js-framework',
		]);
		assert.notEqual(result.code, 0);
		assert.match(result.text, /occupied/);
		const reply = await new Promise((resolve, reject) => {
			const client = net.connect(5178, '127.0.0.1');
			client.on('data', (data) => resolve(String(data)));
			client.on('error', reject);
			client.on('end', () => client.destroy());
		});
		assert.equal(reply, 'still alive');
		const summary = JSON.parse(await fs.readFile(path.join(dir, 'summary.json'), 'utf8'));
		assert.equal(summary.summary[0].status, 'FAIL');
	} finally {
		await new Promise((resolve) => server.close(resolve));
		await fs.rm(dir, { recursive: true, force: true });
	}
});

test('invalid or unsupported CPU throttling fails before building', async () => {
	for (const value of ['0', 'NaN', 'Infinity']) {
		const result = await run([`--cpu-throttle=${value}`, 'js-framework-clear-1k']);
		assert.notEqual(result.code, 0);
		assert.match(result.text, /CPU throttle must be/);
	}
	const unsupported = await run(['--cpu-throttle=4', 'news']);
	assert.notEqual(unsupported.code, 0);
	assert.match(unsupported.text, /CPU throttling is supported only/);
});

test('the 1k clear diagnostic is selectable but cannot replace the default suite', async () => {
	const { selectSuites } = await import('./suites.mjs');
	const manifest = JSON.parse(
		await fs.readFile(new URL('../suites.json', import.meta.url), 'utf8'),
	);
	const defaults = selectSuites(manifest, []);
	assert.equal(defaults.length, 17);
	assert.ok(defaults.some((suite) => suite.name === 'js-framework'));
	assert.ok(!defaults.some((suite) => suite.name === 'js-framework-clear-1k'));
	const [diagnostic] = selectSuites(manifest, ['js-framework-clear-1k']);
	assert.equal(diagnostic.env.CLEAR_1K, '1');
	assert.deepEqual(diagnostic.operations, ['clear_1k']);
	assert.ok(diagnostic.targets.some((target) => target.name === 'ripple'));
	assert.throws(() => selectSuites(manifest, ['missing-suite']), /Unknown suite/);
});
