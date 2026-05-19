import ts from 'typescript';
import { compile_to_volar_mappings } from '../src/index.js';

/**
 * @param {string} code
 */
function get_variable_types(code) {
	const root = process.cwd();
	const file = `${root}/__virtual_tsrx_type_test.tsx`;
	const options = {
		jsx: ts.JsxEmit.Preserve,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		target: ts.ScriptTarget.ESNext,
		noEmit: true,
		types: [],
		baseUrl: root,
		paths: {
			'ripple/jsx-runtime': ['packages/ripple/src/jsx-runtime.d.ts'],
			ripple: ['packages/ripple/types/index.d.ts'],
			'#public': ['packages/ripple/types/index.d.ts'],
			'#helpers': ['packages/ripple/src/helpers.d.ts'],
		},
	};
	const host = ts.createCompilerHost(options);
	const get_source_file = host.getSourceFile.bind(host);
	host.getSourceFile = (name, language_version, on_error, should_create_new_source_file) =>
		name === file
			? ts.createSourceFile(name, code, language_version, true, ts.ScriptKind.TSX)
			: get_source_file(name, language_version, on_error, should_create_new_source_file);
	host.fileExists = (name) => name === file || ts.sys.fileExists(name);
	host.readFile = (name) => (name === file ? code : ts.sys.readFile(name));

	const program = ts.createProgram([file], options, host);
	const diagnostics = ts
		.getPreEmitDiagnostics(program)
		.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
	expect(diagnostics).toEqual([]);

	const checker = program.getTypeChecker();
	const source_file = /** @type {ts.SourceFile} */ (program.getSourceFile(file));
	/** @type {Map<string, string>} */
	const types = new Map();

	/**
	 * @param {ts.Node} node
	 */
	function visit(node) {
		if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
			types.set(node.name.text, checker.typeToString(checker.getTypeAtLocation(node.name)));
		}
		ts.forEachChild(node, visit);
	}
	visit(source_file);

	return types;
}

describe('@tsrx/ripple Volar JSX expression types', () => {
	it('types tsx and nested tsrx expression values as TSRXElement', () => {
		const source = `
component App() {
	const content = <tsx>
		{<tsrx>
			const nested = <tsx><span /></tsx>;
			<div>{nested}</div>
		</tsrx>}
	</tsx>;

	{content}
}
`;
		const { code } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const types = get_variable_types(`import 'ripple/jsx-runtime';\n${code}`);

		expect(types.get('content')).toBe('TSRXElement');
		expect(types.get('nested')).toBe('TSRXElement');
	});
});
