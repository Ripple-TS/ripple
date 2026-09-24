/**
 * Virtual server entry generator for production builds.
 *
 * Generates a self-contained server entry module that:
 * - Imports all SSR-compiled page components and layouts
 * - Imports the production request handler (createHandler)
 * - Imports the adapter's serve() function
 * - Wires routes, middlewares, RPC, and boots the HTTP server
 */

/** @import { ModuleEntry, RootBoundaryConfig, Route } from '@ripple-ts/vite-plugin' */

import {
	get_route_entry_export_name,
	get_route_entry_id,
	get_route_entry_path,
} from '../routes.js';

/**
 * @typedef {Object} ClientAssetEntry
 * @property {string} js - Path to the built JS file
 * @property {string[]} css - Paths to the built CSS files
 */

/**
 * @typedef {Object} VirtualEntryOptions
 * @property {Route[]} routes - Route definitions from ripple.config.ts
 * @property {string} rippleConfigPath - Absolute path to ripple.config.ts (for importing middlewares/adapter)
 * @property {string} htmlTemplatePath - Path to the processed index.html template
 * @property {string[]} [rpcModulePaths] - Paths (relative to root) of .tsrx modules with `module server` declarations
 * @property {Record<string, ClientAssetEntry>} [clientAssetMap] - Map of route entry paths to built JS/CSS asset paths
 * @property {ModuleEntry} [transport] - Module exporting the app's custom serializers
 * @property {RootBoundaryConfig} [rootBoundary] - Modules exporting the root boundary components
 */

/**
 * Generate the virtual server entry module source code.
 *
 * The generated module:
 * 1. Imports ripple SSR utilities (render, getCss, executeServerFunction)
 * 2. Imports createHandler from @ripple-ts/vite-plugin/production
 * 3. Imports ripple.config.ts to get adapter, middlewares, and routes
 * 4. Imports each RenderRoute's entry (and layout) as SSR components, and the
 *    transport and root boundary modules the config names
 * 5. Builds a ServerManifest and creates the fetch handler
 * 6. Reads the HTML template from disk
 * 7. Boots the adapter with the handler
 *
 * @param {VirtualEntryOptions} options
 * @returns {string} The generated JavaScript module source
 */
