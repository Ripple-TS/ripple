// Diagnostics stay opt-in so a normal invocation retains its established suite set.
export function selectSuites(manifest, names) {
	if (!names.length) return manifest.filter((suite) => !suite.optional);
	return names.map((name) => {
		const suite = manifest.find((suite) => suite.name === name);
		if (!suite) throw Error(`Unknown suite: ${name}`);
		return suite;
	});
}
