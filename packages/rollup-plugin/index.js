import path from 'path';
import { createFilter } from '@rollup/pluginutils';
import { compile } from '@tsrx/ripple';

const PREFIX = '[@ripple-ts/rollup-plugin]';

/**
 * @param [options] {Partial<import('.').Options>}
 * @returns {import('rollup').Plugin}
 */
export default function (options = {}) {
	const { compilerOptions = {}, ...rest } = options;
	const extensions = ['.tsrx'];
	const filter = createFilter(rest.include, rest.exclude);

	// [filename]:[chunk]
	const cache_emit = new Map();
	const { emitCss = true } = rest;

	if (emitCss) {
		const cssOptionValue = 'external';
		if (compilerOptions.css) {
			console.warn(
				`${PREFIX} Forcing \`"compilerOptions.css": ${
					typeof cssOptionValue === 'string' ? `"${cssOptionValue}"` : cssOptionValue
				}\` because "emitCss" was truthy.`,
			);
		}
		compilerOptions.css = cssOptionValue;
	} else {
		compilerOptions.css = 'injected';
	}

	return {
		name: 'ripple',

		/**
		 * Returns CSS contents for a file, if ours
		 */
		load(id) {
			return cache_emit.get(id) || null;
		},

		/**
		 * Transforms a Ripple source file into a `.js` file.
		 * NOTE: If `emitCss`, append static `import` to virtual CSS file.
		 */
		async transform(code, id) {
			if (!filter(id)) return null;

			const extension = path.extname(id);
			if (!extensions.includes(extension)) return null;

			const filename = path.relative(process.cwd(), id);

			const result = await compile(code, filename, id);

			if (emitCss && result.css) {
				const fname = id.replace(new RegExp(`\\${extension}$`), '.css');
				result.code += `\nimport ${JSON.stringify(fname)};\n`;
				cache_emit.set(fname, result.css);
			}
			return { code: result.code, map: result.map };
		},
	};
}
