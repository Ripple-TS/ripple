/** @import { Compiler, RspackPluginInstance } from '@rspack/core' */

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JS_LOADER = path.join(__dirname, 'js-loader.js');
const CSS_LOADER = path.join(__dirname, 'css-loader.js');
const BABEL_LOADER = require.resolve('babel-loader');
const BABEL_PRESET_SOLID = require.resolve('babel-preset-solid');
const BABEL_PRESET_TYPESCRIPT = require.resolve('@babel/preset-typescript');
const SOLID_REFRESH_BABEL = require.resolve('solid-refresh/babel');

const TSRX_EXTENSION_PATTERN = /\.tsrx$/;
const CSS_QUERY_PATTERN = /tsrx-css/;

/**
 * Rspack plugin for `.tsrx` files that compiles them via `@tsrx/solid` and
 * then delegates the final TSX + JSX transform to `babel-loader` with Solid's
 * Babel preset. Per-component `<style>` blocks are re-imported via a sibling
 * `?tsrx-css&lang.css` query and handled by rspack's built-in CSS module type.
 *
 * @implements {RspackPluginInstance}
 */
export class TsrxSolidRspackPlugin {
	/**
	 * @param {{ hot?: boolean }} [options]
	 */
	constructor(options = {}) {
		this.options = {
			hot: options.hot,
		};
	}

	/**
	 * @param {Compiler} compiler
	 * @returns {void}
	 */
	apply(compiler) {
		const hot = this.options.hot ?? compiler.options.mode !== 'production';

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
						loader: BABEL_LOADER,
						options: {
							babelrc: false,
							configFile: false,
							sourceMaps: true,
							plugins: hot ? [SOLID_REFRESH_BABEL] : [],
							presets: [
								[BABEL_PRESET_SOLID, {}],
								[
									BABEL_PRESET_TYPESCRIPT,
									{
										allExtensions: true,
										isTSX: true,
									},
								],
							],
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

export default TsrxSolidRspackPlugin;
