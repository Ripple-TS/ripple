import { appendFile, mkdir, mkdtemp, readFile, readdir, rename } from 'node:fs/promises';
import path from 'node:path';

const [mode, input] = process.argv.slice(2);
if (!input || !['release-plan', 'publish'].includes(mode)) {
	throw new Error('Usage: prepare-changesets-action.js <release-plan|publish> <path>');
}

if (mode === 'release-plan') {
	const plan = JSON.parse(await readFile(input, 'utf8'));
	if (!Array.isArray(plan.releases)) throw new Error('Invalid Changesets release plan');
	const has_releases = plan.releases.some((release) =>
		['patch', 'minor', 'major'].includes(release.type),
	);
	if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT is required');
	await appendFile(process.env.GITHUB_OUTPUT, `has-releases=${has_releases}\n`);
} else {
	// The publish workflow runs after versioning. Remaining notes can belong to
	// private/ignored packages, and must not send changesets/action back into its
	// version-PR branch. Preserve them outside this disposable checkout; nothing
	// is committed or deleted from the repository.
	await mkdir(input, { recursive: true });
	const pending = await mkdtemp(path.join(input, 'pending-changesets-'));
	for (const entry of await readdir('.changeset', { withFileTypes: true })) {
		if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
			await rename(path.join('.changeset', entry.name), path.join(pending, entry.name));
		}
	}
	console.log(`Pending changesets preserved at ${pending}`);
}
