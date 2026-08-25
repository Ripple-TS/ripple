import path from 'node:path';
import ts from 'typescript';

/** @type {ts.CompilerOptions} */
const TYPECHECK_OPTIONS = {
	strict: true,
	target: ts.ScriptTarget.ESNext,
	module: ts.ModuleKind.ESNext,
	moduleResolution: ts.ModuleResolutionKind.Bundler,
	lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
	skipLibCheck: true,
	noEmit: true,
};

/** @type {Map<string, ts.SourceFile | undefined>} */
const source_file_cache = new Map();

/**
 * Compile a snippet and report its diagnostics and inferred top-level variable types.
 *
 * @param {string} source
 * @returns {{ errors: string[], types: Record<string, string> }}
 */
export function check_types(source) {
	const file_name = path.resolve('packages/tsrx-ripple/__type-probe__.ts');
	const host = ts.createCompilerHost(TYPECHECK_OPTIONS);
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

	const program = ts.createProgram([file_name], TYPECHECK_OPTIONS, host);
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

/**
 * @param {Array<{
 *   sourceOffsets: number[],
 *   generatedOffsets: number[],
 *   lengths: number[],
 *   generatedLengths: number[]
 * }>} mappings
 * @param {number} source_offset
 * @param {number} generated_offset
 * @param {number} length
 */
export function find_exact_mapping(mappings, source_offset, generated_offset, length) {
	return mappings.find(
		(mapping) =>
			mapping.sourceOffsets[0] === source_offset &&
			mapping.generatedOffsets[0] === generated_offset &&
			mapping.lengths[0] === length &&
			mapping.generatedLengths[0] === length,
	);
}
