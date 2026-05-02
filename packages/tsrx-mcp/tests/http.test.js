import { createServer } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { handleTSRXMcpNodeRequest } from '../src/index.js';

/** @type {Array<import('node:http').Server>} */
const servers = [];

afterEach(async () => {
	await Promise.all(
		servers.splice(0).map(
			(server) =>
				new Promise((resolve, reject) => {
					server.close((error) => (error ? reject(error) : resolve(undefined)));
				}),
		),
	);
});

/**
 * @param {{ bearerToken?: string, preparseBody?: boolean }} [options]
 */
async function create_test_endpoint(options = {}) {
	const server = createServer(async (req, res) => {
		if (options.preparseBody === true && req.method === 'POST') {
			const chunks = [];
			for await (const chunk of req) {
				chunks.push(chunk);
			}
			const req_with_body =
				/** @type {import('node:http').IncomingMessage & { body?: unknown }} */ (req);
			req_with_body.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
		}
		handleTSRXMcpNodeRequest(req, res, options);
	});
	servers.push(server);
	await new Promise((resolve) => {
		server.listen(0, '127.0.0.1', () => resolve(undefined));
	});
	const address = /** @type {{ port: number }} */ (server.address());
	return new URL(`http://127.0.0.1:${address.port}/mcp`);
}

/**
 * @param {(client: Client) => Promise<void>} run
 * @param {{ bearerToken?: string, preparseBody?: boolean }} [options]
 */
async function with_http_client(run, options = {}) {
	const url = await create_test_endpoint({
		bearerToken: options.bearerToken,
		preparseBody: options.preparseBody,
	});
	const transport = new StreamableHTTPClientTransport(url, {
		requestInit: options.bearerToken
			? {
					headers: {
						authorization: `Bearer ${options.bearerToken}`,
					},
				}
			: undefined,
	});
	const client = new Client({ name: 'tsrx-mcp-http-test', version: '0.0.0' });

	await client.connect(transport);
	try {
		await run(client);
	} finally {
		await client.close();
	}
}

/**
 * @param {unknown} content
 * @returns {string}
 */
function expect_text_content(content) {
	expect(content).toBeTruthy();
	expect(content).toHaveProperty('text');
	const text = /** @type {{ text: unknown }} */ (content).text;
	expect(typeof text).toBe('string');
	return /** @type {string} */ (text);
}

/**
 * @param {unknown} result
 * @returns {unknown}
 */
function expect_first_tool_content(result) {
	expect(result).toBeTruthy();
	expect(result).toHaveProperty('content');
	const content = /** @type {{ content: unknown }} */ (result).content;
	expect(Array.isArray(content)).toBe(true);
	return /** @type {unknown[]} */ (content)[0];
}

describe('@tsrx/mcp HTTP server', () => {
	it('exposes remote-safe tools over Streamable HTTP', async () => {
		await with_http_client(async (client) => {
			const { tools } = await client.listTools();

			expect(tools.map((tool) => tool.name).sort()).toEqual([
				'analyze-tsrx',
				'compile-tsrx',
				'format-tsrx',
				'get-documentation',
				'list-sections',
				'review-tsrx-accessibility',
				'review-tsrx-components',
				'review-tsrx-styles',
			]);
		});
	});

	it('serves documentation and prompts over Streamable HTTP', async () => {
		await with_http_client(async (client) => {
			const docs = await client.readResource({ uri: 'tsrx://docs/components.md' });
			expect(expect_text_content(docs.contents[0])).toContain('Component Declarations');

			const prompt = await client.getPrompt({
				name: 'tsrx-task',
				arguments: {
					task: 'Create a card component',
					target: 'react',
				},
			});
			const text = expect_text_content(prompt.messages[0].content);
			expect(text).toContain('Create a card component');
			expect(text).toContain('hosted MCP endpoint cannot inspect a local project filesystem');
		});
	});

	it('compiles with an explicit target over Streamable HTTP', async () => {
		await with_http_client(async (client) => {
			const result = await client.callTool({
				name: 'compile-tsrx',
				arguments: {
					code: `export component Greeting({ name }: { name: string }) {
						<p>"Hello "{name}</p>
					}`,
					filename: 'Greeting.tsrx',
					target: 'react',
				},
			});
			const output = JSON.parse(expect_text_content(expect_first_tool_content(result)));

			expect(output).toMatchObject({
				ok: true,
				target: 'react',
				compilerPackage: '@tsrx/react',
				cwd: 'remote',
			});
		});
	});

	it('supports optional bearer auth', async () => {
		await with_http_client(
			async (client) => {
				const result = await client.callTool({
					name: 'get-documentation',
					arguments: {
						section: 'components',
					},
				});
				const output = JSON.parse(expect_text_content(expect_first_tool_content(result)));
				expect(output.sections[0].slug).toBe('components');
			},
			{ bearerToken: 'test-token' },
		);
	});

	it('supports hosts that provide a pre-parsed request body', async () => {
		await with_http_client(
			async (client) => {
				const { tools } = await client.listTools();

				expect(tools.map((tool) => tool.name)).toContain('compile-tsrx');
			},
			{ preparseBody: true },
		);
	});
});
