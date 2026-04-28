import { RenderRoute, ServerRoute } from '@ripple-ts/vite-plugin';
import { compile as compile_preact } from '@tsrx/preact';
import * as ripple_prettier_plugin from '@tsrx/prettier-plugin';
import { compile as compile_react } from '@tsrx/react';
import { compile as compile_ripple } from '@tsrx/ripple';
import { compile as compile_solid } from '@tsrx/solid';
import { compile as compile_vue } from '@tsrx/vue';
import { format } from 'prettier';

const MAX_SOURCE_LENGTH = 12000;
const VALID_TARGETS = ['react', 'preact', 'ripple', 'solid', 'vue'] as const;

type CompileTarget = (typeof VALID_TARGETS)[number];

function is_valid_target(target: string): target is CompileTarget {
	return VALID_TARGETS.includes(target as CompileTarget);
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function get_error_message(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return 'Compilation failed.';
}

/**
 * @param {string} code
 * @returns {Promise<string>}
 */
async function format_js(code: string) {
	try {
		return await format(code, {
			parser: 'babel-ts',
			useTabs: false,
			tabWidth: 2,
			singleQuote: true,
			printWidth: 80,
		});
	} catch {
		return code;
	}
}

/**
 * @param {string} css
 * @returns {Promise<string>}
 */
async function format_css(css: string) {
	if (!css.trim()) return '';
	try {
		return await format(css, { parser: 'css', useTabs: false, tabWidth: 2, printWidth: 80 });
	} catch {
		return css;
	}
}

/**
 * @param {string} target
 * @param {string} source
 */
async function compile_target(target: CompileTarget, source: string) {
	if (target === 'react') {
		const react_result = compile_react(source, 'LiveDemo.tsrx');

		return {
			target,
			output: {
				code: await format_js(react_result.code),
				css: await format_css(react_result.css?.code ?? ''),
			},
		};
	}

	if (target === 'preact') {
		const preact_result = compile_preact(source, 'LiveDemo.tsrx');

		return {
			target,
			output: {
				code: await format_js(preact_result.code),
				css: await format_css(preact_result.css?.code ?? ''),
			},
		};
	}

	if (target === 'solid') {
		const solid_result = compile_solid(source, 'LiveDemo.tsrx');

		return {
			target,
			output: {
				code: await format_js(solid_result.code),
				css: await format_css(solid_result.css?.code ?? ''),
			},
		};
	}

	if (target === 'vue') {
		const vue_result = compile_vue(source, 'LiveDemo.tsrx');

		return {
			target,
			output: {
				code: await format_js(vue_result.code),
				css: await format_css(vue_result.css?.code ?? ''),
			},
		};
	}

	const ripple_result = compile_ripple(source, 'LiveDemo.tsrx');

	return {
		target,
		output: {
			code: await format_js(ripple_result.js.code),
			css: await format_css(ripple_result.css),
		},
	};
}

/**
 * @param {string} source
 * @returns {Promise<string>}
 */
async function format_tsrx(source: string) {
	return await format(source, {
		parser: 'ripple',
		plugins: [ripple_prettier_plugin as any],
		useTabs: false,
		tabWidth: 2,
		singleQuote: true,
		printWidth: 100,
	});
}

export const routes = [
	new RenderRoute({ path: '/', entry: '/src/pages/index.tsrx' }),
	new RenderRoute({ path: '/getting-started', entry: '/src/pages/getting-started.tsrx' }),
	new RenderRoute({ path: '/features', entry: '/src/pages/features.tsrx' }),
	new RenderRoute({ path: '/specification', entry: '/src/pages/specification.tsrx' }),
	new RenderRoute({ path: '/playground', entry: '/src/pages/playground.tsrx' }),
	new ServerRoute({
		path: '/api/format',
		methods: ['POST'],
		handler: async (context) => {
			let body;

			try {
				body = await context.request.json();
			} catch {
				return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
			}

			const source = typeof body?.source === 'string' ? body.source : '';
			if (!source.trim()) {
				return Response.json({ error: 'A non-empty source string is required.' }, { status: 400 });
			}

			if (source.length > MAX_SOURCE_LENGTH) {
				return Response.json(
					{ error: `Source exceeds the ${MAX_SOURCE_LENGTH} character demo limit.` },
					{ status: 413 },
				);
			}

			try {
				return Response.json({ source: await format_tsrx(source) });
			} catch (error) {
				return Response.json({ error: get_error_message(error) }, { status: 422 });
			}
		},
	}),
	new ServerRoute({
		path: '/api/compile',
		methods: ['POST'],
		handler: async (context) => {
			let body;

			try {
				body = await context.request.json();
			} catch {
				return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
			}

			const source = typeof body?.source === 'string' ? body.source : '';
			const target = typeof body?.target === 'string' ? body.target : 'react';
			if (!source.trim()) {
				return Response.json({ error: 'A non-empty source string is required.' }, { status: 400 });
			}

			if (!is_valid_target(target)) {
				return Response.json(
					{ error: 'Target must be one of: react, preact, ripple, solid, vue.' },
					{ status: 400 },
				);
			}

			if (source.length > MAX_SOURCE_LENGTH) {
				return Response.json(
					{ error: `Source exceeds the ${MAX_SOURCE_LENGTH} character demo limit.` },
					{ status: 413 },
				);
			}

			try {
				return Response.json(await compile_target(target, source));
			} catch (error) {
				return Response.json({ error: get_error_message(error) }, { status: 422 });
			}
		},
	}),
];
