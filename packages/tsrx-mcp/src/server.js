import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
	find_documentation_section,
	find_similar_documentation_sections,
	list_documentation_sections,
} from './docs.js';
import { analyze_tsrx } from './analyze.js';
import { compile_tsrx } from './compile.js';
import { format_tsrx } from './format.js';
import { inspect_project } from './inspect.js';
import { validate_tsrx_file } from './validate.js';
import { detect_target } from './target.js';
import {
	review_tsrx_accessibility,
	review_tsrx_components,
	review_tsrx_styles,
} from './authoring.js';
import {
	TARGET_SCHEMA,
	analysis_result_schema,
	authoring_review_result_schema,
	compile_result_schema,
	format_result_schema,
	inspect_project_result_schema,
	target_detection_schema,
	validate_file_result_schema,
} from './schemas.js';

const package_json_path = fileURLToPath(new URL('../package.json', import.meta.url));
const package_json = JSON.parse(readFileSync(package_json_path, 'utf8'));

const SERVER_INFO = {
	name: 'TSRX MCP Server',
	version: typeof package_json.version === 'string' ? package_json.version : '0.0.0',
};

const TARGET_RESOURCE_CONTENT = {
	react: `# TSRX React Target

The core TSRX MCP server owns target-neutral language syntax and compiler validation. React-specific guidance should live in a React target layer.

The React target layer should own:
- React package and bundler setup
- React runtime imports and helper APIs
- React JSX compatibility expectations
- React-specific compiler diagnostics and examples
- interop with React libraries and hooks

Before giving React-specific advice, use \`detect-target\` or an explicit target signal and validate generated .tsrx code with \`compile-tsrx\`.`,
	preact: `# TSRX Preact Target

The core TSRX MCP server owns target-neutral language syntax and compiler validation. Preact-specific guidance should live in a Preact target layer.

The Preact target layer should own:
- Preact package and bundler setup
- Preact runtime imports and helper APIs
- Preact JSX compatibility expectations
- Preact-specific compiler diagnostics and examples
- interop with Preact libraries and hooks

Before giving Preact-specific advice, use \`detect-target\` or an explicit target signal and validate generated .tsrx code with \`compile-tsrx\`.`,
	solid: `# TSRX Solid Target

The core TSRX MCP server owns target-neutral language syntax and compiler validation. Solid-specific guidance should live in a Solid target layer.

The Solid target layer should own:
- Solid package and bundler setup
- Solid runtime imports and helper APIs
- Solid JSX compatibility expectations
- Solid-specific compiler diagnostics and examples
- interop with Solid primitives and libraries

Before giving Solid-specific advice, use \`detect-target\` or an explicit target signal and validate generated .tsrx code with \`compile-tsrx\`.`,
	vue: `# TSRX Vue Target

The core TSRX MCP server owns target-neutral language syntax and compiler validation. Vue-specific guidance should live in a Vue target layer.

The Vue target layer should own:
- Vue package and bundler setup
- Vue runtime imports and helper APIs
- Vue JSX/Vapor compatibility expectations
- Vue-specific compiler diagnostics and examples
- interop with Vue libraries and composition APIs

Before giving Vue-specific advice, use \`detect-target\` or an explicit target signal and validate generated .tsrx code with \`compile-tsrx\`.`,
	ripple: `# TSRX Ripple Target

The core TSRX MCP server owns target-neutral language syntax and compiler validation. Ripple-specific guidance should live in a Ripple target layer.

The Ripple target layer should own:
- Ripple package and bundler setup
- Ripple runtime imports and helper APIs
- Ripple reactivity, server, and hydration semantics
- Ripple-specific compiler diagnostics and examples
- interop with Ripple runtime components and helpers

Before giving Ripple-specific advice, use \`detect-target\` or an explicit target signal and validate generated .tsrx code with \`compile-tsrx\`.`,
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
 *   collect?: boolean,
 *   loose?: boolean,
 *   includeCode?: boolean,
 *   mode?: 'client' | 'server'
 * }} input
 */
export function compile_tsrx_handler(input) {
	return compile_tsrx(input);
}

/**
 * @param {{
 *   code: string,
 *   filename?: string,
 *   target?: string,
 *   cwd?: string,
 *   collect?: boolean,
 *   loose?: boolean,
 *   mode?: 'client' | 'server'
 * }} input
 */
export function analyze_tsrx_handler(input) {
	return analyze_tsrx(input);
}

