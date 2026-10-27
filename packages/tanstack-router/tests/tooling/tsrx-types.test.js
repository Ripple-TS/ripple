import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { compile_to_volar_mappings } from '@tsrx/ripple';
import { fileURLToPath } from 'node:url';

describe('router TSRX call-site types', () => {
	it('preserves route data and provider props through the target TypeScript view', () => {
		const filename = fileURLToPath(new URL('../types/virtual-consumer.tsx', import.meta.url));
		const source = `
import { createRootRoute, createRoute, createRouter, RouterProvider, Link, MatchRoute, createLazyRoute, createLink, useMatch } from '@ripple-ts/tanstack-router';
import { track, type Derived, type Children } from 'ripple';
import type { AnchorProps } from '@ripple-ts/tanstack-router';
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
 const activeProps = track({title:'Active'});
 const inactiveProps = track<{title:string}|undefined>(undefined);
	<>
		<Link to="/$id" {params} {activeProps} {inactiveProps} onClick={(event) => {
			const anchor: HTMLAnchorElement = event.currentTarget;
			// @ts-expect-error the event target retains its element type
			const wrong: number = event.currentTarget;
		}} render={({ isActive }) => isActive ? 'Active' : 'Inactive'} />
		<MatchRoute to="/$id" render={(match) => match ? match.id : 'none'} />
	</>
}
function CustomAnchor(props: { linkProps: Derived<AnchorProps>; label: string; children?: Children }) {
 return <a {...props.linkProps.value}>{props.label}{props.children}</a>;
}
const CustomLink = createLink(CustomAnchor);
function CustomLinks() @{
 const ref = track<HTMLAnchorElement | null>(null);
 <>
  <CustomLink to="/$id" params={{id:'one'}} label="Read" ref={(anchor) => {
   const valid: HTMLAnchorElement = anchor;
   // @ts-expect-error the native anchor ref must not become any
   const invalid: HTMLInputElement = anchor;
   return () => {};
  }} />
  <Link to="/$id" params={{id:'one'}} {ref} />
 </>
}
// @ts-expect-error custom required props survive generic component inference
const missingLabel = <CustomLink to="/$id" params={{id:'one'}} />;
// @ts-expect-error a ref for another host element is invalid
const wrongRef = <CustomLink to="/$id" params={{id:'one'}} label="Read" ref={(element: HTMLInputElement) => {}} />;
// @ts-expect-error hooks resolve their route during initialization, not from a tracked option
useMatch({from: track('/$id' as const)});
const lazy = createLazyRoute('/$id')({ component: Page });
child.lazy(async () => lazy);
// @ts-expect-error masked params must retain their route type
const wrongMask = <Link to="/$id" params={{id:'one'}} mask={{to:'/$id',params:{id:42}}} />;
// @ts-expect-error masked destinations must exist
const wrongMaskPath = <Link to="/$id" params={{id:'one'}} mask={{to:'/missing'}} />;
const trackedMask = <Link to="/$id" params={{id:'one'}} mask={track({to:'/$id' as const,params:{id:'masked'}})} />;
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
