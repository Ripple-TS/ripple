/**
 * Virtual server entry generator for production builds.
 *
 * Generates a self-contained server entry module that:
 * - Imports all SSR-compiled page components and layouts
 * - Imports the production request handler (createHandler)
 * - Imports the adapter's serve() function
 * - Wires routes, middlewares, RPC, and boots the HTTP server
 */

/** @import { RippleConfigOptions, Route } from '@ripple-ts/vite-plugin' */

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

	// Build import statements
	const lines = [];

	lines.push(`// Auto-generated server entry for production build`);
	lines.push(`// Do not edit — regenerated on each build`);
	lines.push(``);
	lines.push(`import { render, get_css_for_hashes, executeServerFunction } from 'ripple/server';`);
	lines.push(`import { createHandler } from '@ripple-ts/vite-plugin/production';`);
	lines.push(`import { readFileSync } from 'node:fs';`);
	lines.push(`import { fileURLToPath } from 'node:url';`);
	lines.push(`import { dirname, join } from 'node:path';`);
	lines.push(``);

	// Import ripple.config.ts (for adapter + middlewares + server routes)
	lines.push(`import rippleConfig from ${JSON.stringify(rippleConfigPath)};`);
	lines.push(``);

	// Import each page component
	for (const [entry, varName] of component_imports) {
		lines.push(`import * as ${varName} from ${JSON.stringify(entry)};`);
	}

	// Import each layout component
	for (const [layout, varName] of layout_imports) {
		lines.push(`import * as ${varName} from ${JSON.stringify(layout)};`);
	}

	// Import sub-components with #server blocks for RPC
	for (const [rpcPath, varName] of rpc_imports) {
		lines.push(`import * as ${varName} from ${JSON.stringify(rpcPath)};`);
	}

	lines.push(``);

	// Helper to get default export from a module
	lines.push(`function getDefaultExport(mod) {`);
	lines.push(`  if (typeof mod.default === 'function') return mod.default;`);
	lines.push(`  for (const [key, value] of Object.entries(mod)) {`);
	lines.push(`    if (typeof value === 'function' && /^[A-Z]/.test(key)) return value;`);
	lines.push(`  }`);
	lines.push(`  return null;`);
	lines.push(`}`);
	lines.push(``);

	// Build components map
	lines.push(`const components = {`);
	for (const [entry, varName] of component_imports) {
		lines.push(`  ${JSON.stringify(entry)}: getDefaultExport(${varName}),`);
	}
	lines.push(`};`);
	lines.push(``);

	// Build layouts map
	lines.push(`const layouts = {`);
	for (const [layout, varName] of layout_imports) {
		lines.push(`  ${JSON.stringify(layout)}: getDefaultExport(${varName}),`);
	}
	lines.push(`};`);
	lines.push(``);

	// Build RPC map from modules that have _$_server_$_ exports
	lines.push(`// Build RPC map from #server block exports`);
	lines.push(`const rpcModules = {};`);
	// Check page entries
	for (const [entry, varName] of component_imports) {
		lines.push(`if (${varName}._$_server_$_) {`);
		lines.push(`  rpcModules[${JSON.stringify(entry)}] = ${varName}._$_server_$_;`);
		lines.push(`}`);
	}
	// Check sub-components with #server blocks
	for (const [rpcPath, varName] of rpc_imports) {
		lines.push(`if (${varName}._$_server_$_) {`);
		lines.push(`  rpcModules[${JSON.stringify(rpcPath)}] = ${varName}._$_server_$_;`);
		lines.push(`}`);
	}
	lines.push(``);

	// Read HTML template
	lines.push(`// Read the HTML template from the client build output`);
	lines.push(`const __dirname = dirname(fileURLToPath(import.meta.url));`);
	lines.push(`const htmlTemplate = readFileSync(join(__dirname, ${JSON.stringify(htmlTemplatePath)}), 'utf-8');`);
	lines.push(``);

	// Create the production handler
	lines.push(`// Create the production request handler`);
	lines.push(`const handler = createHandler(`);
	lines.push(`  {`);
	lines.push(`    routes: rippleConfig.router.routes,`);
	lines.push(`    components,`);
	lines.push(`    layouts,`);
	lines.push(`    middlewares: rippleConfig.middlewares || [],`);
	lines.push(`    rpcModules,`);
	lines.push(`    trustProxy: rippleConfig.server?.trustProxy ?? false,`);
	lines.push(`    runtime: rippleConfig.adapter.runtime,`);
	lines.push(`  },`);
	lines.push(`  {`);
	lines.push(`    render,`);
	lines.push(`    getCss: get_css_for_hashes,`);
	lines.push(`    htmlTemplate,`);
	lines.push(`    executeServerFunction,`);
	lines.push(`  },`);
	lines.push(`);`);
	lines.push(``);

	// Boot the adapter
	lines.push(`// Boot the production server via adapter`);
	lines.push(`if (rippleConfig.adapter?.serve) {`);
	lines.push(`  const server = rippleConfig.adapter.serve(handler, {`);
	lines.push(`    static: { dir: join(__dirname, '../client') },`);
	lines.push(`  });`);
	lines.push(`  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;`);
	lines.push(`  server.listen(port);`);
	lines.push(`  console.log('[ripple] Production server listening on port ' + port);`);
	lines.push(`} else {`);
	lines.push(`  console.error('[ripple] No adapter configured in ripple.config.ts');`);
	lines.push(`  process.exit(1);`);
	lines.push(`}`);
	lines.push(``);

	// Export the handler for programmatic use
	lines.push(`export { handler };`);
	lines.push(``);

	return lines.join('\n');
}
