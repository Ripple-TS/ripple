import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { compile_to_volar_mappings } from '@tsrx/ripple';
import { fileURLToPath } from 'node:url';

describe('router TSRX call-site types', () => {
	it('preserves route data and provider props through the target TypeScript view', () => {
		const filename = fileURLToPath(new URL('../types/virtual-consumer.tsx', import.meta.url));
		const source = `
import { createRootRoute, createRoute, createRouter, RouterProvider } from '@ripple-ts/tanstack-router';
const root = createRootRoute();
const child = createRoute({ getParentRoute: () => root, path: '/$id', loader: ({ params }) => ({ title: params.id }) });
const router = createRouter({ routeTree: root.addChildren([child]) });
declare module '@ripple-ts/tanstack-router' { interface Register { router: typeof router; } }
function Page() @{
	const data = child.useLoaderData();
	const title: string = data.value.title;
	// @ts-expect-error loader data must not become any in a TSRX component
	const invalid: number = data.value.title;
	<p>{title}</p>
}
function App() { return <RouterProvider {router} />; }
// @ts-expect-error the provider needs a router instance
const missing = <RouterProvider />;
`;
		const { code } = compile_to_volar_mappings(source, filename.replace(/tsx$/, 'tsrx'), {
			loose: true,
		});
		const options = {
			target: ts.ScriptTarget.ESNext,
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			jsx: ts.JsxEmit.Preserve,
			jsxImportSource: 'ripple',
			strict: true,
			skipLibCheck: true,
			noEmit: true,
			types: [],
		};
		const host = ts.createCompilerHost(options);
		const original = host.getSourceFile.bind(host);
		host.getSourceFile = (path, version, error, fresh) =>
			path === filename
				? ts.createSourceFile(
						path,
						`import 'ripple/jsx-runtime';\n${code}`,
						version,
						true,
						ts.ScriptKind.TSX,
					)
				: original(path, version, error, fresh);
		const program = ts.createProgram([filename], options, host);
		const file = program.getSourceFile(filename);
		const diagnostics = [
			...program.getSyntacticDiagnostics(file),
			...program.getSemanticDiagnostics(file),
		];
		expect(
			diagnostics.map((diagnostic) => ({
				line: file.getLineAndCharacterOfPosition(diagnostic.start ?? 0).line + 1,
				message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
			})),
		).toEqual([]);
	}, 15_000);
});
