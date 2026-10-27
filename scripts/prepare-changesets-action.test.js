import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test } from 'node:test';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('./prepare-changesets-action.js', import.meta.url));
async function fixture(t) {
	const root = await mkdtemp(path.join(tmpdir(), 'changesets-action-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	return root;
}

for (const [name, releases, expected] of [
	['only private/ignored packages', [{ name: 'private-package', type: 'none' }], false],
	['no version bumps', [], false],
	[
		'public version bumps',
		[
			{ name: 'ripple', type: 'patch' },
			{ name: 'private-package', type: 'none' },
		],
		true,
	],
]) {
	test(`release PR selection: ${name}`, async (t) => {
		const root = await fixture(t);
		const input = path.join(root, 'plan.json');
		const output = path.join(root, 'output');
		await writeFile(input, JSON.stringify({ releases }));
		await exec(process.execPath, [script, 'release-plan', input], {
			cwd: root,
			env: { ...process.env, GITHUB_OUTPUT: output },
		});
		assert.equal(await readFile(output, 'utf8'), `has-releases=${expected}\n`);
	});
}

test('publishing preserves pending notes outside the checkout without changing package metadata', async (t) => {
	const root = await fixture(t);
	await mkdir(path.join(root, '.changeset'));
	const notes = '---\n"private-adapter": patch\n---\nPending adapter release.\n';
	await writeFile(path.join(root, '.changeset/pending.md'), notes);
	await writeFile(path.join(root, '.changeset/README.md'), 'Instructions');
	await writeFile(path.join(root, '.changeset/config.json'), '{}');
	await writeFile(path.join(root, 'package.json'), '{"version":"0.5.3"}');
	const backups = path.join(root, 'runner-temp');
	await exec(process.execPath, [script, 'publish', backups], { cwd: root });
	assert.deepEqual((await readdir(path.join(root, '.changeset'))).sort(), [
		'README.md',
		'config.json',
	]);
	assert.equal(await readFile(path.join(root, 'package.json'), 'utf8'), '{"version":"0.5.3"}');
	const [backup] = await readdir(backups);
	assert.equal(await readFile(path.join(backups, backup, 'pending.md'), 'utf8'), notes);
});
