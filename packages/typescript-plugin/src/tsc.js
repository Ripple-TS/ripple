#!/usr/bin/env node

import { createRequire } from 'node:module';
import { getRippleLanguagePlugin } from './language.js';

const require = createRequire(import.meta.url);
const { runTsc } = /** @type {typeof import('@volar/typescript/lib/quickstart/runTsc.js')} */ (
	require('@volar/typescript/lib/quickstart/runTsc.js')
);
const tscPath = require.resolve('typescript/lib/tsc.js');

process.env.TSRX_TSC = 'true';

runTsc(
	tscPath,
	{
		extraSupportedExtensions: ['.tsrx'],
		extraExtensionsToRemove: ['.tsrx'],
	},
	(ts, create_program_options) => {
		const compiler_options = /** @type {import('typescript').CompilerOptions & {
		 *  configFile?: import('typescript').TsConfigSourceFile,
		 *  configFilePath?: string,
		 * }} */ (create_program_options.options);
		return [
			getRippleLanguagePlugin({
				ts,
				configFileName: compiler_options.configFile?.fileName ?? compiler_options.configFilePath,
				configHost: ts.sys,
			}),
		];
	},
);
