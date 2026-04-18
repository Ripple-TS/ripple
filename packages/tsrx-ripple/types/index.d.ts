/**
 * Type definitions for @tsrx/ripple
 *
 * Re-exports all core types from @tsrx/core and adds Ripple-specific types.
 */
import type * as AST from 'estree';
import type {
	CompileError,
	CompileOptions,
	CompileResult,
	ParseOptions,
	VolarCompileOptions,
	VolarMappingsResult,
} from '@tsrx/core/types';

export type * from '@tsrx/core/types';

/**
 * Backward-compatible alias for CompileError
 */
export type TSRXCompileError = CompileError;

/**
 * Parse Ripple source code to ESTree AST
 */
export function parse(source: string, filename?: string, options?: ParseOptions): AST.Program;

/**
 * Compile Ripple source code to JS/CSS output
 */
export function compile(source: string, filename: string, options?: CompileOptions): CompileResult;

/**
 * Compile Ripple component to Volar virtual code with TypeScript mappings
 */
export function compile_to_volar_mappings(
	source: string,
	filename: string,
	options?: VolarCompileOptions,
): VolarMappingsResult;
