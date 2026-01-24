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
		writeFileSync(join(serverOutDir, outputName), serverResult.js.code);

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
