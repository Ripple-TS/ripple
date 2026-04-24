/** @import { Compiler, RspackPluginInstance } from '@rspack/core' */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JS_LOADER = path.join(__dirname, 'js-loader.js');
const CSS_LOADER = path.join(__dirname, 'css-loader.js');

const TSRX_EXTENSION_PATTERN = /\.tsrx$/;
const CSS_QUERY_PATTERN = /tsrx-css/;

/**
 * Rspack plugin for `.tsrx` files that compiles them via `@tsrx/preact` and
 * then delegates the final JSX transform to rspack's `builtin:swc-loader` so
 * the output calls Preact's automatic `jsx-runtime`. Per-component `<style>`
 * blocks are re-imported via a sibling `?tsrx-css&lang.css` query and handled
 * by rspack's built-in CSS module type.
 *
 * @implements {RspackPluginInstance}
 */
export class TsrxPreactRspackPlugin {
	/**
	 * @param {{ jsxImportSource?: string, suspenseSource?: string }} [options]
	 */
	constructor(options = {}) {
		this.options = {
			jsxImportSource: options.jsxImportSource ?? 'preact',
			suspenseSource: options.suspenseSource,
		};
	}

	/**
	 * @param {Compiler} compiler
	 * @returns {void}
	 */
	apply(compiler) {
		const { jsxImportSource } = this.options;

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
									tsx: true,
								},
								transform: {
									react: {
										runtime: 'automatic',
										importSource: jsxImportSource,
									},
								},
								target: 'esnext',
							},
						},
					},
					{
						loader: JS_LOADER,
						options: {
							suspenseSource: this.options.suspenseSource,
						},
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
						options: {
							suspenseSource: this.options.suspenseSource,
						},
					},
				],
			},
		);
	}
}

export default TsrxPreactRspackPlugin;
