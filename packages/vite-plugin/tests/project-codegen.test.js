import { describe, expect, it } from 'vitest';
import { create_client_entry_source } from '../src/project-codegen.js';
import { generateServerEntry } from '../src/server/virtual-entry.js';

describe('project codegen', () => {
	it('generates a client entry that resolves route entries from ripple.config.ts', () => {
		const source = create_client_entry_source({
			configPath: '/project/ripple.config.ts',
			staticEntries: ['/src/pages/index.tsrx'],
		});

		expect(source).toContain('import rippleConfig from "/project/ripple.config.ts";');
		expect(source).toContain('"/src/pages/index.tsrx": () => import("/src/pages/index.tsrx")');
		expect(source).not.toContain('route?.component');
		expect(source).toContain('function getRouteEntryPath(entry)');
		expect(source).toContain('return Array.isArray(entry) ? entry[1] : entry;');
		expect(source).toContain('function getRouteEntryExportName(entry)');
		expect(source).toContain('return Array.isArray(entry) ? entry[0] : undefined;');
		expect(source).toContain('const rootBoundary = rippleConfig.rootBoundary;');
		expect(source).toContain('hydrate(root, { target, props, rootBoundary });');
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
});
