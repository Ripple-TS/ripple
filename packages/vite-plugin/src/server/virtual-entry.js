/**
 * Virtual server entry generator for production builds.
 *
 * Generates a self-contained server entry module that:
 * - Imports all SSR-compiled page components and layouts
 * - Imports the production request handler (createHandler)
 * - Imports the adapter's serve() function
 * - Wires routes, middlewares, RPC, and boots the HTTP server
 */

/** @import { Route } from '@ripple-ts/vite-plugin' */

/**
 * @typedef {Object} VirtualEntryOptions
 * @property {Route[]} routes - Route definitions from ripple.config.ts
 * @property {string} rippleConfigPath - Absolute path to ripple.config.ts (for importing middlewares/adapter)
 * @property {string} htmlTemplatePath - Path to the processed index.html template
 * @property {string[]} [rpcModulePaths] - Paths (relative to root) of .ripple modules with #server blocks
 */

/**
 * Generate the virtual server entry module source code.
 *
 * The generated module:
 * 1. Imports ripple SSR utilities (render, get_css_for_hashes, executeServerFunction)
 * 2. Imports createHandler from @ripple-ts/vite-plugin/production
 * 3. Imports ripple.config.ts to get adapter, middlewares, and routes
 * 4. Imports each RenderRoute's entry (and layout) as SSR components
 * 5. Builds a ServerManifest and creates the fetch handler
 * 6. Reads the HTML template from disk
 * 7. Boots the adapter with the handler
 *
 * @param {VirtualEntryOptions} options
 * @returns {string} The generated JavaScript module source
 */
export function generateServerEntry(options) {
	const { routes, rippleConfigPath, htmlTemplatePath, rpcModulePaths = [] } = options;

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
			if (!component_imports.has(route.entry)) {
				component_imports.set(route.entry, `_page_${component_index++}`);
			}
			if (route.layout && !layout_imports.has(route.layout)) {
				layout_imports.set(route.layout, `_layout_${layout_index++}`);
			}
		}
	}

	// Collect RPC modules (sub-components with #server blocks, not already in page entries)
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

	// --- Dynamic map entries ---

	const component_entries = [...component_imports]
		.map(([entry, varName]) => `  ${JSON.stringify(entry)}: getDefaultExport(${varName}),`)
		.join('\n');

	const layout_entries = [...layout_imports]
		.map(([layout, varName]) => `  ${JSON.stringify(layout)}: getDefaultExport(${varName}),`)
		.join('\n');

	// Only check _$_server_$_ on modules known to have #server blocks.
	// Checking modules without #server blocks causes rollup warnings since
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

import { render, get_css_for_hashes, executeServerFunction } from 'ripple/server';
import { createHandler } from '@ripple-ts/vite-plugin/production';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import rippleConfig from ${JSON.stringify(rippleConfigPath)};

${import_lines.join('\n')}

function getDefaultExport(mod) {
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
const htmlTemplate = readFileSync(join(__dirname, ${JSON.stringify(htmlTemplatePath)}), 'utf-8');

const handler = createHandler(
  {
    routes: rippleConfig.router.routes,
    components,
    layouts,
    middlewares: rippleConfig.middlewares || [],
    rpcModules,
    trustProxy: rippleConfig.server?.trustProxy ?? false,
    runtime: rippleConfig.adapter.runtime,
  },
  {
    render,
    getCss: get_css_for_hashes,
    htmlTemplate,
    executeServerFunction,
  },
);

export { handler };

// Auto-boot when running directly (node dist/server/entry.js)
// Skip when imported as a module (e.g. by a serverless function wrapper)
const isMainModule = typeof process !== 'undefined' && process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\\\/g, '/'));
if (isMainModule) {
  if (rippleConfig.adapter?.serve) {
    const server = rippleConfig.adapter.serve(handler, {
      static: { dir: join(__dirname, '../client') },
    });
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    server.listen(port);
    console.log('[ripple] Production server listening on port ' + port);
  } else {
    console.error('[ripple] No adapter configured in ripple.config.ts');
    process.exit(1);
  }
}
`;
}
