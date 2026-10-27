import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventoryTests, upstreamCommit } from './inventory-upstream.js';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
export function compareSources(previous, current) {
	const before = new Map(previous.map((file) => [file.file, file]));
	const after = new Map(current.map((file) => [file.file, file]));
	const changes = [];
	for (const name of [...new Set([...before.keys(), ...after.keys()])].sort()) {
		const old = before.get(name),
			next = after.get(name);
		if (old?.sha256 === next?.sha256) continue;
		changes.push({
			file: name,
			change: !old ? 'added' : !next ? 'removed' : 'changed',
			before: old?.sha256 ?? null,
			after: next?.sha256 ?? null,
			previousTests: old?.tests ?? [],
			currentTests: next?.tests ?? [],
		});
	}
	return changes;
}

export function auditCheckout(checkout, manifests) {
	const roots = ['packages/solid-router/tests', 'packages/react-router/tests'];
	const dirty = execFileSync('git', ['status', '--porcelain', '--', ...roots], {
		cwd: checkout,
		encoding: 'utf8',
	});
	if (dirty.trim())
		throw new Error('Audit a clean upstream checkout, including untracked test files.');
	const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
		cwd: checkout,
		encoding: 'utf8',
	}).trim();
	const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', '--', ...roots], {
		cwd: checkout,
		encoding: 'utf8',
	})
		.trim()
		.split('\n')
		.filter(Boolean);
	const current = paths.map((file) => {
		const source = readFileSync(resolve(checkout, file), 'utf8');
		return {
			file,
			sha256: createHash('sha256').update(source).digest('hex'),
			...(/\.test(?:-d)?\.[jt]sx?$/.test(file) ? { tests: inventoryTests(source, file) } : {}),
		};
	});
	const changes = compareSources(
		manifests.flatMap((manifest) => manifest.files),
		current,
	);
	return {
		baseline: upstreamCommit,
		candidate: commit,
		reviewRequired: commit !== upstreamCommit || changes.length > 0,
		changes,
	};
}

export function reportMappings(manifests, root = packageRoot) {
	const report = {
		ported: [],
		covered: [],
		deferred: [],
		inapplicable: [],
		skipped: [],
		missing: [],
	};
	for (const manifest of manifests) {
		if (manifest.commit !== upstreamCommit)
			report.missing.push(`${manifest.repository}: baseline does not match pinned commit`);
		for (const file of manifest.files) {
			for (const test of file.tests ?? []) {
				const id = `${file.file}:${test.line}`;
				const mapping = file.overrides[test.line] ?? file.mapping;
				if (
					!mapping ||
					!['ported', 'covered', 'deferred', 'inapplicable'].includes(mapping.status) ||
					!mapping.reason?.trim()
				) {
					report.missing.push(id);
					continue;
				}
				const entry = { id, title: test.title, reason: mapping.reason };
				report[mapping.status].push(entry);
				if (
					test.modifiers.some((modifier) => ['skip', 'todo', 'skipIf', 'runIf'].includes(modifier))
				)
					report.skipped.push({ ...entry, modifiers: test.modifiers });
				if (
					['ported', 'covered'].includes(mapping.status) &&
					(!mapping.rippleTests?.length ||
						mapping.rippleTests.some((path) => !existsSync(resolve(root, path))))
				)
					report.missing.push(`${id}: missing Ripple test file`);
				if (mapping.status === 'deferred' && ![5, 7].includes(mapping.milestone))
					report.missing.push(`${id}: unfinished client/type case`);
			}
			for (const line of Object.keys(file.overrides ?? {}))
				if (!file.tests?.some((test) => test.line === Number(line)))
					report.missing.push(`${file.file}:${line}: stale override`);
		}
	}
	return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const manifests = ['tests.json', 'react-tests.json'].map((file) =>
		JSON.parse(readFileSync(new URL(`../upstream/${file}`, import.meta.url), 'utf8')),
	);
	if (process.argv[2]) {
		const audit = auditCheckout(resolve(process.argv[2]), manifests);
		console.log(JSON.stringify(audit, null, 2));
		if (audit.reviewRequired) process.exitCode = 1;
	} else {
		const report = reportMappings(manifests);
		console.log(
			JSON.stringify(
				{
					counts: Object.fromEntries(
						Object.entries(report).map(([key, value]) => [key, value.length]),
					),
					missing: report.missing,
					deferred: report.deferred,
					skipped: report.skipped,
				},
				null,
				2,
			),
		);
		if (report.missing.length) process.exitCode = 1;
	}
}
