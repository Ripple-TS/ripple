import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const react_fixture = new URL('fixtures/react-project', import.meta.url).pathname;

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
 * @param {unknown} content
 * @returns {unknown}
 */
function parse_json_text_content(content) {
	return JSON.parse(expect_text_content(content));
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

describe('@tsrx/mcp stdio server', () => {
	/**
	 * @param {(client: Client) => Promise<void>} run
	 * @param {{ cwd?: string }} [options]
	 */
	async function with_client(run, options = {}) {
		const transport = new StdioClientTransport({
			command: 'node',
			args: [new URL('../src/stdio.js', import.meta.url).pathname],
			cwd: options.cwd ?? new URL('..', import.meta.url).pathname,
		});
		const client = new Client({ name: 'tsrx-mcp-test', version: '0.0.0' });

		await client.connect(transport);
		try {
			await run(client);
		} finally {
			await client.close();
		}
	}

	it('hints to pass cwd when detection runs from outside a project', async () => {
		// Spawn the server with cwd set to an empty temp dir to simulate the
		// realistic scenario where an MCP client launches the server from the
		// user's home or shell directory, not the project root.
		const temp_dir = await mkdtemp(join(tmpdir(), 'tsrx-mcp-cwd-hint-'));

		try {
			await with_client(
				async (client) => {
					const result = await client.callTool({
						name: 'detect-target',
						arguments: {},
					});
					const text = /** @type {{ text: string }} */ (
						/** @type {{ content: unknown[] }} */ (result).content[0]
					).text;
					const parsed = JSON.parse(text);
					expect(parsed.detectedTarget).toBe(null);
					expect(parsed.message).toMatch(/cwd was not supplied/);
					expect(parsed.message).toMatch(/Pass cwd/);
				},
				{ cwd: temp_dir },
			);
		} finally {
			await rm(temp_dir, { recursive: true, force: true });
		}
	});

	it('does not hint about cwd when the caller supplied one', async () => {
		const temp_dir = await mkdtemp(join(tmpdir(), 'tsrx-mcp-cwd-explicit-'));

		try {
			await with_client(
				async (client) => {
					const result = await client.callTool({
						name: 'detect-target',
						arguments: { cwd: temp_dir },
					});
					const text = /** @type {{ text: string }} */ (
						/** @type {{ content: unknown[] }} */ (result).content[0]
					).text;
					const parsed = JSON.parse(text);
					expect(parsed.message).not.toMatch(/cwd was not supplied/);
				},
				{ cwd: temp_dir },
			);
		} finally {
			await rm(temp_dir, { recursive: true, force: true });
		}
	});

	it('exposes the expected tools over stdio', async () => {
		await with_client(async (client) => {
			const { tools } = await client.listTools();

			expect(tools.map((tool) => tool.name).sort()).toEqual([
				'analyze-tsrx',
				'compile-tsrx',
				'detect-target',
				'format-tsrx',
				'get-documentation',
				'inspect-project',
				'list-sections',
				'validate-tsrx-file',
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
			expect(expect_text_content(docs.contents[0])).toContain('Component Declarations');

			const target = await client.readResource({ uri: 'tsrx://targets/react.md' });
			expect(expect_text_content(target.contents[0])).toContain('React target layer');
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
			expect(expect_text_content(prompt.messages[0].content)).toContain('compile-tsrx');
		});
	});

	it('supports the intended target-aware TSRX workflow over stdio', async () => {
		await with_client(async (client) => {
			const prompt = await client.getPrompt({
				name: 'tsrx-task',
				arguments: {
					task: 'Create a greeting component',
				},
			});
			expect(expect_text_content(prompt.messages[0].content)).toContain('detect-target');

			const docs = await client.readResource({ uri: 'tsrx://docs/components.md' });
			expect(expect_text_content(docs.contents[0])).toContain('component Button');

			const target = await client.callTool({
				name: 'detect-target',
				arguments: {
					cwd: react_fixture,
				},
			});
			const target_output = /** @type {{ detectedTarget?: unknown }} */ (
				parse_json_text_content(expect_first_tool_content(target))
			);
			expect(target_output.detectedTarget).toBe('react');

			const inspected = await client.callTool({
				name: 'inspect-project',
				arguments: {
					cwd: react_fixture,
				},
			});
			const inspected_output =
				/** @type {{ target?: { detectedTarget?: unknown }, commands?: { typecheck?: unknown }, tooling?: Array<{ name?: unknown, present?: unknown }> }} */ (
					parse_json_text_content(expect_first_tool_content(inspected))
				);
			expect(inspected_output.target?.detectedTarget).toBe('react');
			expect(inspected_output.commands?.typecheck).toBe('pnpm typecheck');
			expect(inspected_output.tooling).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: '@tsrx/prettier-plugin',
						present: true,
					}),
				]),
			);

			const valid = await client.callTool({
				name: 'compile-tsrx',
				arguments: {
					code: `export component Greeting({ name }: { name: string }) {
						<p>"Hello "{name}</p>
					}`,
					filename: 'Greeting.tsrx',
					cwd: react_fixture,
				},
			});
			const valid_output = parse_json_text_content(expect_first_tool_content(valid));
			expect(valid_output).toMatchObject({
				ok: true,
				target: 'react',
				compilerPackage: '@tsrx/react',
			});

			const invalid = await client.callTool({
				name: 'compile-tsrx',
				arguments: {
					code: `component Broken() {
						return <div />;
					}`,
					filename: 'Broken.tsrx',
					cwd: react_fixture,
				},
			});
			const invalid_output =
				/** @type {{ ok?: unknown, errors?: Array<{ message?: unknown }> }} */ (
					parse_json_text_content(expect_first_tool_content(invalid))
				);
			expect(invalid_output.ok).toBe(false);
			expect(invalid_output.errors?.[0]?.message).toContain(
				'JSX elements cannot be used as expressions',
			);

			const analyzed = await client.callTool({
				name: 'analyze-tsrx',
				arguments: {
					code: `component Broken() {
							return <div />;
						}`,
					filename: 'Broken.tsrx',
					cwd: react_fixture,
				},
			});
			const analyzed_output =
				/** @type {{ advice?: Array<{ kind?: unknown, documentation?: unknown }> }} */ (
					parse_json_text_content(expect_first_tool_content(analyzed))
				);
			expect(analyzed_output.advice?.[0]?.kind).toBe('jsx-return-in-component');
			expect(analyzed_output.advice?.[0]?.documentation).toContain('tsrx://docs/components.md');

			const formatted = await client.callTool({
				name: 'format-tsrx',
				arguments: {
					code: `export component Greeting({ name }: { name: string }){<p>"Hello "{name}</p>}`,
					filename: 'Greeting.tsrx',
				},
			});
			const formatted_output =
				/** @type {{ ok?: unknown, formatted?: unknown, changed?: unknown }} */ (
					parse_json_text_content(expect_first_tool_content(formatted))
				);
			expect(formatted_output.ok).toBe(true);
			expect(formatted_output.changed).toBe(true);
			expect(formatted_output.formatted).toContain('export component Greeting');
			expect(formatted_output.formatted).toContain('"Hello "');
			expect(formatted_output.formatted).toContain('{name}');

			const validated = await client.callTool({
				name: 'validate-tsrx-file',
				arguments: {
					filePath: 'src/Valid.tsrx',
					cwd: react_fixture,
				},
			});
			const validated_output =
				/** @type {{ ok?: unknown, format?: { check?: unknown }, compile?: { target?: unknown } }} */ (
					parse_json_text_content(expect_first_tool_content(validated))
				);
			expect(validated_output.ok).toBe(true);
			expect(validated_output.format?.check).toBe(true);
			expect(validated_output.compile?.target).toBe('react');
		});
	});
});
