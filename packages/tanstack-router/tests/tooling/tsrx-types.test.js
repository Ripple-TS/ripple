import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { compile_to_volar_mappings } from '@tsrx/ripple';
import { fileURLToPath } from 'node:url';

describe('router TSRX call-site types', () => {
	it('preserves route data and provider props through the target TypeScript view', () => {
		const filename = fileURLToPath(new URL('../types/virtual-consumer.tsx', import.meta.url));
		const source = `
import { createRootRoute, createRoute, createRouter, RouterProvider, Link, MatchRoute, createLazyRoute } from '@ripple-ts/tanstack-router';
import { track } from 'ripple';
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
function Links() @{
	const params = track({ id: 'one' });
	<>
		<Link to="/$id" {params} onClick={(event) => {
			const anchor: HTMLAnchorElement = event.currentTarget;
			// @ts-expect-error the event target retains its element type
			const wrong: number = event.currentTarget;
		}} render={({ isActive }) => isActive ? 'Active' : 'Inactive'} />
		<MatchRoute to="/$id" render={(match) => match ? match.id : 'none'} />
	</>
}
const lazy = createLazyRoute('/$id')({ component: Page });
child.lazy(async () => lazy);
// @ts-expect-error Link needs the required route params
const missingParams = <Link to="/$id" />;
// @ts-expect-error Link checks tracked parameter types
const wrongParams = <Link to="/$id" params={{ id: 42 }} />;
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
