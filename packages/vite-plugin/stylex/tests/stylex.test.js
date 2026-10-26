import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { build, createServer } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';
import { stylex } from '@ripple-ts/vite-plugin/stylex';
import upstream_stylex from '@stylexjs/unplugin/vite';
import { SourceMapConsumer } from 'source-map';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
import { stylex_cases, typed_variables } from './stylex-cases.js';
import {
	mkdtempSync,
	mkdirSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packages = fileURLToPath(new URL('../../../', import.meta.url));
const cleanups = [];
beforeEach(() => {
	// The upstream unplugin shares rules across client and SSR plugin instances.
	// Independent fixture projects must not inherit each other's CSS.
	delete globalThis.__stylex_unplugin_store;
});
afterEach(async () => {
	for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
	vi.unstubAllGlobals();
});

const component = `import * as stylex from '@stylexjs/stylex';
import { tokens } from './tokens.stylex';

const styles = stylex.create({
  root: { color: 'rebeccapurple', padding: tokens.padding },
  dynamic: (width: number) => ({ width }),
});

export function App() @{
  const width = 24;
  <>
    <div {...stylex.attrs(styles.root, styles.dynamic(width))}>{'StyleX works'}</div>
    <style>div { font-weight: bold; }</style>
  </>
}`;

function fixture() {
	const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'ripple-stylex-')));
	cleanups.push(() => rmSync(root, { recursive: true, force: true }));
	mkdirSync(path.join(root, 'node_modules', '@ripple-ts'), { recursive: true });
	for (const [name, source] of [
		['ripple', 'ripple'],
		['@ripple-ts/vite-plugin', 'vite-plugin'],
		['@ripple-ts/adapter-node', 'adapter-node'],
	]) {
		symlinkSync(path.join(packages, source), path.join(root, 'node_modules', name), 'dir');
	}
	symlinkSync(
		path.join(packages, 'vite-plugin/node_modules/@stylexjs'),
		path.join(root, 'node_modules/@stylexjs'),
		'dir',
	);
	writeFileSync(path.join(root, 'package.json'), '{"type":"module"}');
	writeFileSync(path.join(root, 'App.tsrx'), component);
	writeFileSync(
		path.join(root, 'tokens.stylex.ts'),
		`import * as stylex from '@stylexjs/stylex';
export const tokens = stylex.defineVars({ padding: '13px' });`,
	);
	writeFileSync(path.join(root, 'global.css'), 'body { margin: 0; }');
	writeFileSync(
		path.join(root, 'main.js'),
		`import { mount } from 'ripple';
import { App } from './App.tsrx';
import './global.css';
mount(App, { target: document.getElementById('root') });`,
	);
	writeFileSync(
		path.join(root, 'index.html'),
		'<html><head><!--ssr-head--></head><body><div id="root"><!--ssr-body--></div><script type="module" src="/main.js"></script></body></html>',
	);
	return root;
}

async function dev_server(root, reverse = false, options = {}, ripple_options = {}) {
	const plugins = [
		ripple({ excludeRippleExternalModules: true, ...ripple_options }),
		stylex({ dev: true, ...options }),
	];
	const server = await createServer({
		root,
		configFile: false,
		plugins: reverse ? plugins.reverse() : plugins,
		logLevel: 'silent',
		server: { host: '127.0.0.1', port: 0 },
	});
	cleanups.push(async () => {
		await server.waitForRequestsIdle();
		await server.close();
	});
	await server.listen();
	return server;
}

async function production_build(root, options = {}, build_options = {}, ripple_options = {}) {
	return build({
		root,
		configFile: false,
		plugins: [ripple({ excludeRippleExternalModules: true, ...ripple_options }), stylex(options)],
		logLevel: 'silent',
		build: { write: false, minify: false, ...build_options },
	});
}

