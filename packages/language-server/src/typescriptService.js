/**
 * @import {LanguageServiceContext} from '@volar/language-server'
 * @import {TextDocument} from 'vscode-languageserver-textdocument'
 */

// Monkey-patch getUserPreferences to inject Ripple-specific defaults.
// volar-service-typescript accesses getUserPreferences through the module object
// at call time (not at import time), so patching the property after import works.
// We use default import (not `import *`) because the bundler treats namespace objects as frozen.
import getUserPreferencesModule from 'volar-service-typescript/lib/configs/getUserPreferences';
import { create } from 'volar-service-typescript';

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
