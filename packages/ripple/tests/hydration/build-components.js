/**
 * Script to compile hydration test components for both client and server.
 * Run with: node packages/ripple/tests/hydration/build-components.js
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

console.log('Done!');