export function generateServerEntry(options) {
	const {
		routes,
		rippleConfigPath,
		htmlTemplatePath,
		rpcModulePaths = [],
		clientAssetMap = {},
		transport,
		rootBoundary = {},
	} = options;

	// Collect unique component entries and layouts
	/** @type {Map<string, string>} entry path → import variable name */
	const component_imports = new Map();
	/** @type {Map<string, string>} layout path → import variable name */
	const layout_imports = new Map();
	/** @type {Map<string, string>} rpc module path → import variable name */
	const rpc_imports = new Map();

	let component_index = 0;
	let layout_index = 0;
	let rpc_index = 0;

	for (const route of routes) {
		if (route.type === 'render') {
			const entryPath = get_route_entry_path(route.entry);
			if (entryPath && !component_imports.has(entryPath)) {
				component_imports.set(entryPath, `_page_${component_index++}`);
			}
			if (typeof route.layout === 'string' && !layout_imports.has(route.layout)) {
				layout_imports.set(route.layout, `_layout_${layout_index++}`);
			}
		}
	}

	// Collect RPC modules (sub-components with `module server` declarations, not already in page entries)
	for (const rpcPath of rpcModulePaths) {
		if (!component_imports.has(rpcPath) && !rpc_imports.has(rpcPath)) {
			rpc_imports.set(rpcPath, `_rpc_${rpc_index++}`);
		}
	}

	// --- Dynamic import lines (built from route/RPC config) ---

	const import_lines = [];

	for (const [entry, varName] of component_imports) {
		import_lines.push(`import * as ${varName} from ${JSON.stringify(entry)};`);
	}
	for (const [layout, varName] of layout_imports) {
		import_lines.push(`import * as ${varName} from ${JSON.stringify(layout)};`);
	}
	for (const [rpcPath, varName] of rpc_imports) {
		import_lines.push(`import * as ${varName} from ${JSON.stringify(rpcPath)};`);
	}
	if (transport) {
		import_lines.push(
			`import * as _transport from ${JSON.stringify(get_route_entry_path(transport))};`,
		);
	}
	/** @type {string[]} */
	const root_boundary_modules = [];
	for (const key of /** @type {const} */ (['pending', 'catch'])) {
		const entry = rootBoundary[key];
		if (entry === undefined) continue;
		import_lines.push(
			`import * as _root_${key} from ${JSON.stringify(get_route_entry_path(entry))};`,
		);
		root_boundary_modules.push(`${key}: _root_${key}`);
	}

	// --- Dynamic map entries ---

	const component_entries = routes
		.filter((route) => route.type === 'render')
		.map((route) => {
			const entryId = get_route_entry_id(route.entry);
			const entryPath = get_route_entry_path(route.entry);
			const exportName = get_route_entry_export_name(route.entry);
			const varName = entryPath ? component_imports.get(entryPath) : undefined;

			if (!entryId || !varName) {
				return null;
			}

			return `  ${JSON.stringify(entryId)}: getComponentExport(${varName}, ${JSON.stringify(exportName)}),`;
		})
		.filter(Boolean)
		.join('\n');

	const layout_entries = [...layout_imports]
		.map(([layout, varName]) => `  ${JSON.stringify(layout)}: getComponentExport(${varName}),`)
		.join('\n');

	// Only check _$_server_$_ on modules known to have `module server` declarations.
	// Checking modules without `module server` declarations causes rollup warnings since
	// they don't export _$_server_$_.
	const rpcPathSet = new Set(rpcModulePaths);
	const rpc_entries = [];

	for (const [entry, varName] of component_imports) {
		if (rpcPathSet.has(entry)) {
			rpc_entries.push(`rpcModules[${JSON.stringify(entry)}] = ${varName}._$_server_$_;`);
		}
	}
	for (const [rpcPath, varName] of rpc_imports) {
		rpc_entries.push(`rpcModules[${JSON.stringify(rpcPath)}] = ${varName}._$_server_$_;`);
	}

	// --- Assemble the full module ---

	return `\
// Auto-generated server entry for production build
// Do not edit — regenerated on each build

import { render, getCss, createStream, executeServerFunction${transport ? ', setTransport' : ''} } from 'ripple/server';
import { createHandler, prerenderRoutes, resolveRippleConfig, resolveRootBoundary${transport ? ', resolveTransport' : ''} } from '@ripple-ts/vite-plugin/production';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import _rawRippleConfig from ${JSON.stringify(rippleConfigPath)};

${import_lines.join('\n')}

let rippleConfig;
let rootBoundary;
try {
  rippleConfig = resolveRippleConfig(_rawRippleConfig, { requireAdapter: true });${
		transport ? `\n  setTransport(resolveTransport(${JSON.stringify(transport)}, _transport));` : ''
	}
  rootBoundary = resolveRootBoundary(${JSON.stringify(rootBoundary)}, {${root_boundary_modules.map((module) => ` ${module}`).join(',')} });
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

function getComponentExport(mod, exportName) {
  if (exportName && typeof mod[exportName] === 'function') return mod[exportName];
  if (typeof mod.default === 'function') return mod.default;
  for (const [key, value] of Object.entries(mod)) {
    if (typeof value === 'function' && /^[A-Z]/.test(key)) return value;
  }
  return null;
}

const components = {
${component_entries}
};

const layouts = {
${layout_entries}
};

const rpcModules = {};
${rpc_entries.join('\n')}

const __dirname = dirname(fileURLToPath(import.meta.url));
if (!existsSync(join(__dirname, ${JSON.stringify(htmlTemplatePath)}))) {
  console.error('[ripple] HTML template not found:', join(__dirname, ${JSON.stringify(htmlTemplatePath)}));
  process.exit(1);
}
const htmlTemplate = readFileSync(join(__dirname, ${JSON.stringify(htmlTemplatePath)}), 'utf-8');

const clientAssets = ${JSON.stringify(clientAssetMap, null, 2)};

const manifest = {
    routes: rippleConfig.router.routes,
    components,
    layouts,
    middlewares: rippleConfig.middlewares,
    rpcModules,
    trustProxy: rippleConfig.server.trustProxy,
    rootBoundary,
    streaming: rippleConfig.ssr.streaming,
    runtime: rippleConfig.adapter.runtime,
    clientAssets,
};
const handlerOptions = {
    render,
    getCss,
    htmlTemplate,
    executeServerFunction,
    createSsrStream: createStream,
};
const handler = createHandler(manifest, handlerOptions);

// Build-time static generation of the render routes marked for prerendering.
export const prerender = (origin) => prerenderRoutes(manifest, handlerOptions, origin);

export { handler };

// Auto-boot when running directly (node dist/server/entry.js)
// Skip when imported as a module (e.g. by a serverless function wrapper)
const isMainModule = typeof process !== 'undefined' && process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  if (rippleConfig.adapter?.serve) {
    const server = rippleConfig.adapter.serve(handler, {
      static: { dir: join(__dirname, '../client') },
    });
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    if (isNaN(port) || port < 1 || port > 65535) {
    	console.error('[ripple] Invalid PORT value:', process.env.PORT);
    	process.exit(1);
    }
    server.listen(port);
    console.log('[ripple] Production server listening on port ' + port);
  } else {
    console.error('[ripple] No adapter configured in ripple.config.ts');
    process.exit(1);
  }
}
`;
}
