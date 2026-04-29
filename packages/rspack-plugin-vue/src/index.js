/** @import { Compiler, RspackPluginInstance } from '@rspack/core' */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JS_LOADER = path.join(__dirname, 'js-loader.js');
const VAPOR_LOADER = path.join(__dirname, 'vapor-loader.js');
const CSS_LOADER = path.join(__dirname, 'css-loader.js');

const TSRX_EXTENSION_PATTERN = /\.tsrx$/;
const CSS_QUERY_PATTERN = /tsrx-css/;

/**
 * Rspack plugin for `.tsrx` files that compiles them via `@tsrx/vue`, runs the
 * result through `vue-jsx-vapor`, and finally strips the remaining TypeScript
 * syntax with rspack's built-in SWC loader. Per-component `<style>` blocks are
 * re-imported via a sibling `?tsrx-css&lang.css` query and handled by rspack's
 * built-in CSS module type.
 *
 * @implements {RspackPluginInstance}
 */
export class TsrxVueRspackPlugin {
	/**
	 * @param {{ vapor?: { interop?: boolean, macros?: boolean | object, compiler?: { runtimeModuleName?: string } } }} [options]
	 */
	constructor(options = {}) {
		this.options = {
			vapor: options.vapor,
		};
	}

	/**
	 * @param {Compiler} compiler
	 * @returns {void}
	 */
	apply(compiler) {
		const resolve = compiler.options.resolve;
		if (resolve.extensions && !resolve.extensions.includes('.tsrx')) {
			resolve.extensions.push('.tsrx');
		}

		if (!compiler.options.experiments) {
			compiler.options.experiments = {};
		}
		if (compiler.options.experiments.css === undefined) {
			compiler.options.experiments.css = true;
		}

		compiler.options.module.rules.unshift(
			{
				test: TSRX_EXTENSION_PATTERN,
				resourceQuery: { not: CSS_QUERY_PATTERN },
				use: [
					{
						loader: 'builtin:swc-loader',
						options: {
							jsc: {
								parser: {
									syntax: 'typescript',
									tsx: false,
								},
								target: 'esnext',
							},
						},
					},
					{
						loader: VAPOR_LOADER,
						options: {
							vapor: this.options.vapor,
						},
					},
					{
						loader: JS_LOADER,
					},
				],
			},
			{
				test: TSRX_EXTENSION_PATTERN,
				resourceQuery: CSS_QUERY_PATTERN,
				type: 'css/auto',
				use: [
					{
						loader: CSS_LOADER,
					},
				],
			},
		);
	}
}

export default TsrxVueRspackPlugin;
