const vue_import_pattern = /import(?!\s+type)\s*\{([\s\S]*?)\}\s*from\s*(['"])vue\2\s*;?/g;

/**
 * Vue's built-in renderer primitives, including `Suspense`, need Vapor/VDOM
 * interop when mounted from a Vapor app. TSRX can emit `Suspense` for
 * `try/pending`, so bundler plugins use this rewrite to make Vapor app
 * creation install the interop plugin without every app entry point needing to
 * remember it.
 *
 * @param {string} source
 * @returns {string}
 */
export function addVaporInteropToCreateVaporApp(source) {
	if (!/\bcreateVaporApp\b/.test(source) || !/\bfrom\s*['"]vue['"]/.test(source)) {
		return source;
	}

	/** @type {string | null} */
	let existing_interop_local = null;

	for (const match of source.matchAll(vue_import_pattern)) {
		for (const specifier of split_import_specifiers(match[1])) {
			const parsed = parse_import_specifier(specifier);
			if (parsed?.imported === 'vaporInteropPlugin') {
				existing_interop_local = parsed.local;
				break;
			}
		}
		if (existing_interop_local) break;
	}

	if (existing_interop_local && source.includes(`.use(${existing_interop_local})`)) {
		return source;
	}

	const interop_local = existing_interop_local ?? 'vaporInteropPlugin';
	let added_interop_import = existing_interop_local !== null;

	return source.replace(vue_import_pattern, (full, specifier_text, quote) => {
		const specifiers = split_import_specifiers(specifier_text);
		/** @type {string[]} */
		const wrappers = [];
		let import_changed = false;

		const next_specifiers = specifiers.map((specifier) => {
			const parsed = parse_import_specifier(specifier);
			if (parsed?.imported !== 'createVaporApp') {
				return specifier.trim();
			}

			const wrapped_local = `__tsrx_${parsed.local}`;
			wrappers.push(
				`const ${parsed.local} = (...args) => ${wrapped_local}(...args).use(${interop_local});`,
			);
			import_changed = true;
			return `createVaporApp as ${wrapped_local}`;
		});

		if (!import_changed) {
			return full;
		}

		if (!added_interop_import) {
			next_specifiers.push(interop_local);
			added_interop_import = true;
		}

		return `import { ${next_specifiers.join(', ')} } from ${quote}vue${quote};\n${wrappers.join('\n')}`;
	});
}

/**
 * @param {string} specifier_text
 * @returns {string[]}
 */
function split_import_specifiers(specifier_text) {
	return specifier_text
		.split(',')
		.map((specifier) => specifier.trim())
		.filter(Boolean);
}

/**
 * @param {string} specifier
 * @returns {{ imported: string, local: string } | null}
 */
function parse_import_specifier(specifier) {
	const match = /^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/.exec(specifier.trim());
	if (!match) {
		return null;
	}
	return { imported: match[1], local: match[2] ?? match[1] };
}
