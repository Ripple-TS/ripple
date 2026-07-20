/** @import {CompilerOptions} from 'typescript' */

import { createLogging } from './utils.js';
import {
	createConnection,
	createServer,
	createTypeScriptProject,
} from '@volar/language-server/node';
import { createCompileErrorDiagnosticPlugin } from './compileErrorDiagnosticPlugin.js';
import { createDefinitionPlugin } from './definitionPlugin.js';
import { createHoverPlugin } from './hoverPlugin.js';
import { createCompletionPlugin } from './completionPlugin.js';
import { createAutoInsertPlugin } from './autoInsertPlugin.js';
import { createTypeScriptDiagnosticFilterPlugin } from './typescriptDiagnosticPlugin.js';
import { createDocumentHighlightPlugin } from './documentHighlightPlugin.js';
import { createDocumentSymbolPlugin } from './documentSymbolPlugin.js';
import {
	getRippleLanguagePlugin,
	invalidateTypeDefinitionCaches,
	resolveConfig,
} from '@tsrx/typescript-plugin/src/language.js';
import { createTypeScriptServices } from './typescriptService.js';
import { create as createCssService } from 'volar-service-css';
import {
	handleWorkspaceChanges,
	trackTypeScriptConfigDependencies,
	WORKSPACE_FILE_PATTERNS,
} from './workspaceState.js';

const { log, logError } = createLogging('[Ripple Language Server]');

/**
 * Strip whole-document formatting capabilities from a Volar service plugin.
 *
 * The bundled TypeScript (`typescript-syntactic`) and CSS services advertise a
 * `documentFormattingProvider`. Because they run against the virtual TS/CSS code
 * rather than the `.tsrx` source, their edits don't map back and formatting is a
 * no-op — yet the capability still makes the language client contribute a
 * "TSRX for VS Code" entry to "Format Document With…" that silently does nothing.
 * Formatting for `.tsrx` is owned by Prettier + @tsrx/prettier-plugin (configured
 * as the default `[ripple]` formatter in the VS Code extension), so we drop these
 * capabilities to keep Prettier as the single, working formatter. On-type
 * formatting is left intact.
 *
 * @template {{ capabilities?: Record<string, unknown> }} T
 * @param {T} plugin
 * @returns {T}
 */
function stripDocumentFormatting(plugin) {
	const {
		documentFormattingProvider: _fmt,
		documentRangeFormattingProvider: _rangeFmt,
		...capabilities
	} = plugin.capabilities ?? {};
	return { ...plugin, capabilities };
}

export function createRippleLanguageServer() {
	const connection = createConnection();
	const server = createServer(connection);

	connection.listen();

	/** @type {WeakSet<Function>} */
	const wrappedFunctions = new WeakSet();
	/** @type {Set<string>} */
	const trackedTypeScriptConfigFiles = new Set();
	let restartScheduled = false;

	/** Restart the process so Node drops the complete ESM compiler graph. */
	function restartLanguageServer() {
		if (restartScheduled) {
			return;
		}
		restartScheduled = true;
		log('Restarting after package state changed.');
		setTimeout(() => process.exit(0), 50);
	}

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
				createTypeScriptProject(ts, undefined, ({ configFileName, projectHost }) => {
					wrapCompilerOptionsProvider(projectHost, 'getCompilationSettings');

					return {
						// Keep language-plugin identity aligned with Volar's project
						// lifecycle. Nested tsconfigs are separate configured projects.
						languagePlugins: [getRippleLanguagePlugin()],
						setup({ project }) {
							wrapCompilerOptionsProvider(
								project?.typescript?.languageServiceHost,
								'getCompilationSettings',
							);
							trackTypeScriptConfigDependencies(trackedTypeScriptConfigFiles, {
								configFileName,
								compilerOptions: projectHost.getCompilationSettings(),
								projectReferences: projectHost.getProjectReferences?.(),
							});
						},
					};
				}),
				[
					createAutoInsertPlugin(),
					createCompletionPlugin(),
					createCompileErrorDiagnosticPlugin(),
					createDefinitionPlugin(),
					createDocumentSymbolPlugin(),
					stripDocumentFormatting(createCssService()),
					...createTypeScriptServices(ts).map(stripDocumentFormatting),
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

		server.fileWatcher.onDidChangeWatchedFiles(({ changes }) => {
			const effects = handleWorkspaceChanges(
				changes,
				{
					restartLanguageServer,
					invalidateTypeDefinitions: invalidateTypeDefinitionCaches,
					reloadProjects: () => {
						// Volar recreates disposed projects lazily, so retain the
						// previously discovered dependency paths until process restart.
						// New project setups extend this set with their current paths.
						server.project.reload();
					},
					requestRefresh: (clearDiagnostics) =>
						server.languageFeatures.requestRefresh(clearDiagnostics),
				},
				trackedTypeScriptConfigFiles,
			);

			if (effects.reloadProjects) {
				log('Reloaded TypeScript projects after workspace configuration changed.');
			}
		});

		// Register file watchers for source files, nested/shared TypeScript
		// configs, and package state that affects compiler selection.
		try {
			await server.fileWatcher.watchFiles(WORKSPACE_FILE_PATTERNS);
			log('Workspace file watchers registered.');
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