/**
 * @param {{ code: string, filename?: string, target?: string }} input
 */
export function review_tsrx_accessibility_handler(input) {
	return review_tsrx_accessibility(input);
}

/**
 * @param {{ code: string, filename?: string, target?: string }} input
 */
export function review_tsrx_styles_handler(input) {
	return review_tsrx_styles(input);
}

/**
 * @param {{ code: string, filename?: string, target?: string }} input
 */
export function review_tsrx_components_handler(input) {
	return review_tsrx_components(input);
}

/**
 * @param {{
 *   code: string,
 *   filename?: string,
 *   cwd?: string,
 *   printWidth?: number,
 *   tabWidth?: number,
 *   useTabs?: boolean,
 *   singleQuote?: boolean,
 *   check?: boolean
 * }} input
 */
export function format_tsrx_handler(input) {
	return format_tsrx(input);
}

/**
 * @param {{ cwd?: string }} input
 */
export function inspect_project_handler(input = {}) {
	return inspect_project(input);
}

/**
 * @param {{
 *   filePath: string,
 *   cwd?: string,
 *   target?: string,
 *   collect?: boolean,
 *   loose?: boolean,
 *   mode?: 'client' | 'server',
 *   printWidth?: number,
 *   tabWidth?: number,
 *   useTabs?: boolean,
 *   singleQuote?: boolean
 * }} input
 */
export function validate_tsrx_file_handler(input) {
	return validate_tsrx_file(input);
}

/**
 * @param {unknown} value
 */
function json_text(value) {
	return JSON.stringify(value, null, 2);
}

/**
 * @param {string} uri
 * @param {string} text
 */
function text_resource(uri, text) {
	return {
		contents: [
			{
				uri,
				mimeType: 'text/markdown',
				text,
			},
		],
	};
}

/**
 * @param {{ remote: boolean }} options
 */
function create_tsrx_task_prompt(options) {
	const project_context_step = options.remote
		? '2. This hosted MCP endpoint cannot inspect a local project filesystem. Use an explicit `target` argument when compiling or analyzing code, or ask the user which target runtime they use.'
		: '2. If project context exists, call `inspect-project` for package/tooling context or `detect-target` when only the runtime target is needed before assuming React, Preact, Solid, Vue, or Ripple semantics.';
	const file_validation_step = options.remote
		? '6. For existing files, ask the user to paste source or use a local stdio MCP client; hosted MCP cannot read local file paths.'
		: '6. When working with an existing file, call `validate-tsrx-file` for one-shot format, compile, and advice feedback.';
	const compile_step = options.remote
		? '7. Before presenting generated .tsrx code as final, call `format-tsrx`, then `compile-tsrx` with an explicit target.'
		: '7. Before presenting generated .tsrx code as final, call `format-tsrx`, then `compile-tsrx` with the inferred or explicit target.';
	const authoring_step =
		'8. For user-facing UI, call `review-tsrx-accessibility`, `review-tsrx-styles`, and `review-tsrx-components` before finalizing. Fix error-severity accessibility/style issues and use component advice when control flow becomes dense.';

	return `Use this workflow when helping with TSRX:

1. Identify whether the task is about target-neutral TSRX syntax, target runtime behavior, or both.
${project_context_step}
3. For syntax uncertainty, use \`list-sections\`, \`get-documentation\`, or read \`tsrx://docs/{slug}.md\`.
4. Keep core TSRX advice target-neutral: component declarations, statement templates, control flow, TSX expression values, lazy destructuring, style identifiers, and submodule declarations.
5. Use \`tsrx://targets/{target}.md\` as the handoff point for target-specific responsibilities.
${file_validation_step}
${compile_step}
${authoring_step}
9. If \`compile-tsrx\` returns diagnostics, call \`analyze-tsrx\` for targeted authoring advice, fix the code, format it, and compile again.
10. Do not invent runtime APIs, imports, or bundler configuration from target-neutral TSRX docs. Use target-specific docs, resources, or skills for those details.`;
}

/**
 * Create the shared TSRX MCP server. Transports are intentionally owned by wrapper
 * packages so this package can be reused by stdio and hosted HTTP entry points.
 *
 * @param {{ remote?: boolean }} [options]
 */
