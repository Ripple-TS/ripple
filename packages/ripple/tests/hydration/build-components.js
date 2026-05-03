/**
 * Script to compile hydration test components for both client and server.
 * Can be run standalone: node packages/ripple/tests/hydration/build-components.js
 * Or used as vitest globalSetup
 */

import { compile } from '@tsrx/ripple';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const componentsDir = join(__dirname, 'components');
const clientOutDir = join(__dirname, 'compiled', 'client');
const serverOutDir = join(__dirname, 'compiled', 'server');

/**
 * Transform server-compiled code to use server runtime imports.
 * This is necessary because vitest runs with browser conditions, but
 * server-compiled code needs server's track() and Portal which have different internals.
 * @param {string} code - The compiled server code
 * @returns {string} - Transformed code with server-compatible imports
 */
function transformServerImports(code) {
	// Replace `import { ... } from 'ripple'` with server version
	// Use 'ripple/server' which always points to the server runtime,
	// bypassing the browser/default condition resolution
	return code.replace(
		/import\s*\{([^}]+)\}\s*from\s*['"]ripple['"]/g,
		(match, specifiers) => `import {${specifiers}} from 'ripple/server'`,
	);
}

function buildComponents() {
	// Ensure output directories exist
	mkdirSync(clientOutDir, { recursive: true });
	mkdirSync(serverOutDir, { recursive: true });

	// Get all supported component files in components directory
	const componentFiles = readdirSync(componentsDir).filter((f) => f.endsWith('.tsrx'));

	for (const file of componentFiles) {
		const filePath = join(componentsDir, file);
		const source = readFileSync(filePath, 'utf-8');
		const outputName = basename(basename(file, '.tsrx'), '.tsrx').replace(/\.tsrx$/, '') + '.js';

		// Compile for client
		const clientResult = compile(source, file, {
			mode: 'client',
		});
		writeFileSync(join(clientOutDir, outputName), '// @ts-nocheck\n' + clientResult.code);

		// Compile for server
		const serverResult = compile(source, file, {
			mode: 'server',
		});
		// Transform imports to use server runtime
		const serverCode = transformServerImports(serverResult.code);
		writeFileSync(join(serverOutDir, outputName), '// @ts-nocheck\n' + serverCode);

		console.log(`Compiled ${file} -> client & server`);
	}

	console.log('Hydration components compiled!');
}

// Export setup function for vitest globalSetup
export default function setup() {
	buildComponents();
}

// Allow running standalone
if (process.argv[1] === __filename) {
	buildComponents();
}