describe('StyleX integration', () => {
	it('requires a boolean stylex compiler option', () => {
		expect(() => ripple({ stylex: 'sx' })).toThrow('`stylex` option must be a boolean');
	});
	it.each([false, true])('compiles TSRX after Ripple (reversed plugins: %s)', async (reverse) => {
		const root = fixture();
		const server = await dev_server(root, reverse);
		const result = await server.transformRequest('/App.tsrx');
		expect(result.code).not.toContain('stylex.create(');
		expect(result.code).toContain('import.meta.hot');
		expect(result.code).toContain('?ripple&type=style&lang.css');
		expect(result.map.sourcesContent).toContain(component);

		// Check an actual mapping, not just sourcesContent: the Babel pass
		// changes line numbers before Vite composes it with the TSRX map.
		const lines = result.code.split('\n');
		const line = lines.findIndex((line) => line.includes('const width = 24'));
		await SourceMapConsumer.with(result.map, null, (map) => {
			const original = map.originalPositionFor({
				line: line + 1,
				column: lines[line].indexOf('24'),
			});
			expect(original.source).toMatch(/App\.tsrx$/);
			expect(original.line).toBe(
				component.split('\n').findIndex((line) => line.includes('const width')) + 1,
			);
		});

		const html = await server.transformIndexHtml('/', '<html><head></head><body></body></html>');
		expect(html).toContain('/virtual:stylex.css');
		expect(html).toContain('virtual:stylex:runtime');
		const css = await fetch(new URL('/virtual:stylex.css', server.resolvedUrls.local[0])).then(
			(r) => r.text(),
		);
		expect(css).toMatch(/color:\s*#639/);
	});

	it.each([false, true])(
		'rewrites HTML and SVG sx before Ripple (reversed plugins: %s)',
		async (reverse) => {
			const root = fixture();
			const source = component
				.replace(
					'{...stylex.attrs(styles.root, styles.dynamic(width))}',
					'sx={[styles.root, styles.dynamic(width)]}',
				)
				.replace('<div ', '<svg ')
				.replace('</div>', '</svg>');
			writeFileSync(path.join(root, 'App.tsrx'), source);
			const server = await dev_server(root, reverse, {}, { stylex: true });
			const result = await server.transformRequest('/App.tsrx');
			expect(result.code).not.toContain('stylex.create(');
			expect(result.map.sourcesContent).toContain(source);
			const { App } = await server.ssrLoadModule('/App.tsrx');
			const { render } = await server.ssrLoadModule('ripple/server');
			const { body } = await render(App);
			expect(body).toMatch(/<svg[^>]+class="[^"]+"/);
			expect(body).toMatch(/style="--[^:]+:24px/);
			expect(body).not.toContain('sx=');
		},
	);

	it('renders static and dynamic StyleX attributes in SSR', async () => {
		const server = await dev_server(fixture());
		const { App } = await server.ssrLoadModule('/App.tsrx');
		const { render } = await server.ssrLoadModule('ripple/server');
		const { body } = await render(App);
		expect(body).toContain('StyleX works');
		expect(body).toMatch(/class="[^"]*x[\w-]+/);
		expect(body).toMatch(/style="--[^:]+:24px/);
		expect(body).not.toContain('className');
	});

	it('preserves attribute order and component props with sx shorthand', async () => {
		const root = fixture();
		writeFileSync(
			path.join(root, 'App.tsrx'),
			`import { create } from '@stylexjs/stylex';
const styles = create({ red: { color: 'red' }, blue: { color: 'blue' } });
const __ripple_stylex = 'binding-collision';
const literal = '<div sx={doNotRewriteThis} />';
function Child(props) { return <span data-sx={props.sx}>Child</span>; }
const UI = { Child };
export function App() @{
  const __ripple_stylex_ = 'nested-collision';
  <>
    <div id="before" class="before" sx={styles.red} />
    <div id="after" sx={(styles.blue, styles.red)} class="after" />
    <div id="spread" sx={styles.red} {...{ class: 'spread-wins' }} />
    <div id="red" sx={styles.red} />
    <div id="comma" sx={(styles.blue, styles.red)} />
    <p data-binding={__ripple_stylex + __ripple_stylex_}>{literal}</p>
    <Child sx="component" />
    <UI.Child sx="member" />
    <{Child} sx="dynamic" />
  </>
}`,
		);
		const server = await dev_server(root, false, {}, { stylex: true });
		const { App } = await server.ssrLoadModule('/App.tsrx');
		const { render } = await server.ssrLoadModule('ripple/server');
		const { body } = await render(App);
		const dom = new JSDOM(body);
		cleanups.push(() => dom.window.close());
		const doc = dom.window.document;
		// Ripple gives an explicit class priority over a spread's class.
		expect(doc.getElementById('before').className).toBe('before');
		expect(doc.getElementById('after').className).toBe('after');
		expect(doc.getElementById('spread').className).toBe('spread-wins');
		expect(doc.getElementById('comma').className).toBe(doc.getElementById('red').className);
		expect(doc.querySelector('p').textContent).toBe('<div sx={doNotRewriteThis} />');
		expect(doc.querySelector('p').getAttribute('data-binding')).toBe(
			'binding-collisionnested-collision',
		);
		expect([...doc.querySelectorAll('span')].map((node) => node.getAttribute('data-sx'))).toEqual([
			'component',
			'member',
			'dynamic',
		]);
	});

	it('leaves shorthand disabled unless configured and rejects invalid enabled values', async () => {
		const root = fixture();
		writeFileSync(
			path.join(root, 'App.tsrx'),
			'export function App() { return <div sx="ordinary-attribute" />; }',
		);
		const server = await dev_server(root);
		const { App } = await server.ssrLoadModule('/App.tsrx');
		const { render } = await server.ssrLoadModule('ripple/server');
		expect((await render(App)).body).toContain('sx="ordinary-attribute"');
		await expect(production_build(root, {}, {}, { stylex: true })).rejects.toThrow(
			'sx must contain a StyleX expression',
		);
	});

	it('updates extracted CSS when a TSRX style changes', async () => {
		const root = fixture();
		const server = await dev_server(root);
		await server.transformRequest('/App.tsrx');
		const send = vi.spyOn(server.ws, 'send');
		writeFileSync(path.join(root, 'App.tsrx'), component.replace('rebeccapurple', 'chartreuse'));
		await vi.waitFor(
			async () => {
				const css = await fetch(new URL('/virtual:stylex.css', server.resolvedUrls.local[0])).then(
					(r) => r.text(),
				);
				expect(css).toMatch(/color:\s*#7fff00/);
				expect(send).toHaveBeenCalledWith({ type: 'custom', event: 'stylex:css-update' });
			},
			{ timeout: 10_000 },
		);
	});

	it('includes StyleX and scoped CSS in a linked production asset', async () => {
		const root = fixture();
		const { output } = await production_build(root);
		const html = output.find((file) => file.fileName === 'index.html').source;
		const css = output.find((file) => file.type === 'asset' && file.fileName.endsWith('.css'));
		expect(css.source).toMatch(/color:\s*#639/);
		expect(css.source).toContain('13px');
		expect(css.source).toMatch(/font-weight:\s*(bold|700)/);
		expect(html).toContain(css.fileName);
		const js = output
			.filter((file) => file.type === 'chunk')
			.map((file) => file.code)
			.join('\n');
		expect(js).not.toContain('stylex.create(');
	});

	it('can lower sx when TypeScript text inference is enabled', async () => {
		const root = fixture();
		writeFileSync(
			path.join(root, 'tsconfig.json'),
			JSON.stringify({
				compilerOptions: {
					strict: true,
					target: 'ESNext',
					module: 'ESNext',
					moduleResolution: 'Bundler',
				},
			}),
		);
		writeFileSync(
			path.join(root, 'App.tsrx'),
			component.replace(
				'{...stylex.attrs(styles.root, styles.dynamic(width))}',
				'sx={[styles.root, styles.dynamic(width)]}',
			),
		);
		const { output } = await production_build(
			root,
			{},
			{},
			{ stylex: true, textTypes: { tsconfig: 'tsconfig.json' } },
		);
		expect(output.find((file) => file.fileName.endsWith('.css')).source).toMatch(/color:\s*#639/);
	});

	it.each(stylex_cases)('supports $name in production and SSR', async (test) => {
		const root = fixture();
		for (const [name, content] of Object.entries(test.files ?? {})) {
			writeFileSync(path.join(root, name), content);
		}
		writeFileSync(
			path.join(root, 'App.tsrx'),
			`import * as stylex from '@stylexjs/stylex';
${test.setup ?? ''}
const styles = stylex.create({ root: ${test.style} });
export function App() @{
  <div {...stylex.attrs(${test.attrs ?? 'styles.root'})}>Feature</div>
}`,
		);
		const { output } = await production_build(root, test.options);
		const css = output
			.filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'))
			.map((file) => file.source)
			.join('\n');
		for (const pattern of test.css) expect(css).toMatch(pattern);

		const server = await dev_server(root, false, test.options);
		const { App } = await server.ssrLoadModule('/App.tsrx');
		const { render } = await server.ssrLoadModule('ripple/server');
		const { body } = await render(App);
		expect(body).toContain('Feature');
		expect(body).toMatch(/class="[^"]+"/);
		expect(body).not.toContain('className');
	});

	it('preserves the upstream 0.19.1 diagnostic for imported experimental nested themes', async () => {
		const root = fixture();
		writeFileSync(
			path.join(root, 'nested.stylex.ts'),
			`import * as stylex from '@stylexjs/stylex';
export const nested = stylex.unstable_defineVarsNested({ colors: { accent: 'red' } });`,
		);
		const source = `import * as stylex from '@stylexjs/stylex';
import { nested } from './nested.stylex';
export const theme = stylex.unstable_createThemeNested(nested, { colors: { accent: 'purple' } });`;
		// This fails in plain TypeScript too: it is not caused by TSRX lowering.
		await expect(
			upstream_stylex().transform.call({}, source, path.join(root, 'theme.stylex.ts')),
		).rejects.toThrow("Cannot read properties of undefined (reading 'slice')");
		writeFileSync(
			path.join(root, 'App.tsrx'),
			source + '\nexport function App() { return <div {...stylex.attrs(theme)}>Theme</div>; }',
		);
		await expect(production_build(root)).rejects.toThrow(
			"Cannot read properties of undefined (reading 'slice')",
		);
	});

	it('supports every types helper in defineVars and typed createTheme values', async () => {
		const root = fixture();
		const definitions = Object.entries(typed_variables)
			.map(([name, [value]]) => `${name}: stylex.types.${name}(${JSON.stringify(value)})`)
			.join(',\n');
		writeFileSync(
			path.join(root, 'typed.stylex.ts'),
			`import * as stylex from '@stylexjs/stylex';
export const tokens = stylex.defineVars({ ${definitions} });`,
		);
		writeFileSync(
			path.join(root, 'App.tsrx'),
			`import * as stylex from '@stylexjs/stylex';
import { tokens } from './typed.stylex';
const theme = stylex.createTheme(tokens, { ${definitions} });
const styles = stylex.create({ root: { color: tokens.color } });
export function App() @{ <div {...stylex.attrs(theme, styles.root)}>Typed</div> }`,
		);
		const { output } = await production_build(root);
		const css = output.find((file) => file.fileName.endsWith('.css')).source;
		for (const [, syntax] of Object.values(typed_variables)) {
			expect(css).toContain(`<${syntax}>`);
		}
		expect(css.match(/@property /g)).toHaveLength(Object.keys(typed_variables).length);
	});

	it.each([
		['mount', false],
		['hydrate', false],
		['mount', true],
		['hydrate', true],
	])(
		'preserves composition, themes, and reactive dynamic styles during %s (sx: %s)',
		async (method, sx) => {
			const root = fixture();
			writeFileSync(
				path.join(root, 'App.tsrx'),
				`import * as stylex from '@stylexjs/stylex';
import { track } from 'ripple';
import { tokens } from './tokens.stylex';
const theme = stylex.createTheme(tokens, { padding: '29px' });
const styles = stylex.create({
  base: { color: 'red', padding: tokens.padding },
  active: { color: 'blue' },
  dynamic: (width: number, opacity: number) => ({ width, opacity }),
});
export function App() @{
  const active = track(false);
  <button id="styled" {...stylex.attrs(theme, [styles.base, null, false, active.value && styles.active],
    !active.value && styles.dynamic(24, 0.5))} onClick={() => { active.value = !active.value; }}>
    Toggle
  </button>
}`,
			);
			if (sx) {
				const source = readFileSync(path.join(root, 'App.tsrx'), 'utf8')
					.replace(
						'{...stylex.attrs(theme, [styles.base, null, false, active.value && styles.active],',
						'sx={[theme, [styles.base, null, false, active.value && styles.active],',
					)
					.replace(
						'!active.value && styles.dynamic(24, 0.5))}',
						'!active.value && styles.dynamic(24, 0.5)]}',
					);
				writeFileSync(path.join(root, 'App.tsrx'), source);
			}
			const server = await dev_server(root, false, { dev: false }, { stylex: sx });
			const { App } = await server.ssrLoadModule('/App.tsrx');
			const { render } = await server.ssrLoadModule('ripple/server');
			const { body } = await render(App);
			writeFileSync(
				path.join(root, 'main.js'),
				`export { mount, hydrate, flushSync } from 'ripple';
export { App } from './App.tsrx';
import './global.css';`,
			);
			await production_build(
				root,
				{},
				{
					write: true,
					rollupOptions: {
						input: path.join(root, 'main.js'),
						preserveEntrySignatures: 'strict',
						output: { entryFileNames: 'main.js' },
					},
				},
				{ stylex: sx },
			);
			const dom = new JSDOM('<html><body><div id="root"></div></body></html>', {
				pretendToBeVisual: true,
			});
			cleanups.push(() => dom.window.close());
			for (const key of [
				'window',
				'document',
				'Node',
				'Element',
				'HTMLElement',
				'Text',
				'Comment',
				'requestAnimationFrame',
				'cancelAnimationFrame',
			]) {
				vi.stubGlobal(key, dom.window[key]);
			}
			const client = await import(pathToFileURL(path.join(root, 'dist/main.js')).href);
			const target = dom.window.document.getElementById('root');
			if (method === 'hydrate') target.innerHTML = body;
			const original = target.querySelector('button');
			const unmount = client[method](client.App, { target });
			cleanups.push(unmount);
			const button = target.querySelector('button');
			if (method === 'hydrate') expect(button).toBe(original);
			const initial_class = button.className;
			expect(initial_class).not.toBe('');
			expect(button.style.cssText).toContain('24px');
			expect(button.style.cssText).toContain('0.5');
			expect(button.hasAttribute('sx')).toBe(false);
			button.click();
			client.flushSync();
			expect(button.className).not.toBe(initial_class);
			expect(button.style.cssText).toBe('');
			button.click();
			client.flushSync();
			expect(button.className).toBe(initial_class);
			expect(button.style.cssText).toContain('24px');
		},
	);

	it('delivers the generated stylesheet through a production render route', async () => {
		const root = fixture();
		writeFileSync(
			path.join(root, 'App.tsrx'),
			component.replace(
				'{...stylex.attrs(styles.root, styles.dynamic(width))}',
				'sx={[styles.root, styles.dynamic(width)]}',
			),
		);
		writeFileSync(
			path.join(root, 'vite.config.js'),
			`import { ripple } from '@ripple-ts/vite-plugin';
import { stylex } from '@ripple-ts/vite-plugin/stylex';
export default { plugins: [ripple({ excludeRippleExternalModules: true, stylex: true }), stylex()], logLevel: 'silent' };`,
		);
		writeFileSync(
			path.join(root, 'ripple.config.ts'),
			`import { defineConfig, RenderRoute } from '@ripple-ts/vite-plugin';
import * as adapter from '@ripple-ts/adapter-node';
export default defineConfig({ adapter, router: { routes: [new RenderRoute({ path: '/', entry: '/App.tsrx' })] } });`,
		);
		writeFileSync(
			path.join(root, 'index.html'),
			'<html><head><link rel="stylesheet" href="/global.css"><!--ssr-head--></head><body><div id="root"><!--ssr-body--></div></body></html>',
		);
		await build({ root });
		const { handler } = await import(pathToFileURL(path.join(root, 'dist/server/entry.js')).href);
		const response = await handler(new Request('http://localhost/'));
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain('StyleX works');
		const stylesheets = [...html.matchAll(/href="([^"]+\.css)"/g)].map((match) => match[1]);
		expect(stylesheets.length).toBeGreaterThan(0);
		const css = stylesheets
			.map((href) => readFileSync(path.join(root, 'dist/client', href), 'utf8'))
			.join('\n');
		expect(css).toMatch(/color:\s*#639/);
		const classes = html.match(/class="([^"]+)"/)[1].split(/\s+/);
		expect(classes.some((name) => css.includes('.' + name))).toBe(true);
	}, 30_000);

	it('exposes compatible StyleX and Ripple attribute types', () => {
		const root = fixture();
		const filename = path.join(root, 'types.ts');
		writeFileSync(
			filename,
			`import * as stylex from '@stylexjs/stylex';
import type { JSX } from 'ripple/jsx-runtime';
import { stylex as plugin, type StylexOptions } from '@ripple-ts/vite-plugin/stylex';
const options: StylexOptions = { useCSSLayers: true, dev: true, env: { color: 'red' } };
plugin(options);
const styles = stylex.create({ root: { color: 'red' } });
function attrs(styles: stylex.StyleXStyles): JSX.IntrinsicElements['div'] {
  return stylex.attrs(styles);
}
attrs(styles.root);
// @ts-expect-error StyleX requires compiled styles, not class strings.
stylex.attrs('uncompiled-class');
// @ts-expect-error Plugin options retain their upstream types.
plugin({ dev: 'yes' });`,
		);
		const program = ts.createProgram([filename], {
			strict: true,
			noEmit: true,
			skipLibCheck: true,
			target: ts.ScriptTarget.ESNext,
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			types: [],
		});
		expect(
			ts
				.getPreEmitDiagnostics(program)
				.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
		).toEqual([]);
	});

	it.each([false, true])('makes sx types opt-in (enabled: %s)', (enabled) => {
		const root = fixture();
		const filename = path.join(root, 'sx-types.tsx');
		writeFileSync(
			filename,
			`import * as stylex from '@stylexjs/stylex';
import { stylex as plugin } from '@ripple-ts/vite-plugin/stylex';
import { ripple } from '@ripple-ts/vite-plugin';
import type { Ripple, JSX as PublicJSX } from 'ripple';
const styles = stylex.create({ root: { color: 'red' } });
ripple({ stylex: true });
plugin();
const html = <div sx={styles.root} />;
const svg = <svg><path sx={[styles.root, false]} /></svg>;
const attributes: Ripple.HTMLAttributes<HTMLButtonElement> = { sx: styles.root };
const global: JSX.IntrinsicElements['div'] = { sx: styles.root };
const exported: PublicJSX.IntrinsicElements['path'] = { sx: styles.root };
type IsAny<T> = 0 extends (1 & T) ? true : false;
const htmlIsAny: IsAny<Ripple.HTMLAttributes['sx']> = ${!enabled};
const svgIsAny: IsAny<PublicJSX.IntrinsicElements['path']['sx']> = ${!enabled};
${enabled ? '// @ts-expect-error Typed sx rejects arbitrary class strings.' : ''}
const invalid = <div sx="raw-class-name" />;`,
		);
		const program = ts.createProgram([filename], {
			strict: true,
			noEmit: true,
			skipLibCheck: true,
			target: ts.ScriptTarget.ESNext,
			module: ts.ModuleKind.ESNext,
			moduleResolution: ts.ModuleResolutionKind.Bundler,
			jsx: ts.JsxEmit.ReactJSX,
			jsxImportSource: 'ripple',
			configFilePath: path.join(root, 'tsconfig.json'),
			types: enabled ? ['@ripple-ts/vite-plugin/stylex/jsx'] : [],
		});
		expect(
			ts
				.getPreEmitDiagnostics(program)
				.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
		).toEqual([]);
	});
});