export function createTSRXMcpServer(options = {}) {
	const remote = options.remote === true;
	const server = new McpServer(SERVER_INFO, {
		instructions: remote
			? 'Use this hosted server for target-neutral TSRX language guidance. It cannot inspect local project files, so pass an explicit runtime target before compiling .tsrx code. Fetch relevant docs sections when syntax details are uncertain, and use target-specific docs or resources for runtime APIs, imports, bundler setup, and framework semantics.'
			: 'Use this server for target-neutral TSRX language guidance. Detect the runtime target before generating .tsrx code, fetch relevant docs sections when syntax details are uncertain, and use target-specific skills or resources for runtime APIs, imports, bundler setup, and framework semantics.',
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

	for (const section of list_documentation_sections()) {
		const uri = `tsrx://docs/${section.slug}.md`;
		server.registerResource(
			`tsrx-docs-${section.slug}`,
			uri,
			{
				title: section.title,
				description: section.use_cases,
				mimeType: 'text/markdown',
			},
			async () => text_resource(uri, section.content),
		);
	}

	for (const [target, content] of Object.entries(TARGET_RESOURCE_CONTENT)) {
		const uri = `tsrx://targets/${target}.md`;
		server.registerResource(
			`tsrx-target-${target}`,
			uri,
			{
				title: `TSRX ${target[0].toUpperCase()}${target.slice(1)} Target`,
				description: `${target} target handoff guidance for TSRX agents`,
				mimeType: 'text/markdown',
			},
			async () => text_resource(uri, content),
		);
	}

	server.registerPrompt(
		'tsrx-task',
		{
			title: 'TSRX Task Workflow',
			description:
				'Guide an agent through target-aware TSRX work: detect target, fetch docs, compile, and defer runtime-specific details to target layers.',
			argsSchema: {
				task: z.string().optional(),
				target: z.enum(['ripple', 'react', 'preact', 'solid', 'vue']).optional(),
			},
		},
		async ({ task, target }) => {
			const context = [task ? `Task: ${task}` : null, target ? `Known target: ${target}` : null]
				.filter(Boolean)
				.join('\n');
			const text = context
				? `${context}\n\n${create_tsrx_task_prompt({ remote })}`
				: create_tsrx_task_prompt({ remote });

			return {
				description: 'Target-aware TSRX agent workflow',
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text,
						},
					},
				],
			};
		},
	);

	if (!remote) {
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
					...target_detection_schema,
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
	}

	server.registerTool(
		'compile-tsrx',
		{
			title: 'Compile TSRX',
			description:
				'Compiles TSRX code with the inferred or explicit runtime target compiler. Use this to validate generated .tsrx code and collect compiler diagnostics.',
			inputSchema: {
				code: z.string(),
				filename: z.string().optional(),
				target: TARGET_SCHEMA.optional(),
				cwd: z.string().optional(),
				collect: z.boolean().optional(),
				loose: z.boolean().optional(),
				includeCode: z.boolean().optional(),
				mode: z.enum(['client', 'server']).optional(),
			},
			outputSchema: compile_result_schema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				openWorldHint: false,
			},
		},
		async (input) => {
			const output = await compile_tsrx_handler(remote ? { ...input, cwd: undefined } : input);
			if (remote) output.cwd = 'remote';
			return {
				content: [{ type: 'text', text: json_text(output) }],
				structuredContent: output,
			};
		},
	);

	server.registerTool(
		'format-tsrx',
		{
			title: 'Format TSRX',
			description:
				'Formats TSRX code using the official @tsrx/prettier-plugin. Use this before returning generated .tsrx code or to check whether source is already formatted.',
			inputSchema: {
				code: z.string(),
				filename: z.string().optional(),
				cwd: z.string().optional(),
				printWidth: z.number().int().positive().optional(),
				tabWidth: z.number().int().positive().optional(),
				useTabs: z.boolean().optional(),
				singleQuote: z.boolean().optional(),
				check: z.boolean().optional(),
			},
			outputSchema: format_result_schema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				openWorldHint: false,
			},
		},
		async (input) => {
			const output = await format_tsrx_handler(remote ? { ...input, cwd: undefined } : input);
			if (remote) {
				output.cwd = 'remote';
				output.configPath = null;
			}
			return {
				content: [{ type: 'text', text: json_text(output) }],
				structuredContent: output,
			};
		},
	);

	server.registerTool(
		'analyze-tsrx',
		{
			title: 'Analyze TSRX Diagnostics',
			description:
				'Compiles TSRX code and turns compiler diagnostics into target-neutral authoring advice with linked TSRX docs resources. Use this before manually guessing fixes.',
			inputSchema: {
				code: z.string(),
				filename: z.string().optional(),
				target: TARGET_SCHEMA.optional(),
				cwd: z.string().optional(),
				collect: z.boolean().optional(),
				loose: z.boolean().optional(),
				mode: z.enum(['client', 'server']).optional(),
			},
			outputSchema: analysis_result_schema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				openWorldHint: false,
			},
		},
		async (input) => {
			const output = await analyze_tsrx_handler(remote ? { ...input, cwd: undefined } : input);
			if (remote) output.cwd = 'remote';
			return {
				content: [{ type: 'text', text: json_text(output) }],
				structuredContent: output,
			};
		},
	);

	server.registerTool(
		'review-tsrx-accessibility',
		{
			title: 'Review TSRX Accessibility',
			description:
				'Reviews TSRX source for common accessibility issues before browser-based Axe validation, including missing button names, unlabeled form controls, and direct quoted text that may not render as accessible text.',
			inputSchema: {
				code: z.string(),
				filename: z.string().optional(),
				target: TARGET_SCHEMA.optional(),
			},
			outputSchema: authoring_review_result_schema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				openWorldHint: false,
			},
		},
		async (input) => {
			const output = review_tsrx_accessibility_handler(input);
			return {
				content: [{ type: 'text', text: json_text(output) }],
				structuredContent: output,
			};
		},
	);

	server.registerTool(
		'review-tsrx-styles',
		{
			title: 'Review TSRX Styles',
			description:
				'Reviews TSRX source for style-authoring issues, including malformed style blocks, broad selectors, root styling that should live on explicit classes, and contrast risks.',
			inputSchema: {
				code: z.string(),
				filename: z.string().optional(),
				target: TARGET_SCHEMA.optional(),
			},
			outputSchema: authoring_review_result_schema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				openWorldHint: false,
			},
		},
		async (input) => {
			const output = review_tsrx_styles_handler(input);
			return {
				content: [{ type: 'text', text: json_text(output) }],
				structuredContent: output,
			};
		},
	);

	server.registerTool(
		'review-tsrx-components',
		{
			title: 'Review TSRX Component Structure',
			description:
				'Reviews TSRX source for component decomposition opportunities when control flow, repeated item templates, or style blocks become large enough to hurt generated-code reliability.',
			inputSchema: {
				code: z.string(),
				filename: z.string().optional(),
				target: TARGET_SCHEMA.optional(),
			},
			outputSchema: authoring_review_result_schema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				openWorldHint: false,
			},
		},
		async (input) => {
			const output = review_tsrx_components_handler(input);
			return {
				content: [{ type: 'text', text: json_text(output) }],
				structuredContent: output,
			};
		},
	);

	if (!remote) {
		server.registerTool(
			'inspect-project',
			{
				title: 'Inspect TSRX Project',
				description:
					'Inspects package.json, target signals, TSRX packages, tooling packages, scripts, and common config files for a project. Use this before choosing target-specific advice or repo commands.',
				inputSchema: {
					cwd: z.string().optional(),
				},
				outputSchema: inspect_project_result_schema,
				annotations: {
					readOnlyHint: true,
					destructiveHint: false,
					openWorldHint: false,
				},
			},
			async ({ cwd }) => {
				const output = inspect_project_handler({ cwd });
				return {
					content: [{ type: 'text', text: json_text(output) }],
					structuredContent: output,
				};
			},
		);

		server.registerTool(
			'validate-tsrx-file',
			{
				title: 'Validate TSRX File',
				description:
					'Reads a .tsrx file and runs the full MCP validation loop: formatting check, target-aware compilation, and diagnostic advice. This tool is read-only and does not rewrite files.',
				inputSchema: {
					filePath: z.string(),
					cwd: z.string().optional(),
					target: TARGET_SCHEMA.optional(),
					collect: z.boolean().optional(),
					loose: z.boolean().optional(),
					mode: z.enum(['client', 'server']).optional(),
					printWidth: z.number().int().positive().optional(),
					tabWidth: z.number().int().positive().optional(),
					useTabs: z.boolean().optional(),
					singleQuote: z.boolean().optional(),
				},
				outputSchema: validate_file_result_schema,
				annotations: {
					readOnlyHint: true,
					destructiveHint: false,
					openWorldHint: false,
				},
			},
			async (input) => {
				const output = await validate_tsrx_file_handler(input);
				return {
					content: [{ type: 'text', text: json_text(output) }],
					structuredContent: output,
				};
			},
		);
	}

	return server;
}
