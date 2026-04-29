/** @import { LoaderContext } from '@rspack/core' */

import { createRequire } from 'node:module';
import { SourceMapConsumer, SourceMapGenerator } from 'source-map';

const require = createRequire(import.meta.url);
const { transformVueJsxVapor } = require('vue-jsx-vapor/api');

const DEFAULT_VAPOR_OPTIONS = {
	macros: true,
	compiler: {
		runtimeModuleName: 'vue-jsx-vapor',
	},
};

/**
 * @param {any} inputMap
 * @param {any} outputMap
 * @returns {Promise<any>}
 */
async function composeSourceMaps(inputMap, outputMap) {
	if (!inputMap) return outputMap ?? null;
	if (!outputMap) return inputMap;

	const generator = new SourceMapGenerator();

	await SourceMapConsumer.with(outputMap, null, async (outputConsumer) => {
		await SourceMapConsumer.with(inputMap, null, async (inputConsumer) => {
			outputConsumer.eachMapping((mapping) => {
				if (mapping.originalLine == null || mapping.originalColumn == null) return;

				const original = inputConsumer.originalPositionFor({
					line: mapping.originalLine,
					column: mapping.originalColumn,
				});

				if (original.line == null || original.column == null || original.source == null) return;

				generator.addMapping({
					generated: {
						line: mapping.generatedLine,
						column: mapping.generatedColumn,
					},
					original: {
						line: original.line,
						column: original.column,
					},
					source: original.source,
					name: original.name ?? mapping.name ?? undefined,
				});
			});

			for (const source of inputConsumer.sources) {
				const content = inputConsumer.sourceContentFor(source, true);
				if (content != null) {
					generator.setSourceContent(source, content);
				}
			}
		});
	});

	return JSON.parse(generator.toString());
}

/**
 * Runs the compiled TSX through `vue-jsx-vapor`'s public transform API, then
 * composes its sourcemap with the upstream tsrx compile map when available.
 *
 * @this {LoaderContext<{ vapor?: { interop?: boolean, macros?: boolean | object, compiler?: { runtimeModuleName?: string } } }>}
 * @param {string} source
 * @param {unknown} inputMap
 * @returns {void}
 */
export default function vaporLoader(source, inputMap) {
	const callback = this.async();
	const options = this.getOptions?.() ?? {};
	const vapor = {
		...DEFAULT_VAPOR_OPTIONS,
		...options.vapor,
		compiler: {
			...DEFAULT_VAPOR_OPTIONS.compiler,
			...options.vapor?.compiler,
		},
	};

	const vaporId = this.resourcePath.replace(/\.tsrx$/, '.tsx');

	Promise.resolve()
		.then(async () => {
			const result = transformVueJsxVapor(source, vaporId, vapor, true, false, false);
			const normalized_input_map =
				typeof inputMap === 'string' ? JSON.parse(inputMap) : /** @type {any} */ (inputMap ?? null);
			const normalized_output_map = result.map ? JSON.parse(result.map) : null;
			const output_map = await composeSourceMaps(normalized_input_map, normalized_output_map);

			callback(null, result.code, /** @type {any} */ (output_map ?? undefined));
		})
		.catch((/** @type {any} */ err) => {
			callback(err);
		});
}
