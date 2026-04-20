import { RenderRoute, ServerRoute } from '@ripple-ts/vite-plugin';
import { compile as compile_react } from '@tsrx/react';
import { compile as compile_ripple } from '@tsrx/ripple';
import { format } from 'prettier';

const MAX_SOURCE_LENGTH = 12000;
const VALID_TARGETS = ['react', 'ripple'];

/**
 * @param {unknown} error
 * @returns {string}
 */
function get_error_message(error) {
	if (error instanceof Error) {
		return error.message;
	}

	return 'Compilation failed.';
}

/**
 * @param {string} code
 * @returns {Promise<string>}
 */
async function format_js(code) {
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
async function format_css(css) {
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
async function compile_target(target, source) {
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

	const ripple_result = compile_ripple(source, 'LiveDemo.tsrx');

	return {
		target,
		output: {
			code: await format_js(ripple_result.js.code),
			css: await format_css(ripple_result.css),
		},
	};
}

export const routes = [
	new RenderRoute({ path: '/', entry: '/src/pages/index.tsrx' }),
	new RenderRoute({ path: '/getting-started', entry: '/src/pages/getting-started.tsrx' }),
	new RenderRoute({ path: '/docs', entry: '/src/pages/docs.tsrx' }),
	new RenderRoute({ path: '/playground', entry: '/src/pages/playground.tsrx' }),
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

			if (!VALID_TARGETS.includes(target)) {
				return Response.json({ error: 'Target must be one of: react, ripple.' }, { status: 400 });
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
