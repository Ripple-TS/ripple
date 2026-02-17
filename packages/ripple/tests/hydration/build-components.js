/**
 * Script to compile hydration test components for both client and server.
 * Can be run standalone: node packages/ripple/tests/hydration/build-components.js
 * Or used as vitest globalSetup
 */

import { compile } from 'ripple/compiler';
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
	// Replace `import { track } from 'ripple'` with server version
	// Replace `import { Portal } from 'ripple'` with server version
	// Use 'ripple/server' which always points to the server runtime,
	// bypassing the browser/default condition resolution
	let transformed = code.replace(
		/import\s*\{\s*track\s*\}\s*from\s*['"]ripple['"]/g,
		"import { track } from 'ripple/server'",
	);
	transformed = transformed.replace(
		/import\s*\{\s*Portal\s*\}\s*from\s*['"]ripple['"]/g,
		"import { Portal } from 'ripple/server'",
	);
	return transformed;
}

function buildComponents() {
	// Ensure output directories exist
	mkdirSync(clientOutDir, { recursive: true });
	mkdirSync(serverOutDir, { recursive: true });

	// Get all .ripple files in components directory
	const componentFiles = readdirSync(componentsDir).filter((f) => f.endsWith('.ripple'));

	for (const file of componentFiles) {
		const filePath = join(componentsDir, file);
		const source = readFileSync(filePath, 'utf-8');
		const outputName = basename(file, '.ripple') + '.js';

		// Compile for client
		const clientResult = compile(source, file, {
			mode: 'client',
		});
		writeFileSync(join(clientOutDir, outputName), clientResult.js.code);

		// Compile for server
		const serverResult = compile(source, file, {
			mode: 'server',
		});
		// Transform imports to use server runtime
		const serverCode = transformServerImports(serverResult.js.code);
		writeFileSync(join(serverOutDir, outputName), serverCode);

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
