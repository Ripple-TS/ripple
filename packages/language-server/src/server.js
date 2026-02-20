/** @import {CompilerOptions} from 'typescript' */

const { createLogging } = require('./utils.js');
const {
	createConnection,
	createServer,
	createTypeScriptProject,
} = require('@volar/language-server/node');
const { createCompileErrorDiagnosticPlugin } = require('./compileErrorDiagnosticPlugin.js');
const { createDefinitionPlugin } = require('./definitionPlugin.js');
const { createHoverPlugin } = require('./hoverPlugin.js');
const { createCompletionPlugin } = require('./completionPlugin.js');
const { createAutoInsertPlugin } = require('./autoInsertPlugin.js');
const { createTypeScriptDiagnosticFilterPlugin } = require('./typescriptDiagnosticPlugin.js');
const { createDocumentHighlightPlugin } = require('./documentHighlightPlugin.js');
const {
	getRippleLanguagePlugin,
	resolveConfig,
} = require('@ripple-ts/typescript-plugin/src/language.js');
const { createTypeScriptServices } = require('./typescriptService.js');
const { create: createCssService } = require('volar-service-css');

const { log, logError } = createLogging('[Ripple Language Server]');

function createRippleLanguageServer() {
	const connection = createConnection();
	const server = createServer(connection);

	connection.listen();

	// Create language plugin instance once and reuse it
	// This prevents creating multiple instances if the callback is called multiple times
	const rippleLanguagePlugin = getRippleLanguagePlugin();
	log('Language plugin instance created');

	/** @type {WeakSet<Function>} */
	const wrappedFunctions = new WeakSet();

	/**
	 * Ensure TypeScript hosts always see compiler options with Ripple defaults.
	 * @param {unknown} target
	 * @param {string} method
	 */
	function wrapCompilerOptionsProvider(target, method) {
		if (!target) {
			return;
		}

		const host = /** @type {{ [key: string]: unknown }} */ (target);
		const original = host[method];
		if (typeof original !== 'function' || wrappedFunctions.has(original)) {
			return;
		}

		/** @type {CompilerOptions | undefined} */
		let cachedInput;
		/** @type {CompilerOptions | undefined} */
		let cachedOutput;

		const wrapped = () => {
			/** @type {CompilerOptions} */
			const input = original.call(host);
			if (cachedInput !== input) {
				cachedInput = input;
				cachedOutput = resolveConfig({ options: input }).options;
			}
			return cachedOutput;
		};

		wrappedFunctions.add(original);
		wrappedFunctions.add(wrapped);
		host[method] = wrapped;
	}

	connection.onInitialize(async (params) => {
		try {
			log('Initializing Ripple language server...');
			log('Initialization options:', JSON.stringify(params.initializationOptions, null, 2));

			const ts = require('typescript');

			const initResult = server.initialize(
				params,
				createTypeScriptProject(ts, undefined, ({ projectHost }) => {
					wrapCompilerOptionsProvider(projectHost, 'getCompilationSettings');

					return {
						languagePlugins: [rippleLanguagePlugin],
						setup({ project }) {
							wrapCompilerOptionsProvider(
								project?.typescript?.languageServiceHost,
								'getCompilationSettings',
							);
						},
					};
				}),
				[
					createAutoInsertPlugin(),
					createCompletionPlugin(),
					createCompileErrorDiagnosticPlugin(),
					createDefinitionPlugin(),
					createCssService(),
					...createTypeScriptServices(ts),
					// !IMPORTANT 'createTypeScriptDiagnosticFilterPlugin', 'createHoverPlugin',
					// and 'createDocumentHighlightPlugin' must come after TypeScript services
					// to intercept volar's and vscode default providers
					createTypeScriptDiagnosticFilterPlugin(),
					createHoverPlugin(),
					createDocumentHighlightPlugin(),
				],
			);

			log('Server initialization complete');
			return initResult;
		} catch (initError) {
			logError('Server initialization failed:', initError);
			throw initError;
		}
	});

	connection.onInitialized(async () => {
		log('Server initialized.');
		server.initialized();

		// Register file watchers for TypeScript/JavaScript files so the language
		// server is notified when they change on disk. Without this, changes to
		// .ts files that are imported by .ripple files are not detected, causing
		// stale diagnostics until the server is restarted.
		try {
			await server.fileWatcher.watchFiles([
				'**/*.ts',
				'**/*.tsx',
				'**/*.cts',
				'**/*.mts',
				'**/*.js',
				'**/*.jsx',
				'**/*.cjs',
				'**/*.mjs',
				'**/*.d.ts',
				'**/tsconfig.json',
				'**/jsconfig.json',
			]);
			log('File watchers registered for TypeScript/JavaScript files.');
		} catch (err) {
			logError('Failed to register file watchers:', err);
		}
	});

	process.on('uncaughtException', (err) => {
		logError('Uncaught exception:', err);
	});

	process.on('unhandledRejection', (reason, promise) => {
		logError('Unhandled rejection at:', promise, 'reason:', reason);
	});

	return { connection, server };
}

module.exports = {
	createRippleLanguageServer,
};
