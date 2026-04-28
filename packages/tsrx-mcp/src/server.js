import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
	find_documentation_section,
	find_similar_documentation_sections,
	list_documentation_sections,
} from './docs.js';
import { compile_tsrx } from './compile.js';
import { detect_target } from './target.js';

export { detect_target, TARGET_CANDIDATES } from './target.js';
export { compile_tsrx } from './compile.js';
export {
	documentation_sections,
	find_documentation_section,
	find_similar_documentation_sections,
	list_documentation_sections,
} from './docs.js';

const SERVER_INFO = {
	name: 'TSRX MCP Server',
	version: '0.0.0',
};

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function normalize_section_input(value) {
	if (Array.isArray(value)) return value.filter((item) => typeof item === 'string');
	if (typeof value !== 'string') return [];
	const trimmed = value.trim();
	if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string');
		} catch {
			// Fall back to comma-separated handling.
		}
	}
	return trimmed
		.split(',')
		.map((section) => section.trim())
		.filter(Boolean);
}

export function list_sections_handler() {
	return {
		sections: list_documentation_sections().map(({ title, slug, use_cases }) => ({
			title,
			slug,
			use_cases,
		})),
	};
}

/**
 * @param {{ section: string | string[] }} input
 */
export function get_documentation_handler(input) {
	const requested_sections = normalize_section_input(input.section);
	const found = [];
	const missing = [];

	for (const requested of requested_sections) {
		const section = find_documentation_section(requested);
		if (section) {
			found.push(section);
		} else {
			missing.push({
				section: requested,
				similar: find_similar_documentation_sections(requested).map(({ title, slug }) => ({
					title,
					slug,
				})),
			});
		}
	}

	return {
		sections: found.map(({ title, slug, content }) => ({ title, slug, content })),
		missing,
	};
}

/**
 * @param {{ cwd?: string }} input
 */
export function detect_target_handler(input = {}) {
	return detect_target(input.cwd);
}

/**
 * @param {{
 *   code: string,
 *   filename?: string,
 *   target?: string,
 *   cwd?: string,
 *   loose?: boolean,
 *   includeCode?: boolean,
 *   mode?: 'client' | 'server'
 * }} input
 */
export function compile_tsrx_handler(input) {
	return compile_tsrx(input);
}

/**
 * @param {unknown} value
 */
function json_text(value) {
	return JSON.stringify(value, null, 2);
}

/**
 * Create the shared TSRX MCP server. Transports are intentionally owned by wrapper
 * packages so this package can be reused by stdio and hosted HTTP entry points.
 */
export function createTSRXMcpServer() {
	const server = new McpServer(SERVER_INFO, {
		instructions:
			'Use this server for target-neutral TSRX language guidance. Detect the runtime target before generating .tsrx code, fetch relevant docs sections when syntax details are uncertain, and use target-specific skills or resources for runtime APIs, imports, bundler setup, and framework semantics.',
	});

	server.registerTool(
		'list-sections',
		{
			title: 'List TSRX Documentation Sections',
			description:
				'Lists available TSRX documentation sections with use_cases. Use this to discover relevant docs before answering TSRX syntax or target-runtime questions.',
			outputSchema: {
				sections: z.array(
					z.object({
						title: z.string(),
						slug: z.string(),
						use_cases: z.string(),
					}),
				),
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				openWorldHint: false,
			},
		},
		async () => {
			const output = list_sections_handler();
			return {
				content: [{ type: 'text', text: json_text(output) }],
				structuredContent: output,
			};
		},
	);

	server.registerTool(
		'get-documentation',
		{
			title: 'Get TSRX Documentation',
			description:
				'Retrieves TSRX documentation for one or more section slugs or titles. Pass a string, comma-separated string, JSON array string, or string array.',
			inputSchema: {
				section: z.union([z.string(), z.array(z.string())]),
			},
			outputSchema: {
				sections: z.array(
					z.object({
						title: z.string(),
						slug: z.string(),
						content: z.string(),
					}),
				),
				missing: z.array(
					z.object({
						section: z.string(),
						similar: z.array(
							z.object({
								title: z.string(),
								slug: z.string(),
							}),
						),
					}),
				),
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				openWorldHint: false,
			},
		},
		async ({ section }) => {
			const output = get_documentation_handler({ section });
			return {
				content: [{ type: 'text', text: json_text(output) }],
				structuredContent: output,
			};
		},
	);

	server.registerTool(
		'detect-target',
		{
			title: 'Detect TSRX Runtime Target',
			description:
				'Inspects package.json and common bundler config files to infer whether a project uses TSRX with Ripple, React, Preact, Solid, or Vue.',
			inputSchema: {
				cwd: z.string().optional(),
			},
			outputSchema: {
				cwd: z.string(),
				packageJsonPath: z.string().nullable(),
				detectedTarget: z.string().nullable(),
				confidence: z.enum(['high', 'ambiguous', 'none']),
				matches: z.array(
					z.object({
						target: z.string(),
						compilerPackage: z.string(),
						signals: z.array(z.string()),
						score: z.number(),
					}),
				),
				message: z.string(),
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				openWorldHint: false,
			},
		},
		async ({ cwd }) => {
			const output = detect_target_handler({ cwd });
			return {
				content: [{ type: 'text', text: json_text(output) }],
				structuredContent: output,
			};
		},
	);

	server.registerTool(
		'compile-tsrx',
		{
			title: 'Compile TSRX',
			description:
				'Compiles TSRX code with the inferred or explicit runtime target compiler. Use this to validate generated .tsrx code and collect compiler diagnostics.',
			inputSchema: {
				code: z.string(),
				filename: z.string().optional(),
				target: z.enum(['ripple', 'react', 'preact', 'solid', 'vue']).optional(),
				cwd: z.string().optional(),
				loose: z.boolean().optional(),
				includeCode: z.boolean().optional(),
				mode: z.enum(['client', 'server']).optional(),
			},
			outputSchema: {
				ok: z.boolean(),
				target: z.string().nullable(),
				compilerPackage: z.string().nullable(),
				filename: z.string(),
				cwd: z.string(),
				errors: z.array(
					z.object({
						message: z.string(),
						type: z.string().nullable(),
						fileName: z.string().nullable(),
						pos: z.number().nullable(),
						end: z.number().nullable(),
						raisedAt: z.number().nullable(),
						loc: z.unknown(),
					}),
				),
				code: z.string().nullable(),
				css: z.string().nullable(),
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				openWorldHint: false,
			},
		},
		async (input) => {
			const output = await compile_tsrx_handler(input);
			return {
				content: [{ type: 'text', text: json_text(output) }],
				structuredContent: output,
			};
		},
	);

	return server;
}
