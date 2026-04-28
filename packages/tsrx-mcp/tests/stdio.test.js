import { describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

describe('@tsrx/mcp stdio server', () => {
	it('exposes the expected tools over stdio', async () => {
		const transport = new StdioClientTransport({
			command: 'node',
			args: ['src/stdio.js'],
			cwd: new URL('..', import.meta.url).pathname,
		});
		const client = new Client({ name: 'tsrx-mcp-test', version: '0.0.0' });

		await client.connect(transport);
		try {
			const { tools } = await client.listTools();

			expect(tools.map((tool) => tool.name).sort()).toEqual([
				'compile-tsrx',
				'detect-target',
				'get-documentation',
				'list-sections',
			]);
		} finally {
			await client.close();
		}
	});
});
