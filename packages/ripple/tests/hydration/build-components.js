/**
 * Script to compile hydration test components for both client and server.
 * Can be run standalone: node packages/ripple/tests/hydration/build-components.js
 * Or used as vitest globalSetup
 */

import { compile } from '@tsrx/ripple';
import { createTextTypeProject as create_text_type_project } from '@tsrx/ripple/typescript';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync } from 'fs';
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
	// Shared JS imports keep the same relative paths in both compiled targets.
	cpSync(join(__dirname, 'fixtures'), join(__dirname, 'compiled', 'fixtures'), { recursive: true });

	// Get all supported component files in components directory
	const componentFiles = readdirSync(componentsDir).filter((f) => f.endsWith('.tsrx'));

	for (const file of componentFiles) {
		const filePath = join(componentsDir, file);
		const source = readFileSync(filePath, 'utf-8');
		const outputName = basename(basename(file, '.tsrx'), '.tsrx').replace(/\.tsrx$/, '') + '.js';

		// Exercise opt-in type proofs using the same snapshot in both modes.
		let text_type_facts;
		if (file === 'typed-text.tsrx') {
			const project = create_text_type_project({
				tsconfig: join(__dirname, 'tsconfig.text-types.json'),
			});
			try {
				text_type_facts = { ...project.getTextTypeFacts(filePath, source), filename: file };
				if (text_type_facts.primitiveTextChildRanges.length === 0) {
					throw new Error('Typed hydration fixture did not produce primitive text proofs');
				}
			} finally {
				project.dispose();
			}
		}

		// Compile for client
		const clientResult = compile(source, file, {
			mode: 'client',
			textTypeFacts: text_type_facts,
		});
		writeFileSync(join(clientOutDir, outputName), '// @ts-nocheck\n' + clientResult.code);

		// Compile for server
		const serverResult = compile(source, file, {
			mode: 'server',
			textTypeFacts: text_type_facts,
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
