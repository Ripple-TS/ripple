/**
 * @import {LanguageServiceContext} from '@volar/language-server'
 * @import {TextDocument} from 'vscode-languageserver-textdocument'
 */

import { createRequire } from 'node:module';

// Use createRequire to get a real require() that hits Node's module cache.
// This guarantees the monkey-patch targets the same exports object that all
// other consumers (semantic.js, codeAction.js, etc.) see via their require() calls,
// regardless of how the bundler handles ESM imports.
const require = createRequire(import.meta.url);
const getUserPreferencesModule = require('volar-service-typescript/lib/configs/getUserPreferences');
const { create } = require('volar-service-typescript');

const originalGetUserPreferences = getUserPreferencesModule.getUserPreferences;

/**
 * Enhanced getUserPreferences to add all ts and ripple preferences
 * Specifically makes preferTypeOnlyAutoImports true if not set
 * @param {LanguageServiceContext} context
 * @param {TextDocument} document
 */
getUserPreferencesModule.getUserPreferences = async function (context, document) {
	const origPreferences = await originalGetUserPreferences.call(this, context, document);

	const [tsConfig, rippleConfig] = await Promise.all([
		context.env.getConfiguration?.('typescript'),
		context.env.getConfiguration?.('ripple'),
	]);

	return {
		preferTypeOnlyAutoImports: true,
		...origPreferences,
		.../** @type {any} */ (tsConfig)?.preferences,
		.../** @type {any} */ (rippleConfig)?.preferences,
	};
};

/**
 * Create TypeScript services with Ripple-specific enhancements.
 * @param {typeof import('typescript')} ts
 * @returns {ReturnType<typeof create>}
 */
export function createTypeScriptServices(ts) {
	return create(ts);
}
