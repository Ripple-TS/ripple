import ts from 'typescript';
import path from 'node:path';

/**
 * Type-level test harness: compiles a snippet against the package's published
 * `.d.ts` declarations and reports both the diagnostics and the type the
 * checker infers for every top-level `const` — the same thing an editor shows
 * on hover, so a signature change that silently degrades intellisense (an
 * inferred `any`, a widened element type) fails a test rather than shipping.
 */

/** @type {ts.CompilerOptions} */
const OPTIONS = {
	strict: true,
	target: ts.ScriptTarget.ESNext,
	module: ts.ModuleKind.ESNext,
	moduleResolution: ts.ModuleResolutionKind.Bundler,
	lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
	skipLibCheck: true,
	noEmit: true,
};

// Parsing lib.dom.d.ts dominates the cost of a program, and every snippet uses
// the same libs and declaration files, so keep them across programs.
/** @type {Map<string, ts.SourceFile | undefined>} */
const source_file_cache = new Map();

/**
 * @param {string} source snippet body; imports resolve relative to `packages/tsrx`
 * @returns {{ errors: string[], types: Record<string, string> }}
 */
export function check_types(source) {
	const file_name = path.resolve('packages/tsrx/__type-probe__.ts');
	const host = ts.createCompilerHost(OPTIONS);
	const read_file = host.readFile.bind(host);
	const file_exists = host.fileExists.bind(host);
	const get_source_file = host.getSourceFile.bind(host);

	host.readFile = (name) => (name === file_name ? source : read_file(name));
	host.fileExists = (name) => name === file_name || file_exists(name);
	host.getSourceFile = (name, language_version, on_error, should_create_new) => {
		if (name === file_name) return get_source_file(name, language_version, on_error, true);
		if (!source_file_cache.has(name)) {
			source_file_cache.set(
				name,
				get_source_file(name, language_version, on_error, should_create_new),
			);
		}
		return source_file_cache.get(name);
	};

	const program = ts.createProgram([file_name], OPTIONS, host);
	const checker = program.getTypeChecker();

	const errors = ts
		.getPreEmitDiagnostics(program)
		.filter((diagnostic) => diagnostic.file?.fileName === file_name)
		.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '));

	/** @type {Record<string, string>} */
	const types = {};
	const probe = program.getSourceFile(file_name);
	ts.forEachChild(/** @type {ts.SourceFile} */ (probe), (node) => {
		if (!ts.isVariableStatement(node)) return;
		for (const declaration of node.declarationList.declarations) {
			if (!ts.isIdentifier(declaration.name)) continue;
			types[declaration.name.text] = checker.typeToString(
				checker.getTypeAtLocation(declaration.name),
			);
		}
	});

	return { errors, types };
}
