import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as tsrx_mcp from '@tsrx/mcp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const package_dir = resolve(__dirname, '..');
const package_json = JSON.parse(readFileSync(resolve(package_dir, 'package.json'), 'utf8'));

describe('@tsrx/mcp package contract', () => {
	it('exposes the public package entrypoint through package exports', () => {
		expect(typeof tsrx_mcp.createTSRXMcpServer).toBe('function');
		expect(typeof tsrx_mcp.compile_tsrx).toBe('function');
		expect(typeof tsrx_mcp.format_tsrx).toBe('function');
		expect(typeof tsrx_mcp.inspect_project).toBe('function');
		expect(typeof tsrx_mcp.validate_tsrx_file).toBe('function');
		expect(package_json.exports['.'].default).toBe('./src/index.js');
	});

	it('starts the declared bin entrypoint over stdio', async () => {
		const bin = package_json.bin['tsrx-mcp'];
		expect(bin).toBe('./src/stdio.js');

		const transport = new StdioClientTransport({
			command: 'node',
			args: [bin],
			cwd: package_dir,
		});
		const client = new Client({ name: 'tsrx-mcp-package-test', version: '0.0.0' });

		await client.connect(transport);
		try {
			const { tools } = await client.listTools();
			expect(tools.map((tool) => tool.name)).toEqual(
				expect.arrayContaining(['inspect-project', 'validate-tsrx-file']),
			);
		} finally {
			await client.close();
		}
	});

	it('reports the package.json version on the initialize handshake', async () => {
		const transport = new StdioClientTransport({
			command: 'node',
			args: [package_json.bin['tsrx-mcp']],
			cwd: package_dir,
		});
		const client = new Client({ name: 'tsrx-mcp-version-test', version: '0.0.0' });

		await client.connect(transport);
		try {
			const info = client.getServerVersion();
			expect(info?.version).toBe(package_json.version);
			expect(info?.name).toBe('TSRX MCP Server');
		} finally {
			await client.close();
		}
	});
});
