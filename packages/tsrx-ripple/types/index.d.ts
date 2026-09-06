/**
 * Type definitions for @tsrx/ripple
 *
 * Re-exports all core types from @tsrx/core and adds Ripple-specific types.
 */
import type * as AST from 'estree';
import type {
	AnalysisResult as CoreAnalysisResult,
	CompileFn,
	CompileOptions,
	CompileResult,
	ParseOptions,
	VolarCompileFn,
	VolarCompileOptions,
} from '@tsrx/core/types';

export type * from '@tsrx/core/types';

/**
 * One thing the server registers with the active request before a component
 * renders its template: a stylesheet hash, or a `theme.$class` read whose
 * getter registers an imported theme's sheet (see `src/style-scopes.js`).
 */
export type StyleRegistration = string | AST.Expression;

/**
 * Ripple's analysis result: the shared shape plus what the style pre-pass
 * (`src/style-scopes.js`) computed for the module.
 */
export interface AnalysisResult extends CoreAnalysisResult {
	/** Every stylesheet of the module, in CSS emission order. */
	stylesheets: AST.CSS.StyleSheet[];
}

/**
 * Ripple's compile result extends the shared {@link CompileResult} with a
 * deprecated `js` field that mirrors the root-level `code`/`map`. Temporary
 * back-compat for the LiveCodes playground (live-codes/livecodes#865); will
 * be removed once the playground is replaced.
 */
export interface RippleCompileResult extends CompileResult {
	/** @deprecated Use `code` and `map` at the root of the result. */
	js: { code: string; map: import('source-map').RawSourceMap };
}

/**
 * Parse Ripple source code to ESTree AST
 */
export function parse(source: string, filename?: string, options?: ParseOptions): AST.Program;

/**
 * Compile Ripple source code to JS/CSS output. Uses Ripple's richer
 * {@link CompileOptions} (mode/dev/hmr/...) and returns the deprecated `js`
 * field for back-compat — see {@link RippleCompileResult}.
 */
export const compile: CompileFn<CompileOptions, RippleCompileResult>;

/**
 * Compile Ripple component to Volar virtual code with TypeScript mappings.
 */
export const compile_to_volar_mappings: VolarCompileFn<VolarCompileOptions>;
