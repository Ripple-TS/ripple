import { describe, expect, it } from 'vitest';
import { create_client_entry_source } from '../src/project-codegen.js';
import { generateServerEntry } from '../src/server/virtual-entry.js';

describe('project codegen', () => {
	it('generates a client entry that resolves route entries from the server route data', () => {
		const source = create_client_entry_source({
			staticEntries: ['/src/pages/index.tsrx'],
		});

		expect(source).not.toContain('ripple.config');
		expect(source).toContain('"/src/pages/index.tsrx": () => import("/src/pages/index.tsrx")');
		expect(source).not.toContain('route?.component');
		expect(source).toContain('function getRouteEntryPath(entry)');
		expect(source).toContain('return Array.isArray(entry) ? entry[1] : entry;');
		expect(source).toContain('function getRouteEntryExportName(entry)');
		expect(source).toContain('return Array.isArray(entry) ? entry[0] : undefined;');
		expect(source).toContain('const entryPath = getRouteEntryPath(data.entry);');
		expect(source).toContain('const layoutPath = data.layout;');
		expect(source).toContain('const rootBoundary = undefined;');
		expect(source).toContain('hydrate(root, { target, props, rootBoundary });');
		expect(source).not.toContain('setTransport');
	});

	it('imports root boundary components from their modules', () => {
		const source = create_client_entry_source({
			staticEntries: [],
			rootBoundary: {
				pending: '/src/Loading.tsrx',
				catch: ['ErrorScreen', '/src/screens.tsrx'],
			},
		});

		expect(source).toContain('import * as pendingModule from "/src/Loading.tsrx";');
		expect(source).toContain('import * as catchModule from "/src/screens.tsrx";');
		expect(source).toContain(`const rootBoundary = {
  pending: getComponentExport(pendingModule, undefined),
  catch: getComponentExport(catchModule, "ErrorScreen"),
};`);
	});

	it('generates server components from named entry tuples', () => {
		const source = generateServerEntry({
			routes: [
				{
					type: 'render',
					path: '/docs/guide/dom-refs',
					entry: ['DomRefsPage', '/src/pages/docs/guide/dom-refs.tsrx'],
					before: [],
				},
			],
			rippleConfigPath: '/project/ripple.config.ts',
			htmlTemplatePath: './index.html',
		});

		expect(source).toContain('import * as _page_0 from "/src/pages/docs/guide/dom-refs.tsrx";');
		expect(source).toContain(
			'"/src/pages/docs/guide/dom-refs.tsrx#DomRefsPage": getComponentExport(_page_0, "DomRefsPage"),',
		);
	});

	it('imports server root boundary components from their modules', () => {
		const source = generateServerEntry({
			routes: [],
			rippleConfigPath: '/ripple.config.ts',
			htmlTemplatePath: './index.html',
			rootBoundary: { catch: ['ErrorScreen', '/src/screens.tsrx'] },
		});

		expect(source).toContain('import * as _root_catch from "/src/screens.tsrx";');
		expect(source).toContain(
			'rootBoundary = resolveRootBoundary({"catch":["ErrorScreen","/src/screens.tsrx"]}, { catch: _root_catch });',
		);
		expect(source).toContain('    rootBoundary,\n');
	});

	it('registers transport before loading client routes and creating the server handler', () => {
		const client = create_client_entry_source({
			staticEntries: ['/src/App.tsrx'],
			transport: ['transport', '/src/money.ts'],
		});
		const server = generateServerEntry({
			routes: [],
			rippleConfigPath: '/ripple.config.ts',
			htmlTemplatePath: './index.html',
			transport: '/src/transport.ts',
		});

		expect(client).toContain('import * as transportModule from "/src/money.ts";');
		expect(client).toContain('setTransport(transportModule["transport"]);');
		expect(client.indexOf('setTransport(')).toBeLessThan(client.indexOf('const routeModules'));

		expect(server).toContain('import * as _transport from "/src/transport.ts";');
		expect(server).toContain('setTransport(resolveTransport("/src/transport.ts", _transport));');
		expect(server.indexOf('setTransport(')).toBeLessThan(
			server.indexOf('const handler = createHandler'),
		);
	});
});
