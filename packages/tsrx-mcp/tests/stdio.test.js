import { describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

describe('@tsrx/mcp stdio server', () => {
	/**
	 * @param {(client: Client) => Promise<void>} run
	 */
	async function with_client(run) {
		const transport = new StdioClientTransport({
			command: 'node',
			args: ['src/stdio.js'],
			cwd: new URL('..', import.meta.url).pathname,
		});
		const client = new Client({ name: 'tsrx-mcp-test', version: '0.0.0' });

		await client.connect(transport);
		try {
			await run(client);
		} finally {
			await client.close();
		}
	}

	it('exposes the expected tools over stdio', async () => {
		await with_client(async (client) => {
			const { tools } = await client.listTools();

			expect(tools.map((tool) => tool.name).sort()).toEqual([
				'compile-tsrx',
				'detect-target',
				'get-documentation',
				'list-sections',
			]);
		});
	});

	it('exposes docs and target handoff resources over stdio', async () => {
		await with_client(async (client) => {
			const { resources } = await client.listResources();
			const uris = resources.map((resource) => resource.uri);

			expect(uris).toContain('tsrx://docs/components.md');
			expect(uris).toContain('tsrx://targets/react.md');

			const docs = await client.readResource({ uri: 'tsrx://docs/components.md' });
			expect(docs.contents[0]).toMatchObject({
				uri: 'tsrx://docs/components.md',
				mimeType: 'text/markdown',
			});
			expect(docs.contents[0].text).toContain('Component Declarations');

			const target = await client.readResource({ uri: 'tsrx://targets/react.md' });
			expect(target.contents[0].text).toContain('React target layer');
		});
	});

	it('exposes the TSRX task prompt over stdio', async () => {
		await with_client(async (client) => {
			const { prompts } = await client.listPrompts();
			expect(prompts.map((prompt) => prompt.name)).toContain('tsrx-task');

			const prompt = await client.getPrompt({
				name: 'tsrx-task',
				arguments: {
					task: 'Build a counter component',
					target: 'react',
				},
			});

			expect(prompt.messages[0].content).toMatchObject({
				type: 'text',
				text: expect.stringContaining('Build a counter component'),
			});
			expect(prompt.messages[0].content.text).toContain('compile-tsrx');
		});
	});
});
