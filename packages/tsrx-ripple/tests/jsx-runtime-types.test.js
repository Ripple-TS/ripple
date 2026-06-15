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
		skipLibCheck: true,
		skipDefaultLibCheck: true,
		types: [],
		baseUrl: root,
		paths: {
			'ripple/jsx-runtime': ['packages/ripple/src/jsx-runtime.d.ts'],
			ripple: ['packages/ripple/types/index.d.ts'],
			'#public': ['packages/ripple/types/index.d.ts'],
			'@tsrx/core/types/helpers': ['packages/tsrx/types/helpers.d.ts'],
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
	const source_file = /** @type {ts.SourceFile} */ (program.getSourceFile(file));
	const diagnostics = program
		.getSyntacticDiagnostics(source_file)
		.concat(program.getSemanticDiagnostics(source_file))
		.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
	expect(diagnostics).toEqual([]);

	const checker = program.getTypeChecker();
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
	it('types JSX expression values as TSRXElement', () => {
		const source = `
function App() @{
	const nested = <div />;
	const content = <>
		<section>{nested}</section>
	</>;

	<>{content}</>
}
`;
		const { code } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });
		const types = get_variable_types(`import 'ripple/jsx-runtime';\n${code}`);

		expect(types.get('content')).toBe('Element');
		expect(types.get('nested')).toBe('Element');
	});

	it('allows tag-specific TSRXElement annotations for JSX values', () => {
		get_variable_types(`
import 'ripple/jsx-runtime';
import type { TSRXElement } from 'ripple';

const div: TSRXElement<'div'> = <div />;
function Child(): TSRXElement<'div'> {
	return <div />;
}
`);
	});

	it('prints statement-bodied JSX fragments with typed child buckets', () => {
		const source = `
function ContentEditable(props: { placeholder: any }) @{
		const className = 'editable';
		<article class={className}>
			<div>{props.placeholder}</div>
		</article>
}

function App() @{
		<ContentEditable placeholder={<><div>Hello</div></>} />
}
`;
		const { code } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		expect(code).toContain("const className = 'editable';");
		expect(code).toContain('return <article');
		expect(code).not.toContain('"const className = \'editable\';"');
	});

	it('keeps fragment expression children inside containers in the TS view', () => {
		const source = `
function StatusBadge() @{
	const a = 'hi';
	<>{<>{a} <>{<>{a}</>}</> </>}</>
}
`;
		const { code } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		expect(code).toContain("<>{a} {a}{' '}</>");
		expect(code).not.toContain('<>aa</>');
	});

	it('keeps an empty fragment inside a container in the TS view', () => {
		const source = `
function App() @{
	<b>{<></>}</b>
}
`;
		const { code } = compile_to_volar_mappings(source, 'App.tsrx', { loose: true });

		expect(code).toContain('<b>{<></>}</b>');
		expect(code).not.toContain('{null}');
	});

	it('matches the JSX targets for text, fragments and edge whitespace', () => {
		const compile = (src) => compile_to_volar_mappings(src, 'App.tsrx', { loose: true }).code;

		expect(compile('let a = <> <>123</> 2 <>123</> </>;')).toContain(
			"let a = <>{' '}<>123</> 2 <>123</>{' '}</>;",
		);
		expect(compile('let b = <> <></> 2 <></> </>;')).toContain(
			"let b = <>{' '}<></> 2 <></>{' '}</>;",
		);
		expect(compile('let c = <></>;')).toContain('let c = null;');
		expect(compile('let d = <pre> <b>1</b> <b>2</b> </pre>;')).toContain(
			"let d = <pre>{' '}<b>1</b> <b>2</b>{' '}</pre>;",
		);
	});
});
